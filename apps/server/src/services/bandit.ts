import type { ArmState } from './stats.js'

function sampleStdNormal(): number {
  // Box-Muller transform
  const u1 = Math.random()
  const u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1 === 0 ? Number.EPSILON : u1)) * Math.cos(2 * Math.PI * u2)
}

function sampleGamma(shape: number): number {
  // Marsaglia-Tsang algorithm (shape >= 1)
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  while (true) {
    let x: number
    let v: number
    do {
      x = sampleStdNormal()
      v = 1 + c * x
    } while (v <= 0)
    v = v * v * v
    const u = Math.random()
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
}

export function sampleBeta(alpha: number, beta: number): number {
  if (alpha <= 0) return 0
  if (beta <= 0) return 1

  if (alpha >= 1 && beta >= 1) {
    // Gamma-ratio method using Marsaglia-Tsang
    const g1 = sampleGamma(alpha)
    const g2 = sampleGamma(beta)
    return g1 / (g1 + g2)
  }

  // Johnk's method for when either param < 1
  while (true) {
    const u1 = Math.pow(Math.random(), 1 / alpha)
    const u2 = Math.pow(Math.random(), 1 / beta)
    if (u1 + u2 <= 1) return u1 / (u1 + u2)
  }
}

export function thompsonSample(arms: ArmState[]): 'control' | 'variant' {
  const samples = arms.map(a =>
    sampleBeta(1 + a.conversions, 1 + (a.impressions - a.conversions)),
  )
  return (samples[1] ?? 0) > (samples[0] ?? 0) ? 'variant' : 'control'
}
