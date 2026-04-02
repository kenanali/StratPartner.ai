import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { waitUntil } from '@vercel/functions'
import { getSupabaseAdmin } from '@/lib/supabase'
import { extractMeetingAsync } from '@/lib/meetingExtraction'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Account-level webhooks use Svix; per-bot realtime_endpoints are unsigned
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
  const botId: string = payload.data?.bot?.id ?? payload.data?.bot_id ?? ''

  if (!botId) return NextResponse.json({ ok: true })

  const supabase = getSupabaseAdmin()

  const { data: meeting } = await supabase
    .from('meetings')
    .select('id, org_id, status, proactive_message_sent')
    .eq('recall_bot_id', botId)
    .single()

  if (!meeting) return NextResponse.json({ ok: true })

  const { data: org } = await supabase
    .from('orgs')
    .select('slug')
    .eq('id', meeting.org_id)
    .single()
  const orgSlug = org?.slug ?? ''

  if (event === 'bot.status_change') {
    // Account-level webhook only — status code at data.code or data.data.code
    const status: string = payload.data?.code ?? payload.data?.data?.code ?? payload.data?.status?.code ?? ''

    if (status === 'joining_call') {
      await supabase.from('meetings').update({ status: 'joining', started_at: new Date().toISOString() }).eq('id', meeting.id)
    } else if (status === 'in_call_recording' || status === 'in_call_not_recording') {
      await supabase.from('meetings').update({ status: 'in_progress' }).eq('id', meeting.id)
    } else if (status === 'call_ended') {
      await supabase.from('meetings').update({ status: 'processing', ended_at: new Date().toISOString() }).eq('id', meeting.id)
    } else if (status === 'done') {
      if (meeting.status !== 'complete' && !meeting.proactive_message_sent) {
        await supabase.from('meetings').update({ status: 'processing' }).eq('id', meeting.id)
        waitUntil(extractMeetingAsync(meeting.id, orgSlug))
      }
    } else if (status === 'fatal') {
      await supabase.from('meetings').update({ status: 'failed' }).eq('id', meeting.id)
    }

  } else if (event === 'transcript.data') {
    // Per-bot realtime webhook — append segment
    const segment = payload.data?.transcript
    if (segment) {
      const { data: current } = await supabase.from('meetings').select('transcript_raw').eq('id', meeting.id).single()
      const existing: unknown[] = Array.isArray(current?.transcript_raw) ? current.transcript_raw : []
      await supabase.from('meetings').update({ transcript_raw: [...existing, segment] }).eq('id', meeting.id)
    }

  } else if (event === 'transcript.complete') {
    // Fired when transcription is done — trigger extraction
    if (meeting.status !== 'complete' && !meeting.proactive_message_sent) {
      await supabase.from('meetings').update({ status: 'processing', ended_at: new Date().toISOString() }).eq('id', meeting.id)
      waitUntil(extractMeetingAsync(meeting.id, orgSlug))
    }
  }

  return NextResponse.json({ ok: true })
}
