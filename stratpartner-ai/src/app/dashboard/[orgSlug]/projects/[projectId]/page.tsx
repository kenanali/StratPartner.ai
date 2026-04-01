import { getSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import RunTaskButton from './RunTaskButton'

interface PageProps {
  params: { orgSlug: string; projectId: string }
}

export default async function ProjectPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, status, phase, description, memory, org_id')
    .eq('id', params.projectId)
    .single()

  if (!project) redirect(`/dashboard/${params.orgSlug}`)

  const [{ data: tasks }, { data: deliverables }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, type, status, created_at')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('deliverables')
      .select('id, title, type, created_at')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false }),
  ])

  const statusColor: Record<string, string> = {
    complete: 'bg-green-50 text-green-700',
    running: 'bg-yellow-50 text-yellow-700',
    pending: 'bg-gray-100 text-gray-500',
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/${params.orgSlug}`} className="text-sm text-indigo-600 hover:underline">
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-bold text-gray-900">{project.name}</h1>
            <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-0.5">{project.phase}</span>
          </div>
          <Link
            href={`/dashboard/${params.orgSlug}/projects/${project.id}/chat`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Open Chat
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8 grid gap-8 lg:grid-cols-2">
        {/* Tasks */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Tasks</h2>
          <div className="space-y-2">
            {tasks?.map((task) => (
              <div key={task.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400">{task.type}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs rounded-full px-2 py-0.5 ${statusColor[task.status] ?? statusColor.pending}`}>
                      {task.status}
                    </span>
                    {task.status === 'pending' && (
                      <RunTaskButton taskId={task.id} />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {(!tasks || tasks.length === 0) && (
              <p className="text-sm text-gray-400 py-2">No tasks yet. Tasks are created when you start a project chat.</p>
            )}
          </div>
        </div>

        {/* Deliverables */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Deliverables</h2>
          <div className="space-y-2">
            {deliverables?.map((d) => (
              <Link
                key={d.id}
                href={`/dashboard/${params.orgSlug}/projects/${project.id}/deliverables/${d.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                  <p className="text-xs text-gray-400">{d.type}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 ml-2">
                  {new Date(d.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
            {(!deliverables || deliverables.length === 0) && (
              <p className="text-sm text-gray-400 py-2">No deliverables yet. Use the chat to generate strategy outputs.</p>
            )}
          </div>
        </div>

        {/* Project memory */}
        {project.memory && (
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Project Context</h2>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{project.memory}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
