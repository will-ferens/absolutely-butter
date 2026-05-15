import { supabase } from '../lib/supabase.js'

export async function processImpression(
  experimentId: string,
  variant: 'control' | 'variant',
  sessionId: string,
): Promise<void> {
  const { error } = await supabase.from('experiment_sessions').insert({
    experiment_id: experimentId,
    session_id: sessionId,
    arm: variant,
    converted: false,
  })

  // 23505 = unique_violation — duplicate session, skip increment
  if (error) {
    if (error.code === '23505') return
    throw error
  }

  await supabase.rpc('increment_impressions', {
    p_experiment_id: experimentId,
    p_arm: variant,
  })
}

export async function processConversion(
  experimentId: string,
  variant: 'control' | 'variant',
  sessionId: string,
): Promise<void> {
  const { data: session } = await supabase
    .from('experiment_sessions')
    .select('converted')
    .eq('experiment_id', experimentId)
    .eq('session_id', sessionId)
    .single()

  if (!session || session.converted) return

  await Promise.all([
    supabase
      .from('experiment_sessions')
      .update({ converted: true })
      .eq('experiment_id', experimentId)
      .eq('session_id', sessionId),
    supabase.rpc('increment_conversions', {
      p_experiment_id: experimentId,
      p_arm: variant,
    }),
  ])
}
