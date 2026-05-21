'use client'

import { useState, useEffect } from 'react'
import { formatExpectedLoss } from '@/lib/experiments'
import type { FullStats } from '@/lib/experiments'

type Props = {
  experimentId: string
  stats: FullStats
}

export default function DecisionBanner({ experimentId, stats }: Props) {
  const [dismissed, setDismissed] = useState(false)

  // Check sessionStorage on mount
  useEffect(() => {
    const key = `banner-dismissed-${experimentId}`
    if (sessionStorage.getItem(key) === '1') setDismissed(true)
  }, [experimentId])

  function dismiss() {
    sessionStorage.setItem(`banner-dismissed-${experimentId}`, '1')
    setDismissed(true)
  }

  const { probVariantWins, expectedLoss, decision } = stats
  const isVariantWinning = decision === 'conclude_variant'
  const isControlWinning = decision === 'conclude_control'
  const showBanner = (probVariantWins >= 0.95 || probVariantWins <= 0.05) && !dismissed

  if (!showBanner) return null

  return (
    <div className={`rounded-lg px-4 py-3 flex items-start justify-between gap-4 ${
      isVariantWinning
        ? 'bg-green-50 border border-green-200'
        : 'bg-red-50 border border-red-200'
    }`}>
      <div className="flex items-start gap-3">
        <span className={`text-lg leading-none mt-0.5 ${isVariantWinning ? 'text-green-600' : 'text-red-500'}`}>
          {isVariantWinning ? '✓' : '✗'}
        </span>
        <div>
          {isVariantWinning && (
            <p className="text-sm font-medium text-green-900">
              Strong signal detected. Variant is likely better.{' '}
              <span className="font-normal text-green-700">
                Expected downside if you ship: {formatExpectedLoss(expectedLoss.ifChooseVariant)}
              </span>
            </p>
          )}
          {isControlWinning && (
            <p className="text-sm font-medium text-red-900">
              Variant is underperforming. Control is likely better.
            </p>
          )}
          {!isVariantWinning && !isControlWinning && (
            <p className="text-sm font-medium text-gray-800">
              Strong signal detected — P(B&gt;A) = {Math.round(probVariantWins * 100)}%
            </p>
          )}
        </div>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
