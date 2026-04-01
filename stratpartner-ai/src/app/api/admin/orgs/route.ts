import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin()
  const { name, slug } = await req.json()

  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('orgs')
    .insert({ name, slug, tier: 'agent' })
    .select('id, slug')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Activate all skills for this new org
  const { data: skills } = await supabase.from('skills').select('id')
  if (skills && skills.length > 0) {
    await supabase.from('org_skills').insert(
      skills.map((s) => ({ org_id: data.id, skill_id: s.id, enabled: true }))
    )
  }

  return NextResponse.json({ id: data.id, slug: data.slug })
}
