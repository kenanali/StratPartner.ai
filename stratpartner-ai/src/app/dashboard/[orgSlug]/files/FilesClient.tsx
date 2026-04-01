'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
}

interface FileRow {
  id: string
  displayName: string
  mime_type: string | null
  created_at: string
  project_id: string | null
}

interface DeliverableRow {
  id: string
  title: string
  type: string
  project_id: string | null
  session_id: string | null
  created_at: string
}

interface Props {
  orgSlug: string
  projects: Project[]
  files: FileRow[]
  deliverables: DeliverableRow[]
}

function fileIcon(mime: string | null): string {
  if (!mime) return '📄'
  if (mime.startsWith('image/')) return '🖼'
  if (mime === 'application/pdf') return '📕'
  if (mime.includes('word')) return '📝'
  if (mime.startsWith('text/')) return '📄'
  if (mime.includes('audio') || mime.includes('video')) return '🎙'
  return '📄'
}

function typeIcon(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('competitive') || t.includes('battlecard')) return '⚔️'
  if (t.includes('persona') || t.includes('icp')) return '👤'
  if (t.includes('meeting') || t.includes('brief')) return '🗓'
  if (t.includes('campaign') || t.includes('ad')) return '📣'
  if (t.includes('journey')) return '🗺'
  if (t.includes('qbr') || t.includes('deck')) return '📊'
  return '📋'
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type PreviewItem =
  | { kind: 'file'; data: FileRow }
  | { kind: 'deliverable'; data: DeliverableRow }
  | null

