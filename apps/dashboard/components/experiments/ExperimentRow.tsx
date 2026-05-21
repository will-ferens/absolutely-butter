import Link from 'next/link'
import { formatProb, formatRelativeDate, hasSignal, truncateName } from '@/lib/experiments'
import type { ExperimentWithArms } from '@/lib/experiments'

const STATUS_COLORS: Record<string, string> = {
  live: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-600',
  inactive: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-400',
}

export default function ExperimentRow({ exp }: { exp: ExperimentWithArms }) {
  const signal = hasSignal(exp.probVariantWins)
  const prob = formatProb(exp.probVariantWins, exp.status)
  const date = formatRelativeDate(exp)

  return (
    <Link
      href={`/experiments/${exp.id}`}
      className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center gap-3 min-w-0">
        {signal && (
          <span className="shrink-0 w-2 h-2 rounded-full bg-indigo-500" aria-label="Signal detected" />
        )}
        {!signal && <span className="shrink-0 w-2 h-2" />}

        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {truncateName(exp.name)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{date}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 ml-4">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[exp.status] ?? ''}`}>
          {exp.status}
        </span>
        <span className="text-sm font-mono text-gray-700 w-12 text-right">
          {prob}
        </span>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
