import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from './supabase'
import { ingestFile } from './ingest'
import { upsertOrgMemory, getOrgMemory } from './memory'

interface TranscriptWord {
  text: string
  start_ms?: number
  end_ms?: number
}

interface TranscriptSegment {
  speaker: string
  words: TranscriptWord[]
}

interface ActionItem {
  text: string
  owner: string
  due: string | null
  suggested_agent_role: string | null
  suggested_skill_slug: string | null
}

interface Decision {
  text: string
  owner: string
  confidence: 'high' | 'medium' | 'low'
}

interface MeetingFindings {
  summary: string
  decisions: Decision[]
  action_items: ActionItem[]
  new_context: string[]
  open_questions: string[]
  memory_update: string
}

interface MeetingRow {
  id: string
  org_id: string
  project_id: string | null
  title: string | null
  platform: string | null
  transcript_raw: TranscriptSegment[]
  started_at: string | null
  ended_at: string | null
  proactive_message_sent: boolean
}

function flattenTranscript(raw: TranscriptSegment[]): string {
  if (!raw || raw.length === 0) return ''
  return raw
    .map((seg) => `${seg.speaker}: ${seg.words.map((w) => w.text).join(' ')}`)
    .join('\n')
}

function formatDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) return 'unknown duration'
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  const mins = Math.round(ms / 60000)
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hrs}h ${rem}min` : `${hrs}h`
}

function formatDate(iso: string | null): string {
  if (!iso) return 'unknown date'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const SKILL_LABELS: Record<string, string> = {
  'competitive-audit': 'Competitive Audit',
  'persona-build': 'Persona Build',
  'meeting-brief': 'Meeting Brief',
  'battlecard-generator': 'Battlecard Generator',
  'icp-identification': 'ICP Identification',
  'campaign-brief-generator': 'Campaign Brief',
  'qbr-deck-builder': 'QBR Deck',
  'sales-call-prep': 'Sales Call Prep',
  'journey-map': 'Journey Map',
  'biz-case': 'Business Case',
}

function collectSuggestedSkills(actionItems: ActionItem[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of actionItems) {
    if (item.suggested_skill_slug && !seen.has(item.suggested_skill_slug)) {
      seen.add(item.suggested_skill_slug)
      result.push(item.suggested_skill_slug)
    }
    if (result.length >= 3) break
  }
  return result
}

function buildProactiveBriefing(
  meeting: MeetingRow,
  findings: MeetingFindings,
  orgSlug: string,
  tasksCreated: Array<{ task_id: string; title: string }>,
  suggestedSkills: string[]
): string {
  const lines: string[] = []
  const title = meeting.title ?? 'Meeting'
  const duration = formatDuration(meeting.started_at, meeting.ended_at)
  const platform = meeting.platform ? meeting.platform.charAt(0).toUpperCase() + meeting.platform.slice(1) : 'Meeting'

  lines.push(`## I was in your meeting — here's what I captured`)
  lines.push(``)
  lines.push(`**${title}** · ${duration} · ${platform}`)
  lines.push(``)
  lines.push(`### Summary`)
  lines.push(findings.summary)

  if (findings.decisions.length > 0) {
    lines.push(``)
    lines.push(`### Decisions made`)
    findings.decisions.forEach((d) => {
      const ownerNote = d.owner !== 'unclear' ? ` *(${d.owner})*` : ''
      lines.push(`- ${d.text}${ownerNote}`)
    })
  }

  if (findings.action_items.length > 0) {
    lines.push(``)
    lines.push(`### Action items`)
    findings.action_items.forEach((item) => {
      const ownerNote = item.owner !== 'unclear' ? ` — *${item.owner}*` : ''
      const dueNote = item.due ? ` · due ${item.due}` : ''
      lines.push(`- ${item.text}${ownerNote}${dueNote}`)
    })
  }

  if (findings.open_questions.length > 0) {
    lines.push(``)
    lines.push(`### Open questions`)
    findings.open_questions.forEach((q) => lines.push(`- ${q}`))
  }

  if (suggestedSkills.length > 0) {
    lines.push(``)
    lines.push(`### What to do next`)
    lines.push(`Based on what I heard, here are the strategy skills most relevant right now:`)
    suggestedSkills.forEach((slug) => {
      const label = SKILL_LABELS[slug] ?? slug
      const relevantItem = findings.action_items.find((a) => a.suggested_skill_slug === slug)
      const context = relevantItem ? ` — ${relevantItem.text.slice(0, 80)}` : ''
      lines.push(`- **${label}**${context}`)
    })
    lines.push(``)
    lines.push(`Click a skill chip below to run it with this meeting as full context.`)
  }

  lines.push(``)
  const sourcesNote = `I've added the transcript to your Sources so you can reference it in future chats.`
  const tasksNote =
    tasksCreated.length > 0
      ? ` I've also created ${tasksCreated.length} task${tasksCreated.length > 1 ? 's' : ''} from the action items above.`
      : ''
  lines.push(sourcesNote + tasksNote)
  lines.push(``)
  lines.push(`[View full transcript →](/dashboard/${orgSlug}/meetings/${meeting.id})`)

  return lines.join('\n')
}

