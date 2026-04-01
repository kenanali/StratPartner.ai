import { getSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import NewProjectForm from './NewProjectForm'

interface PageProps {
  params: { orgSlug: string }
}

export default async function DashboardPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('slug', params.orgSlug)
    .single()

  if (!org) redirect('/')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, phase, description, created_at')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })

  const { data: memRows } = await supabase
    .from('memory')
    .select('content')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const memorySnippet = memRows?.[0]?.content?.slice(0, 300) ?? null

  const { data: recentMessages } = await supabase
    .from('messages')
    .select('id, role, content, created_at, skill_used')
    .eq('org_id', org.id)
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{org.name}</h1>
            <p className="text-xs text-gray-400">StratPartner.ai workspace</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/${org.slug}/sources`}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Sources
            </Link>
            <Link
              href={`/chat/${org.slug}`}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Open Chat
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Projects */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Projects</h2>
              <span className="text-xs text-gray-400">{projects?.length ?? 0} active</span>
            </div>

            {projects?.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/${org.slug}/projects/${project.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    {project.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5 ml-4 shrink-0">
                    <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-0.5">{project.phase}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${
                      project.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>{project.status}</span>
                  </div>
                </div>
              </Link>
            ))}

            {(!projects || projects.length === 0) && (
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-400">No projects yet. Create one to get started.</p>
              </div>
            )}

            <NewProjectForm orgId={org.id} orgSlug={org.slug} />
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            {/* Memory snippet */}
            {memorySnippet && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Strategic Memory</h2>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-600 line-clamp-6">{memorySnippet}</p>
                </div>
              </div>
            )}

            {/* Recent activity */}
            {recentMessages && recentMessages.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Activity</h2>
                <div className="space-y-2">
                  {recentMessages.map((msg) => (
                    <div key={msg.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                      <p className="text-xs text-gray-700 line-clamp-2">{msg.content}</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(msg.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
