import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import DeliverableDetailClient from './DeliverableDetailClient'

interface PageProps {
  params: { orgSlug: string; projectId: string; delivId: string }
}

export default async function DeliverableDetailPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin()

  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('id, project_id, org_id, title, type, phase, content, version, task_id, session_id, created_at')
    .eq('id', params.delivId)
    .single()

  if (!deliverable) redirect(`/dashboard/${params.orgSlug}/projects/${params.projectId}/deliverables`)

  return (
    <DeliverableDetailClient
      deliverable={deliverable}
      orgSlug={params.orgSlug}
      projectId={params.projectId}
    />
  )
}
