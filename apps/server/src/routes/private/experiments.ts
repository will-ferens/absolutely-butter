import { Hono } from 'hono'
import { supabase } from '../../lib/supabase.js'
import { generateExperimentId } from '../../lib/id.js'
import { NotFoundError, ApiError } from '../../lib/errors.js'
import { computeFullStats, computeProbVariantWins } from '../../services/stats.js'
import { billingGuard } from '../../middleware/billing-guard.js'

type Variables = { userId: string }

const experiments = new Hono<{ Variables: Variables }>()

type ExperimentStatus = 'draft' | 'live' | 'inactive' | 'archived'

async function requireExperiment(experimentId: string, userId: string, requiredStatus?: ExperimentStatus) {
  const { data } = await supabase
    .from('experiments')
    .select('*')
    .eq('id', experimentId)
    .eq('user_id', userId)
    .single()

  if (!data) throw new NotFoundError()

  if (requiredStatus && data.status !== requiredStatus) {
    throw new ApiError(422, `Experiment must be '${requiredStatus}' (current: '${data.status}')`)
  }

  return data
}

async function fetchArms(experimentId: string) {
  const { data } = await supabase
    .from('experiment_arms')
    .select('*')
    .eq('experiment_id', experimentId)

  const control = data?.find(a => a.arm === 'control')
  const variant = data?.find(a => a.arm === 'variant')
  return { control, variant }
}

