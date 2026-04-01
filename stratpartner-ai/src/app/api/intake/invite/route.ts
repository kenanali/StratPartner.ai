import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase'

interface InviteBody {
  projectId: string
  orgId: string
  orgSlug: string
}

interface MergeBody {
  projectId: string
  token: string
  responses: Record<string, unknown>
}

/** POST /api/intake/invite — generate a shareable onboarding token */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as InviteBody | MergeBody

  // Determine which action is being requested
  if ('token' in body && 'responses' in body) {
    // Merge teammate responses into existing intake record
    return handleMerge(body as MergeBody)
  }

  return handleGenerate(body as InviteBody)
}

async function handleGenerate(body: InviteBody) {
  const { projectId, orgId, orgSlug } = body

  if (!projectId || !orgId || !orgSlug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const token = randomBytes(4).toString('hex')
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('projects')
    .update({ intake_token: token })
    .eq('id', projectId)
    .eq('org_id', orgId)

  if (error) {
    console.error('[intake/invite] token store error:', error)
    return NextResponse.json({ error: 'Failed to generate invite' }, { status: 500 })
  }

  const url = `/onboard/${orgSlug}?project=${projectId}&token=${token}`

  return NextResponse.json({ token, url })
}

async function handleMerge(body: MergeBody) {
  const { projectId, token, responses } = body

  if (!projectId || !token) {
    return NextResponse.json({ error: 'Missing projectId or token' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Verify token
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('intake_token', token)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 403 })
  }

  // Append to intake responses
  const { data: existing } = await supabase
    .from('intakes')
    .select('id, responses')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    const merged = {
      ...(existing.responses as Record<string, unknown>),
      teammate_responses: [
        ...((existing.responses as Record<string, unknown[]>).teammate_responses ?? []),
        { ...responses, submitted_at: new Date().toISOString() },
      ],
    }

    await supabase
      .from('intakes')
      .update({ responses: merged })
      .eq('id', existing.id)
  }

  return NextResponse.json({ ok: true })
}
