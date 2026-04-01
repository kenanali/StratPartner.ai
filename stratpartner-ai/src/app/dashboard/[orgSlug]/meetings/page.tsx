import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import MeetingsClient from './MeetingsClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: { orgSlug: string }
}

export default async function MeetingsPage({ params }: Props) {
  const { orgSlug } = params
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .single()

  if (!org) redirect('/')

  const { data: meetings } = await supabase
    .from('meetings')
    .select('id, title, platform, status, started_at, ended_at, proactive_message_sent, created_at')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('org_id', org.id)
    .order('name')

  return (
    <div className="p-8">
      <MeetingsClient
        orgId={org.id}
        orgSlug={orgSlug}
        initialMeetings={meetings ?? []}
        projects={projects ?? []}
      />
    </div>
  )
}
