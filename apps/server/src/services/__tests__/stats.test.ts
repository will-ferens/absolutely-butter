import { describe, it, expect } from 'vitest'
import {
  computeFullStats,
  resolveDecision,
  betaCredibleInterval,
} from '../stats.js'

describe('resolveDecision', () => {
  it('returns conclude_variant when prob >= 0.95 and lossVariant < 0.005', () => {
    expect(resolveDecision(0.95, 0.004, 0.05)).toBe('conclude_variant')
    expect(resolveDecision(1.0,  0.0,   0.10)).toBe('conclude_variant')
  })

  it('does not conclude_variant when loss is too high', () => {
    expect(resolveDecision(0.96, 0.006, 0.01)).not.toBe('conclude_variant')
  })

  it('returns conclude_control when prob <= 0.05 and lossControl < 0.005', () => {
    expect(resolveDecision(0.05, 0.10, 0.004)).toBe('conclude_control')
    expect(resolveDecision(0.0,  0.10, 0.0  )).toBe('conclude_control')
  })

  it('returns strong_signal when prob >= 0.80 (but not conclusion threshold)', () => {
    expect(resolveDecision(0.80, 0.02, 0.001)).toBe('strong_signal')
    expect(resolveDecision(0.94, 0.01, 0.001)).toBe('strong_signal')
  })

  it('returns directional when prob >= 0.60', () => {
    expect(resolveDecision(0.60, 0.05, 0.02)).toBe('directional')
    expect(resolveDecision(0.79, 0.05, 0.02)).toBe('directional')
  })

  it('returns no_signal otherwise', () => {
    expect(resolveDecision(0.50, 0.05, 0.05)).toBe('no_signal')
    expect(resolveDecision(0.59, 0.05, 0.05)).toBe('no_signal')
  })
})

describe('betaCredibleInterval', () => {
  it('95% CI for Beta(11, 91) contains ~10% and is roughly 5–16%', () => {
    // control=10/100 → alpha=11, beta=91, posterior mean ≈ 0.107
    const [lo, hi] = betaCredibleInterval({ alpha: 11, beta: 91 }, 0.95)
    expect(lo).toBeGreaterThan(0.04)
    expect(lo).toBeLessThan(0.10)
    expect(hi).toBeGreaterThan(0.10)
    expect(hi).toBeLessThan(0.20)
    // interval should contain the true rate (~10%)
    expect(lo).toBeLessThan(0.10)
    expect(hi).toBeGreaterThan(0.10)
  })

  it('CI width shrinks with more data', () => {
    const [lo1, hi1] = betaCredibleInterval({ alpha: 11,  beta: 91  }, 0.95) // 10/100
    const [lo2, hi2] = betaCredibleInterval({ alpha: 101, beta: 901 }, 0.95) // 100/1000
    expect(hi2 - lo2).toBeLessThan(hi1 - lo1)
  })
})

describe('computeFullStats', () => {
  it('sanity check: variant at 20% vs control at 10% → probVariantWins ~85–95%', () => {
    const { probVariantWins } = computeFullStats(
      { impressions: 100, conversions: 10 },
      { impressions: 100, conversions: 20 },
    )
    expect(probVariantWins).toBeGreaterThan(0.80)
    expect(probVariantWins).toBeLessThan(0.98)
  })

  it('symmetry: control at 20% vs variant at 10% → probVariantWins clearly < 50%', () => {
    const { probVariantWins } = computeFullStats(
      { impressions: 100, conversions: 20 },
      { impressions: 100, conversions: 10 },
    )
    expect(probVariantWins).toBeLessThan(0.20)
  })

  it('no data: 0/0 both → probVariantWins ≈ 0.50 ± 0.05', () => {
    const { probVariantWins } = computeFullStats(
      { impressions: 0, conversions: 0 },
      { impressions: 0, conversions: 0 },
    )
    expect(probVariantWins).toBeGreaterThan(0.45)
    expect(probVariantWins).toBeLessThan(0.55)
  })

  it('expected loss: ifChooseVariant is small when variant is clearly winning', () => {
    // 40% vs 10% — variant should dominate, loss from choosing variant ≈ 0
    const { expectedLoss, probVariantWins } = computeFullStats(
      { impressions: 200, conversions: 20  },
      { impressions: 200, conversions: 80  },
    )
    expect(probVariantWins).toBeGreaterThan(0.95)
    expect(expectedLoss.ifChooseVariant).toBeLessThan(0.01)
  })

  it('credible intervals are non-degenerate and in [0, 1]', () => {
    const { credibleIntervals } = computeFullStats(
      { impressions: 100, conversions: 10 },
      { impressions: 100, conversions: 20 },
    )
    const { control, variant } = credibleIntervals
    expect(control[0]).toBeGreaterThanOrEqual(0)
    expect(control[1]).toBeLessThanOrEqual(1)
    expect(control[0]).toBeLessThan(control[1])
    expect(variant[0]).toBeGreaterThanOrEqual(0)
    expect(variant[1]).toBeLessThanOrEqual(1)
    expect(variant[0]).toBeLessThan(variant[1])
    // variant CI should be shifted higher than control CI
    expect(variant[0]).toBeGreaterThan(control[0])
  })

  it('relativeLift is positive when variant outperforms control', () => {
    const { relativeLift } = computeFullStats(
      { impressions: 100, conversions: 10 },
      { impressions: 100, conversions: 20 },
    )
    expect(relativeLift).toBeGreaterThan(0.5)  // ~100% lift
    expect(relativeLift).toBeLessThan(1.5)
  })

  it('decision is conclude_variant for a clear winner with enough data', () => {
    // 40% vs 10% with high N — should cross the conclude_variant threshold
    const { decision } = computeFullStats(
      { impressions: 1000, conversions: 100 },
      { impressions: 1000, conversions: 400 },
    )
    expect(decision).toBe('conclude_variant')
  })

  it('decision is no_signal when rates are identical', () => {
    const { decision } = computeFullStats(
      { impressions: 100, conversions: 10 },
      { impressions: 100, conversions: 10 },
    )
    expect(['no_signal', 'directional']).toContain(decision)
  })
})

describe('performance', () => {
  it('computeFullStats completes in < 100ms for N=10,000', () => {
    const start = performance.now()
    computeFullStats(
      { impressions: 1000, conversions: 100 },
      { impressions: 1000, conversions: 120 },
    )
    const ms = performance.now() - start
    expect(ms).toBeLessThan(100)
  })
})
