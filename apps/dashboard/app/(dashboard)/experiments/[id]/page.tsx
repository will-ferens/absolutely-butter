import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { serverFetch } from '@/lib/server-api'
import type { ExperimentDetail } from '@/lib/experiments'
import { SDK_PACKAGE_NAME, API_BASE_URL } from '@/lib/docs/nav'
import ExperimentDetailClient from './ExperimentDetailClient'

type PageProps = { params: { id: string } }

export default async function ExperimentDetailPage({ params }: PageProps) {
  const headersList = headers()
  const isActive = headersList.get('x-subscription-active') === 'true'
  const subscriptionStatus = headersList.get('x-subscription-status') ?? 'trialing'
  const canWrite = isActive || subscriptionStatus === 'trialing'

  const [expRes, snippetRes] = await Promise.all([
    serverFetch(`/v1/experiments/${params.id}`),
    // Re-fetch profile for snippet only when draft — we get snippet from POST
    // but detail re-renders on refresh lose it, so we include it on the detail page via a
    // separate profile fetch. Simpler: just reconstruct from the API key on account.
    Promise.resolve(null),
  ])

  if (!expRes.ok) notFound()

  const experiment = await expRes.json() as ExperimentDetail

  // Fetch the snippet by reconstructing it from the account API key
  const accountRes = await serverFetch('/v1/account')
  const account = accountRes.ok ? await accountRes.json() as { apiKey: string } : null
  const apiKey = account?.apiKey ?? 'YOUR_API_KEY'
  const snippet = [
    `import { init, getVariant, track } from '${SDK_PACKAGE_NAME}'`,
    ``,
    `init({`,
    `  apiKey: '${apiKey}',`,
    `  experimentId: '${experiment.id}',`,
    `  baseUrl: '${API_BASE_URL}',`,
    `})`,
  ].join('\n')

  return (
    <div className="max-w-2xl">
      <Link
        href="/experiments"
        className="inline-block text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
      >
        ← Experiments
      </Link>

      <ExperimentDetailClient
        experiment={experiment}
        snippet={snippet}
        isActive={canWrite}
      />
    </div>
  )
}
