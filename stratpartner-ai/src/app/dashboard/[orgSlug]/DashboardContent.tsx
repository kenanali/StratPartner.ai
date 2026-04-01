'use client'

import { useState } from 'react'
import IntakeWizard from '@/components/projects/IntakeWizard'

interface StatCard {
  label: string
  value: number
  sublabel: string
  icon: string
}

interface AuditRow {
  id: string
  event_type: string
  agent_role: string | null
  created_at: string
}

interface TaskRow {
  id: string
  title: string
  status: string
  created_at: string
}

interface DashboardContentProps {
  orgId: string
  orgSlug: string
  orgName: string
  isFirstRun: boolean
  statCards: StatCard[]
  auditRows: AuditRow[]
  recentTasks: TaskRow[]
}

const EVENT_DOT: Record<string, string> = {
  task_created: 'bg-accent',
  deliverable_saved: 'bg-success',
  agent_run_started: 'bg-warning',
  session_created: 'bg-blue-400',
}

const TASK_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-500',
  running: 'bg-amber-50 text-warning',
  done: 'bg-green-50 text-success',
  failed: 'bg-red-50 text-danger',
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

export default function DashboardContent({
  orgId,
  orgSlug,
  orgName,
  isFirstRun,
  statCards,
  auditRows,
  recentTasks,
}: DashboardContentProps) {
  const [wizardOpen, setWizardOpen] = useState(isFirstRun)

  return (
    <div className="p-8">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary">{orgName}</h1>
          <p className="text-sm text-gray-400 mt-1">Strategy engagement dashboard</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setWizardOpen(true)}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            New project
          </button>

          <a
            href={`/chat/${orgSlug}`}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <span>Open chat</span>
            <span className="text-gray-400">→</span>
          </a>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {card.label}
              </p>
              <div className="h-8 w-8 rounded-xl bg-gray-50 flex items-center justify-center text-base">
                {card.icon}
              </div>
            </div>
            <p className="font-display font-bold text-4xl text-primary">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sublabel}</p>
          </div>
        ))}
      </div>

      {/* ── Two-column feed ─────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Activity — 60% */}
        <div className="lg:col-span-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3">
            Recent Activity
          </h2>
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-1">
            {auditRows.length === 0 ? (
              <p className="py-6 text-sm text-gray-400">
                No activity yet. Activity appears as agents run tasks.
              </p>
            ) : (
              auditRows.map((row) => (
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
              ))
            )}
          </div>
        </div>

        {/* Recent Tasks — 40% */}
        <div className="lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3">
            Recent Tasks
          </h2>
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-1">
            {recentTasks.length === 0 ? (
              <p className="py-6 text-sm text-gray-400">No tasks yet.</p>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
                >
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      TASK_STATUS_COLOR[task.status] ?? 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {task.status}
                  </span>
                  <span className="flex-1 text-xs text-gray-700 truncate">{task.title}</span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* IntakeWizard — auto-opens on first run, or triggered by "New project" */}
      <IntakeWizard
        orgId={orgId}
        orgSlug={orgSlug}
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        required={isFirstRun && statCards[0]?.value === 0}
      />
    </div>
  )
}
