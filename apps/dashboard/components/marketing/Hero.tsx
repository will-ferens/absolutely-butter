import TrialCta from './TrialCta'
import Wordmark from './Wordmark'

/**
 * Above the fold: wordmark, one headline, one subhead, one CTA. No nav, no
 * secondary CTA — per the ticket.
 */
export default function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-10 pb-20 sm:pt-14 sm:pb-28">
      <Wordmark />

      <h1 className="mt-16 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-gray-900 sm:mt-20 sm:text-[56px]">
         A/B testing for products without enterprise traffic.
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
        Absolutely Butter tells you how likely each version is to win, so you can
        make confident product decisions with the traffic you have today.
      </p>

      <div className="mt-9">
        <TrialCta size="lg" />
      </div>
    </section>
  )
}
