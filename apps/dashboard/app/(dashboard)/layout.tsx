import Link from 'next/link'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResendVerification from '@/components/ResendVerification'
import NavLink from '@/components/NavLink'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const headersList = headers()
  const subscriptionStatus = headersList.get('x-subscription-status') ?? 'trialing'
  const isActive = headersList.get('x-subscription-active') === 'true'

  const isVerified = !!user.email_confirmed_at
  const daysSinceSignup = user.created_at
    ? (Date.now() - new Date(user.created_at).getTime()) / 86_400_000
    : 0

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/experiments" className="font-semibold text-gray-900 text-sm">
              Absolutely Butter
            </Link>
            <nav className="flex items-center gap-6">
              <NavLink href="/experiments">Experiments</NavLink>
              <NavLink href="/settings">Settings</NavLink>
            </nav>
          </div>
          <span className="text-sm text-gray-500">{user.email}</span>
        </div>
      </header>

      {/* Email verification banner */}
      {!isVerified && daysSinceSignup <= 7 && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-sm text-blue-800 flex items-center justify-center gap-3">
          <span>Please verify your email to unlock all features.</span>
          <ResendVerification email={user.email!} />
        </div>
      )}
      {!isVerified && daysSinceSignup > 7 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900 flex items-center justify-center gap-3">
          <span>Your email isn&apos;t verified. Some features may be limited soon.</span>
          <ResendVerification email={user.email!} />
        </div>
      )}

      {/* Subscription banner placeholder — Phase 14 */}
      {!isActive && subscriptionStatus === 'canceled' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-800 text-center">
          Your subscription has ended. Upgrade to keep creating and launching experiments.
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  )
}
