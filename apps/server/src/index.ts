import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { publicCors, privateCors } from './middleware/cors.js'
import { sessionAuth } from './middleware/session.js'
import { ApiError } from './lib/errors.js'
import configRoute from './routes/public/config.js'
import eventsRoute from './routes/public/events.js'
import authRoute from './routes/private/auth.js'
import experimentsRoute from './routes/private/experiments.js'
import statsRoute from './routes/private/stats.js'
import accountRoute from './routes/private/account.js'
import billingRoute, { webhookHandler } from './routes/private/billing.js'

type Variables = { userId: string }

const app = new Hono<{ Variables: Variables }>()

// Global error handler
app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json({ error: err.message }, err.status as 400 | 401 | 403 | 404 | 422 | 429 | 500)
  }
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

// Health check (Railway)
app.get('/health', c => c.text('ok'))

// ─── Public sub-app (SDK-facing) ──────────────────────────────────────────────
const publicApp = new Hono<{ Variables: Variables }>()
publicApp.use('*', publicCors)
publicApp.route('/experiments', configRoute)
publicApp.route('/events', eventsRoute)

// Auth routes — signup/login bypass session middleware
app.route('/v1/auth', authRoute)

// Webhook is public — must bypass sessionAuth
app.post('/v1/billing/webhook', webhookHandler)

// ─── Private sub-app (dashboard-facing) ──────────────────────────────────────
const privateApp = new Hono<{ Variables: Variables }>()
privateApp.use('*', privateCors)
privateApp.use('*', sessionAuth)
privateApp.route('/experiments', experimentsRoute)
privateApp.route('/experiments', statsRoute)
privateApp.route('/account', accountRoute)
privateApp.route('/billing', billingRoute)

app.route('/v1', publicApp)
app.route('/v1', privateApp)

const port = Number(process.env.PORT ?? 3001)
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`)
})

export type AppType = typeof app
