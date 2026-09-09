import Link from 'next/link'

/**
 * The one "Start free trial" control, reused in the hero, under pricing, and in
 * the closing band. Always a plain link to /signup — no modal, no email capture,
 * no query params (the signup page reads nothing). Ink fill, not butter: the
 * design system keeps the brand colour off the CTA. The trailing arrow is the
 * house style for a forward-moving action.
 */
export default function TrialCta({
  size = 'md',
  className = '',
}: {
  size?: 'md' | 'lg'
  className?: string
}) {
  const sizing = size === 'lg' ? 'px-6 py-3 text-base' : 'px-5 py-2.5 text-sm'
  return (
    <Link
      href="/signup"
      className={`inline-flex items-center gap-2 rounded-lg bg-gray-900 font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/25 focus-visible:ring-offset-2 ${sizing} ${className}`}
    >
      Start free trial
      <span aria-hidden>→</span>
    </Link>
  )
}
