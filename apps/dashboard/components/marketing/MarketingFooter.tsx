import Link from 'next/link'
import TrialCta from './TrialCta'
import Wordmark from './Wordmark'
import { TRIAL_DAYS } from '@/lib/site'

const LINKS = [
  { href: '/docs', label: 'Docs' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
]

/**
 * Closing CTA band + footer. Lives in the marketing layout so every marketing
 * route (landing, /privacy, /terms) carries the same footer.
 */
export default function MarketingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-gray-900 sm:text-3xl">
          Start testing on the traffic you have
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-gray-600">
          {TRIAL_DAYS} days free, no card. Create an experiment, drop in the SDK,
          and read an honest probability from your first few hundred visitors.
        </p>
        <div className="mt-7">
          <TrialCta size="lg" />
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-500 transition-colors hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
