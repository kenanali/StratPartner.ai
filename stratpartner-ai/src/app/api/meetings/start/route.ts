import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

function detectPlatform(url: string): string {
  if (url.includes('zoom.us')) return 'zoom'
  if (url.includes('meet.google.com')) return 'meet'
  if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) return 'teams'
  return 'unknown'
}

export async function POST(req: NextRequest) {
  const { orgId, meetingUrl, title, projectId } = await req.json()

  if (!orgId || !meetingUrl) {
    return NextResponse.json({ error: 'orgId and meetingUrl are required' }, { status: 400 })
  }

  if (!process.env.RECALL_API_KEY) {
    return NextResponse.json({ error: 'Recall.ai not configured' }, { status: 503 })
  }

  const appUrl = process.env.APP_URL
  console.log('[meetings/start] APP_URL=', appUrl)
  if (!appUrl) {
    return NextResponse.json({ error: 'APP_URL env var not set — cannot build webhook URL' }, { status: 503 })
  }

  const platform = detectPlatform(meetingUrl)

  // Deploy bot via Recall.ai
  const recallRes = await fetch('https://us-west-2.recall.ai/api/v1/bot', {
    method: 'POST',
    headers: {
      Authorization: `Token ${process.env.RECALL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      meeting_url: meetingUrl,
      bot_name: 'StratPartner',
      recording_config: {
        transcript: {
          provider: { recallai_streaming: {} },
          diarization: { use_separate_streams_when_available: true },
        },
        realtime_endpoints: [
          {
            type: 'webhook',
            url: `${appUrl}/api/meetings/webhook`,
            events: ['transcript.data'],
          },
        ],
      },
    }),
  })

  if (!recallRes.ok) {
    const err = await recallRes.text()
    return NextResponse.json({ error: `Recall.ai error: ${err}` }, { status: 502 })
  }

  const { id: recallBotId } = await recallRes.json()

  const supabase = getSupabaseAdmin()
  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({
      org_id: orgId,
      project_id: projectId ?? null,
      meeting_url: meetingUrl,
      recall_bot_id: recallBotId,
      title: title ?? 'Untitled Meeting',
      platform,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error || !meeting) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create meeting' }, { status: 500 })
  }

  return NextResponse.json({ meetingId: meeting.id, recallBotId })
}
