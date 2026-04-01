import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('files')
    .select('id, name, filename, mime_type, is_active, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach chunk counts
  const ids = (data ?? []).map((f) => f.id)
  const { data: counts } = ids.length
    ? await supabase
        .from('file_chunks')
        .select('file_id')
        .in('file_id', ids)
    : { data: [] }

  const chunkMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    chunkMap[row.file_id] = (chunkMap[row.file_id] ?? 0) + 1
  }

  const files = (data ?? []).map((f) => ({
    ...f,
    displayName: f.name ?? f.filename,
    chunkCount: chunkMap[f.id] ?? 0,
  }))

  return NextResponse.json({ files })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fileId = searchParams.get('fileId')
  const orgId = searchParams.get('orgId')
  if (!fileId || !orgId) return NextResponse.json({ error: 'fileId and orgId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  // Soft delete: mark inactive so it drops out of RAG retrieval
  await supabase
    .from('files')
    .update({ is_active: false })
    .eq('id', fileId)
    .eq('org_id', orgId)

  // Hard delete chunks so they no longer consume vector search
  await supabase.from('file_chunks').delete().eq('file_id', fileId)

  return NextResponse.json({ ok: true })
}
