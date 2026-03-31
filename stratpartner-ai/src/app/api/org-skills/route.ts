import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')

  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('org_skills')
    .select('skills(slug, title)')
    .eq('org_id', orgId)
    .eq('enabled', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Supabase returns the joined row as an array or object depending on relationship type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skills = (data ?? []).flatMap((row: any) => {
    const s = row.skills
    if (!s) return []
    return Array.isArray(s) ? s : [s]
  })

  return NextResponse.json({ skills })
}
