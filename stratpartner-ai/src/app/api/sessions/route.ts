import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId')
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('sessions')
    .select('id, title, channel, project_id, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { orgId: string; projectId?: string; title?: string }
  const { orgId, projectId, title } = body

  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      org_id: orgId,
      project_id: projectId ?? null,
      title: title ?? null,
      type: 'working',
      channel: 'chat',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const orgId = req.nextUrl.searchParams.get('orgId')

  if (!id || !orgId) return NextResponse.json({ error: 'id and orgId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  // Delete messages first (FK constraint)
  const { error: msgError } = await supabase
    .from('messages')
    .delete()
    .eq('session_id', id)

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })

  const { error: sessionError } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId)

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
