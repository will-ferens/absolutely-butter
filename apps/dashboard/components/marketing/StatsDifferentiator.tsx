import Link from 'next/link'

/**
 * The honest-stats argument, kept deliberately thin — /docs/how-the-stats-work
 * is canonical and this must not drift from it. No "statistically significant"
 * (the docs pointedly avoid the phrase). Four beats, readable in under two
 * minutes.
 */
const BEATS = [
  {
    n: '01',
    title: 'Standard tools assume you wait, then look once',
    body: 'Classic A/B testing math is only valid if you fix a large sample size up front and check the result a single time at the end. Founders check every morning on a few hundred visitors — and every extra look inflates the odds of a false winner.',
  },
  {
    n: '02',
    title: 'We model each variant as a probability, updated every visit',
    body: 'Instead of a pass/fail verdict, each variant carries a distribution over its true conversion rate. Every impression and conversion sharpens it. Looking early changes nothing, because nothing is waiting to be "triggered".',
  },
  {
    n: '03',
    title: '“78% probability variant is better” means exactly that',
    body: 'Of all the true conversion rates still consistent with your data, the variant beats the control in 78% of them. It is a direct statement about your experiment — not a p-value, not a significance threshold you either cleared or didn’t.',
  },
  {
    n: '04',
    title: 'Wide ranges early on are honesty, not a bug',
    body: 'At low traffic the credible intervals we show are wide and often overlap. That is the tool telling you it does not know yet. They tighten on their own as data arrives — a narrow range you hadn’t earned would be the real defect.',
  },
]

export default function StatsDifferentiator() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
      <h2 className="max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] text-gray-900 sm:text-3xl">
        Statistics that stay honest at low traffic
      </h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-gray-600">
        Absolutely Butter uses Thompson sampling and a Beta&ndash;Binomial model.
        In plain terms:
      </p>

      <ol className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
        {BEATS.map(beat => (
          <li key={beat.n}>
            <span className="font-mono text-xs font-medium tracking-widest text-butter-700">
              {beat.n}
            </span>
            <h3 className="mt-3 font-display text-lg font-semibold tracking-[-0.01em] text-gray-900">
              {beat.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{beat.body}</p>
          </li>
        ))}
      </ol>

      <p className="mt-12 text-[15px] text-gray-600">
        The full derivation — expected loss, the decision label, the forward
        projection —{' '}
        <Link
          href="/docs/how-the-stats-work"
          className="font-medium text-butter-700 underline underline-offset-2 hover:text-butter-800"
        >
          is in the docs
        </Link>
        .
      </p>
    </section>
  )
}
