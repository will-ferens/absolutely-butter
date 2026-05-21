export type ExperimentStatus = 'draft' | 'live' | 'inactive' | 'archived'

export type ExperimentArm = {
  id: string
  experiment_id: string
  arm: 'control' | 'variant'
  impressions: number
  conversions: number
}

export type FullStats = {
  probVariantWins: number
  expectedLoss: { ifChooseVariant: number; ifChooseControl: number }
  relativeLift: number
  credibleIntervals: { control: [number, number]; variant: [number, number] }
  decision: 'conclude_variant' | 'conclude_control' | 'strong_signal' | 'directional' | 'no_signal'
}

export type Conclusion = {
  decision: 'shipped_variant' | 'kept_control' | 'shipped_neither'
  notes: string | null
  concludedAt: string
  finalStats: FullStats | null
}

export type Experiment = {
  id: string
  user_id: string
  name: string
  status: ExperimentStatus
  hypothesis: string | null
  control_description: string
  variant_description: string
  goal: string
  created_at: string
  launched_at: string | null
  concluded_at: string | null
  conclusion: Conclusion | null
}

export type ExperimentWithArms = Experiment & {
  arms: { control: ExperimentArm | undefined; variant: ExperimentArm | undefined }
  probVariantWins: number | null
}

export type ExperimentDetail = Experiment & {
  arms: { control: ExperimentArm | undefined; variant: ExperimentArm | undefined }
  stats: FullStats | null
}

export type StatusGroup = {
  status: ExperimentStatus
  experiments: ExperimentWithArms[]
}

const STATUS_ORDER: ExperimentStatus[] = ['live', 'draft', 'inactive', 'archived']

export function groupAndSort(experiments: ExperimentWithArms[]): StatusGroup[] {
  const groups = new Map<ExperimentStatus, ExperimentWithArms[]>()
  for (const status of STATUS_ORDER) groups.set(status, [])

  for (const exp of experiments) {
    groups.get(exp.status)?.push(exp)
  }

  for (const group of groups.values()) {
    group.sort((a, b) => {
      if (a.probVariantWins === null && b.probVariantWins === null) return 0
      if (a.probVariantWins === null) return 1
      if (b.probVariantWins === null) return -1
      return b.probVariantWins - a.probVariantWins
    })
  }

  return STATUS_ORDER
    .map(status => ({ status, experiments: groups.get(status)! }))
    .filter(g => g.experiments.length > 0)
}

export function formatRelativeDate(
  exp: Pick<Experiment, 'status' | 'created_at' | 'launched_at' | 'concluded_at'>,
): string {
  let date: string | null
  let prefix: string

  if (exp.status === 'draft') {
    date = exp.created_at
    prefix = 'Created '
  } else if ((exp.status === 'inactive' || exp.status === 'archived') && exp.concluded_at) {
    date = exp.concluded_at
    prefix = 'Concluded '
  } else {
    date = exp.launched_at ?? exp.created_at
    prefix = ''
  }

  if (!date) return ''

  const diffMs = Date.now() - new Date(date).getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffDays === 0) return `${prefix}Today`
  if (diffDays === 1) return `${prefix}Yesterday`
  return `${prefix}${diffDays} days ago`
}

export function formatProb(prob: number | null, status: ExperimentStatus): string {
  if (status === 'draft' || status === 'archived') return '—'
  if (prob === null) return '—'
  return `${Math.round(prob * 100)}%`
}

export function hasSignal(prob: number | null): boolean {
  if (prob === null) return false
  return prob >= 0.95 || prob <= 0.05
}

export function computeAxisScale(
  controlCI: [number, number],
  variantCI: [number, number],
): { min: number; max: number } {
  const allValues = [...controlCI, ...variantCI]
  const rawMin = Math.min(...allValues)
  const rawMax = Math.max(...allValues)
  const range = rawMax - rawMin || 0.1
  const padding = range * 0.05
  return {
    min: Math.max(0, rawMin - padding),
    max: Math.min(1, rawMax + padding),
  }
}

// Returns total days from launch to estimated convergence, or null if won't converge within 90 days.
export function estimateDaysToSignificance(
  launchedAt: string,
  totalImpressions: number,
  baselineConversionRate: number,
): number | null {
  const daysElapsed = (Date.now() - new Date(launchedAt).getTime()) / 86_400_000
  if (daysElapsed < 2 || totalImpressions < 10) return null

  const dailyRate = totalImpressions / daysElapsed
  const p = Math.max(0.01, Math.min(0.99, baselineConversionRate))

  // Frequentist sample size: n ≈ 16·p·(1−p)/δ², adaptive δ = max(0.01, p/2)
  const delta = Math.max(0.01, p / 2)
  const neededPerArm = Math.ceil((16 * p * (1 - p)) / (delta * delta))
  const neededTotal = neededPerArm * 2

  if (totalImpressions >= neededTotal) return 0

  const remaining = neededTotal - totalImpressions
  const daysRemaining = remaining / dailyRate

  if (daysRemaining > 90) return null

  return Math.ceil(daysElapsed + daysRemaining)
}

export function formatRelativeLift(lift: number): string {
  const sign = lift >= 0 ? '+' : '−'
  return `${sign}${Math.abs(lift * 100).toFixed(1)}%`
}

export function formatExpectedLoss(loss: number): string {
  return `${(loss * 100).toFixed(1)}%`
}

export function truncateName(name: string, maxLen = 40): string {
  if (name.length <= maxLen) return name
  return `${name.slice(0, maxLen - 1)}…`
}

export function observedRate(arm: Pick<ExperimentArm, 'impressions' | 'conversions'>): number {
  if (arm.impressions === 0) return 0
  return arm.conversions / arm.impressions
}

export function decisionLabel(decision: Conclusion['decision']): string {
  if (decision === 'shipped_variant') return 'Shipped variant'
  if (decision === 'kept_control') return 'Kept control'
  return 'Shipped neither'
}
