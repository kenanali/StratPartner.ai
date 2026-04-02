import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Synchronous extraction diagnostic — uses media_shortcuts to fetch transcript
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin()
  const key = process.env.RECALL_API_KEY
  if (!key) return NextResponse.json({ error: 'RECALL_API_KEY not set' }, { status: 503 })

  const { data: meeting } = await supabase
    .from('meetings')
    .select('id, org_id, recall_bot_id, transcript_raw')
    .eq('id', params.id)
    .single()

  if (!meeting) return NextResponse.json({ error: 'meeting not found' }, { status: 404 })

  const steps: Record<string, unknown> = {}

  // Step 1: GET /api/v1/bot/{bot_id}/ to get media_shortcuts.transcript.data.download_url
  const botRes = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${meeting.recall_bot_id}/`, {
    headers: { Authorization: `Token ${key}` },
  })
  const bot = await botRes.json()
  steps.bot_status = botRes.status
  steps.bot_latest_status = bot.status_changes?.[bot.status_changes?.length - 1]?.code ?? null
  steps.recording_count = bot.recordings?.length ?? 0

  const downloadUrl: string = bot.recordings?.[0]?.media_shortcuts?.transcript?.data?.download_url ?? ''
  steps.download_url = downloadUrl ? '[present]' : '[missing]'

  if (!downloadUrl) {
    steps.recording_0 = bot.recordings?.[0] ?? null
    return NextResponse.json({ error: 'no transcript download_url in media_shortcuts', steps })
  }

  // Step 2: Download transcript
  const dlRes = await fetch(downloadUrl)
  steps.download_status = dlRes.status

  if (!dlRes.ok) {
    return NextResponse.json({ error: 'failed to download transcript', steps })
  }

  const segments = await dlRes.json()
  steps.segment_count = Array.isArray(segments) ? segments.length : 'not array'
  steps.first_3_segments = Array.isArray(segments) ? segments.slice(0, 3) : segments

  return NextResponse.json({ ok: true, steps })
}
