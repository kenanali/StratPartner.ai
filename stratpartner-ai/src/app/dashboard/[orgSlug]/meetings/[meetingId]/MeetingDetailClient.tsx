'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Decision {
  text: string
  owner: string
  confidence: 'high' | 'medium' | 'low'
}

interface ActionItem {
  text: string
  owner: string
  due: string | null
  suggested_agent_role: string | null
}

interface TaskCreated {
  task_id: string
  title: string
}

interface MeetingFindings {
  summary: string
  decisions: Decision[]
  action_items: ActionItem[]
  new_context: string[]
  open_questions: string[]
}

interface Meeting {
  id: string
  org_id: string
  title: string | null
  platform: string | null
  status: string
  transcript_text: string | null
  findings: MeetingFindings | null
  tasks_created: TaskCreated[] | null
  session_id: string | null
  started_at: string | null
  ended_at: string | null
  proactive_message_sent: boolean
}

interface Props {
  meeting: Meeting
  orgSlug: string
}

const PLATFORM_LABELS: Record<string, string> = {
  zoom: 'Zoom',
  meet: 'Google Meet',
  teams: 'Teams',
  unknown: 'Meeting',
}

// Pipeline steps in order
const STEPS = [
  { key: 'pending',    label: 'Bot created',        sub: 'Waiting to join' },
  { key: 'joining',   label: 'Joining',             sub: 'Connecting to meeting' },
  { key: 'in_progress', label: 'Recording',         sub: 'Capturing transcript' },
  { key: 'processing', label: 'Transcribing',       sub: 'Processing audio' },
  { key: 'briefing',  label: 'Generating briefing', sub: 'Analyzing with AI' },
  { key: 'complete',  label: 'Complete',            sub: 'Briefing ready' },
]

// Map DB status → step index
function statusToStep(status: string): number {
  switch (status) {
    case 'pending':     return 0
    case 'joining':     return 1
    case 'in_progress': return 2
    case 'processing':  return 3  // could be transcribing or briefing — shown as step 3
    case 'complete':    return 5
    case 'failed':      return -1
    default:            return 0
  }
}

function formatDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) return '—'
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function TranscriptLine({ line }: { line: string }) {
  const colonIdx = line.indexOf(':')
  if (colonIdx > 0 && colonIdx < 40) {
    const speaker = line.slice(0, colonIdx)
    const text = line.slice(colonIdx + 1).trim()
    return (
      <p className="text-sm leading-relaxed mb-2">
        <span className="font-semibold text-accent">{speaker}:</span>{' '}
        <span className="text-gray-700">{text}</span>
      </p>
    )
  }
  return <p className="text-sm leading-relaxed text-gray-700 mb-2">{line}</p>
}

