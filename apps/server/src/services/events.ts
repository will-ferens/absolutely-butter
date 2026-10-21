import { supabase } from '../lib/supabase.js'

export type EventOutcome = 'counted' | 'duplicate' | 'mismatch' | 'unknown_session' | 'inactive'

export interface EventResult {
  outcome: EventOutcome
  storedArm: 'control' | 'variant' | null
  mismatch: boolean
}

function parseResult(data: unknown): EventResult {
  const row = Array.isArray(data) ? data[0] : data
  const result = row as { outcome?: unknown; stored_arm?: unknown; mismatch?: unknown } | null
  const outcomes: EventOutcome[] = ['counted', 'duplicate', 'mismatch', 'unknown_session', 'inactive']

  if (!result || !outcomes.includes(result.outcome as EventOutcome)) {
    throw new Error('Invalid event processing result')
  }

  return {
    outcome: result.outcome as EventOutcome,
    storedArm: result.stored_arm === 'control' || result.stored_arm === 'variant'
      ? result.stored_arm
      : null,
    mismatch: result.mismatch === true,
  }
}

export async function processImpression(
  experimentId: string,
  variant: 'control' | 'variant',
  sessionId: string,
): Promise<EventResult> {
  const { data, error } = await supabase.rpc('record_impression', {
    p_experiment_id: experimentId,
    p_session_id: sessionId,
    p_arm: variant,
  })

  if (error) throw error
  return parseResult(data)
}

export async function processConversion(
  experimentId: string,
  variant: 'control' | 'variant',
  sessionId: string,
): Promise<EventResult> {
  const { data, error } = await supabase.rpc('record_conversion', {
    p_experiment_id: experimentId,
    p_session_id: sessionId,
    p_submitted_arm: variant,
  })

  if (error) throw error
  return parseResult(data)
}
