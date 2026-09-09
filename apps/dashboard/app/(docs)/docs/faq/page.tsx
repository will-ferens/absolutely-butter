import Link from 'next/link'
import type { Metadata } from 'next'
import Prose from '@/components/docs/Prose'
import DocsPager from '@/components/docs/DocsPager'

export const metadata: Metadata = {
  title: 'FAQ — Absolutely Butter docs',
  description: 'Troubleshooting impressions, traffic requirements, trials, projections, and concurrent experiments.',
}

export default function FaqPage() {
  return (
    <>
      <Prose>
        <h1 className="text-2xl font-semibold text-gray-900">FAQ</h1>

        <h2>Why is my experiment not receiving impressions?</h2>
        <p>Work down this list:</p>
        <ul>
          <li>
            <strong>The experiment isn&apos;t live.</strong> The SDK only assigns
            variants and sends impressions for a <code>live</code> experiment.
            Launch it from the detail page.
          </li>
          <li>
            <strong>Wrong <code>apiKey</code> or <code>experimentId</code>.</strong>{' '}
            A bad key or id makes the config request fail, and the SDK falls back
            to <code>control</code> silently — by design, so your page never
            breaks. Double-check both against Settings and the experiment page.
          </li>
          <li>
            <strong><code>init()</code> isn&apos;t running on that page</strong>, or
            runs after the code that reads <code>getVariant()</code>. It must be
            called on the client, early.
          </li>
          <li>
            <strong>You&apos;re refreshing the same browser.</strong> Impressions
            are deduplicated per session, so reloads don&apos;t add to the count.
            Use a fresh session (new private window, cleared cookies) to test.
          </li>
          <li>
            <strong>An ad blocker or privacy extension</strong> is blocking the
            request to your API origin.
          </li>
          <li>
            <strong>Your account is past its trial or unpaid.</strong> Events from
            inactive accounts are accepted by the API and then discarded — see
            below.
          </li>
        </ul>

        <h2>How much traffic do I need?</h2>
        <p>
          There is no minimum. Absolutely Butter has no detectable-effect floor and
          won&apos;t stop you launching a low-traffic test. Low traffic just means{' '}
          <Link href="/docs/how-the-stats-work">wider credible intervals</Link> and
          a longer — or unavailable — forward projection. The result stays honest
          the whole way; it just takes longer to sharpen. Bigger true differences
          need far fewer visitors to show up than small ones.
        </p>

        <h2>Why does the confidence seem low after two weeks?</h2>
        <p>Usually one of two things:</p>
        <ul>
          <li>
            <strong>Not enough data yet.</strong> With small samples the two
            distributions still overlap, so P(variant &gt; control) sits near 50%.
            Check the forward projection for the estimated time to 95%.
          </li>
          <li>
            <strong>The real difference is small.</strong> If relative lift is only
            a percent or two, the probability will climb slowly no matter how long
            you wait. Decide whether a change that size is worth shipping at all.
          </li>
        </ul>
        <p>A low number after two weeks is information, not a malfunction.</p>

        <h2>What happens when my trial expires?</h2>
        <p>
          The 30-day trial ends and, until you add a card, the account is inactive.
          While inactive:
        </p>
        <ul>
          <li>You can&apos;t create, launch, or reactivate experiments.</li>
          <li>
            <strong>Impression and conversion events are never rejected with an
            error</strong> — the API accepts them and silently discards them, so a
            forgotten SDK integration on a live site never starts throwing.
          </li>
          <li>Your experiments and all their historical counts stay exactly as they were.</li>
        </ul>
        <p>
          Start the $19/month subscription from{' '}
          <Link href="/settings">Settings</Link> and data collection resumes
          immediately — no reconfiguration.
        </p>

        <h2>Can I run multiple experiments at the same time?</h2>
        <p>
          Not in v1. The SDK holds one experiment&apos;s assignment in memory and{' '}
          <code>init()</code> is meant to be called once per page. You can conclude
          one experiment and launch another, but concurrent experiments on the same
          page aren&apos;t supported yet. It&apos;s on the roadmap.
        </p>

        <h2>What does &quot;may not reach 95% confidence within 90 days&quot; mean?</h2>
        <p>
          That&apos;s the forward projection telling you it couldn&apos;t produce a
          useful estimate. Extrapolating from your traffic rate since launch and
          the conversion rates so far, the experiment isn&apos;t on track to reach
          95% confidence inside a 90-day window — so rather than show a number you
          can&apos;t plan around, it says so plainly. The usual causes are low
          traffic or a very small difference between the arms. Options: send more
          traffic to the tested surface, accept a directional read, or conclude on
          the relative lift if it&apos;s already big enough to act on.
        </p>

        <h2>Is any of this personally identifiable?</h2>
        <p>
          No. The SDK sets two cookies — the assigned variant and a random session
          id — and neither is tied to a person. Events carry only the experiment
          id, the arm, the event type, a timestamp, and that random id. There is no
          user identifier, and the per-session rows are deleted when an experiment
          is archived.
        </p>

        <h2>Can I change the control or variant after launching?</h2>
        <p>
          The descriptions and the conversion goal lock when you launch, so the
          data can&apos;t drift against a moving definition. Name and hypothesis
          stay editable. If you need to change what you&apos;re testing, conclude
          the experiment and start a new one. See{' '}
          <Link href="/docs/experiment-lifecycle">Experiment lifecycle</Link>.
        </p>
      </Prose>

      <DocsPager slug="faq" />
    </>
  )
}