function MeetingProgress({ status }: { status: string }) {
  if (status === 'failed') {
    return (
      <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
        <span className="text-red-500 shrink-0">✕</span>
        <p className="text-sm text-red-700 font-medium">Bot encountered an error. The meeting could not be recorded.</p>
      </div>
    )
  }

  const currentStep = statusToStep(status)
  const isActive = status !== 'complete' && status !== 'failed'

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Meeting Progress</p>
        {isActive && (
          <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Live
          </span>
        )}
      </div>
      <div className="flex items-start gap-0">
        {STEPS.map((step, i) => {
          const done = i < currentStep
          const active = i === currentStep
          const future = i > currentStep
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className={`absolute top-3 left-1/2 w-full h-0.5 ${done || active ? 'bg-accent' : 'bg-gray-200'} transition-colors duration-500`} />
              )}
              {/* Dot */}
              <div className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                done
                  ? 'border-accent bg-accent'
                  : active
                    ? 'border-accent bg-white'
                    : 'border-gray-200 bg-white'
              }`}>
                {done ? (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : active ? (
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                )}
              </div>
              {/* Label */}
              <p className={`mt-2 text-center text-xs font-medium leading-tight ${
                done ? 'text-accent' : active ? 'text-gray-900' : future ? 'text-gray-400' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
              {active && (
                <p className="mt-0.5 text-center text-xs text-gray-400 leading-tight">{step.sub}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MeetingDetailClient({ meeting, orgSlug }: Props) {
  const [liveData, setLiveData] = useState<Meeting>(meeting)
  const [processing, setProcessing] = useState(false)
  const isActive = liveData.status !== 'complete' && liveData.status !== 'failed'

  const showProcessButton =
    ['pending', 'failed', 'in_progress'].includes(liveData.status) &&
    !liveData.proactive_message_sent

  async function handleProcessMeeting() {
    setProcessing(true)
    try {
      const res = await fetch(`/api/meetings/${liveData.id}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: liveData.org_id }),
      })
      if (res.ok) {
        setLiveData((prev) => ({ ...prev, status: 'processing' }))
      }
    } finally {
      setProcessing(false)
    }
  }

  // Poll API instead of full page reload
  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/meetings/${liveData.id}?orgId=${liveData.org_id}`)
      if (res.ok) {
        const { meeting: updated } = await res.json()
        setLiveData(updated)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [isActive, liveData.id, liveData.org_id])

  const findings = liveData.findings
  const transcriptLines = liveData.transcript_text?.split('\n').filter(Boolean) ?? []

  return (
    <>
      {/* Back + header */}
      <div className="mb-6">
        <Link
          href={`/dashboard/${orgSlug}/meetings`}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Meetings
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-primary">
              {liveData.title ?? 'Untitled Meeting'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {formatDate(liveData.started_at)} · {formatDuration(liveData.started_at, liveData.ended_at)} ·{' '}
              {PLATFORM_LABELS[liveData.platform ?? 'unknown'] ?? 'Meeting'}
            </p>
          </div>
          <div className="flex gap-2">
            {showProcessButton && (
              <button
                onClick={handleProcessMeeting}
                disabled={processing}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {processing ? 'Processing…' : 'Process Meeting'}
              </button>
            )}
            {liveData.session_id && (
              <Link
                href={`/chat/${orgSlug}?session=${liveData.session_id}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                View in Chat
              </Link>
            )}
            <Link
              href={`/dashboard/${orgSlug}/sources`}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              View in Sources
            </Link>
          </div>
        </div>
      </div>

      {/* Progress timeline */}
      <MeetingProgress status={liveData.status} />

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Left — Transcript */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Full Transcript</p>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {transcriptLines.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  {isActive
                    ? 'Transcript will appear here when the meeting ends.'
                    : 'No transcript available.'}
                </p>
              ) : (
                transcriptLines.map((line, i) => <TranscriptLine key={i} line={line} />)
              )}
            </div>
          </div>
        </div>

        {/* Right — Findings */}
        <div className="lg:col-span-2 space-y-4">
          {!findings ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <p className="text-sm text-gray-400">
                {isActive
                  ? 'Findings will appear here after the meeting ends.'
                  : 'No findings available.'}
              </p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="rounded-xl border-l-4 border-l-accent border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Summary</p>
                <p className="text-sm text-gray-700 leading-relaxed">{findings.summary}</p>
              </div>

              {/* Decisions */}
              {findings.decisions?.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Decisions made</p>
                  <ul className="space-y-2">
                    {findings.decisions.map((d, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                        <span>
                          {d.text}
                          {d.owner !== 'unclear' && (
                            <span className="ml-1.5 text-xs text-gray-400">({d.owner})</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action items */}
              {findings.action_items?.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Action items</p>
                  <ul className="space-y-3">
                    {findings.action_items.map((item, i) => {
                      const linkedTask = liveData.tasks_created?.find((t) => t.title === item.text)
                      return (
                        <li key={i} className="text-sm text-gray-700">
                          <div className="flex gap-2">
                            <span className="text-accent shrink-0 mt-0.5">→</span>
                            <div className="min-w-0">
                              <p>{item.text}</p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {item.owner !== 'unclear' && (
                                  <span className="text-xs text-gray-400">{item.owner}</span>
                                )}
                                {item.due && (
                                  <span className="text-xs text-gray-400">· due {item.due}</span>
                                )}
                                {item.suggested_agent_role && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                                    {item.suggested_agent_role}
                                  </span>
                                )}
                                {linkedTask && (
                                  <span className="text-xs text-green-600">Task created ✓</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Open questions */}
              {findings.open_questions?.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Open questions</p>
                  <ul className="space-y-2">
                    {findings.open_questions.map((q, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <span className="text-gray-400 shrink-0 mt-0.5">?</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* New context */}
              {findings.new_context?.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">New context learned</p>
                  <ul className="space-y-2">
                    {findings.new_context.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <span className="text-blue-400 shrink-0 mt-0.5">◆</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
