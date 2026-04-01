import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export interface InboxMessage {
  id: string
  content: string
  channel: string
  created_at: string
  read_at: string | null
  session_id: string | null
  suggested_skills?: string[] | null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('messages')
    .select('id, content, channel, created_at, read_at, session_id, suggested_skills')
    .eq('org_id', orgId)
    .eq('role', 'assistant')
    .not('channel', 'is', null)
    .in('channel', ['agent', 'recall', 'heartbeat'])
    .order('read_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages: (data ?? []) as InboxMessage[] })
}

export async function PATCH(req: NextRequest) {
  let body: { ids?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { ids } = body
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids)
    .is('read_at', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
