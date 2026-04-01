import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase'

interface IntakeBody {
  orgId: string
  projectName: string
  goal: string
  industry: string
  timeline: string
  stakeholders: string
  biggestChallenge: string
  deliverables: string[]
}

interface GeneratedTask {
  title: string
  brief: string
}

interface AIResponse {
  memorySeed: string
  tasks: GeneratedTask[]
}

export async function POST(req: NextRequest) {
  let body: IntakeBody

  try {
    body = (await req.json()) as IntakeBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    orgId,
    projectName,
    goal,
    industry,
    timeline,
    stakeholders,
    biggestChallenge,
    deliverables,
  } = body

  if (!orgId || !projectName || !goal || !biggestChallenge) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // 1. INSERT project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      org_id: orgId,
      name: projectName,
      description: goal,
      status: 'active',
      phase: 'intake',
    })
    .select('id')
    .single()

  if (projectError || !project) {
    console.error('[intake] project insert error:', projectError)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }

  const projectId: string = project.id

  // 2. INSERT intake record
  const { error: intakeError } = await supabase.from('intakes').insert({
    project_id: projectId,
    org_id: orgId,
    responses: {
      goal,
      industry,
      timeline,
      stakeholders,
      biggestChallenge,
      deliverables,
    },
    completed_at: new Date().toISOString(),
  })

  if (intakeError) {
    console.error('[intake] intake insert error:', intakeError)
    // Non-fatal — continue
  }

  // 3. Generate memory seed + tasks via Claude
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are a senior CX strategist onboarding a new client engagement. Based on this intake, generate:

1. A project memory seed: 3-4 sentences capturing the strategic context, goals, and key tensions for this engagement.
2. Three to five research tasks that would be most valuable to run first. Each task needs a title and a 2-sentence brief.

Respond with ONLY valid JSON:
{
  "memorySeed": "...",
  "tasks": [{ "title": "...", "brief": "..." }]
}

Intake:
Goal: ${goal}
Industry: ${industry}
Timeline: ${timeline}
Stakeholders: ${stakeholders}
Biggest challenge: ${biggestChallenge}
Deliverables needed: ${deliverables.join(', ')}`

  let aiResponse: AIResponse = {
    memorySeed: `${projectName} — ${goal}`,
    tasks: [
      {
        title: 'Initial discovery research',
        brief: `Gather foundational context for ${projectName}. Identify key stakeholder needs and existing constraints.`,
      },
    ],
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip markdown code fences if present
    const jsonText = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()

    const parsed = JSON.parse(jsonText) as AIResponse
    if (parsed.memorySeed && Array.isArray(parsed.tasks)) {
      aiResponse = parsed
    }
  } catch (aiErr) {
    console.error('[intake] AI generation error:', aiErr)
    // Fall through with defaults
  }

  // 4. UPDATE project with memory + advance phase
  const { error: updateError } = await supabase
    .from('projects')
    .update({ memory: aiResponse.memorySeed, phase: 'research' })
    .eq('id', projectId)

  if (updateError) {
    console.error('[intake] project update error:', updateError)
  }

  // 5. INSERT tasks
  const taskRows = aiResponse.tasks.map((t) => ({
    org_id: orgId,
    project_id: projectId,
    title: t.title,
    brief: t.brief,
    status: 'pending',
    assigned_to: 'agent',
    type: 'research',
  }))

  const { error: tasksError } = await supabase.from('tasks').insert(taskRows)

  if (tasksError) {
    console.error('[intake] tasks insert error:', tasksError)
    // Non-fatal
  }

  return NextResponse.json({ projectId, taskCount: aiResponse.tasks.length })
}
