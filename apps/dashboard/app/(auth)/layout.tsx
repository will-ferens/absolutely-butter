export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-xl font-semibold text-gray-900">Absolutely Butter</span>
        </div>
        {children}
      </div>
    </div>
  )
}
