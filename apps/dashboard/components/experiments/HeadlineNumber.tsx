import type { ExperimentStatus } from '@/lib/experiments'
import { formatProb } from '@/lib/experiments'

type Props = {
  probVariantWins: number | null
  status: ExperimentStatus
  controlImpressions: number
  variantImpressions: number
}

export default function HeadlineNumber({ probVariantWins, status, controlImpressions, variantImpressions }: Props) {
  const prob = formatProb(probVariantWins, status)
  const total = controlImpressions + variantImpressions

  return (
    <div className="text-center py-6">
      <p className="text-6xl font-bold tabular-nums text-gray-900 tracking-tight">{prob}</p>
      <p className="text-sm text-gray-500 mt-2">P(B &gt; A)</p>
      <p className="text-sm text-gray-400 mt-1">
        {total.toLocaleString()} participant{total !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
