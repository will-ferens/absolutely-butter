/**
 * Docs site navigation model.
 *
 * SDK_PACKAGE_NAME / API_BASE_URL moved to `@/lib/site` (the landing page needs
 * them too) and are re-exported here so existing docs imports keep working.
 */
export { SDK_PACKAGE_NAME, API_BASE_URL } from '@/lib/site'

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
