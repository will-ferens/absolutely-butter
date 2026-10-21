# @absolutely-butter/sdk

Zero-dependency browser SDK for [Absolutely Butter](https://www.absolutely-butter.app), an experimentation platform for solo founders.

## Install

```sh
npm install @absolutely-butter/sdk
```

## Use

```ts
import { init, ready, getVariant, track } from '@absolutely-butter/sdk'

await init({
  apiKey: 'pk_live_…',
  experimentId: 'exp_…',
  baseUrl: 'https://api.absolutely-butter.com',
})

await ready()

if (getVariant() === 'variant') {
  // Render the variant experience.
}

button.addEventListener('click', () => track('conversion'))
```

`init()` always resolves and falls back to `control` on network, timeout, or response errors. `track('conversion')` is fire-and-forget and never throws. Assignment is kept in browser cookies, and events are sent without blocking the host application.

The server keeps the stored assignment authoritative, deduplicates impressions and conversions, and ignores events for experiments that are not live.

## Public API

- `init(config): Promise<void>` initializes an experiment assignment.
- `ready(): Promise<void>` resolves when initialization has settled.
- `getVariant(): 'control' | 'variant'` returns the current assignment.
- `track('conversion'): void` records a conversion without blocking the page.

See the [SDK API reference](https://www.absolutely-butter.app/docs/sdk-reference) and [quick start](https://www.absolutely-butter.app/docs/quickstart) for the complete contract.

## Development

From the repository root:

```sh
pnpm --filter @absolutely-butter/sdk build
pnpm --filter @absolutely-butter/sdk typecheck
pnpm --filter @absolutely-butter/sdk test
pnpm --filter @absolutely-butter/sdk verify:package
```

Releases are version-tagged with `sdk-v<version>` and published by GitHub Actions after the tag matches the package version and all checks pass. Publishing uses npm Trusted Publishing; no npm token is stored in the repository.
