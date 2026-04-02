import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { waitUntil } from '@vercel/functions'
import { getSupabaseAdmin } from '@/lib/supabase'
import { extractMeetingAsync } from '@/lib/meetingExtraction'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Account-level webhooks are signed via Svix
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

  // Bot ID location: data.bot.id for all account-level and per-bot events
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
  if (event === 'bot.joining_call') {
    await supabase.from('meetings').update({ status: 'joining', started_at: new Date().toISOString() }).eq('id', meeting.id)
  } else if (event === 'bot.in_call_not_recording' || event === 'bot.in_call_recording') {
    await supabase.from('meetings').update({ status: 'in_progress' }).eq('id', meeting.id)
  } else if (event === 'bot.call_ended') {
    await supabase.from('meetings').update({ status: 'processing', ended_at: new Date().toISOString() }).eq('id', meeting.id)
  } else if (event === 'bot.done') {
    // bot.done means the bot has finished — transcript.done will follow and trigger extraction
    if (meeting.status !== 'complete') {
      await supabase.from('meetings').update({ status: 'processing' }).eq('id', meeting.id)
    }
  } else if (event === 'bot.fatal') {
    await supabase.from('meetings').update({ status: 'failed', ended_at: new Date().toISOString() }).eq('id', meeting.id)
  }

  // ── transcript.done (account-level Svix webhook) ─────────────────────────
  // Fires when the transcript is ready to download via media_shortcuts.
  // payload: { event, data: { data: { code, sub_code }, bot: { id }, transcript?: { id } } }
  else if (event === 'transcript.done') {
    if (meeting.proactive_message_sent) return NextResponse.json({ ok: true })

    const key = process.env.RECALL_API_KEY
    if (!key) return NextResponse.json({ ok: true })

    try {
      // 1. Fetch bot to get download_url via media_shortcuts
      const botRes = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${botId}/`, {
        headers: { Authorization: `Token ${key}` },
      })
      if (!botRes.ok) return NextResponse.json({ ok: true })

      const bot = await botRes.json()
      const downloadUrl: string = bot.recordings?.[0]?.media_shortcuts?.transcript?.data?.download_url ?? ''

      if (!downloadUrl) return NextResponse.json({ ok: true })

      // 2. Download transcript: array of { participant: { name }, words: [{ text }] }
      const dlRes = await fetch(downloadUrl)
      if (!dlRes.ok) return NextResponse.json({ ok: true })

      const rawSegments: Array<{ participant: { name: string }; words: Array<{ text: string }> }> = await dlRes.json()

      // 3. Store segments in transcript_raw and update status
      const segments = rawSegments.map((s) => ({
        speaker: s.participant?.name ?? 'Unknown',
        words: s.words ?? [],
      }))

      await supabase.from('meetings').update({
        status: 'processing',
        transcript_raw: segments,
      }).eq('id', meeting.id)

      // 4. Trigger async extraction
      const { data: org } = await supabase.from('orgs').select('slug').eq('id', meeting.org_id).single()
      waitUntil(extractMeetingAsync(meeting.id, org?.slug ?? ''))
    } catch {
      // Non-critical — log and continue
    }
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
