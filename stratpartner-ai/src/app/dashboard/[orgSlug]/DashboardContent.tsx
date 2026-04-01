'use client'

import { useState } from 'react'
import Link from 'next/link'
import VoiceIntake from './VoiceIntake'

interface RecallMessage {
  id: string
  content: string
  session_id: string
  created_at: string
  suggested_skills: string[] | null
}

interface AuditRow {
  id: string
  event_type: string
  agent_role: string | null
  created_at: string
}

interface DashboardContentProps {
  orgId: string
  orgSlug: string
  orgName: string
  isFirstRun: boolean
  activeProjectsCount: number
  meetingsMonthCount: number
  latestRecall: RecallMessage | null
  auditRows: AuditRow[]
}

const EVENT_DOT: Record<string, string> = {
  task_created: 'bg-accent',
  deliverable_saved: 'bg-green-400',
  agent_run_started: 'bg-amber-400',
  session_created: 'bg-blue-400',
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function briefingSummary(content: string): string {
  // Return first 2 sentences (up to ~200 chars)
  const sentences = content.replace(/#+[^\n]*/g, '').replace(/\*\*/g, '').trim().split(/(?<=[.!?])\s+/)
  const first2 = sentences.slice(0, 2).join(' ')
  return first2.length > 220 ? first2.slice(0, 217) + '…' : first2
}

const SKILL_LABELS: Record<string, string> = {
  'competitive-audit': 'Competitive Audit',
  'persona-build': 'Persona Build',
  'meeting-brief': 'Meeting Brief',
  'battlecard-generator': 'Battlecard',
  'icp-identification': 'ICP',
  'campaign-brief-generator': 'Campaign Brief',
  'qbr-deck-builder': 'QBR Deck',
  'sales-call-prep': 'Sales Call Prep',
}

export default function DashboardContent({
  orgId,
  orgSlug,
  orgName,
  isFirstRun,
  activeProjectsCount,
  meetingsMonthCount,
  latestRecall,
  auditRows,
}: DashboardContentProps) {
  const [wizardOpen, setWizardOpen] = useState(isFirstRun)

  return (
    <div className="p-8 max-w-4xl">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary">{orgName}</h1>
          <p className="text-sm text-gray-400 mt-1">Your strategy workspace</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setWizardOpen(true)}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            New project
          </button>
          <Link
            href={`/chat/${orgSlug}`}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Open chat →
          </Link>
        </div>
      </div>

      {/* ── Stat cards (2) ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Projects</p>
            <span className="text-xl">📋</span>
          </div>
          <p className="font-display font-bold text-4xl text-primary">{activeProjectsCount}</p>
          <p className="text-xs text-gray-400 mt-1">not archived</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Meetings this month</p>
            <span className="text-xl">🎙</span>
          </div>
          <p className="font-display font-bold text-4xl text-primary">{meetingsMonthCount}</p>
          <p className="text-xs text-gray-400 mt-1">with StratPartner</p>
        </div>
      </div>

      {/* ── Latest from StratPartner ─────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3">
          Latest from StratPartner
        </h2>

        {latestRecall ? (
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white text-sm shrink-0">
                S
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">{relativeTime(latestRecall.created_at)}</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {briefingSummary(latestRecall.content)}
                </p>
              </div>
            </div>

            {latestRecall.suggested_skills && latestRecall.suggested_skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 mb-4">
                {latestRecall.suggested_skills.slice(0, 3).map((slug) => (
                  <Link
                    key={slug}
                    href={`/chat/${orgSlug}?session=${latestRecall.session_id}&skill=/${slug}`}
                    className="inline-flex items-center gap-1 rounded-full bg-white border border-violet-300 px-3 py-1 text-xs font-medium text-accent hover:bg-accent hover:text-white hover:border-accent transition-colors"
                  >
                    <span>⚡</span>
                    {SKILL_LABELS[slug] ?? slug}
                  </Link>
                ))}
              </div>
            )}

            <Link
              href={`/chat/${orgSlug}?session=${latestRecall.session_id}`}
              className="text-xs font-medium text-accent hover:underline"
            >
              View in chat →
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="text-2xl mb-2">🎙</p>
            <p className="text-sm font-medium text-gray-700 mb-1">No meetings yet</p>
            <p className="text-xs text-gray-400 mb-4">
              Invite StratPartner to your next meeting and get a full briefing when it ends.
            </p>
            <Link
              href={`/dashboard/${orgSlug}/meetings`}
              className="inline-flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-violet-600 transition-colors"
            >
              Connect your first meeting →
            </Link>
          </div>
        )}
      </div>

      {/* ── Recent Activity (5 items) ────────────────────────────────────── */}
      {auditRows.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3">
            Recent Activity
          </h2>
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-1">
            {auditRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    EVENT_DOT[row.event_type] ?? 'bg-gray-300'
                  }`}
                />
                <span className="flex-1 text-xs text-gray-700 truncate">
                  {row.event_type.replace(/_/g, ' ')}
                  {row.agent_role && (
                    <span className="text-gray-400"> · {row.agent_role}</span>
                  )}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {relativeTime(row.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <VoiceIntake
        orgId={orgId}
        orgSlug={orgSlug}
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  )
}
