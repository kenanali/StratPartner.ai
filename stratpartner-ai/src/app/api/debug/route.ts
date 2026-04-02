import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const meetingId = req.nextUrl.searchParams.get('meetingId')
  if (!meetingId) return NextResponse.json({ error: 'meetingId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data: meeting } = await supabase
    .from('meetings')
    .select('id, status, recall_bot_id, transcript_raw')
    .eq('id', meetingId)
    .single()

  if (!meeting) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const recallKey = process.env.RECALL_API_KEY
  if (!recallKey) {
    return NextResponse.json({ error: 'RECALL_API_KEY not set in this function', meeting })
  }

  const [transcriptRes, botRes] = await Promise.all([
    fetch(`https://us-west-2.recall.ai/api/v1/bot/${meeting.recall_bot_id}/transcript/`, {
      headers: { Authorization: `Token ${recallKey}` },
    }),
    fetch(`https://us-west-2.recall.ai/api/v1/bot/${meeting.recall_bot_id}/`, {
      headers: { Authorization: `Token ${recallKey}` },
    }),
  ])

  const [transcriptBody, botBody] = await Promise.all([
    transcriptRes.text(),
    botRes.text(),
  ])

  return NextResponse.json({
    meeting: {
      id: meeting.id,
      status: meeting.status,
      recall_bot_id: meeting.recall_bot_id,
      transcript_raw_length: (meeting.transcript_raw as unknown[])?.length ?? 0,
    },
    recall_api_key_present: true,
    transcript_status: transcriptRes.status,
    transcript: transcriptBody.slice(0, 3000),
    bot_status: botRes.status,
    bot: botBody.slice(0, 2000),
  })
}
