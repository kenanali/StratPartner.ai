import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function tryUrl(url: string, key: string) {
  const res = await fetch(url, { headers: { Authorization: `Token ${key}` } })
  const body = await res.text()
  return { status: res.status, body: body.slice(0, 500) }
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
  const recId = '429321d4-ef7c-4b23-aace-d880523bd186'
  const base = 'https://us-west-2.recall.ai'

  const results = await Promise.all([
    tryUrl(`${base}/api/v1/recording/${recId}/transcript/`, key),
    tryUrl(`${base}/api/v1/recordings/${recId}/transcript/`, key),
    tryUrl(`${base}/api/v2/recording/${recId}/transcript/`, key),
    tryUrl(`${base}/api/v2/recordings/${recId}/transcript/`, key),
    tryUrl(`${base}/api/v1/bot/${botId}/transcript/?recording_id=${recId}`, key),
  ])

  return NextResponse.json({
    'v1/recording/{id}/transcript': results[0],
    'v1/recordings/{id}/transcript': results[1],
    'v2/recording/{id}/transcript': results[2],
    'v2/recordings/{id}/transcript': results[3],
    'v1/bot/{id}/transcript?recording_id': results[4],
  })
}
