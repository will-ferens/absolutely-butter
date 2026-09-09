import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-[-0.02em] text-gray-900 transition-colors hover:text-gray-600"
          >
            Absolutely Butter
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
