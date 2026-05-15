import { Hono } from 'hono'
import { supabase } from '../../lib/supabase.js'
import { NotFoundError } from '../../lib/errors.js'
import { computeFullStats } from '../../services/stats.js'

type Variables = { userId: string }

const stats = new Hono<{ Variables: Variables }>()

stats.get('/:id/stats', async c => {
  const userId = c.get('userId')
  const experimentId = c.req.param('id')

  const { data: exp } = await supabase
    .from('experiments')
    .select('*')
    .eq('id', experimentId)
    .eq('user_id', userId)
    .single()

  if (!exp) throw new NotFoundError()

  if (exp.status === 'inactive' || exp.status === 'archived') {
    return c.json({ frozen: true, stats: exp.conclusion?.finalStats ?? null })
  }

  const { data: arms } = await supabase
    .from('experiment_arms')
    .select('*')
    .eq('experiment_id', experimentId)

  const control = arms?.find(a => a.arm === 'control')
  const variant = arms?.find(a => a.arm === 'variant')

  if (!control || !variant) throw new NotFoundError()

  const fullStats = computeFullStats(
    { impressions: control.impressions, conversions: control.conversions },
    { impressions: variant.impressions, conversions: variant.conversions },
  )

  return c.json({ frozen: false, stats: fullStats })
})

export default stats
