import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function tryUrl(url: string, key: string) {
  const res = await fetch(url, { headers: { Authorization: `Token ${key}` } })
  const body = await res.text()
  return { status: res.status, body: body.slice(0, 800) }
}

export async function GET(req: NextRequest) {
  const meetingId = req.nextUrl.searchParams.get('meetingId')
  if (!meetingId) return NextResponse.json({ error: 'meetingId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data: meeting } = await supabase
    .from('meetings')
    .select('id, status, recall_bot_id')
    .eq('id', meetingId)
    .single()

  if (!meeting) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const key = process.env.RECALL_API_KEY!
  const botId = meeting.recall_bot_id
  const base = 'https://us-west-2.recall.ai'

  // Try every plausible v2 transcript endpoint pattern
  const results = await Promise.all([
    tryUrl(`${base}/api/v2/transcript/?bot_id=${botId}`, key),
    tryUrl(`${base}/api/v2/transcripts/?bot_id=${botId}`, key),
    tryUrl(`${base}/api/v2/bot/${botId}/transcript/`, key),
    tryUrl(`${base}/api/v2/bots/${botId}/transcript/`, key),
    // List all bots to confirm API key works
    tryUrl(`${base}/api/v1/bot/?limit=1`, key),
  ])

  return NextResponse.json({
    'v2/transcript/?bot_id': results[0],
    'v2/transcripts/?bot_id': results[1],
    'v2/bot/{id}/transcript': results[2],
    'v2/bots/{id}/transcript': results[3],
    'v1/bot/?limit=1 (key check)': results[4],
  })
}
