import Link from 'next/link'
import type { Metadata } from 'next'
import { DOC_PAGES } from '@/lib/docs/nav'

export const metadata: Metadata = {
  title: 'Docs — Absolutely Butter',
  description:
    'Everything you need to integrate the SDK, understand the statistics, and troubleshoot your experiments.',
}

export default function DocsIndexPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Documentation</h1>
      <p className="mt-3 text-[15px] leading-7 text-gray-600">
        Absolutely Butter runs statistically honest A/B tests on products without
        enterprise traffic. Drop in the SDK, and the dashboard tells you the
        probability your variant is better, how much better, and how risky it is
        to conclude now. These pages cover integration, the statistics, and the
        experiment lifecycle.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {DOC_PAGES.map(page => (
          <Link
            key={page.slug}
            href={page.href}
            className="group rounded-xl border border-gray-200 p-4 transition-colors hover:border-gray-300"
          >
            <span className="block text-sm font-semibold text-gray-900 group-hover:text-indigo-600">
              {page.title}
            </span>
            <span className="mt-1 block text-sm leading-6 text-gray-500">{page.summary}</span>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-gray-500">
        New here? Start with the{' '}
        <Link href="/docs/quickstart" className="font-medium text-indigo-600 underline underline-offset-2">
          Quick start
        </Link>
        .
      </p>
    </div>
  )
}
