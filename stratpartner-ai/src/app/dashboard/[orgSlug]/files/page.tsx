import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import FilesClient from './FilesClient'

interface PageProps {
  params: { orgSlug: string }
}

export default async function FilesPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, slug')
    .eq('slug', params.orgSlug)
    .single()

  if (!org) redirect('/')

  const [{ data: projects }, { data: files }, { data: deliverables }] = await Promise.all([
    supabase.from('projects').select('id, name').eq('org_id', org.id).neq('status', 'archived').order('created_at', { ascending: false }),
    supabase.from('files').select('id, name, filename, mime_type, created_at, project_id').eq('org_id', org.id).eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('deliverables').select('id, title, type, project_id, session_id, created_at').eq('org_id', org.id).order('created_at', { ascending: false }),
  ])

  return (
    <FilesClient
      orgSlug={org.slug}
      projects={projects ?? []}
      files={(files ?? []).map(f => ({ ...f, displayName: f.name ?? f.filename }))}
      deliverables={deliverables ?? []}
    />
  )
}
