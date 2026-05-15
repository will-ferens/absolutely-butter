import type { MiddlewareHandler } from 'hono'
import { supabase } from '../lib/supabase.js'
import { UnauthorizedError } from '../lib/errors.js'

interface CacheEntry { userId: string; expiresAt: number }
const cache = new Map<string, CacheEntry>()

export const apiKeyAuth: MiddlewareHandler = async (c, next) => {
  const key = c.req.header('Authorization')?.replace('Bearer ', '').trim()
  if (!key) throw new UnauthorizedError()

  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    c.set('userId', cached.userId)
    return next()
  }

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('api_key', key)
    .single()

  if (!data) throw new UnauthorizedError()

  cache.set(key, { userId: data.id, expiresAt: Date.now() + 60_000 })
  c.set('userId', data.id)
  return next()
}
