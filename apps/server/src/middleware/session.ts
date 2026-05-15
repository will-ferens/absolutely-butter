import type { MiddlewareHandler } from 'hono'
import { supabase } from '../lib/supabase.js'
import { UnauthorizedError } from '../lib/errors.js'

export const sessionAuth: MiddlewareHandler = async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '').trim()
  if (!token) throw new UnauthorizedError()

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new UnauthorizedError()

  c.set('userId', user.id)
  return next()
}
