import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getOrgMemory, extractMemoryAsync } from '@/lib/memory'
import { retrieveRelevantChunks } from '@/lib/retrieve'
import { detectSkill } from '@/lib/detectSkill'
import { buildSystemPrompt } from '@/lib/systemPrompt'
import { parseDeliverable, saveDeliverable } from '@/lib/parseDeliverable'
import { webSearch } from '@/lib/webSearch'

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

  // Tool definitions — web_search always available if key set, fetch_url always available
  const tools: Anthropic.Tool[] = []

  if (process.env.BRAVE_SEARCH_API_KEY) {
    tools.push({
      name: 'web_search',
      description: 'Search the web for current information: company data, market research, competitor intel, news, job postings, trends, pricing, etc. Use this whenever you need fresh data from the internet.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'The search query' },
          count: { type: 'number', description: 'Number of results to return (1-10, default 5)' },
        },
        required: ['query'],
      },
    })
  }

  tools.push({
    name: 'fetch_url',
    description: 'Fetch and read the text content of a specific URL. Use this to read web pages, articles, company websites, blog posts, etc. after finding URLs via web_search.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'The full URL to fetch (must start with https://)' },
      },
      required: ['url'],
    },
  })

  async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
    if (name === 'web_search') {
      const results = await webSearch(input.query as string, (input.count as number) ?? 5)
      if (!results.length) return 'No results found.'
      return results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.description}`).join('\n\n')
    }
    if (name === 'fetch_url') {
      const url = input.url as string
      if (!url.startsWith('http')) return 'Invalid URL — must start with http:// or https://'
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StratPartner/1.0; research bot)' },
          signal: AbortSignal.timeout(15000),
        })
        if (!res.ok) return `Failed to fetch: HTTP ${res.status}`
        const html = await res.text()
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 10000)
        return text || 'No readable content found at this URL.'
      } catch (err) {
        return `Error fetching URL: ${err instanceof Error ? err.message : 'Unknown error'}`
      }
    }
    return 'Unknown tool'
  }

  const encoder = new TextEncoder()
  let fullResponse = ''
  let deliverablePayload: { id: string; title: string; type: string; content: string } | null = null

  // 11. Auto-title session on first message
  const isFirstMessage = historyMessages.length === 0
  let sessionTitle: string | null = null
  if (isFirstMessage) {
    const raw = message.replace(/^\/[\w-]+ ?/, '').trim() // strip /skill prefix
    sessionTitle = raw.length > 52 ? raw.slice(0, 49) + '…' : (raw || 'New conversation')
    // Fire and forget — don't block the stream
    supabase.from('sessions').update({ title: sessionTitle }).eq('id', session_id).then(() => {})
  }

  // 12. Agentic tool loop + streaming
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send title event immediately so the sidebar updates in real-time
        if (sessionTitle) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ session_title: sessionTitle })}\n\n`))
        }

        const currentMessages: Anthropic.MessageParam[] = [...anthropicMessages]
        const MAX_TOOL_ROUNDS = 8

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          // Final round or no tools: stream the response
          const isLastRound = round === MAX_TOOL_ROUNDS - 1

          if (isLastRound || tools.length === 0) {
            // Stream final response
            const anthropicStream = await anthropic.messages.stream({
              model: 'claude-sonnet-4-6',
              max_tokens: 4096,
              system: systemPrompt,
              messages: currentMessages,
            })
            for await (const chunk of anthropicStream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                fullResponse += chunk.delta.text
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
              }
            }
            break
          }

          // Tool-capable round: non-streaming so we can inspect tool calls
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: systemPrompt,
            messages: currentMessages,
            tools,
            tool_choice: { type: 'auto' },
          })

          // Collect text and tool calls from this response
          let roundText = ''
          const toolUses: Array<{ id: string; name: string; input: Record<string, unknown> }> = []
          for (const block of response.content) {
            if (block.type === 'text') roundText += block.text
            else if (block.type === 'tool_use') toolUses.push({ id: block.id, name: block.name, input: block.input as Record<string, unknown> })
          }

          // Stream any text from this round
          if (roundText) {
            fullResponse += roundText
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: roundText })}\n\n`))
          }

          // No tool calls = Claude is done
          if (toolUses.length === 0 || response.stop_reason === 'end_turn') break

          // Execute tools, emit structured SSE events (not embedded text)
          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const toolUse of toolUses) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tool_start: { name: toolUse.name, input: toolUse.input } })}\n\n`))
            const result = await executeTool(toolUse.name, toolUse.input)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tool_end: { name: toolUse.name } })}\n\n`))
            toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
          }

          // Add this round's exchange to messages and continue
          currentMessages.push({ role: 'assistant', content: response.content })
          currentMessages.push({ role: 'user', content: toolResults })
        }

        // Send suggested skills before closing (parsed post-stream below)
        // We close after all post-processing SSE events
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))

        // Post-stream: parse NEXT_SKILLS marker
        const nextSkillsMatch = fullResponse.match(/\nNEXT_SKILLS:\s*([^\n]+)/i)
        const nextSkillSlugs: string[] = nextSkillsMatch
          ? nextSkillsMatch[1].split(',').map(s => s.trim().replace(/^\//, '')).filter(Boolean)
          : []
        const responseWithoutSkills = fullResponse.replace(/\nNEXT_SKILLS:[^\n]*/i, '').trimEnd()

        // Parse deliverable marker
        const { mainContent, meta } = parseDeliverable(responseWithoutSkills)
        const displayContent = meta ? mainContent : responseWithoutSkills

        await supabase.from('messages').insert({
          org_id,
          session_id,
          role: 'assistant',
          content: displayContent,
          channel: 'web',
          skill_used: detectedSkill?.slug ?? null,
          project_id: project_id ?? null,
        })

        if (meta && detectedSkill) {
          const deliverableId = await saveDeliverable({
            orgId: org_id,
            projectId: project_id ?? null,
            title: meta.title,
            type: detectedSkill.slug,
            content: mainContent,
            sessionId: session_id,
          })
          if (deliverableId) {
            deliverablePayload = { id: deliverableId, title: meta.title, type: detectedSkill.slug, content: mainContent }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ deliverable: deliverablePayload })}\n\n`))
          }
        }

        // Send suggested skills event if any
        if (nextSkillSlugs.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ suggested_skills: nextSkillSlugs })}\n\n`))
        }
        controller.close()

        extractMemoryAsync(org_id, orgMemory, message, displayContent)
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Streaming error'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`))
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
