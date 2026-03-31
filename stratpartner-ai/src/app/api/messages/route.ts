import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')
  const sessionId = searchParams.get('sessionId')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

  if (!orgId || !sessionId) {
    return NextResponse.json(
      { error: 'orgId and sessionId are required' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  const { data: messages, error } = await supabase
    .from('messages')
    .select('role, content')
    .eq('org_id', orgId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages: messages ?? [] })
}
