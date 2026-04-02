import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin()

  const { data: meeting } = await supabase
    .from('meetings')
    .select('id, status, recall_bot_id, transcript_raw, proactive_message_sent, findings, started_at, ended_at')
    .eq('id', params.id)
    .single()

  if (!meeting) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const recallKey = process.env.RECALL_API_KEY
  let recallBot = null
  let recallError = null

  if (recallKey && meeting.recall_bot_id) {
    try {
      const res = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${meeting.recall_bot_id}/`, {
        headers: { Authorization: `Token ${recallKey}` },
      })
      if (res.ok) {
        const bot = await res.json()
        recallBot = {
          id: bot.id,
          status_changes: bot.status_changes,
          latest_status: bot.status_changes?.at(-1)?.code ?? null,
          realtime_endpoints: bot.recording_config?.realtime_endpoints,
          recordings: bot.recordings?.map((r: { id: string; status: { code: string }; started_at?: string; completed_at?: string }) => ({ id: r.id, status: r.status?.code, started_at: r.started_at, completed_at: r.completed_at })),
        }
      } else {
        recallError = `Recall API ${res.status}: ${await res.text()}`
      }
    } catch (e) {
      recallError = String(e)
    }
  } else {
    recallError = recallKey ? 'no recall_bot_id' : 'RECALL_API_KEY not set'
  }

  const transcriptSegments = Array.isArray(meeting.transcript_raw) ? meeting.transcript_raw : []

  return NextResponse.json({
    meeting: {
      id: meeting.id,
      status: meeting.status,
      recall_bot_id: meeting.recall_bot_id,
      transcript_segments: transcriptSegments.length,
      transcript_preview: transcriptSegments.slice(0, 3),
      proactive_message_sent: meeting.proactive_message_sent,
      has_findings: !!meeting.findings,
    },
    recall: recallBot,
    recall_error: recallError,
  })
}
