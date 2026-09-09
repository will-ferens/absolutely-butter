import MarketingFooter from '@/components/marketing/MarketingFooter'

/**
 * Frame for the public marketing surface (`/`, `/privacy`, `/terms`).
 *
 * Deliberately NO global header — the ticket wants nothing above the fold on the
 * landing page but the headline and CTA. The brand wordmark lives inside each
 * page's hero instead. The footer is shared across all three routes.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-700">
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}
