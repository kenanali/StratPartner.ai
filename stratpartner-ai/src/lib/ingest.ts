import OpenAI from 'openai'
import { getSupabaseAdmin } from './supabase'

interface Chunk {
  text: string
  index: number
}

/**
 * Splits text into overlapping chunks of ~500 words with 50-word overlap.
 * Tries to split on sentence boundaries where possible.
 */
function chunkText(text: string, fileName: string): Chunk[] {
  const TARGET_WORDS = 500
  const OVERLAP_WORDS = 50

  const sentences = text
    .replace(/\n{3,}/g, '\n\n')
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0)

  const chunks: Chunk[] = []
  let currentWords: string[] = []
  let chunkIndex = 0

  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/)
    currentWords.push(...sentenceWords)

    if (currentWords.length >= TARGET_WORDS) {
      const text = `[Source: ${fileName}, chunk ${chunkIndex + 1}]\n\n${currentWords.join(' ')}`
      chunks.push({ text, index: chunkIndex })
      chunkIndex++
      currentWords = currentWords.slice(-OVERLAP_WORDS)
    }
  }

  if (currentWords.length > 0) {
    const text = `[Source: ${fileName}, chunk ${chunkIndex + 1}]\n\n${currentWords.join(' ')}`
    chunks.push({ text, index: chunkIndex })
  }

  return chunks
}

function inBatches<T>(arr: T[], size: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size))
  }
  return batches
}

/**
 * Parses a file buffer into plain text.
 * Supports PDF (via pdf-parse) and DOCX (via mammoth).
 */
async function extractText(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const isPdf = mimeType === 'application/pdf' || mimeType.includes('pdf') || fileName.endsWith('.pdf')
  const isDocx =
    mimeType.includes('wordprocessingml') ||
    mimeType.includes('docx') ||
    mimeType === 'application/msword' ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.doc')

  if (isPdf) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>
    const parsed = await pdfParse(buffer)
    return parsed.text
  } else if (isDocx) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } else {
    throw new Error('Unsupported file type. Upload PDF or DOCX only.')
  }
}

/**
 * Full ingestion pipeline:
 * 1. Extract text
 * 2. Chunk with overlap
 * 3. Embed via OpenAI
 * 4. Save file record + chunks to Supabase
 */
export async function ingestFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  orgId: string,
  projectId?: string
): Promise<{ fileId: string; chunkCount: number }> {
  const supabase = getSupabaseAdmin()

  const rawText = await extractText(buffer, mimeType, fileName)
  const text = rawText.replace(/\n{3,}/g, '\n\n').trim()

  if (!text) {
    throw new Error('Could not extract text from this file. The document may be empty or image-only.')
  }

  const chunks = chunkText(text, fileName)
  if (chunks.length === 0) {
    throw new Error('No content could be extracted from this file.')
  }

  // Save file record
  const { data: file, error: fileError } = await supabase
    .from('files')
    .insert({
      org_id: orgId,
      filename: fileName,
      name: fileName,
      mime_type: mimeType,
      is_active: true,
      storage_path: '',
      project_id: projectId ?? null,
    })
    .select('id')
    .single()

  if (fileError || !file) {
    throw new Error(`Failed to save file record: ${fileError?.message}`)
  }

  // Embed and save chunks
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  for (const batch of inBatches(chunks, 20)) {
    const embedResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch.map((c) => c.text),
    })

    await supabase.from('file_chunks').insert(
      batch.map((chunk, i) => ({
        file_id: file.id,
        org_id: orgId,
        chunk_text: chunk.text,
        embedding: embedResponse.data[i].embedding,
        chunk_index: chunk.index,
      }))
    )
  }

  return { fileId: file.id, chunkCount: chunks.length }
}
