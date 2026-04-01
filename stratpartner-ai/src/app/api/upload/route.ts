import { NextRequest, NextResponse } from 'next/server'
import { ingestFile } from '@/lib/ingest'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Increase body size limit for file uploads
export const maxDuration = 60

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const orgId = formData.get('orgId') as string | null
  const projectId = formData.get('projectId') as string | null

  if (!file || !orgId) {
    return NextResponse.json(
      { error: 'file and orgId are required' },
      { status: 400 }
    )
  }

  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ]
  const isAllowed =
    allowedTypes.includes(file.type) ||
    file.name.endsWith('.pdf') ||
    file.name.endsWith('.docx') ||
    file.name.endsWith('.doc')

  if (!isAllowed) {
    return NextResponse.json(
      { error: 'Unsupported file type. Upload PDF or DOCX only.' },
      { status: 400 }
    )
  }

  // Validate file size (50MB max)
  const MAX_SIZE = 50 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 50MB.' },
      { status: 400 }
    )
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const { fileId, chunkCount } = await ingestFile(
      buffer,
      file.type || 'application/pdf',
      file.name,
      orgId,
      projectId ?? undefined
    )

    return NextResponse.json({ fileId, chunkCount, fileName: file.name })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'File processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
