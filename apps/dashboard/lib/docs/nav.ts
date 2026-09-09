/**
 * Single source of truth for the docs site.
 *
 * SDK_PACKAGE_NAME is a placeholder until the npm package is published — it is
 * referenced by every code sample and by the in-product integration snippet
 * (apps/server/src/routes/private/experiments.ts). Update it in one place here
 * once the real package name is known.
 */
export const SDK_PACKAGE_NAME = '@absolutely-butter/sdk'

/**
 * The public origin of the API the SDK talks to. Baked in at build time from
 * NEXT_PUBLIC_API_URL (set per-environment on Vercel); the fallback is only hit
 * in local dev where the API runs on :3001.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export type DocPage = {
  slug: string
  href: string
  title: string
  summary: string
}

export const DOC_PAGES: DocPage[] = [
  {
    slug: 'quickstart',
    href: '/docs/quickstart',
    title: 'Quick start',
    summary: 'Install the SDK and get your first impression in under 15 minutes.',
  },
  {
    slug: 'sdk-reference',
    href: '/docs/sdk-reference',
    title: 'SDK API reference',
    summary: 'Every export, its parameters, return type, and failure behavior.',
  },
  {
    slug: 'how-the-stats-work',
    href: '/docs/how-the-stats-work',
    title: 'How the statistics work',
    summary: 'Thompson sampling, P(variant > control), expected loss, and credible intervals.',
  },
  {
    slug: 'experiment-lifecycle',
    href: '/docs/experiment-lifecycle',
    title: 'Experiment lifecycle',
    summary: 'The draft → live → inactive → archived state machine and what each transition does.',
  },
  {
    slug: 'faq',
    href: '/docs/faq',
    title: 'FAQ',
    summary: 'Troubleshooting impressions, traffic, trials, and concurrent experiments.',
  },
]

export function pagerFor(slug: string): { prev: DocPage | null; next: DocPage | null } {
  const i = DOC_PAGES.findIndex(p => p.slug === slug)
  if (i === -1) return { prev: null, next: null }
  return {
    prev: i > 0 ? DOC_PAGES[i - 1]! : null,
    next: i < DOC_PAGES.length - 1 ? DOC_PAGES[i + 1]! : null,
  }
}
