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

export default function MeetingDetailClient({ meeting, orgSlug }: Props) {
  const [liveData] = useState<Meeting>(meeting)
  const isActive = liveData.status === 'in_progress' || liveData.status === 'processing' || liveData.status === 'joining'

  // Poll by refreshing the page every 15s while meeting is active
  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => {
      window.location.reload()
    }, 15000)
    return () => clearInterval(interval)
  }, [isActive])

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

      {/* Live banner */}
      {isActive && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <p className="text-sm text-amber-800">
            {liveData.status === 'in_progress'
              ? 'StratPartner is in this meeting — transcript will appear when it ends.'
              : 'StratPartner is analyzing the transcript and preparing your briefing…'}
          </p>
        </div>
      )}

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
