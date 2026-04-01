import { getSupabaseAdmin } from '@/lib/supabase'
import { upsertOrgMemory } from '@/lib/memory'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('memory')
    .select('content')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const content = (data ?? []).map((row: { content: string }) => row.content).join('\n\n')
  return NextResponse.json({ content })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json() as { orgId?: string; content?: string }
  const { orgId, content } = body

  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })
  if (content === undefined) return NextResponse.json({ error: 'content required' }, { status: 400 })

  await upsertOrgMemory(orgId, content)
  return NextResponse.json({ ok: true })
}
