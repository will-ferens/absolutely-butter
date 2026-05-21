import Link from 'next/link'

type Step = { label: string; done: boolean }

function CheckIcon({ done }: { done: boolean }) {
  return done ? (
    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <span className="w-5 h-5 rounded-full border-2 border-gray-300 inline-block" />
  )
}

export default function EmptyState({ steps }: { steps: Step[] }) {
  const defaultSteps: Step[] = steps.length > 0 ? steps : [
    { label: 'Create your first experiment', done: false },
    { label: 'Integrate the SDK', done: false },
    { label: 'Receive your first result', done: false },
  ]

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* Simple illustration */}
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-1">Run your first experiment</h2>
      <p className="text-sm text-gray-500 mb-8 max-w-xs">
        A/B test anything on your site with statistically honest results.
      </p>

      <ol className="text-left space-y-3 mb-8">
        {defaultSteps.map((step, i) => (
          <li key={i} className="flex items-center gap-3">
            <CheckIcon done={step.done} />
            <span className={`text-sm ${step.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      <Link
        href="/experiments/new"
        className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Create experiment
      </Link>
    </div>
  )
}
