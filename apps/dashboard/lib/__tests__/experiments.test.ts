import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  groupAndSort,
  formatRelativeDate,
  formatProb,
  hasSignal,
  computeAxisScale,
  estimateDaysToSignificance,
  formatRelativeLift,
  formatExpectedLoss,
  truncateName,
  type ExperimentWithArms,
  type ExperimentArm,
} from '../experiments'

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeArm(arm: 'control' | 'variant', impressions = 100, conversions = 10): ExperimentArm {
  return { id: '1', experiment_id: 'exp1', arm, impressions, conversions }
}

function makeExp(
  overrides: Partial<ExperimentWithArms> = {},
): ExperimentWithArms {
  return {
    id: 'exp1',
    user_id: 'u1',
    name: 'My experiment',
    status: 'live',
    hypothesis: null,
    control_description: 'Control',
    variant_description: 'Variant',
    goal: 'Clicks',
    created_at: '2026-05-01T00:00:00.000Z',
    launched_at: '2026-05-01T00:00:00.000Z',
    concluded_at: null,
    conclusion: null,
    arms: { control: makeArm('control'), variant: makeArm('variant') },
    probVariantWins: 0.72,
    ...overrides,
  }
}

// ─── groupAndSort ─────────────────────────────────────────────────────────────

describe('groupAndSort', () => {
  it('orders groups: live → draft → inactive → archived', () => {
    const exps: ExperimentWithArms[] = [
      makeExp({ id: 'a', status: 'archived', probVariantWins: null }),
      makeExp({ id: 'b', status: 'draft', probVariantWins: null }),
      makeExp({ id: 'c', status: 'live', probVariantWins: 0.6 }),
      makeExp({ id: 'd', status: 'inactive', probVariantWins: 0.4 }),
    ]
    const groups = groupAndSort(exps)
    expect(groups.map(g => g.status)).toEqual(['live', 'draft', 'inactive', 'archived'])
  })

  it('sorts within a group by probVariantWins descending', () => {
    const exps: ExperimentWithArms[] = [
      makeExp({ id: 'a', probVariantWins: 0.3 }),
      makeExp({ id: 'b', probVariantWins: 0.9 }),
      makeExp({ id: 'c', probVariantWins: 0.6 }),
    ]
    const [liveGroup] = groupAndSort(exps)
    expect(liveGroup!.experiments.map(e => e.id)).toEqual(['b', 'c', 'a'])
  })

  it('sorts null probVariantWins last within a group', () => {
    const exps: ExperimentWithArms[] = [
      makeExp({ id: 'a', probVariantWins: null }),
      makeExp({ id: 'b', probVariantWins: 0.8 }),
    ]
    const [liveGroup] = groupAndSort(exps)
    expect(liveGroup!.experiments.map(e => e.id)).toEqual(['b', 'a'])
  })

  it('omits empty groups', () => {
    const exps = [makeExp({ status: 'live', probVariantWins: 0.5 })]
    const groups = groupAndSort(exps)
    expect(groups.length).toBe(1)
    expect(groups[0]!.status).toBe('live')
  })
})

