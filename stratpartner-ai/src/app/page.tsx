import { getSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

export default async function Home() {
  const supabase = getSupabaseAdmin()
  const { data: orgs } = await supabase.from('orgs').select('id, slug, name')
  const { data: projects } = orgs?.length
    ? await supabase.from('projects').select('id, name, org_id').eq('org_id', orgs[0].id)
    : { data: [] }

  const org = orgs?.[0]

  const sections = [
    {
      label: 'Core',
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
            label: `Org: ${org.name} (${org.slug})`,
            links: [
              { href: `/chat/${org.slug}`, label: 'Chat (standalone)' },
              { href: `/dashboard/${org.slug}`, label: 'Dashboard' },
              { href: `/dashboard/${org.slug}/sources`, label: 'Sources — file manager' },
              ...(projects ?? []).map((p) => ({
                href: `/dashboard/${org.slug}/projects/${p.id}`,
                label: `Project — ${p.name}`,
              })),
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
                    className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
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
