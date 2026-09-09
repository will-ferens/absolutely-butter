import Link from 'next/link'
import type { Metadata } from 'next'
import Prose from '@/components/docs/Prose'
import Callout from '@/components/docs/Callout'
import DocsPager from '@/components/docs/DocsPager'

export const metadata: Metadata = {
  title: 'Experiment lifecycle — Absolutely Butter docs',
  description: 'The draft → live → inactive → archived state machine, its transitions, and what each one does to your data.',
}

function StateNode({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-xs font-medium text-gray-900">
      {label}
    </div>
  )
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center px-1 text-gray-400">
      <span className="text-[10px] leading-tight text-gray-500">{label}</span>
      <span aria-hidden className="text-base leading-none">→</span>
    </div>
  )
}

export default function ExperimentLifecyclePage() {
  return (
    <>
      <Prose>
        <h1 className="text-2xl font-semibold text-gray-900">Experiment lifecycle</h1>
        <p>
          An experiment moves through four states. Transitions are explicit — you
          trigger each one, except that nothing ever leaves <code>live</code> on
          its own. In the dashboard, <code>inactive</code> is labelled
          &quot;Concluded.&quot;
        </p>

        <div className="my-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <StateNode label="draft" />
            <Arrow label="launch" />
            <StateNode label="live" />
            <Arrow label="conclude" />
            <StateNode label="inactive" />
            <Arrow label="archive" />
            <StateNode label="archived" />
          </div>
          <p className="mt-3 text-center text-xs text-gray-500">
            <code>inactive → live</code> via <strong>reactivate</strong> is the only backward move.
          </p>
        </div>

        <h2>States and transitions</h2>
        <table>
          <thead>
            <tr>
              <th>From</th><th>Action</th><th>To</th><th>What it does</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>—</td>
              <td>Create</td>
              <td><code>draft</code></td>
              <td>Creates the experiment and its two arms at zero. Requires an active or trialing account.</td>
            </tr>
            <tr>
              <td><code>draft</code></td>
              <td>Launch</td>
              <td><code>live</code></td>
              <td>Stamps <code>launched_at</code>. From now the SDK assigns variants and records events. Requires an active or trialing account.</td>
            </tr>
            <tr>
              <td><code>live</code></td>
              <td>Conclude</td>
              <td><code>inactive</code></td>
              <td>You record a decision — shipped variant, kept control, or shipped neither, plus optional notes. Stamps <code>concluded_at</code> and freezes a full stats snapshot.</td>
            </tr>
            <tr>
              <td><code>inactive</code></td>
              <td>Reactivate</td>
              <td><code>live</code></td>
              <td>Clears the recorded decision and the frozen snapshot, and resumes live assignment and stat computation against the existing arm counts. Requires an active or trialing account.</td>
            </tr>
            <tr>
              <td><code>inactive</code></td>
              <td>Archive</td>
              <td><code>archived</code></td>
              <td>Permanent. Deletes the per-session rows (see below). The experiment becomes read-only.</td>
            </tr>
          </tbody>
        </table>
        <p>
          Every transition is guarded: launching something that isn&apos;t a draft,
          concluding something that isn&apos;t live, or archiving something that
          isn&apos;t inactive all fail. There is no direct <code>live → archived</code>{' '}
          — you conclude first.
        </p>

        <h2>What&apos;s editable in each state</h2>
        <table>
          <thead>
            <tr>
              <th>Field</th><th>draft</th><th>live</th><th>inactive</th><th>archived</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Name</td><td>✅</td><td>✅</td><td>✅</td><td>—</td></tr>
            <tr><td>Hypothesis</td><td>✅</td><td>✅</td><td>✅</td><td>—</td></tr>
            <tr><td>Control description</td><td>✅</td><td>—</td><td>—</td><td>—</td></tr>
            <tr><td>Variant description</td><td>✅</td><td>—</td><td>—</td><td>—</td></tr>
            <tr><td>Conversion goal</td><td>✅</td><td>—</td><td>—</td><td>—</td></tr>
          </tbody>
        </table>
        <p>
          The three defining fields — what control is, what variant is, what counts
          as a conversion — lock when you launch, so a running experiment
          can&apos;t have its terms changed underneath the data. Name and
          hypothesis stay editable until the experiment is archived. An archived
          experiment rejects all edits.
        </p>

        <h2>What happens to your data</h2>
        <p><strong>Arm counts</strong> — impressions and conversions per arm — are kept indefinitely, through every state. They are the permanent record every statistic is derived from.</p>
        <p>
          <strong>On conclude</strong>, the current statistics (probability,
          expected loss, credible intervals, relative lift, decision label) are
          computed once and stored on the experiment. While it&apos;s{' '}
          <code>inactive</code> or <code>archived</code>, the dashboard shows that
          frozen snapshot rather than recomputing — the result you concluded on is
          the result you keep. Reactivating discards the snapshot and goes live
          again.
        </p>
        <p>
          <strong>On archive</strong>, the per-session rows that back deduplication
          and one-conversion-per-session are deleted. Aggregate arm counts and the
          frozen snapshot remain; the granular session history does not. This is
          why archive is one-way.
        </p>

        <Callout tone="warning" title="While inactive or archived">
          <p>
            The SDK&apos;s config endpoint reports the experiment as not live, so{' '}
            <code>getVariant()</code> returns <code>control</code> for everyone and
            any impression or conversion events are dropped. Remove or update the
            experiment id in your integration once you&apos;ve concluded.
          </p>
        </Callout>

        <p>
          For how the frozen statistics are calculated, see{' '}
          <Link href="/docs/how-the-stats-work">How the statistics work</Link>.
        </p>
      </Prose>

      <DocsPager slug="experiment-lifecycle" />
    </>
  )
}
