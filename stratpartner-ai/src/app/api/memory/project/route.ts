import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  const body = await req.json() as { projectId?: string; content?: string }
  const { projectId, content } = body

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  if (content === undefined) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('projects')
    .update({ memory: content })
    .eq('id', projectId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
