'use client'

import { useState } from 'react'

interface Routine {
  id: string
  name: string
  description: string | null
  cron_schedule: string | null
  agent_role: string | null
  trigger_instruction: string | null
  concurrency_policy: string | null
  status: string
  last_run_at: string | null
  created_at: string
}

interface Props {
  routines: Routine[]
}

const AGENT_ROLES = [
  { slug: 'researcher', name: 'Researcher' },
  { slug: 'persona-architect', name: 'Persona Architect' },
  { slug: 'journey-mapper', name: 'Journey Mapper' },
  { slug: 'diagnostic', name: 'Diagnostic' },
  { slug: 'synthesis', name: 'Synthesis' },
  { slug: 'delivery', name: 'Delivery' },
  { slug: 'growth-analyst', name: 'Growth Analyst' },
  { slug: 'prospector', name: 'Prospector' },
]

const STATUS_CHIP: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-gray-100 text-gray-500',
  archived: 'bg-red-100 text-red-600',
}

function describeCron(cron: string): string {
  if (!cron.trim()) return ''
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return cron

  const [minute, hour, dom, month, dow] = parts

  // Build time string
  let timeStr = ''
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour)) {
    const h = parseInt(hour, 10)
    const m = parseInt(minute, 10)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    const mStr = m.toString().padStart(2, '0')
    timeStr = `${h12}:${mStr} ${ampm}`
  } else {
    timeStr = `at ${hour}:${minute}`
  }

  // Ignore dom and month for now, focus on dow
  const DAY_NAMES: Record<string, string> = {
    '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
    '4': 'Thursday', '5': 'Friday', '6': 'Saturday', '7': 'Sunday',
  }
  const DAY_SHORT: Record<string, string> = {
    '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed',
    '4': 'Thu', '5': 'Fri', '6': 'Sat', '7': 'Sun',
  }

  if (dow === '*' && dom === '*' && month === '*') {
    return `Daily at ${timeStr}`
  }

  if (dow === '1-5') {
    return `Daily at ${timeStr}, Mon–Fri`
  }

  if (dow === '0-4' || dow === '1-5') {
    return `Weekdays at ${timeStr}`
  }

  if (dow === '6-7' || dow === '6,0' || dow === '0,6') {
    return `Weekends at ${timeStr}`
  }

  if (/^\d+$/.test(dow)) {
    return `Every ${DAY_NAMES[dow] ?? `day ${dow}`} at ${timeStr}`
  }

  if (/^\d+-\d+$/.test(dow)) {
    const [start, end] = dow.split('-')
    return `Daily at ${timeStr}, ${DAY_SHORT[start] ?? start}–${DAY_SHORT[end] ?? end}`
  }

  if (/^\d+(,\d+)+$/.test(dow)) {
    const days = dow.split(',').map((d) => DAY_SHORT[d] ?? d).join(', ')
    return `${days} at ${timeStr}`
  }

  return cron
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface FormData {
  name: string
  description: string
  cron_schedule: string
  agent_role: string
  trigger_instruction: string
  concurrency_policy: 'skip' | 'enqueue'
  status: 'active' | 'paused'
}

const EMPTY_FORM: FormData = {
  name: '',
  description: '',
  cron_schedule: '',
  agent_role: 'researcher',
  trigger_instruction: '',
  concurrency_policy: 'skip',
  status: 'active',
}

