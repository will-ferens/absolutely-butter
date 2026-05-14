import { Hono } from 'hono'
import { supabase } from '../../lib/supabase.js'
import { apiKeyAuth } from '../../middleware/api-key.js'
import { rateLimitByApiKey } from '../../middleware/rate-limit.js'
import { processImpression, processConversion } from '../../services/events.js'

type Variables = { userId: string }

const events = new Hono<{ Variables: Variables }>()

const ACTIVE_STATUSES = new Set(['trialing', 'active', 'past_due'])

events.post(
  '/',
  rateLimitByApiKey(1000),
  apiKeyAuth,
  async c => {
    try {
      const body = await c.req.json() as Record<string, unknown>
      const { experimentId, variant, event, sessionId } = body

      if (
        typeof experimentId !== 'string' ||
        typeof sessionId !== 'string' ||
        (variant !== 'control' && variant !== 'variant') ||
        (event !== 'impression' && event !== 'conversion')
      ) {
        return c.json({}, 202)
      }

      const userId = c.get('userId')

      // Verify experiment ownership and live status
      const { data: experiment } = await supabase
        .from('experiments')
        .select('status, user_id')
        .eq('id', experimentId)
        .eq('user_id', userId)
        .single()

      if (!experiment || experiment.status !== 'live') return c.json({}, 202)

      // Billing check — discard silently if account is not active
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', userId)
        .single()

      if (!profile || !ACTIVE_STATUSES.has(profile.subscription_status)) {
        return c.json({}, 202)
      }

      if (event === 'impression') {
        await processImpression(experimentId, variant, sessionId)
      } else {
        await processConversion(experimentId, variant, sessionId)
      }
    } catch {
      // swallow all errors — never surface to SDK caller
    }

    return c.json({}, 202)
  },
)

export default events
