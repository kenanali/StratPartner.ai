import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { getSupabaseAdmin } from '@/lib/supabase'
import { extractMeetingAsync } from '@/lib/meetingExtraction'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const orgId: string = body.orgId ?? ''

  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('id, org_id')
    .eq('id', params.id)
    .eq('org_id', orgId)
    .single()

  if (error || !meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

  const { data: org } = await supabase.from('orgs').select('slug').eq('id', meeting.org_id).single()

  // Reset so extraction runs fresh — extractMeetingAsync self-heals transcript from Recall if needed
  await supabase.from('meetings').update({ status: 'processing', proactive_message_sent: false }).eq('id', meeting.id)

  waitUntil(extractMeetingAsync(meeting.id, org?.slug ?? ''))

  return NextResponse.json({ ok: true })
}
