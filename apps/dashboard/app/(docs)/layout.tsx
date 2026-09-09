import type { Metadata } from 'next'
import Link from 'next/link'
import DocsSidebar from '@/components/docs/DocsSidebar'

export const metadata: Metadata = {
  title: 'Docs — Absolutely Butter',
  description:
    'Integrate the SDK, understand the statistics, and troubleshoot your experiments.',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-display text-sm font-semibold tracking-[-0.01em] text-gray-900 transition-colors hover:text-gray-600"
            >
              Absolutely Butter
            </Link>
            <span className="text-sm text-gray-300">/</span>
            <Link href="/docs" className="text-sm text-gray-500 transition-colors hover:text-gray-900">
              Docs
            </Link>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/experiments" className="text-gray-500 transition-colors hover:text-gray-900">
              Dashboard
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Start free trial
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-10">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-24">
            <DocsSidebar />
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
