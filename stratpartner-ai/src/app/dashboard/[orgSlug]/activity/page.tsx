import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: { orgSlug: string }
  searchParams: { page?: string; type?: string }
}

interface AuditRow {
  id: string
  event_type: string
  agent_role: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const EVENT_CHIP: Record<string, string> = {
  task_created: 'bg-indigo-100 text-indigo-700',
  agent_run_started: 'bg-amber-100 text-amber-700',
  agent_run_completed: 'bg-amber-100 text-amber-700',
  deliverable_saved: 'bg-green-100 text-green-700',
  session_created: 'bg-blue-100 text-blue-700',
  memory_updated: 'bg-blue-100 text-blue-600',
  file_uploaded: 'bg-gray-100 text-gray-600',
  routine_triggered: 'bg-amber-100 text-amber-700',
}

const EVENT_DESCRIPTION: Record<string, string> = {
  task_created: 'Task created',
  agent_run_started: 'Agent run started',
  agent_run_completed: 'Agent run completed',
  deliverable_saved: 'Deliverable saved',
  session_created: 'Session created',
  memory_updated: 'Memory updated',
  file_uploaded: 'File uploaded',
  routine_triggered: 'Routine triggered',
}

const PAGE_SIZE = 20

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

export default async function ActivityPage({ params, searchParams }: PageProps) {
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('slug', params.orgSlug)
    .single()

  if (!org) redirect('/')

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const activeType = searchParams.type ?? ''
  const offset = (page - 1) * PAGE_SIZE

  // Fetch all event type counts (last 50 for filter chips)
  let allRows: AuditRow[] = []
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('id, event_type, agent_role, metadata, created_at')
      .eq('org_id', org.id)
      .order('created_at', { ascending: false })
      .limit(200)
    if (!error) allRows = (data ?? []) as AuditRow[]
  } catch {
    // table may not exist yet
  }

  // Count per event type from the fetched rows
  const typeCounts: Record<string, number> = {}
  for (const row of allRows) {
    typeCounts[row.event_type] = (typeCounts[row.event_type] ?? 0) + 1
  }

  // Apply type filter + pagination over allRows (client-side since we fetched 200)
  const filtered = activeType
    ? allRows.filter((r) => r.event_type === activeType)
    : allRows

  const totalFiltered = filtered.length
  const pageRows = filtered.slice(offset, offset + PAGE_SIZE)
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE)

  const eventTypes = Object.keys(typeCounts).sort()

  function buildPageUrl(p: number) {
    const sp = new URLSearchParams()
    sp.set('page', String(p))
    if (activeType) sp.set('type', activeType)
    return `/dashboard/${params.orgSlug}/activity?${sp.toString()}`
  }

  function buildTypeUrl(t: string) {
    const sp = new URLSearchParams()
    sp.set('page', '1')
    if (t) sp.set('type', t)
    return `/dashboard/${params.orgSlug}/activity?${sp.toString()}`
  }

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold text-primary mb-1">Activity</h1>
      <p className="text-sm text-gray-500 mb-6">
        All agent and system events across your engagement.
      </p>

      {/* Filter chips */}
      {eventTypes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by event type">
          <Link
            href={buildTypeUrl('')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !activeType
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
            <span className="ml-1.5 opacity-60">{allRows.length}</span>
          </Link>
          {eventTypes.map((t) => (
            <Link
              key={t}
              href={buildTypeUrl(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeType === t
                  ? 'bg-gray-800 text-white'
                  : `${EVENT_CHIP[t] ?? 'bg-gray-100 text-gray-600'} hover:opacity-80`
              }`}
            >
              {t.replace(/_/g, ' ')}
              <span className="ml-1.5 opacity-60">{typeCounts[t]}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Feed */}
      {pageRows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-gray-400">
            {activeType
              ? `No "${activeType.replace(/_/g, ' ')}" events found.`
              : 'No activity yet. Activity appears as agents run tasks and deliverables are saved.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-50">
          {pageRows.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  EVENT_CHIP[row.event_type] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {row.event_type.replace(/_/g, ' ')}
              </span>

              {row.agent_role && (
                <span className="text-xs text-gray-500 shrink-0">{row.agent_role}</span>
              )}

              <span className="text-xs text-gray-500 truncate min-w-0 flex-1">
                {EVENT_DESCRIPTION[row.event_type] ?? row.event_type.replace(/_/g, ' ')}
              </span>

              <span className="ml-auto text-xs text-gray-400 shrink-0 tabular-nums">
                {relativeTime(row.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, totalFiltered)} of {totalFiltered} events
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={buildPageUrl(page - 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ← Previous
              </Link>
            ) : (
              <span className="rounded-lg border border-gray-100 px-3 py-1.5 text-xs font-medium text-gray-300 cursor-default">
                ← Previous
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={buildPageUrl(page + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Next →
              </Link>
            ) : (
              <span className="rounded-lg border border-gray-100 px-3 py-1.5 text-xs font-medium text-gray-300 cursor-default">
                Next →
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
