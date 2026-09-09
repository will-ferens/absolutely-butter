import Link from 'next/link'
import type { Metadata } from 'next'
import Prose from '@/components/docs/Prose'
import CodeBlock from '@/components/docs/CodeBlock'
import Callout from '@/components/docs/Callout'
import DocsPager from '@/components/docs/DocsPager'
import { SDK_PACKAGE_NAME, API_BASE_URL } from '@/lib/docs/nav'

export const metadata: Metadata = {
  title: 'Quick start — Absolutely Butter docs',
  description: 'Install the SDK, initialize it, render a variant, and track a conversion.',
}

const installNpm = `npm install ${SDK_PACKAGE_NAME}`

const initSnippet = `import { init } from '${SDK_PACKAGE_NAME}'

init({
  apiKey: process.env.NEXT_PUBLIC_AB_API_KEY!, // your publishable pk_live_… key
  experimentId: 'exp_xxxxxxxxxxxx',            // from the experiment's detail page
  baseUrl: '${API_BASE_URL}',
})`

const getVariantSnippet = `import { getVariant } from '${SDK_PACKAGE_NAME}'

const variant = getVariant() // 'control' | 'variant' — never throws, never null

if (variant === 'variant') {
  // render the change you're testing
} else {
  // render the original ('control' is also the value before init resolves)
}`

const trackSnippet = `import { track } from '${SDK_PACKAGE_NAME}'

<button onClick={() => track('conversion')}>Sign up</button>`

const fullExample = `'use client'

import { useEffect, useState } from 'react'
import { init, ready, getVariant, track } from '${SDK_PACKAGE_NAME}'

const EXPERIMENT_ID = 'exp_xxxxxxxxxxxx'

export default function SignupCta() {
  const [variant, setVariant] = useState<'control' | 'variant'>('control')

  useEffect(() => {
    init({
      apiKey: process.env.NEXT_PUBLIC_AB_API_KEY!,
      experimentId: EXPERIMENT_ID,
      baseUrl: '${API_BASE_URL}',
    })

    // ready() always resolves — on success or on silent failure
    ready().then(() => setVariant(getVariant()))
  }, [])

  return (
    <button
      className={variant === 'variant' ? 'btn-green' : 'btn-blue'}
      onClick={() => track('conversion')}
    >
      {variant === 'variant' ? 'Start your free trial' : 'Sign up'}
    </button>
  )
}`

export default function QuickstartPage() {
  return (
    <>
      <Prose>
        <p className="text-sm text-gray-400">Estimated time: under 15 minutes.</p>
        <h1 className="!mt-2 text-2xl font-semibold text-gray-900">Quick start</h1>
        <p>
          This walks through a complete integration in four steps — install,{' '}
          <code>init</code>, <code>getVariant</code>, <code>track</code> — using
          Next.js App Router. The SDK is framework-agnostic; any browser
          environment works the same way.
        </p>

        <h2>Before you start</h2>
        <p>You need a <strong>live</strong> experiment. In the dashboard:</p>
        <ol>
          <li>
            Create an experiment (<Link href="/experiments/new">Experiments → New</Link>) —
            name it, describe your control and variant, and define the conversion goal.
            It starts in <code>draft</code>.
          </li>
          <li>Open the experiment and <strong>Launch</strong> it. It must be <code>live</code> before the SDK will assign variants or record events.</li>
          <li>Copy its ID (the <code>exp_…</code> value in the URL and on the detail page).</li>
          <li>
            Copy your API key from <Link href="/settings">Settings → API key</Link>. It
            looks like <code>pk_live_…</code> and is safe to expose in client code.
          </li>
        </ol>
        <Callout tone="warning" title="If the experiment isn't live">
          <p>
            The config endpoint returns only a status for non-live experiments. The
            SDK then serves <code>control</code> to everyone and sends no
            impressions — so your dashboard counts stay at zero.
          </p>
        </Callout>

        <h2>1. Install</h2>
        <CodeBlock code={installNpm} lang="bash" title="terminal" />
        <p>
          The package has zero runtime dependencies and ships its own TypeScript
          types. <code>pnpm add</code> and <code>yarn add</code> work too.
        </p>

        <h2>2. Initialize</h2>
        <p>
          Call <code>init()</code> once, as early as possible on the client.
          It reads a cookie, and on a cache miss fetches the experiment config and
          assigns a variant. It returns a <code>Promise&lt;void&gt;</code> that
          resolves whether assignment succeeds or fails — it never rejects.
        </p>
        <CodeBlock code={initSnippet} lang="ts" />
        <p>
          <code>baseUrl</code> is the origin of your Absolutely Butter API.{' '}
          <code>timeout</code> is optional and defaults to <code>2000</code> ms;
          if the config request is slower than that, the SDK gives up and serves{' '}
          <code>control</code>.
        </p>

        <h2>3. Render the variant</h2>
        <p>
          <code>getVariant()</code> is synchronous and returns{' '}
          <code>&apos;control&apos;</code> or <code>&apos;variant&apos;</code>. Before{' '}
          <code>init()</code> resolves — and on any failure — it returns{' '}
          <code>&apos;control&apos;</code>, so the original experience always
          renders by default.
        </p>
        <CodeBlock code={getVariantSnippet} lang="ts" />

        <h2>4. Track the conversion</h2>
        <p>
          Call <code>track(&apos;conversion&apos;)</code> when the visitor completes
          your goal. It is fire-and-forget — it returns <code>void</code>, swallows
          all errors, and does nothing if the visitor has no assigned session
          (for example, a returning visitor whose session cookie was cleared).
        </p>
        <CodeBlock code={trackSnippet} lang="tsx" />

        <h2>Complete example</h2>
        <p>
          One client component that initializes the SDK, waits for{' '}
          <code>ready()</code>, renders the assigned variant, and tracks a
          conversion on click:
        </p>
        <CodeBlock code={fullExample} lang="tsx" title="components/SignupCta.tsx" />

        <h2>Verify it worked</h2>
        <p>
          Load the page in a browser, then open the experiment&apos;s detail screen
          in the dashboard:
        </p>
        <ul>
          <li>
            <strong>Impressions</strong> increment on first assignment. Refreshing
            the same browser does <em>not</em> add more — impressions are
            deduplicated per session.
          </li>
          <li>
            <strong>Conversions</strong> increment the first time that session
            fires <code>track(&apos;conversion&apos;)</code>. Repeat conversions
            from the same session are ignored.
          </li>
        </ul>
        <p>
          Your integration is fully confirmed once the experiment is <code>live</code>{' '}
          and has recorded at least one impression <em>and</em> at least one
          conversion.
        </p>

        <Callout tone="info" title="One thing to expect">
          <p>
            Because assignment happens after the page loads, a visitor who ends up
            on <code>variant</code> sees <code>control</code> for a moment first,
            then a re-render. This is a control&nbsp;→&nbsp;variant flash, not a
            blank flash. The{' '}
            <Link href="/docs/sdk-reference#flicker">SDK reference</Link> covers two
            ways to handle it.
          </p>
        </Callout>
      </Prose>

      <DocsPager slug="quickstart" />
    </>
  )
}
