import Link from 'next/link'
import { headers } from 'next/headers'
import { serverFetch } from '@/lib/server-api'
import { groupAndSort } from '@/lib/experiments'
import type { ExperimentWithArms } from '@/lib/experiments'
import ExperimentRow from '@/components/experiments/ExperimentRow'
import EmptyState from '@/components/experiments/EmptyState'

export default async function ExperimentsPage() {
  const headersList = headers()
  const isActive = headersList.get('x-subscription-active') === 'true'
  const subscriptionStatus = headersList.get('x-subscription-status') ?? 'trialing'
  const canWrite = isActive || subscriptionStatus === 'trialing'

  const res = await serverFetch('/v1/experiments')
  const experiments: ExperimentWithArms[] = res.ok ? await res.json() : []

  const groups = groupAndSort(experiments)

  // Determine onboarding checklist progress
  const hasAny = experiments.length > 0
  const hasLive = experiments.some(e => e.status === 'live' || e.status === 'inactive')
  const hasResult = experiments.some(e => {
    const total = (e.arms.control?.impressions ?? 0) + (e.arms.variant?.impressions ?? 0)
    return total > 0
  })

  const onboardingSteps = [
    { label: 'Create your first experiment', done: hasAny },
    { label: 'Integrate the SDK', done: hasLive },
    { label: 'Receive your first result', done: hasResult },
  ]

  const STATUS_LABELS: Record<string, string> = {
    live: 'Live',
    draft: 'Draft',
    inactive: 'Concluded',
    archived: 'Archived',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Experiments</h1>
        {canWrite ? (
          <Link
            href="/experiments/new"
            className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + New experiment
          </Link>
        ) : (
          <span title="Upgrade to create experiments" className="cursor-not-allowed">
            <span className="bg-gray-200 text-gray-400 text-sm font-medium px-4 py-2 rounded-lg select-none">
              + New experiment
            </span>
          </span>
        )}
      </div>

      {experiments.length === 0 ? (
        <EmptyState steps={onboardingSteps} />
      ) : (
        <div className="space-y-8">
          {groups.map(({ status, experiments: group }) => (
            <section key={status}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                {STATUS_LABELS[status] ?? status} · {group.length}
              </h2>
              <div className="space-y-2">
                {group.map(exp => (
                  <ExperimentRow key={exp.id} exp={exp} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
