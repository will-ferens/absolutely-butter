'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DOC_PAGES } from '@/lib/docs/nav'

export default function DocsSidebar() {
  const pathname = usePathname()

  return (
    <nav className="text-sm">
      <Link
        href="/docs"
        className={`block rounded-md px-3 py-1.5 transition-colors ${
          pathname === '/docs'
            ? 'bg-gray-100 font-medium text-gray-900'
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        Overview
      </Link>
      <ul className="mt-1 space-y-0.5">
        {DOC_PAGES.map(page => {
          const active = pathname === page.href
          return (
            <li key={page.slug}>
              <Link
                href={page.href}
                className={`block rounded-md px-3 py-1.5 transition-colors ${
                  active
                    ? 'bg-gray-100 font-medium text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {page.title}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
