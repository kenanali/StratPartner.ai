'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface IntakeWizardProps {
  orgId: string
  orgSlug: string
  isOpen: boolean
  onClose?: () => void
  /** When true the modal cannot be dismissed — used for first-run flow */
  required?: boolean
}

interface FormData {
  projectName: string
  goal: string
  industry: string
  timeline: string
  stakeholders: string
  biggestChallenge: string
  deliverables: string[]
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

const STEP_LABELS = ['Name your project', 'Tell us more', 'Ready to go']

const INITIAL_FORM: FormData = {
  projectName: '',
  goal: '',
  industry: '',
  timeline: '',
  stakeholders: '',
  biggestChallenge: '',
  deliverables: [],
}

export default function IntakeWizard({
  orgId,
  orgSlug,
  isOpen,
  onClose,
  required = false,
}: IntakeWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ projectId: string; taskCount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setForm(INITIAL_FORM)
      setLoading(false)
      setResult(null)
      setError(null)
    }
  }, [isOpen])

  // Trap body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  function handleBackdropClick() {
    if (!required && onClose) onClose()
  }

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
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

  function canAdvanceStep1() {
    return form.projectName.trim().length > 0 && form.goal.trim().length > 0
  }

  function canAdvanceStep2() {
    return form.biggestChallenge.trim().length > 0
  }

  async function handleSubmit() {
    setStep(3)
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          projectName: form.projectName,
          goal: form.goal,
          industry: form.industry,
          timeline: form.timeline,
          stakeholders: form.stakeholders,
          biggestChallenge: form.biggestChallenge,
          deliverables: form.deliverables,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      setResult({ projectId: data.projectId, taskCount: data.taskCount })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleStartWorking() {
    if (result) {
      router.push(`/dashboard/${orgSlug}/projects/${result.projectId}`)
    }
  }

  const progressPercent = ((step - 1) / (STEP_LABELS.length - 1)) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="intake-modal-title"
        className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Progress bar — 1px accent fill */}
        <div className="h-0.5 w-full bg-gray-100">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Header */}
        <div className="bg-primary px-6 py-5 flex items-center justify-between">
          <div>
            <h2
              id="intake-modal-title"
              className="font-display font-bold text-lg text-white leading-tight"
            >
              {STEP_LABELS[step - 1]}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 font-sans">
              Step {step} of {STEP_LABELS.length}
            </p>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2" aria-hidden="true">
            {STEP_LABELS.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  i + 1 === step
                    ? 'bg-accent scale-125'
                    : i + 1 < step
                    ? 'bg-accent opacity-50'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Close button — only shown when not required */}
          {!required && onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="ml-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d="M1 1l16 16M17 1L1 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-6 font-sans">
          {/* ── Step 1 ───────────────────────────────────────────────────── */}
          {step === 1 && (
            <div
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
              key="step-1"
            >
              <div>
                <label
                  htmlFor="intake-project-name"
                  className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
                >
                  Project name <span className="text-danger">*</span>
                </label>
                <input
                  id="intake-project-name"
                  type="text"
                  autoFocus
                  value={form.projectName}
                  onChange={(e) => updateField('projectName', e.target.value)}
                  placeholder="e.g. Q3 CX Transformation"
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-primary placeholder:text-gray-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="intake-goal"
                  className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
                >
                  One-line goal <span className="text-danger">*</span>
                </label>
                <textarea
                  id="intake-goal"
                  rows={2}
                  value={form.goal}
                  onChange={(e) => updateField('goal', e.target.value)}
                  placeholder="What are you trying to achieve?"
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-primary placeholder:text-gray-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors resize-none"
                />
              </div>

              <div>
                <label
                  htmlFor="intake-industry"
                  className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
                >
                  Industry / context
                </label>
                <input
                  id="intake-industry"
                  type="text"
                  value={form.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                  placeholder="e.g. Fintech SaaS, Retail CX"
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-primary placeholder:text-gray-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
                />
              </div>
            </div>
          )}

          {/* ── Step 2 ───────────────────────────────────────────────────── */}
          {step === 2 && (
            <div
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
              key="step-2"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="intake-timeline"
                    className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
                  >
                    Timeline
                  </label>
                  <input
                    id="intake-timeline"
                    type="text"
                    value={form.timeline}
                    onChange={(e) => updateField('timeline', e.target.value)}
                    placeholder="e.g. Q2 2025, 3 months"
                    className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-primary placeholder:text-gray-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="intake-stakeholders"
                    className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
                  >
                    Key stakeholders
                  </label>
                  <input
                    id="intake-stakeholders"
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
                  htmlFor="intake-challenge"
                  className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"
                >
                  Biggest challenge <span className="text-danger">*</span>
                </label>
                <textarea
                  id="intake-challenge"
                  rows={3}
                  value={form.biggestChallenge}
                  onChange={(e) => updateField('biggestChallenge', e.target.value)}
                  placeholder="What's the main obstacle or question you need to resolve?"
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
                      <label
                        key={item}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
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
            </div>
          )}

          {/* ── Step 3 ───────────────────────────────────────────────────── */}
          {step === 3 && (
            <div
              className="py-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300"
              key="step-3"
            >
              {loading && !result && !error && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <svg
                      className="animate-spin h-10 w-10 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </div>
                  <p className="font-display font-semibold text-lg text-primary">
                    Setting up your project...
                  </p>
                  <p className="text-sm text-gray-400">
                    StratPartner is generating your research tasks.
                  </p>
                </div>
              )}

              {!loading && result && (
                <div className="space-y-5">
                  <div className="flex justify-center">
                    <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center">
                      <svg
                        className="h-7 w-7 text-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="font-display font-bold text-xl text-primary">
                      Your project is ready
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {result.taskCount} research{' '}
                      {result.taskCount === 1 ? 'task' : 'tasks'} created
                    </p>
                  </div>
                  <button
                    onClick={handleStartWorking}
                    className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors"
                  >
                    Start working
                  </button>
                </div>
              )}

              {!loading && error && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center">
                      <svg
                        className="h-7 w-7 text-danger"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="font-display font-semibold text-lg text-primary">
                      Something went wrong
                    </p>
                    <p className="text-sm text-gray-400 mt-1">{error}</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setStep(2)}
                      className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Go back
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav (not shown on step 3) */}
        {step < 3 && (
          <div className="px-6 pb-6 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="text-sm text-gray-400 hover:text-primary transition-colors"
              >
                Back
              </button>
            ) : (
              <span />
            )}

            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!canAdvanceStep1()}
                className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              >
                Continue
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleSubmit}
                disabled={!canAdvanceStep2()}
                className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              >
                Create project
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
