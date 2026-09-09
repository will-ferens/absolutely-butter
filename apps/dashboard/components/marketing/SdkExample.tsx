import CodeBlock from '@/components/docs/CodeBlock'
import { SDK_PACKAGE_NAME } from '@/lib/site'

/**
 * The complete happy path — init, getVariant, track — using the real shipped SDK
 * signature (packages/sdk/src/index.ts). Highlighted and copyable via the same
 * build-time <CodeBlock> the docs use. IDs and keys are marked placeholders.
 */
const snippet = `import { init, getVariant, track } from '${SDK_PACKAGE_NAME}'

// Both values below are placeholders — copy the real ones from your dashboard.
await init({
  apiKey: 'pk_live_xxxxxxxxxxxxxxxxxxxxxxxx', // Settings → API key
  experimentId: 'exp_xxxxxxxxxxxx',           // the experiment's detail page
  baseUrl: 'https://api.absolutely-butter.com',
})

// 'control' | 'variant' — synchronous, never throws, never null
const variant = getVariant()

// call this when the visitor completes the goal you're testing
track('conversion')`

export default function SdkExample() {
  return (
    <section className="border-y border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-gray-900 sm:text-3xl">
          Drop in the SDK, ship the test
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-gray-600">
          Three calls. No provider component, no config file, no build step. The
          SDK has zero dependencies and always falls back to your control, so a
          bad network never breaks the page.
        </p>
        <CodeBlock code={snippet} lang="ts" title="app/signup-cta.tsx" />
      </div>
    </section>
  )
}