async function createTasksFromActionItems(
  meeting: MeetingRow,
  actionItems: ActionItem[]
): Promise<Array<{ task_id: string; title: string }>> {
  if (!actionItems || actionItems.length === 0) return []

  const supabase = getSupabaseAdmin()
  const tasksCreated: Array<{ task_id: string; title: string }> = []

  for (const item of actionItems) {
    try {
      const goalAncestry = {
        engagement_mission: meeting.title ?? 'Meeting follow-up',
        phase_goal: `Follow-up from meeting on ${formatDate(meeting.started_at)}`,
        workstream: item.suggested_agent_role ?? 'general',
        task_brief: item.text,
      }

      const { data: task } = await supabase
        .from('tasks')
        .insert({
          org_id: meeting.org_id,
          project_id: meeting.project_id ?? null,
          title: item.text,
          status: 'pending',
          agent_role: item.suggested_agent_role ?? null,
          skill_slug: item.suggested_skill_slug ?? null,
          goal_ancestry: goalAncestry,
        })
        .select('id')
        .single()

      if (task) {
        tasksCreated.push({ task_id: task.id, title: item.text })
      }
    } catch {
      // Non-critical — skip failed task creation
    }
  }

  return tasksCreated
}

/**
 * Fire-and-forget meeting extraction pipeline.
 * Called after meeting ends — never awaited from webhook handler.
 */
