import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Map Recall bot status codes → our DB status (display only — no extraction trigger)
function recallStatusToDb(code: string): string | null {
  switch (code) {
    case 'joining_call':              return 'joining'
    case 'in_waiting_room':           return 'joining'
    case 'in_call_not_recording':
    case 'in_call_recording':         return 'in_progress'
    case 'call_ended':
    case 'recording_done':            return 'processing'
    case 'done':                      return 'processing' // show as processing until webhook triggers extraction
    case 'fatal':                     return 'failed'
    default:                          return null
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const orgId = req.nextUrl.searchParams.get('orgId')
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', orgId)
    .single()

  if (error || !meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  // For active meetings, sync display status from Recall API.
  // Does NOT trigger extraction — that's handled by webhook (transcript.data is_final)
  // or manual "Process Meeting" button.
  const isActive = !['complete', 'failed'].includes(meeting.status)
  if (isActive && meeting.recall_bot_id && process.env.RECALL_API_KEY) {
    try {
      const recallRes = await fetch(
        `https://us-west-2.recall.ai/api/v1/bot/${meeting.recall_bot_id}/`,
        { headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` } }
      )
      if (recallRes.ok) {
        const bot = await recallRes.json()
        const statusChanges: Array<{ code: string }> = bot.status_changes ?? []
        const latestCode = statusChanges.length > 0
          ? statusChanges[statusChanges.length - 1].code
          : null

        if (latestCode) {
          const newStatus = recallStatusToDb(latestCode)
          if (newStatus && newStatus !== meeting.status) {
            const updates: Record<string, unknown> = { status: newStatus }
            if (newStatus === 'joining' && !meeting.started_at) updates.started_at = new Date().toISOString()
            if (newStatus === 'processing' && !meeting.ended_at) updates.ended_at = new Date().toISOString()
            if (newStatus === 'failed' && !meeting.ended_at) updates.ended_at = new Date().toISOString()
            await supabase.from('meetings').update(updates).eq('id', meeting.id)
            Object.assign(meeting, updates)
          }
        }
      }
    } catch {
      // Non-critical
    }
  }

  return NextResponse.json({ meeting })
}
