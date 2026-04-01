import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase'
import { upsertOrgMemory } from '@/lib/memory'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json() as { orgId?: string }
  const { orgId } = body

  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  const { data: messages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!messages || messages.length === 0) {
    return NextResponse.json({ content: '', skipped: true })
  }

  const transcript = messages
    .map((m: { role: string; content: string | null }) =>
      `${m.role}: ${(m.content ?? '').slice(0, 500)}`
    )
    .join('\n')

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `Based on these recent interactions, write a concise strategic memory for this organization. This memory will be prepended to every future AI conversation to give context. Write it as flowing prose, 3-6 sentences. Focus on: the organization's strategic goals, key context, important decisions made, and ongoing priorities.\n\nInteractions:\n${transcript}`,
      },
    ],
  })

  const newMemory =
    response.content[0].type === 'text' ? response.content[0].text : ''

  await upsertOrgMemory(orgId, newMemory)
  return NextResponse.json({ content: newMemory })
}
