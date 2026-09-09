import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/docs',
]

// Fully public surfaces that need no session refresh and must render even if
// Supabase auth is misconfigured or unreachable.
const AUTH_FREE_PREFIXES = ['/docs']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (AUTH_FREE_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove: (name: string, options: CookieOptions) => {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && !isPublic) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      const trialEnd = new Date(profile.trial_ends_at)
      const isActive =
        profile.subscription_status === 'active' ||
        profile.subscription_status === 'past_due' ||
        (profile.subscription_status === 'trialing' && trialEnd > new Date())

      response.headers.set('x-subscription-status', profile.subscription_status)
      response.headers.set('x-subscription-active', String(isActive))
      response.headers.set('x-trial-ends-at', profile.trial_ends_at)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
