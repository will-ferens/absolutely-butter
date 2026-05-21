'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeLift, formatExpectedLoss, decisionLabel } from '@/lib/experiments'
import type { ExperimentDetail, FullStats } from '@/lib/experiments'
import HeadlineNumber from '@/components/experiments/HeadlineNumber'
import IntervalPlot from '@/components/experiments/IntervalPlot'
import DecisionBanner from '@/components/experiments/DecisionBanner'
import ForwardProjection from '@/components/experiments/ForwardProjection'
import ConcludeModal from '@/components/experiments/ConcludeModal'
import SnippetDisplay from '@/components/experiments/SnippetDisplay'

const STATUS_BADGE: Record<string, string> = {
  live: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-600',
  inactive: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-400',
}

const STATUS_LABELS: Record<string, string> = {
  live: 'Live',
  draft: 'Draft',
  inactive: 'Concluded',
  archived: 'Archived',
}

type Props = {
  experiment: ExperimentDetail
  snippet: string
  isActive: boolean
}

export default function ExperimentDetailClient({ experiment: initial, snippet, isActive }: Props) {
  const router = useRouter()
  const [exp, setExp] = useState(initial)
  const [stats, setStats] = useState<FullStats | null>(initial.stats)
  const [firstImpressionReceived, setFirstImpressionReceived] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showSnippet, setShowSnippet] = useState(exp.status === 'draft')
  const [menuOpen, setMenuOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }, [])

  const authedFetch = useCallback(async (path: string, options?: RequestInit) => {
    const token = await getToken()
    return fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers as Record<string, string> | undefined),
      },
    })
  }, [apiBase, getToken])

  // Poll for stats when live or draft (draft polls for first impression)
  useEffect(() => {
    if (exp.status !== 'live' && exp.status !== 'draft') return

    pollingRef.current = setInterval(async () => {
      try {
        const res = await authedFetch(`/v1/experiments/${exp.id}/stats`)
        if (!res.ok) return

        const data = await res.json() as { frozen: boolean; stats: FullStats | null }
        if (data.stats) {
          setStats(data.stats)

          // First impression detected on a draft
          if (exp.status === 'draft') {
            const total = initial.arms.control && initial.arms.variant
              ? 0
              : 0
            const totalNow = (data.stats.probVariantWins !== undefined) ? 1 : 0
            if (totalNow > 0 && !firstImpressionReceived) {
              setFirstImpressionReceived(true)
            }
          }
        }

        // Refresh the full page to pick up status changes
        if (exp.status === 'draft' && data.stats && data.stats.probVariantWins > 0) {
          clearInterval(pollingRef.current!)
          router.refresh()
        }
      } catch {
        // Silently ignore poll failures
      }
    }, 5000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [exp.id, exp.status, authedFetch, router, firstImpressionReceived, initial.arms.control, initial.arms.variant])

  async function handleLaunch() {
    setActionLoading(true)
    try {
      const res = await authedFetch(`/v1/experiments/${exp.id}/launch`, { method: 'POST' })
      if (res.ok) router.refresh()
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReactivate() {
    setActionLoading(true)
    try {
      const res = await authedFetch(`/v1/experiments/${exp.id}/reactivate`, { method: 'POST' })
      if (res.ok) router.refresh()
    } finally {
      setActionLoading(false)
    }
  }

  async function handleArchive() {
    if (!confirm('Archive this experiment? This cannot be undone.')) return
    setActionLoading(true)
    try {
      const res = await authedFetch(`/v1/experiments/${exp.id}/archive`, { method: 'POST' })
      if (res.ok) router.push('/experiments')
    } finally {
      setActionLoading(false)
    }
  }

  const control = exp.arms.control
  const variant = exp.arms.variant
  const hasArms = control && variant
  const isLive = exp.status === 'live'
  const isDraft = exp.status === 'draft'
  const isInactive = exp.status === 'inactive'
  const canWrite = isActive || exp.status === 'draft'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900 break-words">{exp.name}</h1>
          <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mt-2 ${STATUS_BADGE[exp.status] ?? ''}`}>
            {STATUS_LABELS[exp.status] ?? exp.status}
          </span>
          {firstImpressionReceived && (
            <span className="ml-2 text-xs text-green-600 font-medium">✓ First impression received</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Draft: launch button */}
          {isDraft && (
            canWrite ? (
              <button
                onClick={handleLaunch}
                disabled={actionLoading}
                className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                {actionLoading ? 'Launching…' : 'Launch'}
              </button>
            ) : (
              <span title="Upgrade to launch experiments">
                <span className="text-sm font-medium bg-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed select-none">
                  Launch
                </span>
              </span>
            )
          )}

          {/* Live: conclude */}
          {isLive && (
            <button
              onClick={() => setShowModal(true)}
              className="text-sm font-medium border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Conclude experiment
            </button>
          )}

          {/* Inactive: reactivate + archive */}
          {isInactive && (
            <>
              <button
                onClick={handleReactivate}
                disabled={actionLoading || !canWrite}
                className="text-sm font-medium border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Reactivate
              </button>
              <button
                onClick={handleArchive}
                disabled={actionLoading}
                className="text-sm font-medium text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors"
              >
                Archive
              </button>
            </>
          )}

          {/* ⋯ menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ⋯
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 z-10 py-1"
                onBlur={() => setMenuOpen(false)}
              >
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => { setShowSnippet(v => !v); setMenuOpen(false) }}
                >
                  {showSnippet ? 'Hide snippet' : 'View snippet'}
                </button>
                {(isDraft || isLive) && (
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Edit
                  </button>
                )}
                {isInactive && (
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => { handleArchive().catch(() => {}); setMenuOpen(false) }}
                  >
                    Archive
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SDK Snippet */}
      {showSnippet && (
        <SnippetDisplay snippet={snippet} />
      )}

      {/* Concluded banner */}
      {isInactive && exp.conclusion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
          Concluded {new Date(exp.conclusion.concludedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}{' '}
          · {decisionLabel(exp.conclusion.decision)}{' '}
          {stats && (
            <>
              · Final confidence: {Math.round(stats.probVariantWins * 100)}%
              · Relative lift: {formatRelativeLift(stats.relativeLift)}
            </>
          )}
        </div>
      )}

      {/* Decision banner */}
      {isLive && stats && (stats.probVariantWins >= 0.95 || stats.probVariantWins <= 0.05) && (
        <DecisionBanner experimentId={exp.id} stats={stats} />
      )}

      {/* Stats section */}
      {hasArms && stats ? (
        <div className="space-y-6">
          <HeadlineNumber
            probVariantWins={stats.probVariantWins}
            status={exp.status}
            controlImpressions={control.impressions}
            variantImpressions={variant.impressions}
          />

          <IntervalPlot control={control} variant={variant} stats={stats} />

          {/* Supporting numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Relative lift</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatRelativeLift(stats.relativeLift)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Expected loss if concluded now</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatExpectedLoss(
                  stats.probVariantWins >= 0.5
                    ? stats.expectedLoss.ifChooseVariant
                    : stats.expectedLoss.ifChooseControl,
                )}
              </p>
            </div>
          </div>

          {/* Forward projection — live only */}
          {isLive && exp.launched_at && (
            <ForwardProjection
              launchedAt={exp.launched_at}
              control={control}
              variant={variant}
              stats={stats}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 text-sm">
          {isDraft
            ? 'No data yet. Launch this experiment and integrate the SDK to start collecting results.'
            : 'No data available.'}
        </div>
      )}

      {/* Experiment details (collapsible) */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setDetailsOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>Experiment details</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {detailsOpen && (
          <div className="px-4 py-4 border-t border-gray-100 space-y-4 text-sm">
            {exp.hypothesis && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Hypothesis</p>
                <p className="text-gray-700">{exp.hypothesis}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Control</p>
              <p className="text-gray-700">{exp.control_description}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Variant</p>
              <p className="text-gray-700">{exp.variant_description}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Conversion goal</p>
              <p className="text-gray-700">{exp.goal}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Created</p>
                <p className="text-gray-600">{new Date(exp.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Experiment ID</p>
                <p className="text-gray-600 font-mono text-xs">{exp.id}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conclude modal */}
      {showModal && (
        <ConcludeModal
          experimentId={exp.id}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
