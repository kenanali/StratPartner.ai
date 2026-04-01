import OpenAI from 'openai'
import { getSupabaseAdmin } from './supabase'

export interface RetrievedChunk {
  content: string
  fileName: string
  similarity: number
}

/**
 * Embeds a query and retrieves the top-K most similar file chunks for the org.
 * Uses the match_file_chunks Supabase RPC function.
 */
export async function retrieveRelevantChunks(
  query: string,
  orgId: string,
  topK = 5,
  similarityThreshold = 0.25
): Promise<RetrievedChunk[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })

  const queryEmbedding = embeddingResponse.data[0].embedding
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase.rpc('match_file_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: similarityThreshold,
    match_count: topK,
    filter_org_id: orgId,
  })

  if (error) {
    // RPC function may not exist yet — fail gracefully
    console.error('retrieve error:', error.message)
    return []
  }

  return (data ?? []).map(
    (row: { content: string; file_name: string; similarity: number }) => ({
      content: row.content,
      fileName: row.file_name,
      similarity: row.similarity,
    })
  )
}
