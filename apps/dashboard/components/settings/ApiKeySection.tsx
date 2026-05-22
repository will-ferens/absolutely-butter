'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function authedFetch(path: string, options?: RequestInit) {
  const token = await getToken()
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> | undefined),
    },
  })
}

type Props = { maskedKey: string }

export default function ApiKeySection({ maskedKey }: Props) {
  const [displayKey, setDisplayKey] = useState(maskedKey)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newKeyNotice, setNewKeyNotice] = useState(false)

  async function handleReveal() {
    if (revealed) {
      setDisplayKey(maskedKey)
      setRevealed(false)
      return
    }
    try {
      const res = await authedFetch('/v1/account/api-key')
      if (!res.ok) throw new Error('Failed to reveal key')
      const data = await res.json() as { apiKey: string }
      setDisplayKey(data.apiKey)
      setRevealed(true)
    } catch {
      setError('Could not reveal key. Try again.')
    }
  }

  async function handleCopy() {
    let key = displayKey
    if (!revealed) {
      try {
        const res = await authedFetch('/v1/account/api-key')
        if (!res.ok) throw new Error()
        const data = await res.json() as { apiKey: string }
        key = data.apiKey
        setDisplayKey(data.apiKey)
        setRevealed(true)
      } catch {
        setError('Could not fetch key to copy.')
        return
      }
    }
    await navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    setRegenerating(true)
    setError(null)
    try {
      const res = await authedFetch('/v1/account/api-key/regenerate', { method: 'POST' })
      if (!res.ok) throw new Error('Regeneration failed')
      const data = await res.json() as { apiKey: string }
      setDisplayKey(data.apiKey)
      setRevealed(true)
      setNewKeyNotice(true)
      setShowConfirm(false)
    } catch {
      setError('Regeneration failed. Try again.')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {newKeyNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
          Save this key — it won&apos;t be shown in full again unless you click Reveal.
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/* Key display */}
        <code className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 truncate">
          {revealed ? displayKey : maskedKey.replace(/[^•]/g, c => c === '_' || c === 'p' || c === 'k' || c === 'l' || c === 'i' || c === 'v' || c === 'e' ? c : '•')}
        </code>

        {/* Actions */}
        <button
          onClick={handleReveal}
          className="shrink-0 text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {revealed ? 'Hide' : 'Reveal'}
        </button>

        <button
          onClick={handleCopy}
          className="shrink-0 text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
        >
          {copied ? (
            <><svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-green-600">Copied</span></>
          ) : 'Copy'}
        </button>

        <button
          onClick={() => { setShowConfirm(true); setError(null) }}
          className="shrink-0 text-sm text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          Regenerate
        </button>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-900">Regenerate API key?</p>
          <p className="text-sm text-amber-800">
            Your current key will stop working immediately. Any active experiments
            will stop receiving data until you update your SDK integration.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="text-sm text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-sm font-medium text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {regenerating ? 'Regenerating…' : 'Regenerate'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
