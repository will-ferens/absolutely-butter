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

type Props = {
  status: string
  trialDaysRemaining: number
}

export default function TrialBanner({ status, trialDaysRemaining }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await authedPost('/v1/billing/checkout')
      if (res.ok) {
        const { url } = await res.json() as { url: string }
        window.location.href = url
      }
    } finally {
      setLoading(false)
    }
  }

  async function handlePortal() {
    setLoading(true)
    try {
      const res = await authedPost('/v1/billing/portal')
      if (res.ok) {
        const { url } = await res.json() as { url: string }
        window.location.href = url
      }
    } finally {
      setLoading(false)
    }
  }

  // Active: no banner
  if (status === 'active') return null

  // Trialing with >7 days: no banner
  if (status === 'trialing' && trialDaysRemaining > 7) return null

  const upgradeBtn = (label = 'Upgrade — $19/mo →') => (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="text-xs font-medium underline underline-offset-2 hover:no-underline disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {loading ? 'Redirecting…' : label}
    </button>
  )

  const portalBtn = (label: string) => (
    <button
      onClick={handlePortal}
      disabled={loading}
      className="text-xs font-medium underline underline-offset-2 hover:no-underline disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {loading ? 'Redirecting…' : label}
    </button>
  )

  // Trialing 1–7 days
  if (status === 'trialing' && trialDaysRemaining >= 1) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900 flex items-center justify-center gap-3">
        <span>Your free trial ends in {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}.</span>
        {upgradeBtn()}
      </div>
    )
  }

  // Trialing 0 days (today)
  if (status === 'trialing' && trialDaysRemaining === 0) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900 flex items-center justify-center gap-3">
        <span>Your trial ends today.</span>
        {upgradeBtn()}
      </div>
    )
  }

  // Past due
  if (status === 'past_due') {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-800 flex items-center justify-center gap-3">
        <span>Payment failed. We&apos;ll retry automatically. Update your card to avoid interruption.</span>
        {portalBtn('Update card →')}
      </div>
    )
  }

  // Canceled
  if (status === 'canceled') {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-800 flex items-center justify-center gap-3">
        <span>Your trial has ended. Experiments are paused. Your data is safe.</span>
        {upgradeBtn()}
      </div>
    )
  }

  return null
}
