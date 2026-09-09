import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { DOC_PAGES } from '@/lib/docs/nav'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/docs`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ...DOC_PAGES.map(page => ({
      url: `${SITE_URL}${page.href}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ]
}
