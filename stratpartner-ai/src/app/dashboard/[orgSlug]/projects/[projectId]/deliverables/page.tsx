import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import DeliverablesClient from './DeliverablesClient'

interface PageProps {
  params: { orgSlug: string; projectId: string }
}

export default async function DeliverablesPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin()

  const [{ data: org }, { data: project }] = await Promise.all([
    supabase.from('orgs').select('id, slug, name').eq('slug', params.orgSlug).single(),
    supabase.from('projects').select('id, name, phase').eq('id', params.projectId).single(),
  ])

  if (!org || !project) redirect('/')

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('id, title, type, phase, version, content, created_at')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })

  return (
    <DeliverablesClient
      orgSlug={params.orgSlug}
      project={project}
      deliverables={deliverables ?? []}
    />
  )
}
