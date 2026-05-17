'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`text-sm pb-0.5 transition-colors ${
        active
          ? 'text-gray-900 border-b-2 border-gray-900'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </Link>
  )
}
