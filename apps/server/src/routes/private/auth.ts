import { Hono } from 'hono'
import { supabase } from '../../lib/supabase.js'
import { sessionAuth } from '../../middleware/session.js'
import { rateLimitByIp } from '../../middleware/rate-limit.js'

type Variables = { userId: string }

const auth = new Hono<{ Variables: Variables }>()

function maskApiKey(key: string): string {
  return `pk_live_****${key.slice(-4)}`
}

auth.post('/signup', async c => {
  const { email, password } = await c.req.json<{ email: string; password: string }>()
  if (!email || !password) return c.json({ error: 'email and password required' }, 400)

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error || !data.user) return c.json({ error: 'Signup failed' }, 400)

  return c.json({ user: { id: data.user.id, email: data.user.email } }, 201)
})

auth.post('/login', rateLimitByIp(10), async c => {
  const { email, password } = await c.req.json<{ email: string; password: string }>()

  // Direct HTTP call avoids mutating the shared supabase singleton's auth state.
  // signInWithPassword() fires SIGNED_IN → onAuthStateChange swaps PostgREST to the
  // user JWT, which breaks subsequent service-role DB queries (RLS blocks them).
  const res = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
      body: JSON.stringify({ email, password }),
    },
  )

  // Always return the same generic error — never reveal which credential is wrong
  if (!res.ok) return c.json({ error: 'Invalid credentials' }, 401)

  const session = await res.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  return c.json({
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
    },
  })
})

auth.post('/logout', sessionAuth, async c => {
  const userId = c.get('userId')
  await supabase.auth.admin.signOut(userId)
  return c.body(null, 204)
})

auth.get('/me', sessionAuth, async c => {
  const userId = c.get('userId')

  const [{ data: profile }, { data: { user } }] = await Promise.all([
    supabase.from('profiles').select('api_key, created_at').eq('id', userId).single(),
    supabase.auth.admin.getUserById(userId),
  ])

  if (!profile || !user) return c.json({ error: 'Not found' }, 404)

  return c.json({
    id: userId,
    email: user.email,
    apiKey: maskApiKey(profile.api_key),
  })
})

export default auth
