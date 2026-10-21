import { Hono } from 'hono'
import { createHash } from 'node:crypto'
import { supabase } from '../../lib/supabase.js'
import { apiKeyAuth } from '../../middleware/api-key.js'
import { rateLimitByApiKey } from '../../middleware/rate-limit.js'
import {
  processImpression,
  processConversion,
  type EventResult,
} from '../../services/events.js'

type Variables = { userId: string }

const events = new Hono<{ Variables: Variables }>()

const ACTIVE_STATUSES = new Set(['trialing', 'active', 'past_due'])

function hashSessionId(sessionId: string): string {
  return createHash('sha256').update(sessionId).digest('hex').slice(0, 16)
}

function logEventOutcome(input: {
  event: string
  experimentId: string
  sessionId: string
  result: EventResult
}): void {
  console.info(JSON.stringify({
    type: 'experiment_event_outcome',
    event: input.event,
    experimentId: input.experimentId,
    sessionIdHash: hashSessionId(input.sessionId),
    outcome: input.result.outcome,
    storedArm: input.result.storedArm,
    mismatch: input.result.mismatch,
    receivedAt: new Date().toISOString(),
  }))
}

events.post(
  '/',
  rateLimitByApiKey(1000),
  apiKeyAuth,
  async c => {
    let experimentIdForLog = ''
    let sessionIdForLog = ''
    let eventForLog = ''

    try {
      const body = await c.req.json() as Record<string, unknown>
      const { experimentId, variant, event, sessionId } = body

      experimentIdForLog = typeof experimentId === 'string' ? experimentId : ''
      sessionIdForLog = typeof sessionId === 'string' ? sessionId : ''
      eventForLog = typeof event === 'string' ? event : ''

      if (
        typeof experimentId !== 'string' ||
        typeof sessionId !== 'string' ||
        (variant !== 'control' && variant !== 'variant') ||
        (event !== 'impression' && event !== 'conversion')
      ) {
        console.info(JSON.stringify({
          type: 'experiment_event_outcome',
          event: eventForLog,
          experimentId: experimentIdForLog,
          sessionIdHash: hashSessionId(sessionIdForLog),
          outcome: 'invalid_payload',
          receivedAt: new Date().toISOString(),
        }))
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

      if (!experiment || experiment.status !== 'live') {
        console.info(JSON.stringify({
          type: 'experiment_event_outcome',
          event: eventForLog,
          experimentId: experimentIdForLog,
          sessionIdHash: hashSessionId(sessionIdForLog),
          outcome: 'inactive',
          receivedAt: new Date().toISOString(),
        }))
        return c.json({}, 202)
      }

      // Billing check — discard silently if account is not active
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', userId)
        .single()

      if (!profile || !ACTIVE_STATUSES.has(profile.subscription_status)) {
        console.info(JSON.stringify({
          type: 'experiment_event_outcome',
          event: eventForLog,
          experimentId: experimentIdForLog,
          sessionIdHash: hashSessionId(sessionIdForLog),
          outcome: 'billing_rejected',
          receivedAt: new Date().toISOString(),
        }))
        return c.json({}, 202)
      }

      let result: EventResult
      if (event === 'impression') {
        result = await processImpression(experimentId, variant, sessionId)
      } else {
        result = await processConversion(experimentId, variant, sessionId)
      }
      logEventOutcome({ event, experimentId, sessionId, result })
    } catch (error) {
      // swallow all errors — never surface to SDK caller
      console.error(JSON.stringify({
        type: 'experiment_event_processing_failed',
        event: eventForLog,
        experimentId: experimentIdForLog,
        sessionIdHash: hashSessionId(sessionIdForLog),
        error: error instanceof Error ? error.message : 'unknown_error',
        receivedAt: new Date().toISOString(),
      }))
    }

    return c.json({}, 202)
  },
)

export default events
