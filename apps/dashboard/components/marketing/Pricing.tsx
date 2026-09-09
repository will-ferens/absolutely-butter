import TrialCta from './TrialCta'
import { PRICE_PER_MONTH, TRIAL_DAYS } from '@/lib/site'

const INCLUDED = [
  'Unlimited experiments and traffic',
  'The full stats engine — probabilities, expected loss, credible intervals, forecasts',
  'The zero-dependency SDK and the dashboard',
  'Automatic traffic allocation via Thompson sampling',
]

/**
 * One tier. No comparison table, no annual toggle, no "contact sales". Matches
 * the real billing: a single $19/mo Stripe price, 30-day trial, no card up front.
 */
export default function Pricing() {
  return (
    <section className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-gray-900 sm:text-3xl">
          One plan
        </h2>

        <div className="mt-8 max-w-md rounded-xl border border-gray-200 bg-white p-8">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-5xl font-bold tracking-[-0.03em] text-gray-900 tabular-nums">
              ${PRICE_PER_MONTH}
            </span>
            <span className="text-[15px] text-gray-500">/ month</span>
          </div>
          <p className="mt-2 text-[15px] text-gray-600">
            {TRIAL_DAYS}-day free trial. No credit card required.
          </p>

          <ul className="mt-6 space-y-2.5">
            {INCLUDED.map(item => (
              <li key={item} className="flex gap-2.5 text-[15px] leading-relaxed text-gray-700">
                <span aria-hidden className="mt-0.5 text-butter-600">
                  &#10003;
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <TrialCta className="w-full justify-center" />
          </div>
        </div>
      </div>
    </section>
  )
}
