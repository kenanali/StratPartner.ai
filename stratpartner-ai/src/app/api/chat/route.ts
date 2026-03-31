import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const KSTACK_SYSTEM_PROMPT = `You are StratPartner — a senior strategic advisor built on the kstack methodology.

You think in patterns, not platitudes. You are direct, opinionated, and specific. You do not hedge when the answer is clear. You do not give generic frameworks when the situation calls for a sharp point of view.

Your operating principles:
- Pattern recognition first: connect what you're hearing now to patterns you've seen across companies, markets, and founders
- Specificity over generality: "your churn is a onboarding problem, not a product problem" beats "you should improve retention"
- Strategic compression: say in one sentence what others say in ten slides
- Challenge the framing: if the question is wrong, say so before answering
- Name the real constraint: most problems have one root cause; find it and say it plainly
- Respect intelligence: talk to founders as peers, not students

Voice: Think Charlie Munger meets a great operator. Blunt, insightful, occasionally provocative, never fluffy.

When you have relevant memory records from this org, weave them into your analysis — show you remember context. When you lack context, ask the one question that would unlock the most clarity.

Format: Short paragraphs preferred. Use bullets only when listing genuinely discrete items. No unnecessary headers. No "I hope this helps." No "Great question!"`

function extractMemoryFacts(message: string, response: string): string | null {
  // Extract durable facts: decisions, numbers, named entities, commitments
  const factPatterns = [
    /(?:we(?:'re| are)|our|the company)\s+(?:has|have|is|are|launched|raised|signed|closed|hired|targeting|building|moving)\s+[^.!?]+[.!?]/gi,
    /(?:\$[\d,]+(?:k|m|b)?|\d+%|\d+\s*(?:users|customers|employees|months|years))[^.!?]*[.!?]/gi,
    /(?:decided|agreed|confirmed|committed)\s+(?:to\s+)?[^.!?]+[.!?]/gi,
  ]

  const facts: string[] = []
  const combined = `${message} ${response}`

  for (const pattern of factPatterns) {
    const matches = combined.match(pattern) || []
    facts.push(...matches.map((f) => f.trim()))
  }

  if (facts.length === 0) return null

  // Return the most specific fact
  return facts.sort((a, b) => b.length - a.length)[0].slice(0, 500)
}

export async function POST(req: NextRequest) {
  let body: { org_id?: string; message?: string; session_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { org_id, message, session_id } = body

  if (!org_id || !message || !session_id) {
    return NextResponse.json(
      { error: 'org_id, message, and session_id are required' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  // Load last 10 messages for session context
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('org_id', org_id)
    .eq('session_id', session_id)
    .order('created_at', { ascending: false })
    .limit(10)

  const historyMessages = (history ?? []).reverse()

  // Load top 3 relevant memory records via simple text match
  const keywords = message
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 5)

  let memoryContext = ''
  if (keywords.length > 0) {
    const { data: memories } = await supabase
      .from('memory')
      .select('content, type')
      .eq('org_id', org_id)
      .or(keywords.map((k) => `content.ilike.%${k}%`).join(','))
      .order('created_at', { ascending: false })
      .limit(3)

    if (memories && memories.length > 0) {
      memoryContext =
        '\n\n[Relevant memory from this org]\n' +
        memories.map((m) => `- [${m.type}] ${m.content}`).join('\n')
    }
  }

  // Save user message
  await supabase.from('messages').insert({
    org_id,
    session_id,
    role: 'user',
    content: message,
  })

  // Build Anthropic messages array
  const anthropicMessages: Anthropic.MessageParam[] = [
    ...historyMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content as string,
    })),
    { role: 'user' as const, content: message },
  ]

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const systemPrompt = memoryContext
    ? KSTACK_SYSTEM_PROMPT + memoryContext
    : KSTACK_SYSTEM_PROMPT

  // Stream SSE response
  const encoder = new TextEncoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
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

        // Signal stream end
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()

        // Save assistant response
        await supabase.from('messages').insert({
          org_id,
          session_id,
          role: 'assistant',
          content: fullResponse,
        })

        // Extract and persist durable facts to memory
        const fact = extractMemoryFacts(message, fullResponse)
        if (fact) {
          await supabase.from('memory').insert({
            org_id,
            type: 'fact',
            content: fact,
          })
        }
      } catch (err) {
        const errMsg =
          err instanceof Error ? err.message : 'Streaming error'
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: errMsg })}\n\n`
          )
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
