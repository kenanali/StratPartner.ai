import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import MeetingDetailClient from './MeetingDetailClient'

interface Props {
  params: { orgSlug: string; meetingId: string }
}

export default async function MeetingDetailPage({ params }: Props) {
  const { orgSlug, meetingId } = params
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase.from('orgs').select('id').eq('slug', orgSlug).single()
  if (!org) redirect('/')

  const { data: meeting } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .eq('org_id', org.id)
    .single()

  if (!meeting) redirect(`/dashboard/${orgSlug}/meetings`)

  return (
    <div className="p-8">
      <MeetingDetailClient meeting={meeting} orgSlug={orgSlug} />
    </div>
  )
}