// GET /v1/experiments
experiments.get('/', async c => {
  const userId = c.get('userId')

  const { data: exps } = await supabase
    .from('experiments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!exps) return c.json([])

  const result = await Promise.all(
    exps.map(async exp => {
      const { control, variant } = await fetchArms(exp.id)
      const probVariantWins = control && variant
        ? computeProbVariantWins(
            { impressions: control.impressions, conversions: control.conversions },
            { impressions: variant.impressions, conversions: variant.conversions },
          )
        : null
      return { ...exp, arms: { control, variant }, probVariantWins }
    }),
  )

  return c.json(result)
})

// POST /v1/experiments
experiments.post('/', billingGuard, async c => {
  const userId = c.get('userId')
  const body = await c.req.json<{
    name: string
    controlDescription: string
    variantDescription: string
    goal: string
    hypothesis?: string
  }>()

  const { name, controlDescription, variantDescription, goal } = body
  if (!name || !controlDescription || !variantDescription || !goal) {
    return c.json({ error: 'name, controlDescription, variantDescription, goal are required' }, 400)
  }

  const experimentId = generateExperimentId()

  const { data: exp, error: expErr } = await supabase
    .from('experiments')
    .insert({
      id: experimentId,
      user_id: userId,
      name,
      control_description: controlDescription,
      variant_description: variantDescription,
      goal,
      hypothesis: body.hypothesis ?? null,
      status: 'draft',
    })
    .select()
    .single()

  if (expErr || !exp) return c.json({ error: 'Failed to create experiment' }, 500)

  const { error: armsErr } = await supabase.from('experiment_arms').insert([
    { experiment_id: experimentId, arm: 'control', impressions: 0, conversions: 0 },
    { experiment_id: experimentId, arm: 'variant', impressions: 0, conversions: 0 },
  ])

  if (armsErr) return c.json({ error: 'Failed to create arms' }, 500)

  const { data: profile } = await supabase
    .from('profiles')
    .select('api_key')
    .eq('id', userId)
    .single()

  const apiKey = profile?.api_key ?? 'YOUR_API_KEY'
  const snippet = `AbsolutelyButter.init({ apiKey: '${apiKey}', experimentId: '${experimentId}' })`

  return c.json({ experiment: exp, snippet }, 201)
})

// GET /v1/experiments/:id
experiments.get('/:id', async c => {
  const userId = c.get('userId')
  const exp = await requireExperiment(c.req.param('id'), userId)
  const { control, variant } = await fetchArms(exp.id)

  const stats = control && variant
    ? computeFullStats(
        { impressions: control.impressions, conversions: control.conversions },
        { impressions: variant.impressions, conversions: variant.conversions },
      )
    : null

  return c.json({ ...exp, arms: { control, variant }, stats })
})

// PATCH /v1/experiments/:id
experiments.patch('/:id', async c => {
  const userId = c.get('userId')
  const exp = await requireExperiment(c.req.param('id'), userId)

  if (exp.status === 'archived') {
    return c.json({ error: 'Archived experiments cannot be edited' }, 422)
  }

  const body = await c.req.json<{
    name?: string
    hypothesis?: string
    controlDescription?: string
    variantDescription?: string
    goal?: string
  }>()

  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) updates.name = body.name
  if (body.hypothesis !== undefined) updates.hypothesis = body.hypothesis

  const draftOnlyFields = ['controlDescription', 'variantDescription', 'goal'] as const
  for (const field of draftOnlyFields) {
    if (body[field] !== undefined) {
      if (exp.status !== 'draft') {
        return c.json({ error: `'${field}' can only be edited on draft experiments` }, 422)
      }
      const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase()
      updates[dbField] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) return c.json({ error: 'No editable fields provided' }, 400)

  const { data, error } = await supabase
    .from('experiments')
    .update(updates)
    .eq('id', exp.id)
    .select()
    .single()

  if (error || !data) return c.json({ error: 'Update failed' }, 500)

  return c.json(data)
})

// POST /v1/experiments/:id/launch
experiments.post('/:id/launch', billingGuard, async c => {
  const userId = c.get('userId')
  const exp = await requireExperiment(c.req.param('id'), userId, 'draft')

  const { data, error } = await supabase
    .from('experiments')
    .update({ status: 'live', launched_at: new Date().toISOString() })
    .eq('id', exp.id)
    .select()
    .single()

  if (error || !data) return c.json({ error: 'Launch failed' }, 500)

  return c.json(data)
})

// POST /v1/experiments/:id/conclude
experiments.post('/:id/conclude', async c => {
  const userId = c.get('userId')
  const exp = await requireExperiment(c.req.param('id'), userId, 'live')

  const body = await c.req.json<{ decision: string; notes?: string }>()
  const validDecisions = ['shipped_variant', 'kept_control', 'shipped_neither']
  if (!validDecisions.includes(body.decision)) {
    return c.json({ error: `decision must be one of: ${validDecisions.join(', ')}` }, 400)
  }

  const { control, variant } = await fetchArms(exp.id)
  const finalStats = control && variant
    ? computeFullStats(
        { impressions: control.impressions, conversions: control.conversions },
        { impressions: variant.impressions, conversions: variant.conversions },
      )
    : null

  const concludedAt = new Date().toISOString()
  const conclusion = {
    decision: body.decision,
    notes: body.notes ?? null,
    concludedAt,
    finalStats,
  }

  const { data, error } = await supabase
    .from('experiments')
    .update({ status: 'inactive', concluded_at: concludedAt, conclusion })
    .eq('id', exp.id)
    .select()
    .single()

  if (error || !data) return c.json({ error: 'Conclude failed' }, 500)

  return c.json(data)
})

// POST /v1/experiments/:id/reactivate
experiments.post('/:id/reactivate', billingGuard, async c => {
  const userId = c.get('userId')
  const exp = await requireExperiment(c.req.param('id'), userId, 'inactive')

  const { data, error } = await supabase
    .from('experiments')
    .update({ status: 'live', conclusion: null, concluded_at: null })
    .eq('id', exp.id)
    .select()
    .single()

  if (error || !data) return c.json({ error: 'Reactivation failed' }, 500)

  return c.json(data)
})

// POST /v1/experiments/:id/archive
experiments.post('/:id/archive', async c => {
  const userId = c.get('userId')
  const exp = await requireExperiment(c.req.param('id'), userId, 'inactive')

  await supabase
    .from('experiment_sessions')
    .delete()
    .eq('experiment_id', exp.id)

  const { data, error } = await supabase
    .from('experiments')
    .update({ status: 'archived' })
    .eq('id', exp.id)
    .select()
    .single()

  if (error || !data) return c.json({ error: 'Archive failed' }, 500)

  return c.json(data)
})

export default experiments
