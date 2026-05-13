# Absolutely Butter

A/B testing SaaS for solo technical founders. Statistically honest results via Thompson Sampling + Beta-Binomial inference. One plan, $19/month, 30-day free trial.

## Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Language | TypeScript (strict, end-to-end) |
| API framework | Hono (RPC mode for type-safe dashboard client) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Dashboard | Next.js 14 App Router |
| Package manager | pnpm workspaces |
| Deployment | Railway (server) + Vercel (dashboard) |
| Billing | Stripe (hosted Checkout + Customer Portal) |

## Monorepo Layout

```
/
├── apps/
│   ├── server/          # @ab/server — Hono API, deployed on Railway
│   │   └── src/
│   │       ├── index.ts
│   │       ├── routes/
│   │       │   ├── public/    # SDK-facing: /config, /events
│   │       │   └── private/   # Dashboard-facing: auth, experiments, stats, billing
│   │       ├── middleware/    # api-key, session, cors, rate-limit, billing-guard
│   │       ├── services/      # stats.ts, bandit.ts, events.ts (pure logic)
│   │       └── lib/           # supabase.ts, id.ts, errors.ts
│   │
│   └── dashboard/       # @ab/dashboard — Next.js App Router, deployed on Vercel
│       ├── app/
│       │   ├── (auth)/        # /login, /signup, /forgot-password, /reset-password
│       │   ├── (dashboard)/   # /experiments, /settings (protected)
│       │   └── auth/callback/ # Supabase auth callback route
│       ├── components/
│       │   ├── experiments/   # ExperimentRow, IntervalPlot, DecisionBanner, etc.
│       │   └── ui/            # Shared primitives
│       └── lib/
│           ├── api.ts         # Typed Hono RPC client
│           └── supabase/      # server.ts + client.ts helpers
│
├── packages/
│   └── sdk/             # @ab/sdk — npm package, zero dependencies
│       └── src/index.ts # init, ready, getVariant, track
│
├── CLAUDE.md
├── package.json         # Root — shared dev deps, workspace scripts
├── pnpm-workspace.yaml
└── tsconfig.base.json   # Shared TS config (strict, ESNext, bundler)
```

## Workspace Names

| Directory | Package name |
|---|---|
| `apps/server` | `@ab/server` |
| `apps/dashboard` | `@ab/dashboard` |
| `packages/sdk` | `@ab/sdk` |

## Key Constraints

**SDK (`@ab/sdk`):**
- Zero runtime dependencies — `dependencies` field must remain empty
- Bundle must stay under 5kb gzipped (enforced as a check in Phase 4)
- Four exports only: `init`, `ready`, `getVariant`, `track`
- `getVariant()` must always return `'control'` on any failure — never break the host page
- `ready()` must always resolve, never reject

**TypeScript:**
- Strict mode everywhere, no exceptions
- `moduleResolution: bundler` — do not change to `node`

**pnpm:**
- pnpm only — do not run `npm install` or `yarn` anywhere

**Auth split:**
- Dashboard middleware handles auth-only route protection
- `billingGuard` Hono middleware handles write enforcement
- `POST /v1/events` is NEVER 402'd — events from expired accounts are silently discarded

## Specs

Full product specs live in the Obsidian vault at `Absolutely Butter/Specs/`. Five files:

| File | Covers |
|---|---|
| `Server & API Design Specification v1.md` | Stack, repo structure, DB schema, all routes, middleware, Hono RPC |
| `Stats Engine Specification — v1.md` | Thompson Sampling, Beta-Binomial model, all inference outputs |
| `SDK Specification — v1.md` | API surface, failure behavior, cookie strategy, event shape |
| `Dashboard Specification v1.md` | All 5 screens, component list, conclude flow, UI decisions |
| `Auth & Billing Specification.md` | Supabase Auth, Stripe, webhook handler, billing guard, trial logic |

## Build Order

10 phases tracked in Linear (team: Absolutely Butter, ABS-5 through ABS-14):

| Issue | Phase |
|---|---|
| ABS-5 | Monorepo scaffolding (this phase) |
| ABS-6 | Database migrations |
| ABS-7 | Stats engine |
| ABS-8 | SDK |
| ABS-9 | Server core (public routes + middleware) |
| ABS-10 | Server private routes (auth, experiments, stats) |
| ABS-11 | Billing (Stripe integration) |
| ABS-12 | Dashboard shell (auth pages, nav, middleware) |
| ABS-13 | Dashboard experiments (list, creation, detail) |
| ABS-14 | Dashboard settings (API key, billing UI) |

## Common Commands

```bash
# Install all dependencies
pnpm install

# Run server in dev mode
pnpm --filter @ab/server dev

# Run dashboard in dev mode
pnpm --filter @ab/dashboard dev

# Typecheck all packages
pnpm -r tsc --noEmit

# Run all tests
pnpm -r test

# Run tests for a specific package
pnpm --filter @ab/server test
pnpm --filter @ab/sdk test
```
