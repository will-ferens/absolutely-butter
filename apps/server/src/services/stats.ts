import { sampleBeta } from './bandit.js'

export interface ArmState {
  impressions: number
  conversions: number
}

export interface BetaParams {
  alpha: number
  beta: number
}

export type Decision =
  | 'conclude_variant'
  | 'conclude_control'
  | 'strong_signal'
  | 'directional'
  | 'no_signal'

export interface ExpectedLoss {
  ifChooseVariant: number
  ifChooseControl: number
}

export interface FullStats {
  probVariantWins: number
  expectedLoss: ExpectedLoss
  relativeLift: number
  credibleIntervals: {
    control: [number, number]
    variant: [number, number]
  }
  decision: Decision
}

const MONTE_CARLO_N = 10_000

function armToParams(arm: ArmState): BetaParams {
  return {
    alpha: 1 + arm.conversions,
    beta: 1 + (arm.impressions - arm.conversions),
  }
}

export function betaCredibleInterval(
  params: BetaParams,
  credibility: number,
): [number, number] {
  const samples: number[] = Array.from({ length: MONTE_CARLO_N }, () =>
    sampleBeta(params.alpha, params.beta),
  )
  samples.sort((a, b) => a - b)
  const tail = (1 - credibility) / 2
  const lo = Math.floor(MONTE_CARLO_N * tail)
  const hi = Math.floor(MONTE_CARLO_N * (1 - tail))
  return [samples[lo]!, samples[hi]!]
}

export function resolveDecision(
  prob: number,
  lossVariant: number,
  lossControl: number,
): Decision {
  if (prob >= 0.95 && lossVariant < 0.005) return 'conclude_variant'
  if (prob <= 0.05 && lossControl < 0.005) return 'conclude_control'
  if (prob >= 0.80) return 'strong_signal'
  if (prob >= 0.60) return 'directional'
  return 'no_signal'
}

export function computeProbVariantWins(control: ArmState, variant: ArmState): number {
  const cp = armToParams(control)
  const vp = armToParams(variant)
  let wins = 0
  for (let i = 0; i < MONTE_CARLO_N; i++) {
    if (sampleBeta(vp.alpha, vp.beta) > sampleBeta(cp.alpha, cp.beta)) wins++
  }
  return wins / MONTE_CARLO_N
}

export function computeFullStats(
  control: ArmState,
  variant: ArmState,
): FullStats {
  const cp = armToParams(control)
  const vp = armToParams(variant)

  let wins = 0
  let lossIfChooseVariant = 0
  let lossIfChooseControl = 0

  for (let i = 0; i < MONTE_CARLO_N; i++) {
    const cs = sampleBeta(cp.alpha, cp.beta)
    const vs = sampleBeta(vp.alpha, vp.beta)
    if (vs > cs) wins++
    lossIfChooseVariant += Math.max(0, cs - vs)
    lossIfChooseControl += Math.max(0, vs - cs)
  }

  const probVariantWins = wins / MONTE_CARLO_N
  const expectedLoss: ExpectedLoss = {
    ifChooseVariant: lossIfChooseVariant / MONTE_CARLO_N,
    ifChooseControl: lossIfChooseControl / MONTE_CARLO_N,
  }

  const rateControl = cp.alpha / (cp.alpha + cp.beta)
  const rateVariant = vp.alpha / (vp.alpha + vp.beta)
  const relativeLift =
    rateControl === 0 ? 0 : (rateVariant - rateControl) / rateControl

  return {
    probVariantWins,
    expectedLoss,
    relativeLift,
    credibleIntervals: {
      control: betaCredibleInterval(cp, 0.95),
      variant: betaCredibleInterval(vp, 0.95),
    },
    decision: resolveDecision(
      probVariantWins,
      expectedLoss.ifChooseVariant,
      expectedLoss.ifChooseControl,
    ),
  }
}
