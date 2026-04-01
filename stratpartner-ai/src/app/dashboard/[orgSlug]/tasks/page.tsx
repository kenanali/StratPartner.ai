import { getSupabaseAdmin } from '@/lib/supabase'
import TaskBoardClient from './TaskBoardClient'
import type { Task } from './TaskBoardClient'

interface PageProps {
  params: { orgSlug: string }
}

export default async function TasksPage({ params }: PageProps) {
  const { orgSlug } = params
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .single()

  if (!org) return null

  // Fetch tasks with joined project name
  const { data: rawTasks } = await supabase
    .from('tasks')
    .select('id, title, status, org_id, project_id, agent_role, skill_slug, created_at, projects(name)')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Fetch projects for filter dropdown
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('org_id', org.id)
    .order('name', { ascending: true })

  // Normalise: coerce join result to the shape TaskBoardClient expects
  const tasks: Task[] = (rawTasks ?? []).map((t) => {
    // Supabase returns the joined row as an object or null; guard both shapes
    const projectJoin = t.projects
    const projectObj: { name: string } | null = Array.isArray(projectJoin)
      ? (projectJoin[0] ?? null)
      : (projectJoin as { name: string } | null)

    return {
      id: t.id as string,
      title: t.title as string,
      status: (t.status as string) ?? 'pending',
      org_id: t.org_id as string,
      project_id: t.project_id as string | null,
      agent_role: (t.agent_role as string | null) ?? null,
      skill_slug: (t.skill_slug as string | null) ?? null,
      created_at: t.created_at as string,
      projects: projectObj,
    }
  })

  const projectOptions = (projects ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
  }))

  return (
    <TaskBoardClient
      tasks={tasks}
      projects={projectOptions}
      orgSlug={orgSlug}
    />
  )
}
