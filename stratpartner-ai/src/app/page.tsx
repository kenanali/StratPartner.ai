import { getSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

export default async function Home() {
  const supabase = getSupabaseAdmin()
  const { data: orgs } = await supabase.from('orgs').select('id, slug, name')
  const { data: projects } = orgs?.length
    ? await supabase.from('projects').select('id, name, org_id').eq('org_id', orgs[0].id).limit(3)
    : { data: [] }
  const { data: deliverables } = projects?.length
    ? await supabase.from('deliverables').select('id, title, project_id').eq('project_id', projects[0].id).limit(2)
    : { data: [] }

  const org = orgs?.[0]
  const project = projects?.[0]
  const deliverable = deliverables?.[0]

  const sections = [
    {
      label: 'Auth',
      links: [
        { href: '/login', label: 'Login (magic link)' },
        { href: '/gate', label: 'Password gate' },
        { href: '/admin', label: 'Admin — org list' },
        ...(org ? [{ href: `/admin/orgs/${org.slug}`, label: `Admin — ${org.name}` }] : []),
      ],
    },
    ...(org
      ? [
          {
            label: `Dashboard — ${org.name}`,
            links: [
              { href: `/dashboard/${org.slug}`, label: 'Dashboard (home + first-run wizard)' },
              { href: `/dashboard/${org.slug}/activity`, label: 'Activity feed' },
              { href: `/dashboard/${org.slug}/inbox`, label: '📬 Inbox (agent notifications)' },
              { href: `/dashboard/${org.slug}/memory`, label: '🧠 Memory (org + project cards)' },
              { href: `/dashboard/${org.slug}/projects`, label: 'Projects' },
              { href: `/dashboard/${org.slug}/tasks`, label: 'Tasks (kanban)' },
              { href: `/dashboard/${org.slug}/meetings`, label: 'Meetings (Recall.ai)' },
              { href: `/dashboard/${org.slug}/sources`, label: 'Sources (RAG files)' },
              { href: `/dashboard/${org.slug}/skills`, label: 'Skills catalog' },
              { href: `/dashboard/${org.slug}/routines`, label: 'Routines' },
              { href: `/dashboard/${org.slug}/agents`, label: 'Agents (8 roles)' },
            ],
          },
          {
            label: 'Chat',
            links: [
              { href: `/chat/${org.slug}`, label: 'Chat hub (session list + new chat)' },
            ],
          },
          ...(project
            ? [
                {
                  label: `Project — ${project.name}`,
                  links: [
                    { href: `/dashboard/${org.slug}/projects/${project.id}`, label: 'Project overview' },
                    { href: `/dashboard/${org.slug}/projects/${project.id}/deliverables`, label: 'Deliverables library' },
                    ...(deliverable
                      ? [{ href: `/dashboard/${org.slug}/projects/${project.id}/deliverables/${deliverable.id}`, label: `Deliverable — ${deliverable.title.slice(0, 40)}` }]
                      : []
                    ),
                  ],
                },
              ]
            : []
          ),
          {
            label: 'Onboarding (teammate invite)',
            links: [
              { href: `/onboard/${org.slug}`, label: 'Onboard form (no auth — shareable link)' },
            ],
          },
        ]
      : []),
    {
      label: 'API',
      links: [
        { href: '/api/health', label: 'GET /api/health' },
        { href: `/api/projects?orgId=${org?.id ?? ''}`, label: 'GET /api/projects' },
        { href: `/api/org-skills?org_id=${org?.id ?? ''}`, label: 'GET /api/org-skills' },
        { href: `/api/messages?org_id=${org?.id ?? ''}`, label: 'GET /api/messages' },
        { href: `/api/inbox?orgId=${org?.id ?? ''}`, label: 'GET /api/inbox' },
        { href: `/api/inbox/count?orgId=${org?.id ?? ''}`, label: 'GET /api/inbox/count' },
        { href: `/api/memory?orgId=${org?.id ?? ''}`, label: 'GET /api/memory' },
        { href: `/api/deliverables?orgId=${org?.id ?? ''}`, label: 'GET /api/deliverables' },
        { href: `/api/sessions?orgId=${org?.id ?? ''}`, label: 'GET /api/sessions' },
      ],
    },
  ]

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">StratPartner.ai</h1>
          <p className="mt-1 text-sm text-gray-500">Test navigation — auth disabled</p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                {section.label}
              </p>
              <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                  >
                    <span>{link.label}</span>
                    <span className="text-gray-300 text-xs font-mono truncate ml-4 max-w-xs">{link.href}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-gray-400">
          Auth + password gate are disabled. Re-enable middleware before going live.
        </p>
      </div>
    </main>
  )
}
