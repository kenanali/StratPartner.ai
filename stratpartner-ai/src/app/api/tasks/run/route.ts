import { getSupabaseAdmin } from '@/lib/supabase'
import { retrieveRelevantChunks } from '@/lib/retrieve'
import { webSearch, formatSearchResults } from '@/lib/webSearch'
import { SOUL } from '@/lib/soul'
import { saveDeliverable } from '@/lib/parseDeliverable'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/tasks/run
 * Runs a research/deliverable task autonomously:
 * 1. Web search for external context
 * 2. RAG retrieval from org files
 * 3. Claude generates output
 * 4. Saves output to tasks + deliverables tables
 */
export async function POST(req: NextRequest) {
  const { taskId } = await req.json()
  if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  const { data: task, error: taskErr } = await supabase
    .from('tasks')
    .select('*, projects(name, memory, org_id)')
    .eq('id', taskId)
    .single()

  if (taskErr || !task) return NextResponse.json({ error: 'task not found' }, { status: 404 })

  // Mark in progress
  await supabase.from('tasks').update({ status: 'running' }).eq('id', taskId)

  const orgId = task.org_id
  const brief = task.brief ?? task.title

  // Parallel: web search + RAG
  const [searchResults, ragChunks] = await Promise.all([
    webSearch(`${task.title} strategy analysis`),
    retrieveRelevantChunks(brief, orgId),
  ])

  const ragContext = ragChunks.length > 0
    ? ragChunks.map((c) => `[${c.fileName}]\n${c.content}`).join('\n\n')
    : ''

  const webContext = formatSearchResults(searchResults)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectMemory = (task.projects as any)?.memory ?? ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectName = (task.projects as any)?.name ?? 'this engagement'

  const systemPrompt = [
    SOUL,
    projectMemory ? `## PROJECT CONTEXT\n${projectName}\n${projectMemory}` : '',
    ragContext ? `## INTERNAL DOCUMENTS\n${ragContext}` : '',
    webContext ? `## WEB RESEARCH\n${webContext}` : '',
    `## TASK\nProduce a thorough, structured strategic output for the following task. Format the output in markdown.\n\nTask: ${brief}`,
  ].filter(Boolean).join('\n\n')

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: brief }],
  })

  const output = message.content[0].type === 'text' ? message.content[0].text : ''

  // Save output to task
  await supabase.from('tasks').update({
    status: 'complete',
    output,
    completed_at: new Date().toISOString(),
  }).eq('id', taskId)

  // Save as deliverable
  const deliverableId = await saveDeliverable({
    orgId,
    projectId: task.project_id,
    title: task.title,
    type: task.type,
    content: output,
    taskId,
  })

  return NextResponse.json({ taskId, deliverableId, output })
}
