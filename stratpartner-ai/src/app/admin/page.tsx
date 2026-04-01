import { getSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import CreateOrgForm from './CreateOrgForm'

export default async function AdminPage() {
  const supabase = getSupabaseAdmin()

  const { data: orgs } = await supabase
    .from('orgs')
    .select('id, slug, name, tier, created_at')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
          <span className="text-sm text-gray-500">{orgs?.length ?? 0} orgs</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Organizations</h2>
            <div className="space-y-2">
              {orgs?.map((org) => (
                <Link
                  key={org.id}
                  href={`/admin/orgs/${org.slug}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-400">{org.slug}</p>
                  </div>
                  <span className="text-xs rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 font-medium">
                    {org.tier ?? 'agent'}
                  </span>
                </Link>
              ))}
              {(!orgs || orgs.length === 0) && (
                <p className="text-sm text-gray-400 py-4">No orgs yet.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Create Org</h2>
            <CreateOrgForm />
          </div>
        </div>
      </div>
    </main>
  )
}
