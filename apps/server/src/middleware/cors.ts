import { cors } from 'hono/cors'

export const publicCors = cors({ origin: '*' })

export const privateCors = cors({
  origin: process.env.DASHBOARD_ORIGIN ?? 'http://localhost:3000',
  credentials: true,
})
