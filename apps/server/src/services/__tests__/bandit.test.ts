import { describe, it, expect } from 'vitest'
import { sampleBeta, thompsonSample } from '../bandit.js'

describe('sampleBeta', () => {
  it('returns values in [0, 1]', () => {
    for (let i = 0; i < 1000; i++) {
      const v = sampleBeta(2, 5)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('mean is approximately alpha / (alpha + beta)', () => {
    const alpha = 3
    const beta = 7
    const N = 10_000
    const mean = Array.from({ length: N }, () => sampleBeta(alpha, beta))
      .reduce((s, v) => s + v, 0) / N
    expect(mean).toBeGreaterThan(0.25)
    expect(mean).toBeLessThan(0.35)
  })

  it('handles params < 1 via Johnk (skewed distribution)', () => {
    // Beta(0.5, 0.5) has mean 0.5 and is U-shaped
    const N = 5_000
    const mean = Array.from({ length: N }, () => sampleBeta(0.5, 0.5))
      .reduce((s, v) => s + v, 0) / N
    expect(mean).toBeGreaterThan(0.45)
    expect(mean).toBeLessThan(0.55)
  })
})

describe('thompsonSample', () => {
  it('chooses the arm with higher conversion rate more than 50% of the time', () => {
    const control = { impressions: 100, conversions: 10 }
    const variant = { impressions: 100, conversions: 20 }
    const N = 10_000
    let variantWins = 0
    for (let i = 0; i < N; i++) {
      if (thompsonSample([control, variant]) === 'variant') variantWins++
    }
    expect(variantWins / N).toBeGreaterThan(0.5)
  })

  it('is approximately 50/50 with no data (uniform prior)', () => {
    const control = { impressions: 0, conversions: 0 }
    const variant = { impressions: 0, conversions: 0 }
    const N = 10_000
    let variantWins = 0
    for (let i = 0; i < N; i++) {
      if (thompsonSample([control, variant]) === 'variant') variantWins++
    }
    const ratio = variantWins / N
    expect(ratio).toBeGreaterThan(0.45)
    expect(ratio).toBeLessThan(0.55)
  })
})
