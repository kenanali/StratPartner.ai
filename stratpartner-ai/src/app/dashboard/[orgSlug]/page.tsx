import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import DashboardContent from './DashboardContent'

interface PageProps {
  params: { orgSlug: string }
}

export default async function DashboardPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('slug', params.orgSlug)
    .single()

  if (!org) redirect('/')

  // ── First-run detection ──────────────────────────────────────────────────
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.id)

  const isFirstRun = (projectCount ?? 0) === 0

  // ── Stat card queries ────────────────────────────────────────────────────

  const [
    { count: activeProjectsCount },
    { count: tasksRunningCount },
    { count: deliverablesMonthCount },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .neq('status', 'archived'),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .in('status', ['pending', 'running']),
    supabase
      .from('deliverables')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  let agentRunsToday = 0
  try {
    const { count, error } = await supabase
      .from('agent_runs')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    if (!error) agentRunsToday = count ?? 0
  } catch {
    // table may not exist yet
  }

  // ── Feed queries ─────────────────────────────────────────────────────────

  type AuditRow = { id: string; event_type: string; agent_role: string | null; created_at: string }
  let auditRows: AuditRow[] = []
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('id, event_type, agent_role, created_at')
      .eq('org_id', org.id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (!error) auditRows = (data ?? []) as AuditRow[]
  } catch {
    // table may not exist yet
  }

  const { data: recentTasksData } = await supabase
    .from('tasks')
    .select('id, title, status, created_at')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const statCards = [
    {
      label: 'Active Projects',
      value: activeProjectsCount ?? 0,
      sublabel: 'not archived',
      icon: '📋',
    },
    {
      label: 'Tasks Running',
      value: tasksRunningCount ?? 0,
      sublabel: 'pending or running',
      icon: '⚡',
    },
    {
      label: 'Deliverables / Month',
      value: deliverablesMonthCount ?? 0,
      sublabel: 'last 30 days',
      icon: '📄',
    },
    {
      label: 'Agent Runs Today',
      value: agentRunsToday,
      sublabel: 'last 24 hours',
      icon: '🤖',
    },
  ]

  return (
    <DashboardContent
      orgId={org.id}
      orgSlug={org.slug}
      orgName={org.name}
      isFirstRun={isFirstRun}
      statCards={statCards}
      auditRows={auditRows}
      recentTasks={recentTasksData ?? []}
    />
  )
}
