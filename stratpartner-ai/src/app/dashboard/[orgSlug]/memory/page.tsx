import { getSupabaseAdmin } from '@/lib/supabase'
import { getOrgMemory } from '@/lib/memory'
import Link from 'next/link'
import MemoryClient from './MemoryClient'

interface PageProps {
  params: { orgSlug: string }
}

interface ProjectWithMemory {
  id: string
  name: string
  memory: string | null
}

export default async function MemoryPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('slug', params.orgSlug)
    .single()

  if (!org) return null

  const [orgMemory, projectsResult] = await Promise.all([
    getOrgMemory(org.id),
    supabase
      .from('projects')
      .select('id, name, memory')
      .eq('org_id', org.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false }),
  ])

  const projects: ProjectWithMemory[] = (projectsResult.data ?? []).map(
    (p: { id: string; name: string; memory: string | null }) => ({
      id: p.id,
      name: p.name,
      memory: p.memory ?? null,
    })
  )

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-sm" aria-label="Breadcrumb">
        <Link href={`/dashboard/${org.slug}`} className="text-accent hover:underline">
          {org.name}
        </Link>
        <span className="text-gray-300" aria-hidden="true">/</span>
        <span className="font-semibold text-gray-900">Memory</span>
      </nav>

      <MemoryClient
        orgId={org.id}
        orgSlug={org.slug}
        initialOrgMemory={orgMemory}
        projects={projects}
      />
    </div>
  )
}
