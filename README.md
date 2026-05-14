# Absolutely Butter

A/B testing built for solo founders. Statistically honest results — no enterprise pricing, no dashboard full of noise.

## What it does

Absolutely Butter lets you run experiments on your product and tells you when you have enough data to make a decision. It uses Thompson Sampling and Bayesian inference to give you a real answer: the probability that your variant is better than your control, how much better, and how risky it is to conclude now.

**No p-values. No "statistically significant" theater.** Just: here's the probability, here's the expected loss if you're wrong, here's how long until you have enough data to be confident.

## Stack

| Layer | Choice |
|---|---|
| API | [Hono](https://hono.dev) on Node.js |
| Database | [Supabase](https://supabase.com) (PostgreSQL + Auth) |
| Dashboard | [Next.js](https://nextjs.org) App Router |
| SDK | Zero-dependency TypeScript package |
| Billing | [Stripe](https://stripe.com) |
| Deployment | Railway (API) + Vercel (dashboard) |

## How it works

1. Create an experiment in the dashboard — name it, describe your control and variant, define what counts as a conversion.
2. Drop the SDK into your app. Two lines of code.
3. The SDK assigns each visitor to a variant using Thompson Sampling, tracks impressions and conversions, and sends them to the API.
4. The dashboard shows you the live Bayesian inference: P(variant > control), credible intervals, relative lift, expected loss, and a forward projection of when you'll hit 95% confidence.
5. When you have a strong signal, you conclude the experiment and record your decision. The result becomes a permanent part of your experiment history.

## Project structure

```
/
├── apps/
│   ├── server/      # Hono API — public SDK routes + private dashboard routes
│   └── dashboard/   # Next.js App Router — experiments, stats, settings
└── packages/
    └── sdk/         # npm package — init, getVariant, track
```

## Status

Active development. Following a 10-phase build plan from scaffolding through billing.

## License

Proprietary — Copyright (c) 2026 Will Ferens. All rights reserved.
