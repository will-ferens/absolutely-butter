import Link from 'next/link'
import type { Metadata } from 'next'
import Prose from '@/components/docs/Prose'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import DocsPager from '@/components/docs/DocsPager'
import { SDK_PACKAGE_NAME, API_BASE_URL } from '@/lib/docs/nav'

export const metadata: Metadata = {
  title: 'SDK API reference — Absolutely Butter docs',
  description: 'init, ready, getVariant, and track — parameters, return types, defaults, and failure behavior.',
}

const importLine = `import { init, ready, getVariant, track } from '${SDK_PACKAGE_NAME}'`

const initSig = `init(config: {
  apiKey: string
  experimentId: string
  baseUrl: string
  timeout?: number   // default: 2000
}): Promise<void>`

const hideRevealSnippet = `import { init, ready } from '${SDK_PACKAGE_NAME}'

const box = document.querySelector('#hero')
box.style.visibility = 'hidden'

init({ apiKey: '…', experimentId: '…', baseUrl: '${API_BASE_URL}' })

await ready()
box.style.visibility = 'visible' // reveal once the variant is known`

const configResponse = `// GET {baseUrl}/v1/experiments/:id/config
// Authorization: Bearer <apiKey>

{
  "status": "live",
  "control": { "alpha": 15, "beta": 90 },
  "variant": { "alpha": 24, "beta": 72 }
}

// For any non-live experiment the body is just:
{ "status": "draft" }`

