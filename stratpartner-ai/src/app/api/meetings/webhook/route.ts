import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { waitUntil } from '@vercel/functions'
import { getSupabaseAdmin } from '@/lib/supabase'
import { extractMeetingAsync } from '@/lib/meetingExtraction'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Account-level webhooks (bot.status_change, recording.done) are signed via Svix
  // Per-bot realtime_endpoints (transcript.data) are unsigned
  const isSvix = !!req.headers.get('svix-signature')
  if (isSvix && process.env.RECALL_WEBHOOK_SECRET) {
    const wh = new Webhook(process.env.RECALL_WEBHOOK_SECRET)
    try {
      wh.verify(rawBody, {
        'svix-id': req.headers.get('svix-id') ?? '',
        'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
        'svix-signature': req.headers.get('svix-signature') ?? '',
      })
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const payload = JSON.parse(rawBody)
  const event: string = payload.event ?? ''

  // Bot ID location differs by event type:
  // - bot.status_change / recording.done (account webhook): data.bot.id
  // - transcript.data (per-bot realtime): data.bot.id
  const botId: string = payload.data?.bot?.id ?? ''

  if (!botId) return NextResponse.json({ ok: true })

  const supabase = getSupabaseAdmin()

  const { data: meeting } = await supabase
    .from('meetings')
    .select('id, org_id, status, proactive_message_sent')
    .eq('recall_bot_id', botId)
    .single()

  if (!meeting) return NextResponse.json({ ok: true })

  // ── Bot status events (account-level Svix webhook) ───────────────────────
  // Each status is its own event: bot.joining_call, bot.in_call_recording, etc.
  if (event === 'bot.joining_call') {
    await supabase.from('meetings').update({ status: 'joining', started_at: new Date().toISOString() }).eq('id', meeting.id)
  } else if (event === 'bot.in_call_not_recording' || event === 'bot.in_call_recording') {
    await supabase.from('meetings').update({ status: 'in_progress' }).eq('id', meeting.id)
  } else if (event === 'bot.call_ended') {
    await supabase.from('meetings').update({ status: 'processing', ended_at: new Date().toISOString() }).eq('id', meeting.id)
  } else if (event === 'bot.done') {
    // bot.done means recording is uploaded — recording.done will follow shortly and trigger extraction
    if (meeting.status !== 'complete') {
      await supabase.from('meetings').update({ status: 'processing' }).eq('id', meeting.id)
    }
  } else if (event === 'bot.fatal') {
    await supabase.from('meetings').update({ status: 'failed', ended_at: new Date().toISOString() }).eq('id', meeting.id)
  }

  // ── recording.done (account-level Svix webhook) ──────────────────────────
  // This fires when the recording is complete and ready for async transcription.
  // payload: { event, data: { data: { code, ... }, recording: { id }, bot: { id } } }
  else if (event === 'recording.done') {
    if (meeting.proactive_message_sent) return NextResponse.json({ ok: true })

    const recordingId: string = payload.data?.recording?.id ?? ''
    if (!recordingId) return NextResponse.json({ ok: true })

    // Update status and store recording_id for extraction
    await supabase.from('meetings')
      .update({ status: 'processing', ended_at: new Date().toISOString() })
      .eq('id', meeting.id)

    const { data: org } = await supabase.from('orgs').select('slug').eq('id', meeting.org_id).single()
    waitUntil(extractMeetingAsync(meeting.id, org?.slug ?? '', recordingId))
  }

  // ── transcript.data (per-bot realtime_endpoints webhook) ─────────────────
  // payload: { event, data: { data: { words, language_code, participant }, bot: { id }, ... } }
  else if (event === 'transcript.data') {
    const transcriptData = payload.data?.data
    if (transcriptData) {
      const segment = {
        speaker: transcriptData.participant?.name ?? 'Unknown',
        words: transcriptData.words ?? [],
      }
      const { data: current } = await supabase.from('meetings').select('transcript_raw').eq('id', meeting.id).single()
      const existing: unknown[] = Array.isArray(current?.transcript_raw) ? current.transcript_raw : []
      await supabase.from('meetings').update({ transcript_raw: [...existing, segment] }).eq('id', meeting.id)
    }
  }

  return NextResponse.json({ ok: true })
}
