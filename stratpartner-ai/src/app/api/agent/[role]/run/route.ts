import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { runAgentTask } from '@/lib/agents/worker'
import { getRoleBySlug } from '@/lib/agents/roles'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: { role: string } }
) {
  const { role } = params

  // Validate role exists
  const agentRole = getRoleBySlug(role)
  if (!agentRole) {
    return NextResponse.json(
      { error: `Unknown agent role: ${role}` },
      { status: 400 }
    )
  }

  let body: { taskId?: string; orgId?: string; projectId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { taskId, orgId, projectId } = body
  if (!taskId || !orgId) {
    return NextResponse.json(
      { error: 'taskId and orgId required' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  // Fetch task to verify ownership + get brief
  const { data: task } = await supabase
    .from('tasks')
    .select(
      'id, title, brief, status, org_id, project_id, goal_ancestry, agent_role, skill_slug'
    )
    .eq('id', taskId)
    .eq('org_id', orgId)
    .single()

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (task.status === 'running') {
    return NextResponse.json(
      { error: 'Task is already running' },
      { status: 409 }
    )
  }

  // Pre-create agent_run row so we can return the id immediately
  const agentRunId = crypto.randomUUID()

  await supabase.from('agent_runs').insert({
    id: agentRunId,
    task_id: taskId,
    org_id: orgId,
    project_id: projectId ?? task.project_id ?? null,
    agent_role: role,
    status: 'running',
    started_at: new Date().toISOString(),
  })

  // Update task status immediately
  await supabase.from('tasks').update({ status: 'running' }).eq('id', taskId)

  // Fire worker async — do not await
  runAgentTask(
    {
      taskId,
      orgId,
      projectId: projectId ?? (task.project_id as string) ?? undefined,
      role,
      taskTitle: task.title as string,
      taskBrief: (task.brief as string) ?? (task.title as string),
      goalAncestry:
        (task.goal_ancestry as {
          engagement_mission?: string
          phase_goal?: string
          workstream?: string
          task_brief?: string
        }) ?? undefined,
    },
    agentRunId
  ).catch(async (err) => {
    // Uncaught error safety net — worker's own try/catch should handle this
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
      .eq('id', taskId)
    console.error(`Agent run ${agentRunId} failed:`, err)
  })

  return NextResponse.json({ agentRunId, status: 'running' })
}

// GET: poll status of a specific agent run
export async function GET(
  req: NextRequest,
  { params }: { params: { role: string } }
) {
  // role param is available but not needed for lookup — run is found by id
  void params

  const runId = req.nextUrl.searchParams.get('runId')
  const orgId = req.nextUrl.searchParams.get('orgId')

  if (!runId || !orgId) {
    return NextResponse.json(
      { error: 'runId and orgId required' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()
  const { data: run } = await supabase
    .from('agent_runs')
    .select(
      'id, status, tokens_used, completed_at, deliverable_id, execution_log'
    )
    .eq('id', runId)
    .eq('org_id', orgId)
    .single()

  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  return NextResponse.json({ run })
}
