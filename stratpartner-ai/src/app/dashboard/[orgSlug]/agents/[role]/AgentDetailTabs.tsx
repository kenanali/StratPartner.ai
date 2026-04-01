'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Run {
  id: string
  status: string
  tokens_used: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  tasks: { title: string } | null
  deliverables: { title: string } | null
}

interface Props {
  runs: Run[]
  roleName: string
  roleDescription: string
  skillCategories: string[]
  orgSlug: string
}

const STATUS_CHIP: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  running: 'bg-amber-100 text-amber-700',
  done: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
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

function formatDuration(started: string | null, completed: string | null): string {
  if (!started || !completed) return '—'
  const secs = Math.round((new Date(completed).getTime() - new Date(started).getTime()) / 1000)
  if (secs < 0) return '—'
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

function formatTokens(n: number | null): string {
  if (n == null) return '—'
  return n.toLocaleString()
}

type Tab = 'runs' | 'config'

export default function AgentDetailTabs({
  runs,
  roleName,
  roleDescription,
  skillCategories,
  orgSlug,
}: Props) {
  const [tab, setTab] = useState<Tab>('runs')

  return (
    <>
      {/* Back link + heading */}
      <div className="mb-6">
        <Link
          href={`/dashboard/${orgSlug}/agents`}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Agents
        </Link>
        <h1 className="font-display text-2xl font-bold text-primary mt-2">{roleName}</h1>
        <p className="text-sm text-gray-500 mt-1">{roleDescription}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6" role="tablist">
        {(['runs', 'config'] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Runs tab */}
      {tab === 'runs' && (
        <div>
          {runs.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No runs yet for this agent.
            </p>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Task
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Deliverable
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Tokens
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-800 max-w-[180px] truncate">
                        {run.tasks?.title ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                        {run.deliverables?.title ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_CHIP[run.status] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {formatTokens(run.tokens_used)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {formatDuration(run.started_at, run.completed_at)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {relativeTime(run.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Config tab */}
      {tab === 'config' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5 max-w-lg">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Model</p>
            <p className="font-mono text-sm text-gray-800">claude-sonnet-4-6</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Temperature
            </p>
            <p className="font-mono text-sm text-gray-800">0.3</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              System Prompt
            </p>
            <p className="text-sm text-gray-600">SOUL.md + role-specific skill instructions</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Assigned Skill Categories
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {skillCategories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
