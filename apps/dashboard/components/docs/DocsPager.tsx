import Link from 'next/link'
import { pagerFor } from '@/lib/docs/nav'

export default function DocsPager({ slug }: { slug: string }) {
  const { prev, next } = pagerFor(slug)

  return (
    <div className="mt-16 flex items-stretch justify-between gap-4 border-t border-gray-200 pt-6">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex-1 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:border-gray-300"
        >
          <span className="text-xs text-gray-400">← Previous</span>
          <span className="mt-0.5 block text-sm font-medium text-gray-900 group-hover:text-butter-700">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span className="flex-1" />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex-1 rounded-lg border border-gray-200 px-4 py-3 text-right transition-colors hover:border-gray-300"
        >
          <span className="text-xs text-gray-400">Next →</span>
          <span className="mt-0.5 block text-sm font-medium text-gray-900 group-hover:text-butter-700">
            {next.title}
          </span>
        </Link>
      ) : (
        <span className="flex-1" />
      )}
    </div>
  )
}
