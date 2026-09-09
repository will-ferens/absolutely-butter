type Tone = 'info' | 'warning' | 'success'

const STYLES: Record<Tone, { box: string; label: string }> = {
  info: { box: 'border-indigo-200 bg-indigo-50 text-indigo-900', label: 'text-indigo-600' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', label: 'text-amber-700' },
  success: { box: 'border-green-200 bg-green-50 text-green-900', label: 'text-green-700' },
}

export default function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: Tone
  title?: string
  children: React.ReactNode
}) {
  const s = STYLES[tone]
  return (
    <div className={`my-6 rounded-lg border px-4 py-3 text-sm ${s.box}`}>
      {title && <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${s.label}`}>{title}</p>}
      <div className="[&_a]:underline [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">{children}</div>
    </div>
  )
}
