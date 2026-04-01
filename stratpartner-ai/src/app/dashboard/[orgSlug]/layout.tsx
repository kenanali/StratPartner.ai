import { getSupabaseAdmin } from '@/lib/supabase'
import OrgRail from '@/components/layout/OrgRail'
import Sidebar from '@/components/layout/Sidebar'

interface LayoutProps {
  children: React.ReactNode
  params: { orgSlug: string }
}

export default async function DashboardLayout({ children, params }: LayoutProps) {
  const supabase = getSupabaseAdmin()

  // Fetch all orgs for the OrgRail
  const { data: orgs } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .order('name', { ascending: true })

  // Fetch the current org by slug
  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('slug', params.orgSlug)
    .single()

  // Fetch active agent run counts grouped by agent_role.
  // The agent_runs table may not exist yet — default to {} on any error.
  const activeRunsByRole: Record<string, number> = {}
  try {
    const { data: runs, error } = await supabase
      .from('agent_runs')
      .select('agent_role')
      .eq('status', 'running')
      .eq('org_id', org?.id ?? '')

    if (!error && runs) {
      for (const row of runs) {
        const role = row.agent_role as string
        activeRunsByRole[role] = (activeRunsByRole[role] ?? 0) + 1
      }
    }
  } catch {
    // Table doesn't exist yet — silently ignore
  }

  // Admin check: server-side, using ADMIN_EMAIL env var
  const adminEmail = process.env.ADMIN_EMAIL
  const isAdmin = Boolean(adminEmail)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <OrgRail
        orgs={orgs ?? []}
        currentSlug={params.orgSlug}
      />
      <Sidebar
        orgSlug={params.orgSlug}
        orgName={org?.name ?? params.orgSlug}
        activeRunsByRole={activeRunsByRole}
        isAdmin={isAdmin}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
