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
    .select('id, org_id, status, proactive_message_sent, recall_bot_id, transcript_raw')
    .eq('id', params.id)
    .eq('org_id', orgId)
    .single()

  if (error || !meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

  const { data: org } = await supabase.from('orgs').select('slug').eq('id', meeting.org_id).single()
  const orgSlug = org?.slug ?? ''

  // If transcript_raw is empty, fetch from Recall via media_shortcuts
  const existingSegments = Array.isArray(meeting.transcript_raw) ? meeting.transcript_raw : []
  if (existingSegments.length === 0 && meeting.recall_bot_id && process.env.RECALL_API_KEY) {
    try {
      const botRes = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${meeting.recall_bot_id}/`, {
        headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` },
      })
      if (botRes.ok) {
        const bot = await botRes.json()
        const downloadUrl: string = bot.recordings?.[0]?.media_shortcuts?.transcript?.data?.download_url ?? ''
        if (downloadUrl) {
          const dlRes = await fetch(downloadUrl)
          if (dlRes.ok) {
            const rawSegments: Array<{ participant: { name: string }; words: Array<{ text: string }> }> = await dlRes.json()
            const segments = rawSegments.map((s) => ({
              speaker: s.participant?.name ?? 'Unknown',
              words: s.words ?? [],
            }))
            await supabase.from('meetings').update({ transcript_raw: segments }).eq('id', meeting.id)
          }
        }
      }
    } catch { /* fall through — extractMeetingAsync will fail gracefully */ }
  }

  await supabase.from('meetings').update({ status: 'processing', proactive_message_sent: false }).eq('id', meeting.id)

  waitUntil(extractMeetingAsync(meeting.id, orgSlug))

  return NextResponse.json({ ok: true })
}
