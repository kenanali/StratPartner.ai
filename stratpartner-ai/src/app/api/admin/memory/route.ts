import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { orgId, content } = await req.json()
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  await supabase.from('memory').delete().eq('org_id', orgId)

  if (content?.trim()) {
    await supabase.from('memory').insert({
      org_id: orgId,
      type: 'strategic',
      content: content.trim(),
    })
  }

  return NextResponse.json({ ok: true })
}
