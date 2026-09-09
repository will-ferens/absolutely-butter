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
// Supabase auth is misconfigured or unreachable. `/privacy` and `/terms` are the
// marketing legal pages — static, no Supabase round-trip.
const AUTH_FREE_PREFIXES = ['/docs', '/privacy', '/terms']

// Generated metadata routes — must reach their route handlers untouched, never a
// Supabase round-trip or an auth redirect (a crawler hitting a login wall).
const AUTH_FREE_EXACT = new Set(['/robots.txt', '/sitemap.xml'])

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    AUTH_FREE_EXACT.has(pathname) ||
    AUTH_FREE_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  // The marketing landing page. Public and statically served for anonymous
  // visitors; a logged-in visitor is bounced straight to the app so returning
  // users never see the pitch. Doing the check here (not in the page) keeps
  // `app/(marketing)/page.tsx` fully static. NOT added to AUTH_FREE_PREFIXES:
  // every path starts with '/', so a prefix match there would make the whole app
  // public. A Supabase failure must never take the landing page down — on any
  // error we fall through and serve it.
  if (pathname === '/') {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      if (url && key) {
        const supabase = createServerClient(url, key, {
          cookies: {
            get: (name: string) => request.cookies.get(name)?.value,
            set: () => {},
            remove: () => {},
          },
        })
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          return NextResponse.redirect(new URL('/experiments', request.url))
        }
      }
    } catch {
      // Supabase unset or unreachable — serve the anonymous landing page.
    }
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
