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
    return NextResponse.json({ error: 'RECALL_API_KEY not set', meeting })
  }

  // Fetch bot to get recording ID
  const botRes = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${meeting.recall_bot_id}/`, {
    headers: { Authorization: `Token ${recallKey}` },
  })
  const bot = await botRes.json()
  const recordingId = bot.recordings?.[0]?.id ?? null

  // Try new v2 endpoint using recording ID
  let v2TranscriptStatus = null
  let v2TranscriptBody = null
  if (recordingId) {
    const v2Res = await fetch(`https://us-west-2.recall.ai/api/v2/recording/${recordingId}/transcript/`, {
      headers: { Authorization: `Token ${recallKey}` },
    })
    v2TranscriptStatus = v2Res.status
    v2TranscriptBody = (await v2Res.text()).slice(0, 2000)
  }

  // Also try the bot-level v2 endpoint
  const v2BotRes = await fetch(`https://us-west-2.recall.ai/api/v2/bot/${meeting.recall_bot_id}/transcript/`, {
    headers: { Authorization: `Token ${recallKey}` },
  })
  const v2BotTranscriptStatus = v2BotRes.status
  const v2BotTranscriptBody = (await v2BotRes.text()).slice(0, 2000)

  return NextResponse.json({
    meeting: { id: meeting.id, status: meeting.status, recall_bot_id: meeting.recall_bot_id },
    recording_id: recordingId,
    bot_status_changes: bot.status_changes,
    v2_recording_transcript: { status: v2TranscriptStatus, body: v2TranscriptBody },
    v2_bot_transcript: { status: v2BotTranscriptStatus, body: v2BotTranscriptBody },
    // Show what host header looks like (for webhook URL fix)
    headers: {
      host: req.headers.get('host'),
      x_forwarded_host: req.headers.get('x-forwarded-host'),
      x_forwarded_proto: req.headers.get('x-forwarded-proto'),
    },
  })
}