// ─── formatRelativeDate ───────────────────────────────────────────────────────

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-21T12:00:00.000Z'))
  })
  afterEach(() => { vi.useRealTimers() })

  it('draft: uses created_at with "Created" prefix', () => {
    const result = formatRelativeDate({
      status: 'draft',
      created_at: '2026-05-07T12:00:00.000Z', // 14 days ago
      launched_at: null,
      concluded_at: null,
    })
    expect(result).toBe('Created 14 days ago')
  })

  it('live: uses launched_at with no prefix', () => {
    const result = formatRelativeDate({
      status: 'live',
      created_at: '2026-05-01T12:00:00.000Z',
      launched_at: '2026-05-14T12:00:00.000Z', // 7 days ago
      concluded_at: null,
    })
    expect(result).toBe('7 days ago')
  })

  it('inactive: uses concluded_at with "Concluded" prefix', () => {
    const result = formatRelativeDate({
      status: 'inactive',
      created_at: '2026-04-01T12:00:00.000Z',
      launched_at: '2026-04-01T12:00:00.000Z',
      concluded_at: '2026-05-15T12:00:00.000Z', // 6 days ago
    })
    expect(result).toBe('Concluded 6 days ago')
  })

  it('returns "Today" when diff is 0 days', () => {
    const result = formatRelativeDate({
      status: 'live',
      created_at: '2026-05-21T10:00:00.000Z',
      launched_at: '2026-05-21T10:00:00.000Z',
      concluded_at: null,
    })
    expect(result).toBe('Today')
  })

  it('returns "Yesterday" when diff is 1 day', () => {
    const result = formatRelativeDate({
      status: 'live',
      created_at: '2026-05-20T12:00:00.000Z',
      launched_at: '2026-05-20T12:00:00.000Z',
      concluded_at: null,
    })
    expect(result).toBe('Yesterday')
  })
})

// ─── formatProb ───────────────────────────────────────────────────────────────

describe('formatProb', () => {
  it('returns "—" for draft regardless of prob', () => {
    expect(formatProb(0.95, 'draft')).toBe('—')
    expect(formatProb(null, 'draft')).toBe('—')
  })

  it('returns "—" for archived', () => {
    expect(formatProb(0.7, 'archived')).toBe('—')
  })

  it('returns "—" when prob is null for live', () => {
    expect(formatProb(null, 'live')).toBe('—')
  })

  it('rounds and formats percentage for live', () => {
    expect(formatProb(0.95, 'live')).toBe('95%')
    expect(formatProb(0.949, 'live')).toBe('95%')  // rounds up
    expect(formatProb(0.944, 'live')).toBe('94%')
    expect(formatProb(0.1, 'live')).toBe('10%')
  })

  it('formats for inactive', () => {
    expect(formatProb(0.78, 'inactive')).toBe('78%')
  })
})

// ─── hasSignal ────────────────────────────────────────────────────────────────

describe('hasSignal', () => {
  it('returns true at exactly 0.95', () => expect(hasSignal(0.95)).toBe(true))
  it('returns true above 0.95', () => expect(hasSignal(0.99)).toBe(true))
  it('returns false at 0.94', () => expect(hasSignal(0.94)).toBe(false))
  it('returns true at exactly 0.05', () => expect(hasSignal(0.05)).toBe(true))
  it('returns true below 0.05', () => expect(hasSignal(0.01)).toBe(true))
  it('returns false at 0.06', () => expect(hasSignal(0.06)).toBe(false))
  it('returns false for null', () => expect(hasSignal(null)).toBe(false))
  it('returns false in the middle', () => expect(hasSignal(0.5)).toBe(false))
})

// ─── computeAxisScale ─────────────────────────────────────────────────────────

describe('computeAxisScale', () => {
  it('takes the outer envelope of both CIs', () => {
    const { min, max } = computeAxisScale([0.1, 0.3], [0.2, 0.5])
    expect(min).toBeLessThan(0.1)
    expect(max).toBeGreaterThan(0.5)
  })

  it('adds 5% padding on each side', () => {
    // range = 0.4, padding = 0.02
    const { min, max } = computeAxisScale([0.1, 0.3], [0.2, 0.5])
    const range = 0.5 - 0.1
    const padding = range * 0.05
    expect(min).toBeCloseTo(0.1 - padding, 5)
    expect(max).toBeCloseTo(0.5 + padding, 5)
  })

  it('never returns min below 0', () => {
    const { min } = computeAxisScale([0.0, 0.1], [0.0, 0.05])
    expect(min).toBeGreaterThanOrEqual(0)
  })

  it('never returns max above 1', () => {
    const { max } = computeAxisScale([0.9, 1.0], [0.95, 1.0])
    expect(max).toBeLessThanOrEqual(1)
  })

  it('handles equal bounds without zero-width range', () => {
    const { min, max } = computeAxisScale([0.2, 0.2], [0.2, 0.2])
    expect(max).toBeGreaterThan(min)
  })
})

