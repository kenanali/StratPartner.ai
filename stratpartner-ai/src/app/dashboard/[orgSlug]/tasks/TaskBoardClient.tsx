'use client'

import { useState, useMemo } from 'react'

interface TaskProject {
  name: string
}

export interface Task {
  id: string
  title: string
  status: string
  org_id: string
  project_id: string | null
  agent_role: string | null
  skill_slug: string | null
  created_at: string
  projects: TaskProject | null
}

interface ProjectOption {
  id: string
  name: string
}

interface Props {
  tasks: Task[]
  projects: ProjectOption[]
  orgSlug: string
}

type ViewMode = 'list' | 'kanban'

const KANBAN_COLUMNS = [
  { key: 'pending', label: 'Pending' },
  { key: 'running', label: 'Running' },
  { key: 'review', label: 'In Review' },
  { key: 'done', label: 'Done' },
]

function statusChipClass(status: string): string {
  switch (status?.toLowerCase()) {
    case 'done':
    case 'complete':
      return 'bg-green-50 text-green-700'
    case 'running':
      return 'bg-amber-50 text-amber-700'
    case 'failed':
      return 'bg-red-50 text-red-600'
    case 'pending':
    default:
      return 'bg-gray-100 text-gray-500'
  }
}

function isRunning(status: string): boolean {
  return status?.toLowerCase() === 'running'
}

function normalizeStatus(status: string): string {
  const s = status?.toLowerCase()
  if (s === 'complete') return 'done'
  return s ?? 'pending'
}

function AgentRoleBadge({ role }: { role: string | null }) {
  if (!role) return null
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
      {role}
    </span>
  )
}

function SkillBadge({ skill }: { skill: string | null }) {
  if (!skill) return null
  return (
    <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
      &#9889;{skill}
    </span>
  )
}

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusChipClass(status)}`}
    >
      {isRunning(status) && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
          aria-hidden="true"
        />
      )}
      {status}
    </span>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function TaskBoardClient({ tasks, projects }: Props) {
  const [view, setView] = useState<ViewMode>('list')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterProject, setFilterProject] = useState('')

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const statusMatch =
        !filterStatus || normalizeStatus(t.status) === filterStatus || t.status?.toLowerCase() === filterStatus
      const projectMatch =
        !filterProject || t.project_id === filterProject
      return statusMatch && projectMatch
    })
  }, [tasks, filterStatus, filterProject])

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-primary">Tasks</h1>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* View toggle */}
        <div
          className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'list'
                ? 'bg-accent text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            aria-pressed={view === 'list'}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 ${
              view === 'kanban'
                ? 'bg-accent text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            aria-pressed={view === 'kanban'}
          >
            Kanban
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <label htmlFor="filter-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="done">Done</option>
            <option value="failed">Failed</option>
          </select>

          <label htmlFor="filter-project" className="sr-only">
            Filter by project
          </label>
          <select
            id="filter-project"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List view */}
      {view === 'list' && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-400">
                No tasks match your filters.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    Agent Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Skill
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    Project
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                      {task.title}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <AgentRoleBadge role={task.agent_role} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <SkillBadge skill={task.skill_slug} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {task.projects?.name ?? (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={task.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden xl:table-cell">
                      {formatDate(task.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = filtered.filter(
              (t) =>
                normalizeStatus(t.status) === col.key ||
                t.status?.toLowerCase() === col.key
            )
            return (
              <div key={col.key} className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {col.label}
                  </h2>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 font-medium">
                    {colTasks.length}
                  </span>
                </div>
                <div className="min-h-32 space-y-2">
                  {colTasks.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-200 h-16 flex items-center justify-center">
                      <span className="text-xs text-gray-300">Empty</span>
                    </div>
                  )}
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm font-medium text-gray-900 leading-snug mb-2">
                        {task.title}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-1">
                        <AgentRoleBadge role={task.agent_role} />
                        <SkillBadge skill={task.skill_slug} />
                      </div>
                      {task.projects?.name && (
                        <p className="text-xs text-gray-400 mt-1.5 truncate">
                          {task.projects.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
