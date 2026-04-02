'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Meeting {
  id: string
  title: string | null
  platform: string | null
  status: string
  started_at: string | null
  ended_at: string | null
  proactive_message_sent: boolean
  created_at: string
}

interface Project {
  id: string
  name: string
}

interface Props {
  orgId: string
  orgSlug: string
  initialMeetings: Meeting[]
  projects: Project[]
}

const PLATFORM_LABELS: Record<string, string> = {
  zoom: 'Zoom',
  meet: 'Google Meet',
  teams: 'Teams',
  unknown: 'Meeting',
}

const STATUS_BADGE: Record<string, string> = {
  pending:     'bg-gray-100 text-gray-500',
  joining:     'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-100 text-green-700',
  processing:  'bg-amber-100 text-amber-700',
  complete:    'bg-violet-100 text-violet-700',
  failed:      'bg-red-100 text-red-600',
}

const STATUS_LABEL: Record<string, string> = {
  pending:     'Scheduled',
  joining:     'Joining…',
  in_progress: 'Live',
  processing:  'Transcribing…',
  complete:    'Complete',
  failed:      'Failed',
}

const STATUS_DOT: Record<string, string> = {
  joining:     'bg-blue-500',
  in_progress: 'bg-green-500',
  processing:  'bg-amber-400',
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MeetingsClient({ orgId, orgSlug, initialMeetings, projects }: Props) {
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings)
  const [showModal, setShowModal] = useState(false)
  const [meetingUrl, setMeetingUrl] = useState('')
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Always poll — 5s when active meetings exist, 30s otherwise
  const hasActiveMeetings = meetings.some((m) => !['complete', 'failed'].includes(m.status))

  useEffect(() => {
    const interval = hasActiveMeetings ? 5000 : 30000

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/meetings?orgId=${orgId}`)
        if (res.ok) {
          const { meetings: updated } = await res.json()
          // Only replace if API returns results — prevents empty-array flash on transient error
          if (Array.isArray(updated) && updated.length > 0) {
            setMeetings(updated)
          }
        }
      } catch {
        // non-critical
      }
    }, interval)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [hasActiveMeetings, orgId])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/meetings/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, meetingUrl, title: title || undefined, projectId: projectId || undefined }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to join meeting')

      setMeetings((prev) => [
        {
          id: data.meetingId,
          title: title || 'Untitled Meeting',
          platform: detectPlatform(meetingUrl),
          status: 'pending',
          started_at: null,
          ended_at: null,
          proactive_message_sent: false,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])

      setShowModal(false)
      setMeetingUrl('')
      setTitle('')
      setProjectId('')
      setToast('StratPartner is joining your meeting')
      setTimeout(() => setToast(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join meeting')
    } finally {
      setSubmitting(false)
    }
  }

  function detectPlatform(url: string): string {
    if (url.includes('zoom.us')) return 'zoom'
    if (url.includes('meet.google.com')) return 'meet'
    if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) return 'teams'
    return 'unknown'
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-primary text-white text-sm px-4 py-3 shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Meetings</h1>
          <p className="mt-1 text-sm text-gray-500">
            StratPartner joins your meetings, captures transcripts, and sends you a briefing when it ends.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition-colors"
        >
          Join a Meeting
        </button>
      </div>

      {/* Meetings table */}
      {meetings.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-100 p-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-2xl">
            🎙
          </div>
          <p className="text-sm font-medium text-gray-700">No meetings yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Paste any Zoom, Google Meet, or Teams URL and StratPartner will join as a silent participant.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition-colors"
          >
            Join your first meeting
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Meeting</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Platform</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hidden md:table-cell">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {meetings.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => router.push(`/dashboard/${orgSlug}/meetings/${m.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{m.title ?? 'Untitled Meeting'}</p>
                    {m.proactive_message_sent && (
                      <p className="text-xs text-violet-600 mt-0.5">Briefing sent ✓</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500">
                    {PLATFORM_LABELS[m.platform ?? 'unknown'] ?? 'Meeting'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[m.status] ?? STATUS_BADGE.pending}`}>
                      {STATUS_DOT[m.status] && (
                        <span className={`inline-block h-1.5 w-1.5 rounded-full animate-pulse ${STATUS_DOT[m.status]}`} />
                      )}
                      {m.status === 'complete' && (
                        <svg className="h-3 w-3 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                    {formatDuration(m.started_at, m.ended_at)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                    {formatDate(m.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Join Meeting modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-lg text-primary">Join a Meeting</h2>
              <button
                onClick={() => { setShowModal(false); setError(null) }}
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Meeting URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://zoom.us/j/... or meet.google.com/..."
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Supports Zoom, Google Meet, and Microsoft Teams.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Q2 Strategy Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>

              {projects.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Link to project (optional)</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
              )}

              <div className="rounded-lg bg-violet-50 px-3 py-3 text-xs text-violet-700">
                StratPartner joins silently, captures the transcript with speaker labels, and sends you a briefing when the meeting ends. The transcript is also added to your Sources for future chat queries.
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(null) }}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Joining…' : 'Join Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
