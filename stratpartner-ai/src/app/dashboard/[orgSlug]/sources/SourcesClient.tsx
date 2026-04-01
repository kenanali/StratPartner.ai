'use client'

import { useState, useCallback, useRef, DragEvent } from 'react'

interface Source {
  id: string
  name: string
  mimeType: string
  createdAt: string
  chunkCount: number
}

interface Deliverable {
  id: string
  title: string
  type: string
  content: string
  createdAt: string
}

interface Props {
  orgId: string
  orgSlug: string
  initialSources: Source[]
  initialDeliverables: Deliverable[]
}

interface UploadingFile {
  id: string
  name: string
  progress: 'uploading' | 'processing' | 'done' | 'error'
  error?: string
}

const ACCEPTED = '.pdf,.docx,.doc,.txt,.md,.markdown,.csv,.json,.xml,.yaml,.yml,.ts,.tsx,.js,.jsx,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.css,.sql,.html'
const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain', 'text/markdown', 'text/csv', 'text/html', 'text/xml',
  'application/json', 'application/xml',
]

function mimeLabel(mime: string, name: string): string {
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'PDF'
  if (mime.includes('wordprocessingml') || name.endsWith('.docx')) return 'DOCX'
  if (mime.includes('msword') || name.endsWith('.doc')) return 'DOC'
  const ext = name.split('.').pop()?.toUpperCase()
  if (ext) return ext
  return mime.split('/').pop()?.toUpperCase() ?? 'FILE'
}

function downloadMd(d: Deliverable) {
  const blob = new Blob([d.content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${d.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
  a.click()
  URL.revokeObjectURL(url)
}

export default function SourcesClient({ orgId, orgSlug, initialSources, initialDeliverables }: Props) {
  const [sources, setSources] = useState<Source[]>(initialSources)
  const [deliverables] = useState<Deliverable[]>(initialDeliverables)
  const [activeTab, setActiveTab] = useState<'sources' | 'outputs'>('sources')
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const uploadFiles = useCallback(async (files: File[]) => {
    const ACCEPTED_EXTS = ACCEPTED.split(',')
    const valid = files.filter(f =>
      ACCEPTED_MIME.includes(f.type) ||
      f.type.startsWith('text/') ||
      ACCEPTED_EXTS.some(ext => f.name.toLowerCase().endsWith(ext))
    )

    if (!valid.length) return

    const entries: UploadingFile[] = valid.map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      progress: 'uploading',
    }))
    setUploading(prev => [...prev, ...entries])

    await Promise.all(valid.map(async (file, i) => {
      const entryId = entries[i].id
      try {
        setUploading(prev => prev.map(u => u.id === entryId ? { ...u, progress: 'processing' } : u))

        const formData = new FormData()
        formData.append('file', file)
        formData.append('orgId', orgId)

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()

        if (!res.ok) throw new Error(data.error ?? 'Upload failed')

        setSources(prev => [{
          id: data.fileId,
          name: data.fileName,
          mimeType: file.type,
          createdAt: new Date().toISOString(),
          chunkCount: data.chunkCount,
        }, ...prev])

        setUploading(prev => prev.map(u => u.id === entryId ? { ...u, progress: 'done' } : u))
        setTimeout(() => setUploading(prev => prev.filter(u => u.id !== entryId)), 2000)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setUploading(prev => prev.map(u => u.id === entryId ? { ...u, progress: 'error', error: msg } : u))
      }
    }))
  }, [orgId])

  async function deleteSource(id: string) {
    setSources(prev => prev.filter(s => s.id !== id))
    await fetch(`/api/files?fileId=${id}&orgId=${orgId}`, { method: 'DELETE' })
  }

  const onDragEnter = (e: DragEvent) => { e.preventDefault(); dragCounter.current++; setIsDragging(true) }
  const onDragLeave = (e: DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false) }
  const onDragOver = (e: DragEvent) => e.preventDefault()
  const onDrop = (e: DragEvent) => {
    e.preventDefault(); dragCounter.current = 0; setIsDragging(false)
    uploadFiles(Array.from(e.dataTransfer.files))
  }

  const isEmpty = sources.length === 0 && uploading.length === 0

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['sources', 'outputs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'sources' ? `Sources (${sources.length})` : `Outputs (${deliverables.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'outputs' && (
        <div>
          {deliverables.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center">
              <p className="text-sm text-gray-400">No outputs yet.</p>
              <p className="mt-1 text-xs text-gray-300">Use skills in chat to generate strategy deliverables.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deliverables.map(d => (
                <div key={d.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold uppercase">
                      {d.type.slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                      <p className="text-xs text-gray-400">{d.type} · {new Date(d.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadMd(d)}
                    className="ml-4 shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Download MD
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sources' && <div className="grid gap-8 lg:grid-cols-5">
      {/* Upload panel */}
      <div className="lg:col-span-2">
        <div
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            className="hidden"
            onChange={e => { uploadFiles(Array.from(e.target.files ?? [])); e.target.value = '' }}
          />
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
            <svg className="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0-3 3m3-3 3 3M6.5 19a4.5 4.5 0 01-.86-8.93A5.5 5.5 0 1118 11.09V19" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">
            {isDragging ? 'Drop to add sources' : 'Add sources'}
          </p>
          <p className="mt-1 text-xs text-gray-400">Drag & drop or click · PDF, DOCX</p>
          <p className="mt-1 text-xs text-gray-300">Max 50MB per file</p>
        </div>

        <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">How sources work</p>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li className="flex gap-2"><span className="text-indigo-400">↗</span> Uploaded files are split into chunks and embedded</li>
            <li className="flex gap-2"><span className="text-indigo-400">🔍</span> Relevant chunks are retrieved automatically when you chat</li>
            <li className="flex gap-2"><span className="text-indigo-400">🗑</span> Deleting removes the file from all future responses</li>
          </ul>
        </div>
      </div>

      {/* Sources list */}
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {sources.length} source{sources.length !== 1 ? 's' : ''}
          </p>
          {sources.length > 0 && (
            <a href={`/chat/${orgSlug}`} className="text-xs text-indigo-600 hover:underline">
              Chat with these sources →
            </a>
          )}
        </div>

        {/* In-progress uploads */}
        {uploading.map(u => (
          <div key={u.id} className="mb-2 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg">{u.progress === 'error' ? '⚠️' : '⏳'}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                <p className="text-xs text-indigo-500">
                  {u.progress === 'uploading' ? 'Uploading…'
                    : u.progress === 'processing' ? 'Embedding chunks…'
                    : u.progress === 'done' ? 'Added'
                    : u.error}
                </p>
              </div>
            </div>
            {u.progress !== 'done' && u.progress !== 'error' && (
              <div className="h-1 w-16 rounded-full bg-indigo-200 overflow-hidden shrink-0">
                <div className={`h-full bg-indigo-500 transition-all duration-500 ${u.progress === 'processing' ? 'w-3/4 animate-pulse' : 'w-1/4'}`} />
              </div>
            )}
          </div>
        ))}

        {isEmpty ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center">
            <p className="text-sm text-gray-400">No sources yet.</p>
            <p className="mt-1 text-xs text-gray-300">Upload PDFs or DOCX files to give the assistant knowledge of your documents.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map(source => (
              <div key={source.id} className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 text-xs font-bold">
                    {mimeLabel(source.mimeType, source.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{source.name}</p>
                    <p className="text-xs text-gray-400">
                      {source.chunkCount} chunks · {new Date(source.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteSource(source.id)}
                  className="ml-4 shrink-0 opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Remove source"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>}
    </div>
  )
}
