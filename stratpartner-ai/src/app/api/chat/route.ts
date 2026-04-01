import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getOrgMemory, extractMemoryAsync } from '@/lib/memory'
import { retrieveRelevantChunks } from '@/lib/retrieve'
import { detectSkill } from '@/lib/detectSkill'
import { buildSystemPrompt } from '@/lib/systemPrompt'
import { parseDeliverable, saveDeliverable } from '@/lib/parseDeliverable'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Attachment {
  type: 'image' | 'document' | 'text'
  mimeType?: string
  data?: string      // base64 for image/document
  content?: string   // plain text for text type
  fileName: string
}

export async function POST(req: NextRequest) {
  let body: {
    org_id?: string
    message?: string
    session_id?: string
    project_id?: string
    attachments?: Attachment[]
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { org_id, message, session_id, project_id, attachments = [] } = body

  if (!org_id || !message || !session_id) {
    return NextResponse.json(
      { error: 'org_id, message, and session_id are required' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  // 1. Load org by id — validate it exists
  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('id', org_id)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })
  }

  // 2. Load last 10 messages for session history
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('org_id', org_id)
    .eq('session_id', session_id)
    .order('created_at', { ascending: false })
    .limit(10)

  const historyMessages = (history ?? []).reverse()

  // 3. Load active skills for this org
  const { data: orgSkillsData } = await supabase
    .from('org_skills')
    .select('skills(slug)')
    .eq('org_id', org_id)
    .eq('enabled', true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeSlugs: string[] = (orgSkillsData ?? []).flatMap((row: any) => {
    const s = row.skills
    if (!s) return []
    return Array.isArray(s) ? s.map((x: { slug: string }) => x.slug) : [s.slug]
  })

  // 4. Detect skill trigger
  const detectedSkill = detectSkill(message, activeSlugs)

  // 5. Load org memory
  const orgMemory = await getOrgMemory(org_id)

  // 6. Load project context if projectId provided
  let projectContext = null
  if (project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('name, phase, description, memory')
      .eq('id', project_id)
      .eq('org_id', org_id)
      .single()

    if (project) {
      projectContext = {
        name: project.name as string,
        phase: project.phase as string,
        description: (project.description as string) ?? '',
        memory: (project.memory as string) ?? '',
      }
    }
  }

  // 7. Retrieve relevant file chunks (skip if OPENAI_API_KEY not set)
  let retrievedChunks: Awaited<ReturnType<typeof retrieveRelevantChunks>> = []
  if (process.env.OPENAI_API_KEY) {
    try {
      retrievedChunks = await retrieveRelevantChunks(message, org_id)
    } catch {
      // RAG failure is non-critical — continue without context
    }
  }

  // 8. Build system prompt
  const systemPrompt = buildSystemPrompt({
    orgMemory,
    retrievedChunks,
    activeSlugs,
    detectedSkill,
    projectContext,
  })

  // 9. Save user message
  await supabase.from('messages').insert({
    org_id,
    session_id,
    role: 'user',
    content: message,
    channel: 'web',
    skill_used: detectedSkill?.slug ?? null,
    project_id: project_id ?? null,
  })

  // 10. Build Anthropic messages array
  // Build user content — attachments first, then text
  const userContent: Anthropic.ContentBlockParam[] = []

  for (const att of attachments) {
    if (att.type === 'image' && att.data && att.mimeType) {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
      type ImageMediaType = typeof validImageTypes[number]
      const mediaType: ImageMediaType = validImageTypes.includes(att.mimeType as ImageMediaType)
        ? (att.mimeType as ImageMediaType)
        : 'image/jpeg'
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: att.data },
      })
    } else if (att.type === 'document' && att.data) {
      userContent.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: att.data },
      } as Anthropic.ContentBlockParam)
    } else if (att.type === 'text' && att.content) {
      userContent.push({
        type: 'text',
        text: `[Attached file: ${att.fileName}]\n\`\`\`\n${att.content}\n\`\`\``,
      })
    }
  }

  userContent.push({ type: 'text', text: message })

  const userMessage: Anthropic.MessageParam = {
    role: 'user',
    content: userContent.length === 1 ? message : userContent,
  }

  const anthropicMessages: Anthropic.MessageParam[] = [
    ...historyMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content as string,
    })),
    userMessage,
  ]

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const encoder = new TextEncoder()
  let fullResponse = ''

  // 11. Stream response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: systemPrompt,
          messages: anthropicMessages,
        })

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const text = chunk.delta.text
            fullResponse += text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            )
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()

        // Post-stream: parse deliverable marker, save message, update memory
        const { mainContent, meta } = parseDeliverable(fullResponse)
        const displayContent = meta ? mainContent : fullResponse

        // Save assistant message (with marker stripped if present)
        await supabase.from('messages').insert({
          org_id,
          session_id,
          role: 'assistant',
          content: displayContent,
          channel: 'web',
          skill_used: detectedSkill?.slug ?? null,
          project_id: project_id ?? null,
        })

        // Auto-save deliverable if marker was found and we're in a project
        if (meta && project_id && detectedSkill) {
          await saveDeliverable({
            orgId: org_id,
            projectId: project_id,
            title: meta.title,
            type: detectedSkill.slug,
            content: mainContent,
            sessionId: session_id,
          })
        }

        // Update memory asynchronously (non-blocking)
        extractMemoryAsync(org_id, orgMemory, message, displayContent)
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Streaming error'
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
