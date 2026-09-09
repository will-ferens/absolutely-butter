/**
 * Site-wide constants shared by the docs, the marketing pages, and the
 * in-product integration snippet.
 */

/**
 * SDK npm package name. Placeholder until the package is published — referenced
 * by every code sample (docs + landing) and by the snippet the server generates
 * (apps/server/src/routes/private/experiments.ts, env PUBLIC_SDK_PACKAGE).
 * Change it here once the real name is known.
 */
export const SDK_PACKAGE_NAME = '@absolutely-butter/sdk'

/**
 * Public origin of the API the SDK talks to. Baked in at build time from
 * NEXT_PUBLIC_API_URL (set per-environment on Vercel); the fallback is only hit
 * in local dev where the API runs on :3001.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/**
 * Canonical site origin, for metadataBase / OpenGraph absolute URLs.
 * Override with NEXT_PUBLIC_SITE_URL per environment.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://absolutely-butter.com'

export const PRICE_PER_MONTH = 19
export const TRIAL_DAYS = 30
