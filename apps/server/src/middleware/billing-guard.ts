import type { MiddlewareHandler } from 'hono'
import { supabase } from '../lib/supabase.js'
import { ApiError, UnauthorizedError } from '../lib/errors.js'

export const billingGuard: MiddlewareHandler = async (c, next) => {
  const userId = c.get('userId')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, trial_ends_at')
    .eq('id', userId)
    .single()

  if (!profile) throw new UnauthorizedError()

  const { subscription_status, trial_ends_at } = profile
  const isActive =
    subscription_status === 'active' ||
    subscription_status === 'past_due' ||
    (subscription_status === 'trialing' && new Date(trial_ends_at) > new Date())

  if (!isActive) throw new ApiError(402, 'SUBSCRIPTION_REQUIRED')

  return next()
}
