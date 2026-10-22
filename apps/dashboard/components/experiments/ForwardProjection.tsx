import { estimateDaysToResult } from '@/lib/experiments'
import type { ExperimentArm, FullStats } from '@/lib/experiments'

type Props = {
  launchedAt: string
  control: ExperimentArm
  variant: ExperimentArm
  stats: FullStats
}

export default function ForwardProjection({ launchedAt, control, variant, stats }: Props) {
  // Hidden once threshold is crossed
  if (stats.probVariantWins >= 0.95 || stats.probVariantWins <= 0.05) return null

  const totalImpressions = control.impressions + variant.impressions
  const totalConversions = control.conversions + variant.conversions
  const baselineRate = totalImpressions > 0 ? totalConversions / totalImpressions : 0

  const daysToResult = estimateDaysToResult(launchedAt, totalImpressions, baselineRate)

  const launchDate = new Date(launchedAt)
  const estimatedDate = daysToResult !== null && daysToResult > 0
    ? new Date(launchDate.getTime() + daysToResult * 86_400_000)
    : null

  const daysElapsed = (Date.now() - launchDate.getTime()) / 86_400_000
  const progressPct = daysToResult && daysToResult > 0
    ? Math.min(100, Math.round((daysElapsed / daysToResult) * 100))
    : 0

  return (
    <div className="border border-gray-200 rounded-lg px-4 py-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Planning estimate</p>
      <p className="text-xs text-gray-400 mb-3">A rough projection from current traffic and observed conversion rates.</p>

      {daysToResult === null ? (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-2">
          At your current traffic level, this experiment may not produce a clear result within 90 days.
        </p>
      ) : daysToResult === 0 ? (
        <p className="text-sm text-green-700">
          This estimate says you have enough data to consider wrapping up the experiment.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{launchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>Est. {estimatedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            ~{daysToResult - Math.floor(daysElapsed)} days remaining at current traffic
          </p>
        </div>
      )}
    </div>
  )
}
