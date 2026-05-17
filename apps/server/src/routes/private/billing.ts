import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import Stripe from 'stripe'
import { stripe } from '../../lib/stripe.js'
import { supabase } from '../../lib/supabase.js'
import { ApiError, NotFoundError } from '../../lib/errors.js'

type Variables = { userId: string }

const billing = new Hono<{ Variables: Variables }>()

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  if (status === 'active') return 'active'
  if (status === 'past_due') return 'past_due'
  return 'canceled'
}

// GET /v1/billing/status
billing.get('/status', async c => {
  const userId = c.get('userId')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, trial_ends_at, stripe_customer_id')
    .eq('id', userId)
    .single()

  if (!profile) throw new NotFoundError()

  const { subscription_status, trial_ends_at, stripe_customer_id } = profile
  const trialEnd = new Date(trial_ends_at)
  const now = new Date()
  const isActive =
    subscription_status === 'active' ||
    subscription_status === 'past_due' ||
    (subscription_status === 'trialing' && trialEnd > now)

  const trialDaysRemaining =
    subscription_status === 'trialing' && trialEnd > now
      ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0

  return c.json({
    status: subscription_status,
    isActive,
    trialEndsAt: trial_ends_at,
    trialDaysRemaining,
    hasPaymentMethod: !!stripe_customer_id,
  })
})

// POST /v1/billing/checkout
billing.post('/checkout', async c => {
  const userId = c.get('userId')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', userId)
    .single()

  if (profile?.subscription_status === 'active') {
    return c.json({ error: 'Already subscribed' }, 409)
  }

  const dashboardUrl = process.env.DASHBOARD_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    client_reference_id: userId,
    allow_promotion_codes: true,
    success_url: `${dashboardUrl}/settings?checkout=success`,
    cancel_url: `${dashboardUrl}/settings?checkout=canceled`,
  })

  return c.json({ url: session.url })
})

// POST /v1/billing/portal
billing.post('/portal', async c => {
  const userId = c.get('userId')

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (!profile?.stripe_customer_id) throw new NotFoundError('No billing account found')

  const dashboardUrl = process.env.DASHBOARD_URL ?? 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${dashboardUrl}/settings`,
  })

  return c.json({ url: session.url })
})

// Webhook handler — exported and mounted on root app (no sessionAuth)
export const webhookHandler: MiddlewareHandler = async c => {
  const sig = c.req.header('stripe-signature')
  if (!sig) return c.json({ error: 'Missing signature' }, 400)

  const rawBody = await c.req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return c.json({ error: 'Invalid signature' }, 400)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id
      if (!userId) break

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        })
        .eq('id', userId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('profiles')
        .update({ subscription_status: mapStripeStatus(sub.status) })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('profiles')
        .update({ subscription_status: 'canceled' })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await supabase
        .from('profiles')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', invoice.customer as string)
      break
    }

    default:
      break
  }

  return c.json({ received: true })
}

export default billing
