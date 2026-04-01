import { getSupabaseAdmin } from '@/lib/supabase'
import ProjectsClient from './ProjectsClient'

interface PageProps {
  params: { orgSlug: string }
  searchParams: { new?: string }
}

type Phase = 'discovery' | 'activation' | 'delivery' | string
type Status = 'active' | 'paused' | 'archived' | string

interface ProjectRow {
  id: string
  name: string
  description: string | null
  phase: Phase
  status: Status
  created_at: string
  org_id: string
  task_count: number
  deliverable_count: number
}

export default async function ProjectsPage({ params, searchParams }: PageProps) {
  const { orgSlug } = params
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .single()

  if (!org) return null

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, description, phase, status, created_at, org_id')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })

  const projectList = projects ?? []
  const projectIds = projectList.map((p) => p.id)

  const [taskCountsResult, deliverableCountsResult] = await Promise.all(
    projectIds.length > 0
      ? [
          supabase.from('tasks').select('project_id').in('project_id', projectIds),
          supabase.from('deliverables').select('project_id').in('project_id', projectIds),
        ]
      : [
          Promise.resolve({ data: [] as { project_id: string }[] }),
          Promise.resolve({ data: [] as { project_id: string }[] }),
        ]
  )

  const taskCountMap: Record<string, number> = {}
  for (const row of taskCountsResult.data ?? []) {
    taskCountMap[row.project_id] = (taskCountMap[row.project_id] ?? 0) + 1
  }

  const deliverableCountMap: Record<string, number> = {}
  for (const row of deliverableCountsResult.data ?? []) {
    deliverableCountMap[row.project_id] = (deliverableCountMap[row.project_id] ?? 0) + 1
  }

  const enriched: ProjectRow[] = projectList.map((p) => ({
    ...p,
    task_count: taskCountMap[p.id] ?? 0,
    deliverable_count: deliverableCountMap[p.id] ?? 0,
  }))

  return (
    <ProjectsClient
      orgId={org.id}
      orgSlug={orgSlug}
      projects={enriched}
      openNew={searchParams.new === '1'}
    />
  )
}