export default function FilesClient({ orgSlug, projects, files, deliverables }: Props) {
  const [selected, setSelected] = useState<PreviewItem>(null)

  function getProjectName(id: string | null): string {
    if (!id) return 'Org-level'
    return projects.find(p => p.id === id)?.name ?? 'Unknown project'
  }

  // Group files by project
  const filesByProject: Record<string, FileRow[]> = {}
  const isTranscript = (f: FileRow) => f.displayName.toLowerCase().includes('meeting') || f.displayName.toLowerCase().includes('transcript')

  for (const f of files) {
    const key = f.project_id ?? '__org__'
    if (!filesByProject[key]) filesByProject[key] = []
    filesByProject[key].push(f)
  }

  // Group deliverables by project
  const deliverablesByProject: Record<string, DeliverableRow[]> = {}
  for (const d of deliverables) {
    const key = d.project_id ?? '__org__'
    if (!deliverablesByProject[key]) deliverablesByProject[key] = []
    deliverablesByProject[key].push(d)
  }

  const allProjectKeys = Array.from(new Set([
    ...Object.keys(filesByProject),
    ...Object.keys(deliverablesByProject),
  ]))

  // Sort: named projects first, org-level last
  const sortedKeys = allProjectKeys.sort((a, b) => {
    if (a === '__org__') return 1
    if (b === '__org__') return -1
    return 0
  })

  const totalItems = files.length + deliverables.length

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel — file tree */}
      <div className="w-72 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="px-4 pt-6 pb-3">
          <h1 className="font-display font-bold text-lg text-primary">Files</h1>
          <p className="text-xs text-gray-400 mt-0.5">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
        </div>

        {totalItems === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-400">No files yet. Upload files in chat or connect meetings.</p>
          </div>
        ) : (
          <nav className="px-2 pb-6">
            {sortedKeys.map((key) => {
              const projectName = key === '__org__' ? 'Org-level' : (projects.find(p => p.id === key)?.name ?? 'Unknown')
              const projectFiles = filesByProject[key] ?? []
              const projectDeliverables = deliverablesByProject[key] ?? []
              const inputs = projectFiles.filter(f => !isTranscript(f))
              const transcripts = projectFiles.filter(f => isTranscript(f))

              return (
                <div key={key} className="mt-4">
                  <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    📁 {projectName}
                  </p>

                  {inputs.length > 0 && (
                    <div className="mb-1">
                      <p className="px-2 text-[10px] text-gray-300 mb-0.5">Inputs</p>
                      {inputs.map(f => (
                        <button
                          key={f.id}
                          onClick={() => setSelected({ kind: 'file', data: f })}
                          className={`w-full text-left flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                            selected?.kind === 'file' && selected.data.id === f.id
                              ? 'bg-violet-50 text-accent'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <span className="shrink-0">{fileIcon(f.mime_type)}</span>
                          <span className="truncate flex-1">{f.displayName}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {transcripts.length > 0 && (
                    <div className="mb-1">
                      <p className="px-2 text-[10px] text-gray-300 mb-0.5">Transcripts</p>
                      {transcripts.map(f => (
                        <button
                          key={f.id}
                          onClick={() => setSelected({ kind: 'file', data: f })}
                          className={`w-full text-left flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                            selected?.kind === 'file' && selected.data.id === f.id
                              ? 'bg-violet-50 text-accent'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <span className="shrink-0">🎙</span>
                          <span className="truncate flex-1">{f.displayName}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {projectDeliverables.length > 0 && (
                    <div className="mb-1">
                      <p className="px-2 text-[10px] text-gray-300 mb-0.5">Deliverables</p>
                      {projectDeliverables.map(d => (
                        <button
                          key={d.id}
                          onClick={() => setSelected({ kind: 'deliverable', data: d })}
                          className={`w-full text-left flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                            selected?.kind === 'deliverable' && selected.data.id === d.id
                              ? 'bg-violet-50 text-accent'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <span className="shrink-0">{typeIcon(d.type)}</span>
                          <span className="truncate flex-1">{d.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        )}
      </div>

      {/* Right panel — preview */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <p className="text-4xl mb-4">📂</p>
            <p className="font-display font-semibold text-gray-700 mb-1">Select a file to preview</p>
            <p className="text-sm text-gray-400">Input files, transcripts, and deliverables — all in one place</p>
          </div>
        ) : selected.kind === 'deliverable' ? (
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Deliverable header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{typeIcon(selected.data.type)}</span>
                  <span className="text-xs font-medium bg-violet-100 text-accent px-2 py-0.5 rounded-full">{selected.data.type}</span>
                </div>
                <h2 className="font-display font-bold text-xl text-primary">{selected.data.title}</h2>
                <p className="text-xs text-gray-400 mt-1">
                  {getProjectName(selected.data.project_id)} · {relativeTime(selected.data.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selected.data.session_id && (
                  <Link
                    href={`/chat/${orgSlug}?session=${selected.data.session_id}`}
                    className="text-xs font-medium text-accent border border-violet-200 rounded-lg px-3 py-1.5 hover:bg-violet-50 transition-colors"
                  >
                    Open in chat →
                  </Link>
                )}
                <Link
                  href={`/dashboard/${orgSlug}/projects/${selected.data.project_id ?? ''}/deliverables/${selected.data.id}`}
                  className="text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                >
                  Full view →
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700 leading-relaxed">
              <p className="text-gray-400 italic text-xs mb-3">Preview not available in file tree — open full view to read.</p>
              <Link
                href={`/dashboard/${orgSlug}/projects/${selected.data.project_id ?? ''}/deliverables/${selected.data.id}`}
                className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:underline"
              >
                Open deliverable →
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* File header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{fileIcon(selected.data.mime_type)}</span>
                  {selected.data.mime_type && (
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{selected.data.mime_type}</span>
                  )}
                </div>
                <h2 className="font-display font-bold text-xl text-primary">{selected.data.displayName}</h2>
                <p className="text-xs text-gray-400 mt-1">
                  {getProjectName(selected.data.project_id)} · {relativeTime(selected.data.created_at)}
                </p>
              </div>
              <Link
                href={`/chat/${orgSlug}?fileId=${selected.data.id}`}
                className="shrink-0 text-xs font-medium text-accent border border-violet-200 rounded-lg px-3 py-1.5 hover:bg-violet-50 transition-colors"
              >
                Chat about this →
              </Link>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 italic">
              File stored in RAG — use &ldquo;Chat about this →&rdquo; to reference it in a conversation.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
