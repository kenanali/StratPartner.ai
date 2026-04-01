import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export interface VoiceIntakeSummary {
  org_name: string
  project_name: string
  goal: string
  client_type: 'boutique_consultancy' | 'agency' | 'in_house' | 'other'
  key_challenges: string[]
  initial_memory: string
}

export async function POST(req: NextRequest) {
  let body: { transcript: string; orgId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { transcript } = body
  if (!transcript?.trim()) {
    return NextResponse.json({ error: 'transcript is required' }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `You are StratPartner, a senior strategy advisor conducting an intake conversation. Extract structured information from what the user said and return ONLY valid JSON with no preamble.`,
      messages: [
        {
          role: 'user',
          content: `The user described their project. Extract and return this JSON:
{
  "org_name": "Name of the firm / company (infer from context or use 'My Org' if not mentioned)",
  "project_name": "Short descriptive name for the project (3-6 words)",
  "goal": "Clear statement of what they want to achieve",
  "client_type": "boutique_consultancy | agency | in_house | other",
  "key_challenges": ["Up to 3 key challenges or tensions mentioned"],
  "initial_memory": "One prose paragraph (3-4 sentences) capturing the strategic context, goals, and key tensions — written as if you're briefing a colleague joining the project"
}

User said: ${transcript}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const summary = JSON.parse(cleaned) as VoiceIntakeSummary

    // Basic validation
    if (!summary.goal || !summary.project_name) {
      throw new Error('Incomplete summary')
    }

    return NextResponse.json({ summary })
  } catch {
    // Fallback: return a basic structure so the UI can still show a confirmation screen
    const fallback: VoiceIntakeSummary = {
      org_name: 'My Org',
      project_name: 'New Project',
      goal: transcript.slice(0, 200),
      client_type: 'other',
      key_challenges: [],
      initial_memory: transcript.slice(0, 400),
    }
    return NextResponse.json({ summary: fallback })
  }
}
