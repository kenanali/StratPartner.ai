import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase'
import { SKILLS } from '@/lib/skills'
import { SOUL } from '@/lib/soul'
import { getOrgMemory } from '@/lib/memory'
import { parseDeliverable, saveDeliverable } from '@/lib/parseDeliverable'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function runSkillActivation(meetingId: string, skillSlug: string, orgId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const skill = SKILLS[skillSlug]
  if (!skill) return

  // 1. Fetch meeting + org slug + project context in parallel
  const [meetingResult, orgResult] = await Promise.all([
    supabase
      .from('meetings')
      .select('id, org_id, project_id, title, transcript_text, transcript_raw, findings, session_id, started_at')
      .eq('id', meetingId)
      .single(),
    supabase.from('orgs').select('slug').eq('id', orgId).single(),
  ])

  const meeting = meetingResult.data
  if (!meeting) return
  const orgSlug = orgResult.data?.slug ?? ''

  // 2. Fetch org memory + project context
  const [orgMemory, projectResult] = await Promise.all([
    getOrgMemory(orgId),
    meeting.project_id
      ? supabase.from('projects').select('name, goal').eq('id', meeting.project_id).single()
      : Promise.resolve({ data: null }),
  ])

  // 3. Build transcript text
  type TranscriptSegment = { speaker: string; words: Array<{ text: string }> }
  let transcriptText = (meeting.transcript_text as string) ?? ''
  if (!transcriptText && Array.isArray(meeting.transcript_raw)) {
    transcriptText = (meeting.transcript_raw as TranscriptSegment[])
      .map(seg => `${seg.speaker}: ${seg.words.map(w => w.text).join(' ')}`)
      .join('\n')
  }

  // 4. Build system prompt
  const systemParts: string[] = [SOUL]
  if (orgMemory) systemParts.push(`## Org Strategic Memory\n${orgMemory}`)
  if (projectResult?.data) {
    const p = projectResult.data as { name?: string; goal?: string }
    const lines = ['## Project Context']
    if (p.name) lines.push(`**Project:** ${p.name}`)
    if (p.goal) lines.push(`**Goal:** ${p.goal}`)
    systemParts.push(lines.join('\n'))
  }
  systemParts.push(skill.content)
  const systemPrompt = systemParts.join('\n\n')

  // 5. Build user message with meeting context
  type Findings = { summary?: string; decisions?: Array<{ text: string }>; action_items?: Array<{ text: string }> }
  const findings = (meeting.findings as Findings) ?? {}

  const contextLines = [
    `Run the **${skill.name}** skill using context from this meeting.`,
    '',
    `**Meeting:** ${meeting.title ?? 'Untitled Meeting'}`,
  ]
  if (transcriptText) contextLines.push(`\n**Transcript:**\n${transcriptText}`)
  if (findings.summary) contextLines.push(`\n**Meeting Summary:** ${findings.summary}`)
  if (findings.decisions?.length) {
    contextLines.push(`\n**Decisions made:** ${findings.decisions.map(d => d.text).join('; ')}`)
  }
  if (findings.action_items?.length) {
    contextLines.push(`\n**Action items:** ${findings.action_items.map(a => a.text).join('; ')}`)
  }
  const userMessage = contextLines.join('\n')

  // 6. Run Claude
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const rawContent = response.content[0].type === 'text' ? response.content[0].text : ''

  // 7. Parse + save deliverable
  const { mainContent, meta } = parseDeliverable(rawContent)
  const deliverableTitle = meta?.title ?? `${skill.name} — ${meeting.title ?? 'Meeting'}`
  const deliverableId = await saveDeliverable({
    orgId,
    projectId: (meeting.project_id as string) ?? null,
    title: deliverableTitle,
    type: skillSlug,
    content: mainContent,
    sessionId: (meeting.session_id as string) ?? undefined,
  })

  // 8. Build + send inbox completion message
  const deliverableLink = deliverableId && orgSlug
    ? `\n\n[View in Files →](/dashboard/${orgSlug}/files)`
    : ''

  const preview = mainContent.slice(0, 600) + (mainContent.length > 600 ? '\n\n…' : '')

  const completionContent = [
    `## ${skill.name} — complete`,
    '',
    `I ran **${skill.name}** using context from your meeting "${meeting.title ?? 'Untitled Meeting'}".`,
    '',
    preview,
    deliverableLink,
  ].join('\n')

  const sessionId = (meeting.session_id as string) ?? crypto.randomUUID()
  await supabase.from('messages').insert({
    org_id: orgId,
    session_id: sessionId,
    role: 'assistant',
    content: completionContent,
    channel: 'skill_complete',
    project_id: (meeting.project_id as string) ?? null,
    payload: { meeting_id: meetingId, skill_slug: skillSlug, deliverable_id: deliverableId },
  })
}

export async function POST(req: NextRequest) {
  const { meetingId, skillSlug, orgId } = await req.json()

  if (!meetingId || !skillSlug || !orgId) {
    return NextResponse.json({ error: 'meetingId, skillSlug, and orgId required' }, { status: 400 })
  }
  if (!SKILLS[skillSlug]) {
    return NextResponse.json({ error: `Unknown skill: ${skillSlug}` }, { status: 400 })
  }

  waitUntil(
    runSkillActivation(meetingId, skillSlug, orgId).catch(() => { /* silently fail */ })
  )

  return NextResponse.json({ ok: true })
}
