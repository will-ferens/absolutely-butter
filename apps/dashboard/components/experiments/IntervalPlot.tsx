import { computeAxisScale, observedRate } from '@/lib/experiments'
import type { ExperimentArm, FullStats } from '@/lib/experiments'

type Props = {
  control: ExperimentArm
  variant: ExperimentArm
  stats: FullStats
}

const LABEL_W = 72
const DOT_R = 5
const ROW_H = 52
const SVG_H = ROW_H * 2 + 16

function Row({
  label,
  arm,
  ci,
  scale,
  plotW,
  y,
  color,
}: {
  label: string
  arm: ExperimentArm
  ci: [number, number]
  scale: { min: number; max: number }
  plotW: number
  y: number
  color: string
}) {
  const toX = (v: number) => LABEL_W + ((v - scale.min) / (scale.max - scale.min)) * plotW

  const x1 = toX(ci[0])
  const x2 = toX(ci[1])
  const cx = toX(observedRate(arm))
  const midY = y + ROW_H / 2

  const rateLabel = arm.impressions > 0
    ? `${(observedRate(arm) * 100).toFixed(1)}%`
    : '—'

  return (
    <g>
      {/* Label */}
      <text x={0} y={midY + 4} className="text-xs fill-gray-500" fontSize={12}>
        {label}
      </text>

      {/* Impression count */}
      <text x={LABEL_W - 4} y={midY - 8} textAnchor="end" fontSize={10} className="fill-gray-400">
        n={arm.impressions.toLocaleString()}
      </text>

      {/* Credible interval line */}
      <line
        x1={x1} y1={midY} x2={x2} y2={midY}
        stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.35}
      />

      {/* Interval caps */}
      <line x1={x1} y1={midY - 6} x2={x1} y2={midY + 6} stroke={color} strokeWidth={2} opacity={0.5} />
      <line x1={x2} y1={midY - 6} x2={x2} y2={midY + 6} stroke={color} strokeWidth={2} opacity={0.5} />

      {/* Observed rate dot */}
      <circle cx={cx} cy={midY} r={DOT_R} fill={color} />

      {/* Rate label */}
      <text x={cx} y={midY + ROW_H / 2 - 4} textAnchor="middle" fontSize={11} className="fill-gray-600">
        {rateLabel}
      </text>
    </g>
  )
}

export default function IntervalPlot({ control, variant, stats }: Props) {
  const scale = computeAxisScale(stats.credibleIntervals.control, stats.credibleIntervals.variant)

  return (
    <div className="w-full">
      <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-medium">95% Credible Intervals</p>
      <svg
        width="100%"
        viewBox={`0 0 600 ${SVG_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        {/* Axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => {
          if (v < scale.min - 0.01 || v > scale.max + 0.01) return null
          const x = LABEL_W + ((v - scale.min) / (scale.max - scale.min)) * (600 - LABEL_W - 16)
          return (
            <g key={v}>
              <line x1={x} y1={0} x2={x} y2={SVG_H} stroke="#e5e7eb" strokeWidth={1} />
              <text x={x} y={SVG_H + 14} textAnchor="middle" fontSize={10} className="fill-gray-400">
                {(v * 100).toFixed(0)}%
              </text>
            </g>
          )
        })}

        <Row
          label="Control"
          arm={control}
          ci={stats.credibleIntervals.control}
          scale={scale}
          plotW={600 - LABEL_W - 16}
          y={0}
          color="#6366f1"
        />
        <Row
          label="Variant"
          arm={variant}
          ci={stats.credibleIntervals.variant}
          scale={scale}
          plotW={600 - LABEL_W - 16}
          y={ROW_H}
          color="#10b981"
        />
      </svg>
    </div>
  )
}
