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
    .select('id, org_id, status, proactive_message_sent, recall_bot_id')
    .eq('id', params.id)
    .eq('org_id', orgId)
    .single()

  if (error || !meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

  const { data: org } = await supabase.from('orgs').select('slug').eq('id', meeting.org_id).single()
  const orgSlug = org?.slug ?? ''

  // Try to get recording_id from Recall for async transcript path
  let recordingId: string | undefined
  if (meeting.recall_bot_id && process.env.RECALL_API_KEY) {
    try {
      const botRes = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${meeting.recall_bot_id}/`, {
        headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` },
      })
      if (botRes.ok) {
        const bot = await botRes.json()
        recordingId = bot.recordings?.[0]?.id
      }
    } catch { /* ignore */ }
  }

  await supabase.from('meetings').update({ status: 'processing', proactive_message_sent: false }).eq('id', meeting.id)

  waitUntil(extractMeetingAsync(meeting.id, orgSlug, recordingId))

  return NextResponse.json({ ok: true, recordingId: recordingId ?? null })
}
