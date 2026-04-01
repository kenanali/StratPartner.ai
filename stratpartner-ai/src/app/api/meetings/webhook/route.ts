import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase'
import { extractMeetingAsync } from '@/lib/meetingExtraction'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // 1. Read raw body for HMAC verification
  const rawBody = await req.text()

  // 2. Verify signature (if secret is configured)
  if (process.env.RECALL_WEBHOOK_SECRET) {
    const sig = req.headers.get('x-recall-signature') ?? ''
    const expected = `sha256=${crypto
      .createHmac('sha256', process.env.RECALL_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex')}`
    if (sig !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const payload = JSON.parse(rawBody)
  const event: string = payload.event ?? ''
  // Recall sends bot id at data.bot.id
  const botId: string = payload.data?.bot?.id ?? payload.data?.bot_id ?? ''

  if (!botId) return NextResponse.json({ ok: true })

  const supabase = getSupabaseAdmin()

  // Look up meeting by recall_bot_id
  const { data: meeting } = await supabase
    .from('meetings')
    .select('id, org_id, status')
    .eq('recall_bot_id', botId)
    .single()

  if (!meeting) return NextResponse.json({ ok: true })

  // Get org slug for proactive briefing links
  const { data: org } = await supabase
    .from('orgs')
    .select('slug')
    .eq('id', meeting.org_id)
    .single()
  const orgSlug = org?.slug ?? ''

  // 3. Handle events
  if (event === 'bot.status_change') {
    // Recall sends status code at data.data.code
    const status: string = payload.data?.data?.code ?? payload.data?.status?.code ?? ''

    if (status === 'joining_call') {
      await supabase
        .from('meetings')
        .update({ status: 'joining', started_at: new Date().toISOString() })
        .eq('id', meeting.id)
    } else if (status === 'in_call_recording' || status === 'in_call_not_recording') {
      await supabase.from('meetings').update({ status: 'in_progress' }).eq('id', meeting.id)
    } else if (status === 'call_ended') {
      await supabase
        .from('meetings')
        .update({ status: 'processing', ended_at: new Date().toISOString() })
        .eq('id', meeting.id)
    } else if (status === 'done') {
      // 'done' fires after transcription is complete — best trigger for extraction
      if (meeting.status !== 'complete') {
        await supabase
          .from('meetings')
          .update({ status: 'processing', ended_at: meeting.status === 'in_progress' ? new Date().toISOString() : undefined })
          .eq('id', meeting.id)
        extractMeetingAsync(meeting.id, orgSlug)
      }
    } else if (status === 'fatal') {
      await supabase.from('meetings').update({ status: 'failed' }).eq('id', meeting.id)
    }
  } else if (event === 'transcript.data') {
    // Append transcript segment to transcript_raw
    const segment = payload.data?.transcript
    if (segment) {
      // Fetch current transcript_raw and append
      const { data: current } = await supabase
        .from('meetings')
        .select('transcript_raw')
        .eq('id', meeting.id)
        .single()

      const existing: unknown[] = Array.isArray(current?.transcript_raw) ? current.transcript_raw : []
      await supabase
        .from('meetings')
        .update({ transcript_raw: [...existing, segment] })
        .eq('id', meeting.id)
    }
  } else if (event === 'transcript.complete') {
    // Backup trigger — only extract if not already processing/complete
    if (meeting.status !== 'complete' && meeting.status !== 'processing') {
      await supabase
        .from('meetings')
        .update({ status: 'processing', ended_at: new Date().toISOString() })
        .eq('id', meeting.id)
      extractMeetingAsync(meeting.id, orgSlug)
    }
  }

  // Always respond 200 immediately
  return NextResponse.json({ ok: true })
}
