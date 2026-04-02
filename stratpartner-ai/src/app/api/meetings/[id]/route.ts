import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { getSupabaseAdmin } from '@/lib/supabase'
import { extractMeetingAsync } from '@/lib/meetingExtraction'

// Map Recall bot status codes → our DB status
function recallStatusToDb(code: string): string | null {
  switch (code) {
    case 'joining_call':              return 'joining'
    case 'in_call_not_recording':
    case 'in_call_recording':         return 'in_progress'
    case 'call_ended':
    case 'recording_done':            return 'processing'
    case 'done':                      return 'done' // special — triggers extraction
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

  // For active meetings, sync status from Recall API so the detail page
  // updates even without account-level status webhooks configured.
  const isActive = !['complete', 'failed'].includes(meeting.status)
  if (isActive && meeting.recall_bot_id && process.env.RECALL_API_KEY) {
    try {
      const recallRes = await fetch(
        `https://us-west-2.recall.ai/api/v1/bot/${meeting.recall_bot_id}/`,
        { headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` } }
      )
      if (recallRes.ok) {
        const bot = await recallRes.json()
        // Latest status is the last entry in status_changes
        const statusChanges: Array<{ code: string }> = bot.status_changes ?? []
        const latestCode = statusChanges.length > 0
          ? statusChanges[statusChanges.length - 1].code
          : null

        if (latestCode) {
          const newStatus = recallStatusToDb(latestCode)

          if (newStatus === 'done' && meeting.status !== 'complete' && !meeting.proactive_message_sent) {
            // Trigger extraction
            await supabase.from('meetings').update({ status: 'processing' }).eq('id', meeting.id)
            meeting.status = 'processing'
            const { data: org } = await supabase.from('orgs').select('slug').eq('id', meeting.org_id).single()
            waitUntil(extractMeetingAsync(meeting.id, org?.slug ?? ''))
          } else if (newStatus && newStatus !== meeting.status) {
            // Normal status update
            const updates: Record<string, unknown> = { status: newStatus }
            if (newStatus === 'joining' && !meeting.started_at) {
              updates.started_at = new Date().toISOString()
            }
            if ((newStatus === 'processing' || newStatus === 'failed') && !meeting.ended_at) {
              updates.ended_at = new Date().toISOString()
            }
            await supabase.from('meetings').update(updates).eq('id', meeting.id)
            Object.assign(meeting, updates)
          }
        }
      }
    } catch {
      // Non-critical — return whatever we have
    }
  }

  return NextResponse.json({ meeting })
}
