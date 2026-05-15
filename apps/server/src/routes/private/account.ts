import { Hono } from 'hono'
import { supabase } from '../../lib/supabase.js'
import { clearApiKeyCache } from '../../middleware/api-key.js'

type Variables = { userId: string }

const account = new Hono<{ Variables: Variables }>()

function maskApiKey(key: string): string {
  return `pk_live_****${key.slice(-4)}`
}

function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  return 'pk_live_' + btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

account.get('/', async c => {
  const userId = c.get('userId')

  const { data: profile } = await supabase
    .from('profiles')
    .select('api_key, created_at')
    .eq('id', userId)
    .single()

  if (!profile) return c.json({ error: 'Not found' }, 404)

  return c.json({
    apiKey: maskApiKey(profile.api_key),
    createdAt: profile.created_at,
  })
})

account.post('/api-key/regenerate', async c => {
  const userId = c.get('userId')

  // Fetch old key so we can evict it from the cache
  const { data: existing } = await supabase
    .from('profiles')
    .select('api_key')
    .eq('id', userId)
    .single()

  if (existing) clearApiKeyCache(existing.api_key)

  const newKey = generateApiKey()

  const { error } = await supabase
    .from('profiles')
    .update({ api_key: newKey })
    .eq('id', userId)

  if (error) return c.json({ error: 'Regeneration failed' }, 500)

  // Return full key — only time it's shown unmasked after creation
  return c.json({ apiKey: newKey })
})

export default account
