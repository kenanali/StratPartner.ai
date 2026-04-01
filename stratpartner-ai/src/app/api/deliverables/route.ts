import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')
  const orgId = req.nextUrl.searchParams.get('orgId')

  if (!projectId && !orgId) {
    return NextResponse.json({ error: 'projectId or orgId required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('deliverables')
    .select('id, title, type, phase, version, created_at')
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  } else if (orgId) {
    query = query.eq('org_id', orgId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deliverables: data ?? [] })
}