export default function SdkReferencePage() {
  return (
    <>
      <Prose>
        <h1 className="text-2xl font-semibold text-gray-900">SDK API reference</h1>
        <p>
          The package exports exactly four functions. It has zero runtime
          dependencies, ships its own types, and is designed never to throw and
          never to break the host page.
        </p>
        <CodeBlock code={importLine} lang="ts" />

        <h2 id="init">init(config)</h2>
        <CodeBlock code={initSig} lang="ts" />
        <p>
          Call once, on the client, as early as possible. Returns a{' '}
          <code>Promise&lt;void&gt;</code> that <strong>always resolves</strong> —
          on success, on network failure, on timeout, on a malformed response, or
          when the experiment isn&apos;t live. It never rejects.
        </p>
        <table>
          <thead>
            <tr><th>Field</th><th>Type</th><th>Notes</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>apiKey</code></td>
              <td><code>string</code></td>
              <td>Your publishable <code>pk_live_…</code> key. Sent as <code>Authorization: Bearer</code> on every request. Safe to ship in client code.</td>
            </tr>
            <tr>
              <td><code>experimentId</code></td>
              <td><code>string</code></td>
              <td>The <code>exp_…</code> identifier from the experiment&apos;s detail page.</td>
            </tr>
            <tr>
              <td><code>baseUrl</code></td>
              <td><code>string</code></td>
              <td>Origin of your Absolutely Butter API, e.g. <code>{API_BASE_URL}</code>.</td>
            </tr>
            <tr>
              <td><code>timeout</code></td>
              <td><code>number?</code></td>
              <td>Milliseconds before the config request is aborted and <code>control</code> is served. Default <code>2000</code>.</td>
            </tr>
          </tbody>
        </table>
        <p>What <code>init()</code> does, in order:</p>
        <ol>
          <li>
            Reads the <code>__ab_&lt;experimentId&gt;</code> cookie. If it holds{' '}
            <code>control</code> or <code>variant</code>, that value is used, the
            session id is restored from <code>__ab_&lt;experimentId&gt;_sid</code>,
            and <code>init()</code> resolves immediately — <strong>no network
            request</strong>.
          </li>
          <li>
            Otherwise it fetches{' '}
            <code>GET {'{baseUrl}'}/v1/experiments/&lt;id&gt;/config</code>.
          </li>
          <li>
            If the response status isn&apos;t <code>&quot;live&quot;</code>, it
            resolves and leaves the variant as <code>control</code>. No cookie is
            set, no impression is sent.
          </li>
          <li>
            If it is live, the SDK draws one sample from each arm&apos;s Beta
            posterior (Thompson sampling), picks the higher draw, writes both
            cookies (30-day expiry), and sends one <code>impression</code> event.
          </li>
        </ol>
        <CodeBlock code={configResponse} lang="json" />

        <h2 id="ready">ready()</h2>
        <CodeBlock code={`ready(): Promise<void>`} lang="ts" />
        <p>
          Resolves once <code>init()</code> has settled — whether it succeeded or
          failed silently. Use it to defer rendering until the variant is known.
          It never rejects. Before <code>init()</code> has been called, the
          promise is simply still pending.
        </p>

        <h2 id="getvariant">getVariant()</h2>
        <CodeBlock code={`getVariant(): 'control' | 'variant'`} lang="ts" />
        <p>
          Synchronous. Returns the assigned arm. This is the control guarantee:
        </p>
        <table>
          <thead>
            <tr><th>State</th><th><code>getVariant()</code></th></tr>
          </thead>
          <tbody>
            <tr><td>Before <code>init()</code> resolves</td><td><code>&apos;control&apos;</code></td></tr>
            <tr><td>After a successful assignment</td><td><code>&apos;control&apos;</code> or <code>&apos;variant&apos;</code></td></tr>
            <tr><td>Network failure / timeout</td><td><code>&apos;control&apos;</code></td></tr>
            <tr><td>Invalid API key or experiment id</td><td><code>&apos;control&apos;</code></td></tr>
            <tr><td>Experiment not live</td><td><code>&apos;control&apos;</code></td></tr>
          </tbody>
        </table>
        <p>It never returns <code>null</code>, never returns any other string, and never throws.</p>

        <h2 id="track">track(event)</h2>
        <CodeBlock code={`track(event: 'conversion'): void`} lang="ts" />
        <p>
          Records a conversion for the current session. Fire-and-forget: it
          returns <code>void</code>, sends the request without awaiting it, and
          swallows every error. <code>&apos;conversion&apos;</code> is the only
          accepted argument.
        </p>
        <p>
          It does nothing if there is no session id — which happens when{' '}
          <code>init()</code> never established a live session, or when a returning
          visitor&apos;s <code>_sid</code> cookie was cleared. The server also
          ignores a conversion with no matching impression, and ignores repeat
          conversions from a session that already converted.
        </p>

        <h2 id="cookies">Cookies</h2>
        <p>The SDK sets two cookies per experiment, both scoped to <code>path=/</code>:</p>
        <table>
          <thead>
            <tr><th>Name</th><th>Value</th><th>Purpose</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>__ab_&lt;experimentId&gt;</code></td>
              <td><code>control</code> or <code>variant</code></td>
              <td>Keeps assignment stable across page loads.</td>
            </tr>
            <tr>
              <td><code>__ab_&lt;experimentId&gt;_sid</code></td>
              <td>a random UUID</td>
              <td>Server-side deduplication of impressions. Not a user id — it cannot be traced to a person.</td>
            </tr>
          </tbody>
        </table>
        <ul>
          <li><strong>Expiry:</strong> 30 days (<code>max-age</code>), refreshed only when a new assignment is made.</li>
          <li><strong>Flags:</strong> <code>SameSite=Lax</code>. Not <code>HttpOnly</code> (the SDK must read them in JS) and not <code>Secure</code>-only (so they work on <code>localhost</code>).</li>
          <li>
            <strong>If cleared mid-experiment:</strong> the next <code>init()</code>{' '}
            sees no cookie and re-runs assignment. The visitor may land on the
            other variant and receives a new session id. This is an accepted
            trade-off of client-side assignment.
          </li>
        </ul>

        <h2 id="assignment">How assignment works</h2>
        <p>
          The <code>/config</code> response carries each arm&apos;s Beta posterior
          parameters — <code>alpha = 1 + conversions</code> and{' '}
          <code>beta = 1 + (impressions − conversions)</code>. The SDK draws one
          sample from each arm and assigns whichever is higher. Early on, when the
          posteriors are wide, this is close to a coin flip; as data accumulates it
          shifts traffic toward the better-performing arm. There is no{' '}
          <code>epsilon</code> parameter and no fixed split.
        </p>

        <h2 id="flicker">Flicker</h2>
        <p>
          Assignment finishes after the page has already rendered, so a visitor
          who ends up on <code>variant</code> briefly sees <code>control</code>
          first, then a re-render. It is a control&nbsp;→&nbsp;variant flash, never
          a blank one. Two ways to handle it:
        </p>
        <ol>
          <li>
            <strong>Default to control (recommended).</strong>{' '}
            <code>getVariant()</code> already returns <code>control</code> before
            assignment, so the original renders instantly and swaps in the variant
            when <code>init()</code> resolves. On fast connections this is
            imperceptible, and it degrades gracefully on slow ones.
          </li>
          <li>
            <strong>Hide and reveal.</strong> Keep the experimental region hidden,
            <code>await ready()</code>, then reveal it. No flash, at the cost of a
            blank region while the config request is in flight.
          </li>
        </ol>
        <CodeBlock code={hideRevealSnippet} lang="ts" />
        <Callout tone="info">
          <p>
            Zero-flicker assignment at the edge (before the page renders) is on the
            v2 roadmap. v1 is client-side only.
          </p>
        </Callout>

        <h2 id="endpoints">Endpoints the SDK calls</h2>
        <ul>
          <li>
            <code>GET {'{baseUrl}'}/v1/experiments/&lt;id&gt;/config</code> — on{' '}
            <code>init()</code> when there is no cookie. <code>Authorization: Bearer &lt;apiKey&gt;</code>.
          </li>
          <li>
            <code>POST {'{baseUrl}'}/v1/events</code> — one <code>impression</code>{' '}
            on assignment, one <code>conversion</code> per <code>track()</code> call.{' '}
            <code>Authorization: Bearer &lt;apiKey&gt;</code>. Always answered{' '}
            <code>202</code>; the SDK does not wait on it.
          </li>
        </ul>
        <p>
          Full request and response shapes are in the{' '}
          <Link href="/docs/how-the-stats-work">statistics reference</Link> and the
          Server &amp; API specification.
        </p>
      </Prose>

      <DocsPager slug="sdk-reference" />
    </>
  )
}
