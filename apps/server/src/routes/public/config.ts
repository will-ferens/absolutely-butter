import { Hono } from 'hono'
import { supabase } from '../../lib/supabase.js'
import { apiKeyAuth } from '../../middleware/api-key.js'
import { rateLimitByApiKey } from '../../middleware/rate-limit.js'

type Variables = { userId: string }

const config = new Hono<{ Variables: Variables }>()

config.get(
  '/:id/config',
  rateLimitByApiKey(200),
  apiKeyAuth,
  async c => {
    const experimentId = c.req.param('id')
    const userId = c.get('userId')

    const { data: experiment, error } = await supabase
      .from('experiments')
      .select('id, status')
      .eq('id', experimentId)
      .eq('user_id', userId)
      .single()

    if (error || !experiment) return c.json({ error: 'Not found' }, 404)

    if (experiment.status !== 'live') {
      return c.json({ status: experiment.status })
    }

    const { data: arms } = await supabase
      .from('experiment_arms')
      .select('arm, impressions, conversions')
      .eq('experiment_id', experimentId)

    const control = arms?.find(a => a.arm === 'control')
    const variant = arms?.find(a => a.arm === 'variant')

    return c.json({
      status: 'live',
      control: {
        alpha: 1 + (control?.conversions ?? 0),
        beta: 1 + ((control?.impressions ?? 0) - (control?.conversions ?? 0)),
      },
      variant: {
        alpha: 1 + (variant?.conversions ?? 0),
        beta: 1 + ((variant?.impressions ?? 0) - (variant?.conversions ?? 0)),
      },
    })
  },
)

export default config
