import { getSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import SourcesClient from './SourcesClient'

interface PageProps {
  params: { orgSlug: string }
}

export default async function SourcesPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('slug', params.orgSlug)
    .single()

  if (!org) return null

  const { data: files } = await supabase
    .from('files')
    .select('id, name, filename, mime_type, is_active, created_at')
    .eq('org_id', org.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const ids = (files ?? []).map(f => f.id)
  const { data: counts } = ids.length
    ? await supabase.from('file_chunks').select('file_id').in('file_id', ids)
    : { data: [] }

  const chunkMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    chunkMap[row.file_id] = (chunkMap[row.file_id] ?? 0) + 1
  }

  const sources = (files ?? []).map(f => ({
    id: f.id,
    name: f.name ?? f.filename,
    mimeType: f.mime_type ?? '',
    createdAt: f.created_at,
    chunkCount: chunkMap[f.id] ?? 0,
  }))

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('id, title, type, content, created_at')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-sm">
        <Link href={`/dashboard/${org.slug}`} className="text-violet-600 hover:underline">
          {org.name}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-900">Sources</span>
      </nav>

      <SourcesClient
        orgId={org.id}
        orgSlug={org.slug}
        initialSources={sources}
        initialDeliverables={(deliverables ?? []).map(d => ({
          id: d.id,
          title: d.title,
          type: d.type,
          content: d.content,
          createdAt: d.created_at,
        }))}
      />
    </div>
  )
}