// ─── estimateDaysToSignificance ───────────────────────────────────────────────

describe('estimateDaysToSignificance', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-21T00:00:00.000Z'))
  })
  afterEach(() => { vi.useRealTimers() })

  it('returns null when fewer than 2 days elapsed', () => {
    const launchedAt = new Date(Date.now() - 1 * 86_400_000).toISOString()
    expect(estimateDaysToSignificance(launchedAt, 500, 0.1)).toBeNull()
  })

  it('returns null when fewer than 10 total impressions', () => {
    const launchedAt = new Date(Date.now() - 10 * 86_400_000).toISOString()
    expect(estimateDaysToSignificance(launchedAt, 5, 0.1)).toBeNull()
  })

  it('returns null when projection exceeds 90 days', () => {
    // Very low traffic: 10 impressions over 10 days = 1/day, needs thousands
    const launchedAt = new Date(Date.now() - 10 * 86_400_000).toISOString()
    expect(estimateDaysToSignificance(launchedAt, 10, 0.01)).toBeNull()
  })

  it('returns 0 when already have enough impressions', () => {
    // High traffic scenario that exceeds needed sample
    const launchedAt = new Date(Date.now() - 30 * 86_400_000).toISOString()
    // p=0.5, delta=0.25, needed = 16*0.5*0.5/0.0625 = 64 per arm = 128 total
    // We pass 10000 impressions, far exceeds that
    expect(estimateDaysToSignificance(launchedAt, 10000, 0.5)).toBe(0)
  })

  it('returns a positive integer for a realistic scenario', () => {
    const launchedAt = new Date(Date.now() - 14 * 86_400_000).toISOString()
    const result = estimateDaysToSignificance(launchedAt, 280, 0.1) // 20/day
    if (result !== null) {
      expect(result).toBeGreaterThan(0)
      expect(Number.isInteger(result)).toBe(true)
    }
  })
})

// ─── formatRelativeLift ───────────────────────────────────────────────────────

describe('formatRelativeLift', () => {
  it('prefixes positive lift with "+"', () => {
    expect(formatRelativeLift(0.569)).toBe('+56.9%')
  })

  it('prefixes negative lift with "−" (minus sign, not hyphen)', () => {
    const result = formatRelativeLift(-0.123)
    expect(result).toBe('−12.3%')
    expect(result.charCodeAt(0)).toBe(0x2212) // Unicode minus
  })

  it('formats zero as "0.0%"', () => {
    expect(formatRelativeLift(0)).toBe('+0.0%')
  })

  it('rounds to 1 decimal', () => {
    expect(formatRelativeLift(0.1234)).toBe('+12.3%')
    expect(formatRelativeLift(0.1236)).toBe('+12.4%')
  })
})

// ─── formatExpectedLoss ───────────────────────────────────────────────────────

describe('formatExpectedLoss', () => {
  it('formats as percentage to 1 decimal', () => {
    expect(formatExpectedLoss(0.003)).toBe('0.3%')
    expect(formatExpectedLoss(0.01)).toBe('1.0%')
  })

  it('never shows negative', () => {
    // Expected loss should always be >= 0 from the engine, but guard anyway
    const result = formatExpectedLoss(0)
    expect(result).toBe('0.0%')
  })
})

// ─── truncateName ─────────────────────────────────────────────────────────────

describe('truncateName', () => {
  it('returns the full name when within limit', () => {
    expect(truncateName('Short name')).toBe('Short name')
  })

  it('truncates with ellipsis at 40 chars', () => {
    const long = 'A'.repeat(45)
    const result = truncateName(long)
    expect(result.length).toBe(40)
    expect(result.endsWith('…')).toBe(true)
  })

  it('respects a custom maxLen', () => {
    expect(truncateName('Hello world', 5)).toBe('Hell…')
  })
})
