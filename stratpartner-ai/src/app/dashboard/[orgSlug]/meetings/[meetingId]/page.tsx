import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import MeetingDetailClient from './MeetingDetailClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: { orgSlug: string; meetingId: string }
}

export default async function MeetingDetailPage({ params }: Props) {
  const { orgSlug, meetingId } = params
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase.from('orgs').select('id').eq('slug', orgSlug).single()
  if (!org) redirect('/')

  const exists = await supabase.from('meetings').select('id').eq('id', meetingId).eq('org_id', org.id).single()
  if (!exists.data) redirect(`/dashboard/${orgSlug}/meetings`)

  return (
    <div>
      <MeetingDetailClient meetingId={meetingId} orgSlug={orgSlug} orgId={org.id} />
    </div>
  )
}