export default function RoutinesClient({ routines: initial }: Props) {
  const [routines, setRoutines] = useState<Routine[]>(initial)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function handleField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Optimistic UI — real API call is out of scope
    console.log('New routine:', form)
    const newRoutine: Routine = {
      id: `temp-${Date.now()}`,
      name: form.name,
      description: form.description || null,
      cron_schedule: form.cron_schedule || null,
      agent_role: form.agent_role,
      trigger_instruction: form.trigger_instruction,
      concurrency_policy: form.concurrency_policy,
      status: form.status,
      last_run_at: null,
      created_at: new Date().toISOString(),
    }
    setRoutines((prev) => [newRoutine, ...prev])
    setForm(EMPTY_FORM)
    setShowModal(false)
  }

  function toggleStatus(id: string) {
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r
      )
    )
  }

  function handleDelete(id: string) {
    setRoutines((prev) => prev.filter((r) => r.id !== id))
    setDeleteConfirm(null)
  }

  return (
    <>
      {/* Header */}
      <div className="p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-primary">Routines</h1>
            <p className="text-sm text-gray-500 mt-1">
              Scheduled heartbeats that run agents automatically.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            New Routine
          </button>
        </div>

        {/* Table */}
        {routines.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-gray-400">
              No routines yet. Create a routine to automate recurring agent work.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Name', 'Schedule', 'Agent', 'Last Run', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {routines.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.name}</p>
                      {r.description && (
                        <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">
                          {r.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {r.cron_schedule ? (
                        <>
                          <p>{describeCron(r.cron_schedule)}</p>
                          <p className="font-mono text-gray-400 mt-0.5">{r.cron_schedule}</p>
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {AGENT_ROLES.find((a) => a.slug === r.agent_role)?.name ?? r.agent_role ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{relativeTime(r.last_run_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_CHIP[r.status] ?? 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStatus(r.id)}
                          className="text-xs text-violet-600 hover:text-violet-800 transition-colors"
                          aria-label={r.status === 'active' ? 'Pause routine' : 'Resume routine'}
                        >
                          {r.status === 'active' ? 'Pause' : 'Resume'}
                        </button>
                        {deleteConfirm === r.id ? (
                          <span className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(r.id)}
                            className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                            aria-label="Delete routine"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="routine-modal-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 id="routine-modal-title" className="font-display font-bold text-lg text-gray-900">
                New Routine
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="r-name">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="r-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleField('name', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Weekly competitor scan"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="r-desc">
                  Description
                </label>
                <textarea
                  id="r-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => handleField('description', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  placeholder="Optional description…"
                />
              </div>

              {/* Cron schedule */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="r-cron">
                  Cron Schedule
                </label>
                <input
                  id="r-cron"
                  type="text"
                  value={form.cron_schedule}
                  onChange={(e) => handleField('cron_schedule', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="0 9 * * 1-5"
                />
                {form.cron_schedule && (
                  <p className="mt-1 text-xs text-violet-600">
                    {describeCron(form.cron_schedule) || 'Invalid cron expression'}
                  </p>
                )}
              </div>

              {/* Agent role */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="r-agent">
                  Agent Role
                </label>
                <select
                  id="r-agent"
                  value={form.agent_role}
                  onChange={(e) => handleField('agent_role', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                >
                  {AGENT_ROLES.map((a) => (
                    <option key={a.slug} value={a.slug}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Trigger instruction */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="r-trigger">
                  Trigger Instruction <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="r-trigger"
                  rows={3}
                  required
                  value={form.trigger_instruction}
                  onChange={(e) => handleField('trigger_instruction', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  placeholder="What should the agent do when triggered?"
                />
              </div>

              {/* Concurrency policy */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Concurrency Policy</p>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'skip', label: 'Skip if active', hint: 'Do not enqueue if this routine is already running.' },
                    { value: 'enqueue', label: 'Always enqueue', hint: 'Queue a new run even if one is already active.' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-start gap-2.5 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="concurrency_policy"
                        value={opt.value}
                        checked={form.concurrency_policy === opt.value}
                        onChange={() => handleField('concurrency_policy', opt.value as 'skip' | 'enqueue')}
                        className="mt-0.5 accent-violet-600"
                      />
                      <span>
                        <span className="text-sm text-gray-800 font-medium">{opt.label}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">{opt.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-700">Status</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {form.status === 'active' ? 'Routine will run on schedule.' : 'Routine is paused.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.status === 'active'}
                  onClick={() => handleField('status', form.status === 'active' ? 'paused' : 'active')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
                    form.status === 'active' ? 'bg-violet-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      form.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                >
                  Create Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
