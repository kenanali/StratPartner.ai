import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase'
import { SOUL } from '@/lib/soul'
import { getOrgMemory, extractMemoryAsync } from '@/lib/memory'
import { getRoleBySlug } from '@/lib/agents/roles'
import { parseDeliverable, saveDeliverable } from '@/lib/parseDeliverable'
import { retrieveRelevantChunks } from '@/lib/retrieve'

export interface WorkerInput {
  taskId: string
  orgId: string
  projectId?: string
  role: string // one of the 8 role slugs
  taskTitle: string
  taskBrief: string // what the agent should do
  goalAncestry?: {
    // context chain
    engagement_mission?: string
    phase_goal?: string
    workstream?: string
    task_brief?: string
  }
  // Optional: pre-created agent_run id from the API route
  agentRunId?: string
}

export interface WorkerResult {
  agentRunId: string
  status: 'done' | 'failed'
  deliverableId?: string
  tokensUsed?: number
}

export async function runAgentTask(
  input: WorkerInput,
  preCreatedRunId?: string
): Promise<WorkerResult> {
  const supabase = getSupabaseAdmin()

  // 1. Validate role
  const agentRole = getRoleBySlug(input.role)
  if (!agentRole) {
    throw new Error(`Unknown agent role: ${input.role}`)
  }

  // 2. Determine the agent_run id — use pre-created if provided
  const agentRunId = preCreatedRunId ?? input.agentRunId ?? crypto.randomUUID()

  try {
    // 3. Create agent_run row (only if not pre-created by API route)
    if (!preCreatedRunId && !input.agentRunId) {
      await supabase.from('agent_runs').insert({
        id: agentRunId,
        task_id: input.taskId,
        org_id: input.orgId,
        project_id: input.projectId ?? null,
        agent_role: input.role,
        status: 'running',
        started_at: new Date().toISOString(),
      })
    }

    // 4. Mark task as running
    await supabase
      .from('tasks')
      .update({ status: 'running' })
      .eq('id', input.taskId)

    // 5. Fetch org memory
    const orgMemory = await getOrgMemory(input.orgId)

    // 6. Optionally fetch project context
    let projectName: string | null = null
    let projectPhase: string | null = null
    if (input.projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('name, phase')
        .eq('id', input.projectId)
        .eq('org_id', input.orgId)
        .single()
      if (project) {
        projectName = (project.name as string) ?? null
        projectPhase = (project.phase as string) ?? null
      }
    }

    // 7. Build system prompt
    const parts: string[] = []

    parts.push(SOUL)

    if (orgMemory) {
      parts.push(`## ORG MEMORY\n${orgMemory}`)
    }

    if (projectName || input.goalAncestry) {
      const projectLines: string[] = ['## PROJECT CONTEXT']
      if (projectName) projectLines.push(`Project: ${projectName}`)
      if (projectPhase) projectLines.push(`Phase: ${projectPhase}`)
      if (input.goalAncestry?.engagement_mission) {
        projectLines.push(
          `Engagement mission: ${input.goalAncestry.engagement_mission}`
        )
      }
      if (input.goalAncestry?.phase_goal) {
        projectLines.push(`Goal: ${input.goalAncestry.phase_goal}`)
      }
      if (input.goalAncestry?.workstream) {
        projectLines.push(`Workstream: ${input.goalAncestry.workstream}`)
      }
      parts.push(projectLines.join('\n'))
    }

    parts.push(`## ROLE\n${agentRole.systemPromptSuffix}`)

    parts.push(`## TASK\n${input.taskBrief}`)

    parts.push(
      `## DELIVERABLE INSTRUCTION\nIf your response constitutes a complete strategic deliverable, end it with:\n---DELIVERABLE---\nTitle: [descriptive title]\n---`
    )

    let systemPrompt = parts.join('\n\n')

    // 8. RAG retrieval — only if OPENAI_API_KEY is present
    if (process.env.OPENAI_API_KEY) {
      try {
        const chunks = await retrieveRelevantChunks(
          input.taskBrief,
          input.orgId,
          5
        )
        if (chunks.length > 0) {
          systemPrompt +=
            '\n\n## RELEVANT SOURCES\n' +
            chunks
              .map((c) => `Source: ${c.fileName}\n${c.content}`)
              .join('\n\n---\n\n')
        }
      } catch {
        // RAG failure is non-critical — continue without context
      }
    }

    // 9. Call Anthropic (non-streaming)
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: input.taskBrief }],
    })

    const content =
      response.content[0].type === 'text' ? response.content[0].text : ''
    const tokensUsed =
      response.usage.input_tokens + response.usage.output_tokens

    // 10. Parse deliverable marker
    const { mainContent, meta } = parseDeliverable(content)

    // 11. Save deliverable if marker found
    let deliverableId: string | undefined
    if (meta) {
      const savedId = await saveDeliverable({
        orgId: input.orgId,
        projectId: input.projectId ?? null,
        title: meta.title,
        type: input.role,
        content: mainContent,
        taskId: input.taskId,
      })
      if (savedId) deliverableId = savedId
    }

    // 12. Update agent_run to done
    await supabase
      .from('agent_runs')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        tokens_used: tokensUsed,
        deliverable_id: deliverableId ?? null,
        execution_log: [
          {
            step: 'complete',
            content: mainContent.slice(0, 500),
            timestamp: new Date().toISOString(),
          },
        ],
      })
      .eq('id', agentRunId)

    // 13. Update task to done
    await supabase
      .from('tasks')
      .update({ status: 'done' })
      .eq('id', input.taskId)

    // 14. Write audit_log
    await supabase.from('audit_log').insert({
      org_id: input.orgId,
      project_id: input.projectId ?? null,
      agent_role: input.role,
      task_id: input.taskId,
      event_type: 'agent_run_completed',
      payload: {
        deliverable_saved: !!deliverableId,
        tokens_used: tokensUsed,
      },
    })

    // 15. Insert inbox message so user sees a notification
    const inboxContent = deliverableId
      ? `## ${agentRole.name} completed: ${input.taskTitle}\n\n${mainContent.slice(0, 600)}${mainContent.length > 600 ? '…' : ''}\n\n[View deliverable →](/dashboard/${input.orgId}/projects/${input.projectId ?? 'all'}/deliverables/${deliverableId})`
      : `## ${agentRole.name} completed: ${input.taskTitle}\n\n${mainContent.slice(0, 600)}${mainContent.length > 600 ? '…' : ''}`

    // Find most recent session for this org to attach the message to
    const { data: recentSession } = await supabase
      .from('sessions')
      .select('id')
      .eq('org_id', input.orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    await supabase.from('messages').insert({
      org_id: input.orgId,
      session_id: recentSession?.id ?? null,
      role: 'assistant',
      content: inboxContent,
      channel: 'agent',
    })

    // 16. Fire-and-forget memory update
    extractMemoryAsync(input.orgId, orgMemory, input.taskBrief, mainContent)

    return { agentRunId, status: 'done', deliverableId, tokensUsed }
  } catch (err) {
    // On failure — mark both agent_run and task as failed
    await supabase
      .from('agent_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', agentRunId)

    await supabase
      .from('tasks')
      .update({ status: 'failed' })
      .eq('id', input.taskId)

    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error'

    await supabase.from('audit_log').insert({
      org_id: input.orgId,
      project_id: input.projectId ?? null,
      agent_role: input.role,
      task_id: input.taskId,
      event_type: 'agent_run_failed',
      payload: { error: errorMessage },
    })

    return { agentRunId, status: 'failed' }
  }
}