export function extractMeetingAsync(meetingId: string, orgSlug: string): void {
  ;(async () => {
    const supabase = getSupabaseAdmin()

    try {
      // 1. Fetch meeting
      const { data: meeting } = await supabase
        .from('meetings')
        .select('id, org_id, project_id, title, platform, transcript_raw, started_at, ended_at, proactive_message_sent')
        .eq('id', meetingId)
        .single()

      if (!meeting) return

      // 2. Idempotency guard
      if (meeting.proactive_message_sent) return

      // 3. Flatten transcript
      const transcriptText = flattenTranscript(meeting.transcript_raw ?? [])
      if (!transcriptText) {
        // No transcript — mark failed
        await supabase.from('meetings').update({ status: 'failed' }).eq('id', meetingId)
        return
      }

      // 4. Claude extraction
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const extractionResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: `You are StratPartner, a senior strategy advisor who attended a client meeting as a silent observer. Extract structured strategic intelligence from the transcript. Return ONLY valid JSON with no preamble or explanation.`,
        messages: [
          {
            role: 'user',
            content: `Meeting: ${meeting.title ?? 'Untitled Meeting'}
Date: ${formatDate(meeting.started_at)}
Duration: ${formatDuration(meeting.started_at, meeting.ended_at)}

Full transcript:
${transcriptText}

Extract strategic intelligence and return this exact JSON structure:
{
  "summary": "2-3 sentence executive summary of what the meeting was about and what was resolved",
  "decisions": [
    { "text": "Decision made", "owner": "Name or 'unclear'", "confidence": "high" }
  ],
  "action_items": [
    {
      "text": "What needs to happen",
      "owner": "Person responsible or 'unclear'",
      "due": "Timeframe mentioned or null",
      "suggested_agent_role": "researcher|persona-architect|journey-mapper|diagnostic|synthesis|delivery|null",
      "suggested_skill_slug": "journey-map|persona-build|biz-case|prioritize|null"
    }
  ],
  "new_context": ["Fact or strategic context revealed in this meeting"],
  "open_questions": ["Question raised but not resolved"],
  "memory_update": "Prose paragraph (max 300 words) of what should be added to or updated in the org strategic memory based on this meeting. Focus on: decisions made, priorities revealed, stakeholder dynamics, blockers surfaced, strategic direction changes."
}`,
          },
        ],
      })

      let findings: MeetingFindings
      try {
        const raw = extractionResponse.content[0].type === 'text' ? extractionResponse.content[0].text : '{}'
        findings = JSON.parse(raw.replace(/^```json\n?/, '').replace(/\n?```$/, ''))
      } catch {
        findings = {
          summary: 'Meeting transcript was captured but extraction encountered an error.',
          decisions: [],
          action_items: [],
          new_context: [],
          open_questions: [],
          memory_update: '',
        }
      }

      // 5. Ingest transcript as RAG source
      const transcriptFileName = `Meeting: ${meeting.title ?? 'Untitled'} — ${formatDate(meeting.started_at)}`
      let sourceFileId: string | null = null
      try {
        const { fileId } = await ingestFile(
          Buffer.from(transcriptText, 'utf-8'),
          'text/plain',
          transcriptFileName,
          meeting.org_id,
          meeting.project_id ?? undefined
        )
        sourceFileId = fileId
      } catch {
        // Non-critical — continue without source
      }

      // 6. Create tasks from action items + collect suggested skills
      const tasksCreated = await createTasksFromActionItems(meeting, findings.action_items ?? [])
      const suggestedSkills = collectSuggestedSkills(findings.action_items ?? [])

      // 7. Update org memory
      if (findings.memory_update) {
        try {
          const currentMemory = await getOrgMemory(meeting.org_id)
          const updatedMemory = currentMemory
            ? `${currentMemory}\n\n---\n\n${findings.memory_update}`
            : findings.memory_update
          await upsertOrgMemory(meeting.org_id, updatedMemory)
        } catch {
          // Non-critical
        }
      }

      // 8. Get org slug for briefing link (if not passed)
      let resolvedOrgSlug = orgSlug
      if (!resolvedOrgSlug) {
        const { data: org } = await supabase.from('orgs').select('slug').eq('id', meeting.org_id).single()
        resolvedOrgSlug = org?.slug ?? ''
      }

      // 9. Build + insert proactive briefing message
      const briefingContent = buildProactiveBriefing(meeting, findings, resolvedOrgSlug, tasksCreated, suggestedSkills)

      // Find most recent session_id for this org
      const { data: recentMsg } = await supabase
        .from('messages')
        .select('session_id')
        .eq('org_id', meeting.org_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const targetSessionId = recentMsg?.session_id ?? crypto.randomUUID()

      const { data: proactiveMsg } = await supabase
        .from('messages')
        .insert({
          org_id: meeting.org_id,
          session_id: targetSessionId,
          role: 'assistant',
          content: briefingContent,
          channel: 'recall',
          project_id: meeting.project_id ?? null,
          suggested_skills: suggestedSkills,
        })
        .select('id')
        .single()

      // 10. Mark meeting complete
      await supabase.from('meetings').update({
        status: 'complete',
        transcript_text: transcriptText,
        findings,
        source_file_id: sourceFileId,
        proactive_message_id: proactiveMsg?.id ?? null,
        proactive_message_sent: true,
        tasks_created: tasksCreated,
        session_id: targetSessionId,
      }).eq('id', meetingId)
    } catch {
      // Mark as failed if pipeline throws
      try { await supabase.from('meetings').update({ status: 'failed' }).eq('id', meetingId) } catch { /* ignore */ }
    }
  })()
}
