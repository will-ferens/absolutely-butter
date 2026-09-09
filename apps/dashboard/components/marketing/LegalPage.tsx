import Wordmark from './Wordmark'

/**
 * Shared shell for /privacy and /terms. Placeholder-grade content is acceptable
 * at launch (per the ticket) — real legal text is a separate follow-up, and is
 * required before any paid launch (Stripe needs a terms URL; collecting email +
 * running Stripe means a privacy policy is expected).
 */
export default function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
  children: React.ReactNode
}) {
  return (
    <article className="mx-auto max-w-2xl px-6 pt-12 pb-20">
      <Wordmark />
      <h1 className="mt-12 font-display text-3xl font-bold tracking-[-0.03em] text-gray-900">
        {title}
      </h1>
      <p className="mt-2 text-sm text-gray-500">Last updated {lastUpdated}</p>

      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-gray-700 [&_a]:font-medium [&_a]:text-butter-700 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-butter-800 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_strong]:font-semibold [&_strong]:text-gray-900">
        {children}
      </div>
    </article>
  )
}
