import type { Metadata } from 'next'
import LegalPage from '@/components/marketing/LegalPage'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Terms of Service — Absolutely Butter',
  description: 'The terms for using Absolutely Butter.',
  alternates: { canonical: '/terms' },
  robots: { index: false },
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="September 2026">
      <p>
        These placeholder terms cover the Absolutely Butter beta. A full
        agreement will replace them before general availability. By creating an
        account you accept the following.
      </p>

      <h2>The service</h2>
      <p>
        Absolutely Butter is a hosted A/B testing tool. We aim for high
        availability but the service is provided &ldquo;as is&rdquo;, without
        warranty, during the beta. Statistical outputs are decision aids, not
        guarantees of outcome.
      </p>

      <h2>Your account</h2>
      <p>
        You are responsible for activity under your account and for keeping your
        API key secure. Don&rsquo;t use the service to break the law, infringe
        others&rsquo; rights, or attempt to disrupt the platform.
      </p>

      <h2>Billing</h2>
      <p>
        Subscriptions are $19 per month after a 30-day free trial, billed through
        Stripe. You can cancel at any time from the dashboard; cancellation takes
        effect at the end of the current period and is not prorated.
      </p>

      <h2>Termination</h2>
      <p>
        You may close your account at any time. We may suspend accounts that
        violate these terms. On termination your experiment data is deleted.
      </p>

      <h2>Changes</h2>
      <p>
        We&rsquo;ll post material changes to these terms here and update the date
        above.
      </p>

      <h2>Contact</h2>
      <p>
        Questions: <a href="mailto:support@absolutely-butter.com">support@absolutely-butter.com</a>.
      </p>
    </LegalPage>
  )
}
