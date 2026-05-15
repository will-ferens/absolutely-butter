import type { Context, MiddlewareHandler } from 'hono'

interface RateLimitOptions {
  windowMs: number
  max: number
  keyFn: (c: Context) => string
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  const store = new Map<string, number[]>()

  return async (c, next) => {
    const key = opts.keyFn(c)
    const now = Date.now()
    const windowStart = now - opts.windowMs

    const timestamps = (store.get(key) ?? []).filter(t => t > windowStart)

    if (timestamps.length >= opts.max) {
      return c.json({ error: 'Too many requests' }, 429)
    }

    timestamps.push(now)
    store.set(key, timestamps)
    return next()
  }
}

export const rateLimitByApiKey = (max: number) =>
  rateLimit({
    windowMs: 60_000,
    max,
    keyFn: c => c.req.header('Authorization') ?? c.req.header('x-forwarded-for') ?? 'unknown',
  })

export const rateLimitBySession = (max: number) =>
  rateLimit({
    windowMs: 60_000,
    max,
    keyFn: c => c.get('userId') ?? c.req.header('x-forwarded-for') ?? 'unknown',
  })

export const rateLimitByIp = (max: number) =>
  rateLimit({
    windowMs: 60_000,
    max,
    keyFn: c => c.req.header('x-forwarded-for') ?? 'unknown',
  })
