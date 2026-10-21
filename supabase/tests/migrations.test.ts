import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import ws from 'ws'

const SUPABASE_URL          = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.test')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
})

// ─── handle_new_user trigger ──────────────────────────────────────────────────

describe('handle_new_user trigger', () => {
  let userId: string

  afterEach(async () => {
    if (userId) await supabase.auth.admin.deleteUser(userId)
  })

  it('creates a profile row automatically on signup', async () => {
    const { data, error } = await supabase.auth.admin.createUser({
      email: `trigger-test-${Date.now()}@test.com`,
      password: 'testpassword123',
      email_confirm: true,
    })

    expect(error).toBeNull()
    userId = data.user!.id

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    expect(profileError).toBeNull()
    expect(profile).not.toBeNull()
  })

  it('generates an api_key with the pk_live_ prefix', async () => {
    const { data } = await supabase.auth.admin.createUser({
      email: `apikey-test-${Date.now()}@test.com`,
      password: 'testpassword123',
      email_confirm: true,
    })
    userId = data.user!.id

    const { data: profile } = await supabase
      .from('profiles')
      .select('api_key')
      .eq('id', userId)
      .single()

    expect(profile!.api_key).toMatch(/^pk_live_/)
    expect(profile!.api_key.length).toBeGreaterThan(8)
  })

  it('sets subscription_status to trialing', async () => {
    const { data } = await supabase.auth.admin.createUser({
      email: `status-test-${Date.now()}@test.com`,
      password: 'testpassword123',
      email_confirm: true,
    })
    userId = data.user!.id

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single()

    expect(profile!.subscription_status).toBe('trialing')
  })

  it('sets trial_ends_at to approximately 30 days from now', async () => {
    const before = new Date()

    const { data } = await supabase.auth.admin.createUser({
      email: `trial-test-${Date.now()}@test.com`,
      password: 'testpassword123',
      email_confirm: true,
    })
    userId = data.user!.id

    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_ends_at')
      .eq('id', userId)
      .single()

    const trialEnd  = new Date(profile!.trial_ends_at)
    const msIn30Days = 30 * 24 * 60 * 60 * 1000
    const expected  = new Date(before.getTime() + msIn30Days)

    // Should be within a few seconds of 30 days from now
    expect(trialEnd.getTime()).toBeGreaterThanOrEqual(expected.getTime() - 5000)
    expect(trialEnd.getTime()).toBeLessThanOrEqual(expected.getTime() + 5000)
  })

  it('generates a unique api_key for each user', async () => {
    const ids: string[] = []

    for (let i = 0; i < 3; i++) {
      const { data } = await supabase.auth.admin.createUser({
        email: `unique-test-${Date.now()}-${i}@test.com`,
        password: 'testpassword123',
        email_confirm: true,
      })
      ids.push(data.user!.id)
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('api_key')
      .in('id', ids)

    const keys = profiles!.map(p => p.api_key)
    const uniqueKeys = new Set(keys)

    expect(uniqueKeys.size).toBe(3)

    // cleanup the extras (afterEach only handles one)
    for (const id of ids) await supabase.auth.admin.deleteUser(id)
    userId = '' // prevent double-delete in afterEach
  })
})

// ─── increment RPCs ───────────────────────────────────────────────────────────

describe('increment_impressions and increment_conversions', () => {
  let userId: string
  let experimentId: string

  beforeEach(async () => {
    const { data } = await supabase.auth.admin.createUser({
      email: `rpc-test-${Date.now()}@test.com`,
      password: 'testpassword123',
      email_confirm: true,
    })
    userId = data.user!.id

    experimentId = `exp_test_${Date.now()}`

    await supabase.from('experiments').insert({
      id:                  experimentId,
      user_id:             userId,
      name:                'RPC test experiment',
      control_description: 'Control arm',
      variant_description: 'Variant arm',
      goal:                'Test conversions',
      status:              'live',
    })

    await supabase.from('experiment_arms').insert([
      { experiment_id: experimentId, arm: 'control' },
      { experiment_id: experimentId, arm: 'variant' },
    ])
  })

  afterEach(async () => {
    if (experimentId) {
      await supabase.from('experiments').delete().eq('id', experimentId)
    }
    if (userId) await supabase.auth.admin.deleteUser(userId)
  })

  it('increments impression count for the specified arm', async () => {
    await supabase.rpc('increment_impressions', {
      p_experiment_id: experimentId,
      p_arm: 'control',
    })

    const { data } = await supabase
      .from('experiment_arms')
      .select('impressions')
      .eq('experiment_id', experimentId)
      .eq('arm', 'control')
      .single()

    expect(data!.impressions).toBe(1)
  })

  it('does not affect the other arm', async () => {
    await supabase.rpc('increment_impressions', {
      p_experiment_id: experimentId,
      p_arm: 'variant',
    })

    const { data } = await supabase
      .from('experiment_arms')
      .select('arm, impressions')
      .eq('experiment_id', experimentId)

    const control = data!.find(a => a.arm === 'control')
    const variant = data!.find(a => a.arm === 'variant')

    expect(control!.impressions).toBe(0)
    expect(variant!.impressions).toBe(1)
  })

  it('accumulates multiple impression increments', async () => {
    for (let i = 0; i < 5; i++) {
      await supabase.rpc('increment_impressions', {
        p_experiment_id: experimentId,
        p_arm: 'control',
      })
    }

    const { data } = await supabase
      .from('experiment_arms')
      .select('impressions')
      .eq('experiment_id', experimentId)
      .eq('arm', 'control')
      .single()

    expect(data!.impressions).toBe(5)
  })

  it('increments conversion count for the specified arm', async () => {
    await supabase.rpc('increment_conversions', {
      p_experiment_id: experimentId,
      p_arm: 'variant',
    })

    const { data } = await supabase
      .from('experiment_arms')
      .select('conversions')
      .eq('experiment_id', experimentId)
      .eq('arm', 'variant')
      .single()

    expect(data!.conversions).toBe(1)
  })

  it('increments impressions and conversions independently', async () => {
    await supabase.rpc('increment_impressions', { p_experiment_id: experimentId, p_arm: 'control' })
    await supabase.rpc('increment_impressions', { p_experiment_id: experimentId, p_arm: 'control' })
    await supabase.rpc('increment_conversions', { p_experiment_id: experimentId, p_arm: 'control' })

    const { data } = await supabase
      .from('experiment_arms')
      .select('impressions, conversions')
      .eq('experiment_id', experimentId)
      .eq('arm', 'control')
      .single()

    expect(data!.impressions).toBe(2)
    expect(data!.conversions).toBe(1)
  })
})

describe('atomic event processing', () => {
  let userId: string
  let experimentId: string
  const controlSessionId = '00000000-0000-4000-8000-000000000001'
  const variantSessionId = '00000000-0000-4000-8000-000000000002'

  beforeEach(async () => {
    const { data } = await supabase.auth.admin.createUser({
      email: `event-test-${Date.now()}@test.com`,
      password: 'testpassword123',
      email_confirm: true,
    })
    userId = data.user!.id
    experimentId = `exp_event_${Date.now()}`

    await supabase.from('experiments').insert({
      id: experimentId,
      user_id: userId,
      name: 'Atomic event test',
      control_description: 'Control arm',
      variant_description: 'Variant arm',
      goal: 'Test conversions',
      status: 'live',
    })

    await supabase.from('experiment_arms').insert([
      { experiment_id: experimentId, arm: 'control' },
      { experiment_id: experimentId, arm: 'variant' },
    ])
  })

  afterEach(async () => {
    await supabase.from('experiments').delete().eq('id', experimentId)
    await supabase.auth.admin.deleteUser(userId)
  })

  it('counts an impression once and reports duplicate arm mismatches', async () => {
    const first = await supabase.rpc('record_impression', {
      p_experiment_id: experimentId,
      p_session_id: controlSessionId,
      p_arm: 'control',
    })
    expect(first.error).toBeNull()
    expect(first.data?.[0]).toMatchObject({ outcome: 'counted', stored_arm: 'control', mismatch: false })

    const duplicate = await supabase.rpc('record_impression', {
      p_experiment_id: experimentId,
      p_session_id: controlSessionId,
      p_arm: 'variant',
    })
    expect(duplicate.error).toBeNull()
    expect(duplicate.data?.[0]).toMatchObject({ outcome: 'mismatch', stored_arm: 'control', mismatch: true })

    const { data: arm } = await supabase
      .from('experiment_arms')
      .select('impressions')
      .eq('experiment_id', experimentId)
      .eq('arm', 'control')
      .single()
    expect(arm!.impressions).toBe(1)
  })

  it('uses the stored arm and rejects mismatched conversions', async () => {
    await supabase.rpc('record_impression', {
      p_experiment_id: experimentId,
      p_session_id: controlSessionId,
      p_arm: 'control',
    })

    const mismatch = await supabase.rpc('record_conversion', {
      p_experiment_id: experimentId,
      p_session_id: controlSessionId,
      p_submitted_arm: 'variant',
    })
    expect(mismatch.data?.[0]).toMatchObject({ outcome: 'mismatch', stored_arm: 'control', mismatch: true })

    const valid = await supabase.rpc('record_conversion', {
      p_experiment_id: experimentId,
      p_session_id: controlSessionId,
      p_submitted_arm: 'control',
    })
    expect(valid.data?.[0]).toMatchObject({ outcome: 'counted', stored_arm: 'control', mismatch: false })

    const duplicate = await supabase.rpc('record_conversion', {
      p_experiment_id: experimentId,
      p_session_id: controlSessionId,
      p_submitted_arm: 'control',
    })
    expect(duplicate.data?.[0]).toMatchObject({ outcome: 'duplicate', stored_arm: 'control', mismatch: false })

    const { data: arms } = await supabase
      .from('experiment_arms')
      .select('arm, conversions')
      .eq('experiment_id', experimentId)
    expect(arms!.find(a => a.arm === 'control')!.conversions).toBe(1)
    expect(arms!.find(a => a.arm === 'variant')!.conversions).toBe(0)
  })

  it('does not convert unknown sessions and rejects writes after conclusion', async () => {
    const unknown = await supabase.rpc('record_conversion', {
      p_experiment_id: experimentId,
      p_session_id: variantSessionId,
      p_submitted_arm: 'variant',
    })
    expect(unknown.data?.[0]).toMatchObject({ outcome: 'unknown_session', stored_arm: null, mismatch: false })

    await supabase
      .from('experiments')
      .update({ status: 'inactive' })
      .eq('id', experimentId)

    const impression = await supabase.rpc('record_impression', {
      p_experiment_id: experimentId,
      p_session_id: variantSessionId,
      p_arm: 'variant',
    })
    expect(impression.data?.[0]).toMatchObject({ outcome: 'inactive', stored_arm: null, mismatch: false })
  })

  it('serializes concurrent conversions to one count', async () => {
    await supabase.rpc('record_impression', {
      p_experiment_id: experimentId,
      p_session_id: controlSessionId,
      p_arm: 'control',
    })

    const results = await Promise.all(Array.from({ length: 8 }, () =>
      supabase.rpc('record_conversion', {
        p_experiment_id: experimentId,
        p_session_id: controlSessionId,
        p_submitted_arm: 'control',
      }),
    ))

    expect(results.filter(result => result.data?.[0]?.outcome === 'counted')).toHaveLength(1)
    expect(results.filter(result => result.data?.[0]?.outcome === 'duplicate')).toHaveLength(7)

    const { data: arm } = await supabase
      .from('experiment_arms')
      .select('conversions')
      .eq('experiment_id', experimentId)
      .eq('arm', 'control')
      .single()
    expect(arm!.conversions).toBe(1)
  })
})
