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

  // Fetch unread inbox count.
  // Gracefully handles the case where read_at column doesn't exist yet.
  let inboxUnread = 0
  try {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org?.id ?? '')
      .eq('role', 'assistant')
      .not('channel', 'is', null)
      .in('channel', ['agent', 'recall', 'heartbeat'])
      .is('read_at', null)
    inboxUnread = count ?? 0
  } catch {
    // Table may not have read_at column yet — silently ignore
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
        isAdmin={isAdmin}
        inboxUnread={inboxUnread}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
