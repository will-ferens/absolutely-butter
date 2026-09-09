import Link from 'next/link'
import type { Metadata } from 'next'
import Prose from '@/components/docs/Prose'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import DocsPager from '@/components/docs/DocsPager'

export const metadata: Metadata = {
  title: 'How the statistics work — Absolutely Butter docs',
  description:
    'Thompson sampling, P(variant > control), expected loss, credible intervals, and the forward projection — in plain English.',
}

const statsShape = `{
  "probVariantWins": 0.87,
  "expectedLoss": {
    "ifChooseVariant": 0.004,
    "ifChooseControl": 0.021
  },
  "relativeLift": 0.34,
  "credibleIntervals": {
    "control": [0.031, 0.078],
    "variant": [0.048, 0.101]
  },
  "decision": "strong_signal"
}`

export default function HowTheStatsWorkPage() {
  return (
    <>
      <Prose>
        <h1 className="text-2xl font-semibold text-gray-900">How the statistics work</h1>
        <p>
          Every number on the experiment screen is derived, on each page load,
          from four integers: impressions and conversions for control, and the
          same for variant. Nothing else is stored. This page explains what those
          derived numbers mean and how to read them.
        </p>

        <h2>The model: one Beta distribution per arm</h2>
        <p>
          For each arm we keep a <strong>Beta distribution</strong> that represents
          our current belief about its true conversion rate. It starts as{' '}
          <code>Beta(1, 1)</code> — a flat line that says &quot;any rate between 0%
          and 100% is equally plausible.&quot; Each visitor updates it:
        </p>
        <CodeBlock
          code={`alpha = 1 + conversions
beta  = 1 + (impressions − conversions)`}
          lang="ts"
        />
        <p>
          With little data the distribution is wide — we genuinely don&apos;t know
          the rate yet. As impressions accumulate it narrows around the observed
          rate. There is no point at which the math &quot;turns on&quot;; the belief
          just gets sharper. That is why you can watch the dashboard continuously
          without invalidating anything — there is no penalty for looking early and
          often.
        </p>

        <h2>Thompson sampling</h2>
        <p>
          Assignment and inference are the same operation. To assign a visitor, the
          SDK draws one random sample from each arm&apos;s Beta distribution and
          sends the visitor to whichever arm&apos;s sample came out higher.
        </p>
        <ul>
          <li>When the two distributions overlap heavily (early on), each arm wins roughly half its draws — traffic stays near 50/50 and both arms keep collecting data.</li>
          <li>As one arm pulls ahead, it wins more draws, so more traffic flows to it — you spend less of your visitors on the worse option.</li>
          <li>It self-corrects. If the trailing arm was just unlucky, its distribution stays wide enough to keep winning some draws and clawing traffic back.</li>
        </ul>
        <p>There is no fixed split to configure and no exploration rate to tune.</p>

        <h2>P(variant &gt; control)</h2>
        <p>
          The headline number. We draw 10,000 paired samples — one from each
          arm&apos;s distribution — and count the fraction where the variant sample
          is higher. <code>0.87</code> means: <em>in 87% of plausible worlds
          consistent with the data so far, variant&apos;s true rate is higher than
          control&apos;s.</em>
        </p>
        <p>
          It is a direct probability about your experiment, not a p-value. <code>0.5</code>{' '}
          means the data can&apos;t yet tell the arms apart. <code>0.95</code>+ or{' '}
          <code>0.05</code>− is where the dashboard flags a strong result.
        </p>

        <h2>Expected loss</h2>
        <p>
          Probability alone doesn&apos;t tell you how much is at stake. Expected
          loss does. From the same 10,000 paired samples:
        </p>
        <ul>
          <li>
            <strong><code>ifChooseVariant</code></strong> — average amount of
            conversion rate you give up if you ship variant and control was
            actually better. <code>0.004</code> = about 0.4 percentage points.
          </li>
          <li>
            <strong><code>ifChooseControl</code></strong> — the mirror: what you
            forgo by keeping control if variant was actually better.
          </li>
        </ul>
        <p>
          Read it next to the probability. 82% with an expected loss of 0.1% is a
          safer call than 88% with an expected loss of 3% — in the second case,
          being wrong is expensive. The dashboard uses an expected-loss ceiling of
          0.5% as one of the conditions before it recommends concluding.
        </p>

        <h2>Credible intervals</h2>
        <p>
          Each arm shows a 95% credible interval: &quot;there&apos;s a 95%
          probability this arm&apos;s true conversion rate is between X and Y.&quot;
        </p>
        <p>
          At low traffic these are <strong>wide</strong>, and often they overlap.
          That is the model being honest — the data simply doesn&apos;t pin the
          rate down yet. A narrow interval you didn&apos;t earn with sample size
          would be the bug. Intervals tighten on their own as impressions grow.
        </p>

        <h2>Relative lift</h2>
        <p>
          <code>(variant rate − control rate) / control rate</code>, using the
          distribution means. It&apos;s the practical-size question sitting next to
          the probability question. A 40% lift from 2% to 2.8% is worth shipping; a
          1% lift from 5.00% to 5.05% probably isn&apos;t, however confident the
          probability gets. Both are shown so you weigh them together.
        </p>

        <h2>The decision label</h2>
        <p>
          The engine collapses the above into one of five labels. The thresholds:
        </p>
        <table>
          <thead>
            <tr><th>Label</th><th>Condition</th></tr>
          </thead>
          <tbody>
            <tr><td><code>conclude_variant</code></td><td>P(variant &gt; control) ≥ 0.95 <em>and</em> expected loss if you choose variant &lt; 0.5%</td></tr>
            <tr><td><code>conclude_control</code></td><td>P(variant &gt; control) ≤ 0.05 <em>and</em> expected loss if you choose control &lt; 0.5%</td></tr>
            <tr><td><code>strong_signal</code></td><td>P(variant &gt; control) ≥ 0.80</td></tr>
            <tr><td><code>directional</code></td><td>P(variant &gt; control) ≥ 0.60</td></tr>
            <tr><td><code>no_signal</code></td><td>everything else — the arms look the same so far</td></tr>
          </tbody>
        </table>
        <p>
          When the label reaches <code>conclude_variant</code> or{' '}
          <code>conclude_control</code>, a banner appears on the experiment. The
          experiment stays <code>live</code> — nothing transitions automatically.
          You decide when to conclude. The banner can be dismissed and does not
          reappear for that browser session.
        </p>

        <h2>The forward projection</h2>
        <p>
          While a result is still inconclusive, the dashboard estimates how much
          longer you need. It is based on:
        </p>
        <ul>
          <li>your <strong>traffic rate since launch</strong> — total impressions divided by days elapsed;</li>
          <li>the <strong>pooled conversion rate</strong> observed so far;</li>
          <li>a sample-size estimate for reaching 95% confidence, scaled to the effect size the data suggests.</li>
        </ul>
        <p>It has guard rails:</p>
        <ul>
          <li>Nothing is shown in the first 2 days or under 10 total impressions — too little to extrapolate from.</li>
          <li>If the projection lands beyond 90 days, the dashboard says the experiment <em>may not reach 95% confidence within 90 days</em> rather than printing a number you can&apos;t act on.</li>
          <li>Once the probability crosses 0.95 or 0.05, the projection disappears — you&apos;re there.</li>
        </ul>
        <p>
          It is a planning aid built from current velocity, not a promise. Real
          traffic and conversion rates move.
        </p>

        <h2>The full object</h2>
        <p>
          This is what the stats endpoint returns for a live experiment (and what
          gets frozen into the record when you conclude):
        </p>
        <CodeBlock code={statsShape} lang="json" />

        <Callout tone="info">
          <p>
            For the experiment&apos;s state machine — when stats freeze, what
            happens to the data on conclude and archive — see{' '}
            <Link href="/docs/experiment-lifecycle">Experiment lifecycle</Link>.
          </p>
        </Callout>
      </Prose>

      <DocsPager slug="how-the-stats-work" />
    </>
  )
}
