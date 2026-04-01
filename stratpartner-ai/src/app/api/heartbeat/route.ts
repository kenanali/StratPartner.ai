import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface PendingTask {
  id: string
  title: string
  type: string | null
  agent_role: string | null
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { orgId?: string }
  const { orgId } = body

  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  // 1. Fetch pending tasks
  const { data: pendingTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, type, agent_role')
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10)

  if (tasksError) return NextResponse.json({ error: tasksError.message }, { status: 500 })

  // 2. Skip if nothing to report
  if (!pendingTasks || pendingTasks.length === 0) {
    return NextResponse.json({ messagesInserted: 0, taskCount: 0, skipped: true })
  }

  // 3. Fetch most recent session
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)

  let sessionId: string

  if (sessions && sessions.length > 0) {
    sessionId = (sessions[0] as { id: string }).id
  } else {
    // Create a new session
    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({ org_id: orgId })
      .select('id')
      .single()

    if (sessionError || !newSession) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    sessionId = (newSession as { id: string }).id
  }

  // 4. Build briefing content
  const taskList = (pendingTasks as PendingTask[])
    .map(
      (t) =>
        `- **${t.title}**${t.agent_role ? ` *(${t.agent_role})*` : ''}`
    )
    .join('\n')

  const content = `## What I can work on

Here are the tasks I'm ready to tackle:

${taskList}

Want me to start on any of these? Just say the word, or I can prioritise based on what's most urgent.`

  // 5. Insert heartbeat message
  const { error: insertError } = await supabase.from('messages').insert({
    org_id: orgId,
    session_id: sessionId,
    role: 'assistant',
    content,
    channel: 'heartbeat',
  })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  return NextResponse.json({
    messagesInserted: 1,
    taskCount: (pendingTasks as PendingTask[]).length,
  })
}
