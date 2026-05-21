'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type FormData = {
  name: string
  hypothesis: string
  controlDescription: string
  variantDescription: string
  goal: string
}

type FieldConfig = {
  key: keyof FormData
  label: string
  required: boolean
  placeholder: string
  rows?: number
}

const FIELDS: FieldConfig[] = [
  {
    key: 'name',
    label: 'Experiment name',
    required: true,
    placeholder: 'e.g. Checkout button color',
    rows: 1,
  },
  {
    key: 'hypothesis',
    label: 'Hypothesis',
    required: false,
    placeholder: 'e.g. A green button will increase conversion because it signals action.',
    rows: 2,
  },
  {
    key: 'controlDescription',
    label: 'Control description',
    required: true,
    placeholder: 'Describe the original experience.',
    rows: 2,
  },
  {
    key: 'variantDescription',
    label: 'Variant description',
    required: true,
    placeholder: 'Describe the change you\'re testing.',
    rows: 2,
  },
  {
    key: 'goal',
    label: 'Conversion goal',
    required: true,
    placeholder: 'e.g. User clicks the checkout button.',
    rows: 2,
  },
]

export default function NewExperimentPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({
    name: '',
    hypothesis: '',
    controlDescription: '',
    variantDescription: '',
    goal: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = form.name.trim() && form.controlDescription.trim() && form.variantDescription.trim() && form.goal.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/v1/experiments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: form.name.trim(),
            hypothesis: form.hypothesis.trim() || undefined,
            controlDescription: form.controlDescription.trim(),
            variantDescription: form.variantDescription.trim(),
            goal: form.goal.trim(),
          }),
        },
      )

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? 'Failed to create experiment')
      }

      const { experiment } = await res.json() as { experiment: { id: string } }
      router.push(`/experiments/${experiment.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/experiments" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Experiments
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-3">New experiment</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {FIELDS.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {(field.rows ?? 1) === 1 ? (
              <input
                type="text"
                value={form[field.key]}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <textarea
                rows={field.rows}
                value={form[field.key]}
                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            )}
          </div>
        ))}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex items-center justify-between pt-2">
          <Link
            href="/experiments"
            className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!isValid || loading}
            className="bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? 'Saving…' : 'Save as draft'}
            {!loading && <span>→</span>}
          </button>
        </div>
      </form>
    </div>
  )
}
