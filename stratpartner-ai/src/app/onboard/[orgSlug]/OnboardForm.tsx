'use client'

import { useState } from 'react'

interface OnboardFormProps {
  projectId: string
  token: string
}

const DELIVERABLE_OPTIONS = [
  'Customer Journey Map',
  'Brand Building Blocks',
  'Customer Personas',
  'Competitive Landscape',
  'Prioritisation Roadmap',
  'Business Case',
  'CX Vision',
]

interface FormState {
  timeline: string
  stakeholders: string
  biggestChallenge: string
  deliverables: string[]
}

export default function OnboardForm({ projectId, token }: OnboardFormProps) {
  const [form, setForm] = useState<FormState>({
    timeline: '',
    stakeholders: '',
    biggestChallenge: '',
    deliverables: [],
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleDeliverable(item: string) {
    setForm((prev) => ({
      ...prev,
      deliverables: prev.deliverables.includes(item)
        ? prev.deliverables.filter((d) => d !== item)
        : [...prev.deliverables, item],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.biggestChallenge.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/intake/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          token,
          responses: form,
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? 'Something went wrong.')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center space-y-4 animate-in fade-in duration-300">
        <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <svg
            className="h-7 w-7 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display font-bold text-xl text-primary">
          Thank you for your input!
        </h2>
        <p className="text-sm text-gray-400">
          Your responses have been added to the project. The team will be in touch.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-primary leading-tight">
          Help shape this engagement
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Your perspective matters. Fill in what you know — everything is optional except
          where marked.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="ob-timeline"
              className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
            >
              Timeline
            </label>
            <input
              id="ob-timeline"
              type="text"
              value={form.timeline}
              onChange={(e) => updateField('timeline', e.target.value)}
              placeholder="e.g. Q2 2025, 3 months"
              className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-primary placeholder:text-gray-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="ob-stakeholders"
              className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
            >
              Key stakeholders
            </label>
            <input
              id="ob-stakeholders"
              type="text"
              value={form.stakeholders}
              onChange={(e) => updateField('stakeholders', e.target.value)}
              placeholder="Names or roles"
              className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-primary placeholder:text-gray-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="ob-challenge"
            className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
          >
            Biggest challenge <span className="text-danger">*</span>
          </label>
          <textarea
            id="ob-challenge"
            rows={4}
            required
            value={form.biggestChallenge}
            onChange={(e) => updateField('biggestChallenge', e.target.value)}
            placeholder="From your perspective, what is the most important problem to solve?"
            className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-primary placeholder:text-gray-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors resize-none"
          />
        </div>

        <div>
          <p className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Deliverables needed
          </p>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {DELIVERABLE_OPTIONS.map((item) => {
              const checked = form.deliverables.includes(item)
              return (
                <label key={item} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDeliverable(item)}
                    className="h-4 w-4 rounded border-gray-200 text-accent focus:ring-accent/30 checked:bg-accent checked:border-accent cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-primary transition-colors leading-tight">
                    {item}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {error && (
          <p className="text-sm text-danger bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !form.biggestChallenge.trim()}
          className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
        >
          {loading ? 'Submitting...' : 'Submit responses'}
        </button>
      </form>
    </div>
  )
}
