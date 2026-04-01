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

  // ── Stat queries ─────────────────────────────────────────────────────────
  const [
    { count: activeProjectsCount },
    { count: meetingsMonthCount },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .neq('status', 'archived'),
    supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .eq('channel', 'recall')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  // ── Latest recall briefing (last 14 days) ─────────────────────────────────
  type RecallMessage = {
    id: string
    content: string
    session_id: string
    created_at: string
    suggested_skills: string[] | null
  }
  let latestRecall: RecallMessage | null = null
  try {
    const { data } = await supabase
      .from('messages')
      .select('id, content, session_id, created_at, suggested_skills')
      .eq('org_id', org.id)
      .eq('channel', 'recall')
      .eq('role', 'assistant')
      .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    latestRecall = data as RecallMessage | null
  } catch {
    // column may not exist yet
  }

  // ── Activity feed (5 items) ───────────────────────────────────────────────
  type AuditRow = { id: string; event_type: string; agent_role: string | null; created_at: string }
  let auditRows: AuditRow[] = []
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('id, event_type, agent_role, created_at')
      .eq('org_id', org.id)
      .order('created_at', { ascending: false })
      .limit(5)
    if (!error) auditRows = (data ?? []) as AuditRow[]
  } catch {
    // table may not exist yet
  }

  return (
    <DashboardContent
      orgId={org.id}
      orgSlug={org.slug}
      orgName={org.name}
      isFirstRun={isFirstRun}
      activeProjectsCount={activeProjectsCount ?? 0}
      meetingsMonthCount={meetingsMonthCount ?? 0}
      latestRecall={latestRecall}
      auditRows={auditRows}
    />
  )
}
