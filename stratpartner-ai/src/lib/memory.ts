import { getSupabaseAdmin } from './supabase'

/**
 * Returns the full org memory as a single prose string.
 * The memory table stores multiple rows; we assemble them in order.
 */
export async function getOrgMemory(orgId: string): Promise<string> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('memory')
    .select('content, type, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })
    .limit(20)

  if (!data || data.length === 0) return ''

  return data.map(row => row.content).join('\n\n')
}

/**
 * Replaces all existing org memory with a single updated blob.
 * Called after memory extraction completes.
 */
export async function upsertOrgMemory(orgId: string, content: string): Promise<void> {
  if (!content.trim()) return

  const supabase = getSupabaseAdmin()

  // Delete existing memory rows
  await supabase.from('memory').delete().eq('org_id', orgId)

  // Insert the updated single memory blob
  await supabase.from('memory').insert({
    org_id: orgId,
    type: 'strategic',
    content: content.trim(),
  })
}

/**
 * Fire-and-forget memory extraction after each chat turn.
 * Runs a separate Anthropic call to update org memory.
 * Never awaited — does not block the streaming response.
 */
export function extractMemoryAsync(
  orgId: string,
  currentMemory: string,
  userMessage: string,
  assistantResponse: string
): void {
  // Import Anthropic lazily to avoid loading it in client contexts
  import('@anthropic-ai/sdk').then(({ default: Anthropic }) => {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    anthropic.messages
      .create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are updating the strategic memory for a CX transformation engagement.

Current memory:
${currentMemory || 'No memory yet — this is the beginning of the engagement.'}

New conversation:
User: ${userMessage}
Assistant: ${assistantResponse}

Identify any NEW information that should be added to or replace existing memory entries. Focus on: decisions made, strategic context revealed, client priorities, blockers mentioned, stakeholder names/dynamics, programme status changes.

Do not repeat what's already in memory. Do not add conversational filler. Return the UPDATED full memory as prose — max 800 words. If nothing new was learned, return the existing memory unchanged.`,
          },
        ],
      })
      .then(async (response) => {
        const updatedMemory = response.content[0].type === 'text' ? response.content[0].text : ''
        if (updatedMemory) {
          await upsertOrgMemory(orgId, updatedMemory)
        }
      })
      .catch(() => {
        // Memory extraction failure is non-critical — silently ignore
      })
  })
}
