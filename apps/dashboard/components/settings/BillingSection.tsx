'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function authedPost(path: string) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

type Status = 'trialing' | 'active' | 'past_due' | 'canceled'

type Props = {
  status: Status
  trialDaysRemaining: number
  trialEndsAt: string
  hasPaymentMethod: boolean
  checkoutSuccess: boolean
}

export default function BillingSection({ status, trialDaysRemaining, trialEndsAt, hasPaymentMethod, checkoutSuccess }: Props) {
  const [loading, setLoading] = useState<'checkout' | 'portal' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    setLoading('checkout')
    setError(null)
    try {
      const res = await authedPost('/v1/billing/checkout')
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? 'Failed to start checkout')
      }
      const { url } = await res.json() as { url: string }
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    setError(null)
    try {
      const res = await authedPost('/v1/billing/portal')
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? 'Failed to open billing portal')
      }
      const { url } = await res.json() as { url: string }
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(null)
    }
  }

  const nextBillingDate = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="space-y-4">
      {/* Checkout success banner */}
      {checkoutSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          <span className="text-green-600">✓</span>
          <span>You&apos;re all set. Welcome to the paid plan.</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Trialing */}
      {status === 'trialing' && (
        <div className="border border-gray-200 rounded-xl p-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Free trial · {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining
            </p>
            <p className="text-sm text-gray-500 mt-1">
              After your trial ends, you&apos;ll need a paid plan to continue receiving experiment data.
            </p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading === 'checkout'}
            className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading === 'checkout' ? 'Redirecting…' : 'Add payment method →'}
          </button>
        </div>
      )}

      {/* Active */}
      {status === 'active' && (
        <div className="border border-gray-200 rounded-xl p-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Pro plan · $19/month</p>
            {nextBillingDate && (
              <p className="text-sm text-gray-500 mt-1">Next billing date: {nextBillingDate}</p>
            )}
          </div>
          <button
            onClick={handlePortal}
            disabled={loading === 'portal'}
            className="text-sm font-medium border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading === 'portal' ? 'Redirecting…' : 'Manage billing →'}
          </button>
        </div>
      )}

      {/* Past due */}
      {status === 'past_due' && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-red-900">Payment failed</p>
            <p className="text-sm text-red-700 mt-1">We&apos;ll retry automatically.</p>
          </div>
          <button
            onClick={handlePortal}
            disabled={loading === 'portal'}
            className="text-sm font-medium border border-red-300 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {loading === 'portal' ? 'Redirecting…' : 'Update card →'}
          </button>
        </div>
      )}

      {/* Canceled */}
      {status === 'canceled' && (
        <div className="border border-gray-200 rounded-xl p-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Subscription ended</p>
            <p className="text-sm text-gray-500 mt-1">Your data is safe. Upgrade to resume experiments.</p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading === 'checkout'}
            className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading === 'checkout' ? 'Redirecting…' : 'Upgrade — $19/mo →'}
          </button>
        </div>
      )}
    </div>
  )
}
