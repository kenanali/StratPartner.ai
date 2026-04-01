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
  const ALLOWED_EXTS = ['.pdf', '.docx', '.doc', '.txt', '.md', '.markdown', '.csv', '.json', '.xml', '.yaml', '.yml', '.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.css', '.sql', '.html', '.htm']
  const nameLower = file.name.toLowerCase()
  const isAllowed =
    file.type.startsWith('text/') ||
    file.type === 'application/pdf' ||
    file.type === 'application/json' ||
    file.type === 'application/xml' ||
    file.type.includes('wordprocessingml') ||
    file.type === 'application/msword' ||
    ALLOWED_EXTS.some(ext => nameLower.endsWith(ext))

  if (!isAllowed) {
    return NextResponse.json(
      { error: 'Unsupported file type. Upload PDF, DOCX, MD, TXT, CSV, JSON, or code files.' },
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
