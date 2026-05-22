import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { serverFetch } from '@/lib/server-api'
import ApiKeySection from '@/components/settings/ApiKeySection'
import AccountSection from '@/components/settings/AccountSection'
import BillingSection from '@/components/settings/BillingSection'

type AccountData = { apiKey: string; createdAt: string }
type BillingStatus = {
  status: 'trialing' | 'active' | 'past_due' | 'canceled'
  isActive: boolean
  trialEndsAt: string
  trialDaysRemaining: number
  hasPaymentMethod: boolean
}

type SearchParams = { checkout?: string }

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const headersList = headers()
  const subscriptionStatus = headersList.get('x-subscription-status') ?? 'trialing'
  const trialEndsAt = headersList.get('x-trial-ends-at') ?? ''

  const [accountRes, billingRes] = await Promise.all([
    serverFetch('/v1/account'),
    serverFetch('/v1/billing/status'),
  ])

  const account: AccountData | null = accountRes.ok ? await accountRes.json() : null
  const billing: BillingStatus | null = billingRes.ok ? await billingRes.json() : null

  const checkoutSuccess = searchParams.checkout === 'success'

  return (
    <div className="max-w-2xl space-y-12">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      {/* API Key */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">API Key</h2>
        <ApiKeySection maskedKey={account?.apiKey ?? 'pk_live_••••••••'} />
        <p className="text-xs text-gray-400 mt-3">
          This key is used in your SDK integration. Keep it private.
        </p>
      </section>

      <hr className="border-gray-100" />

      {/* Account */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Account</h2>
        <AccountSection email={user?.email ?? ''} />
      </section>

      <hr className="border-gray-100" />

      {/* Billing */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Billing</h2>
        <BillingSection
          status={(billing?.status ?? subscriptionStatus) as BillingStatus['status']}
          trialDaysRemaining={billing?.trialDaysRemaining ?? 0}
          trialEndsAt={billing?.trialEndsAt ?? trialEndsAt}
          hasPaymentMethod={billing?.hasPaymentMethod ?? false}
          checkoutSuccess={checkoutSuccess}
        />
      </section>
    </div>
  )
}
