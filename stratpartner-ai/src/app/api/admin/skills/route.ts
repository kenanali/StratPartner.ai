import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { orgId, skillId, enabled } = await req.json()
  if (!orgId || !skillId) return NextResponse.json({ error: 'orgId and skillId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  await supabase
    .from('org_skills')
    .upsert({ org_id: orgId, skill_id: skillId, enabled }, { onConflict: 'org_id,skill_id' })

  return NextResponse.json({ ok: true })
}
