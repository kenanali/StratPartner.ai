'use client'

import { useEffect, useRef, useState, useCallback, DragEvent, ClipboardEvent } from 'react'

interface Deliverable {
  id: string
  title: string
  type: string
  content: string
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  attachments?: PendingAttachment[]
  deliverable?: Deliverable
}

interface Skill {
  slug: string
  title: string
}

interface PendingAttachment {
  id: string
  type: 'image' | 'document' | 'text' | 'rag'
  fileName: string
  mimeType?: string
  data?: string        // base64 for image/document
  content?: string     // for text files
  preview?: string     // data URL for image preview
  // rag-type extras
  fileId?: string
  chunkCount?: number
  status: 'ready' | 'processing' | 'error'
  error?: string
}

interface ChatUIProps {
  orgId: string
  orgName: string
  orgSlug: string
  projectId?: string
}

// File type classification
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const RAG_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]
const TEXT_TYPES = [
  'text/plain', 'text/markdown', 'text/csv', 'text/html',
  'application/json', 'application/xml', 'text/xml',
]
const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.xml', '.yaml', '.yml', '.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.css', '.sql']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024    // 5MB
const MAX_TEXT_BYTES  = 1 * 1024 * 1024    // 1MB
const MAX_PDF_BYTES   = 20 * 1024 * 1024   // 20MB for direct Claude attachment
const MAX_RAG_BYTES   = 50 * 1024 * 1024   // 50MB for RAG ingestion

function classifyFile(file: File): 'image' | 'document' | 'text' | 'rag' | null {
  const mime = file.type
  const name = file.name.toLowerCase()
  if (IMAGE_TYPES.includes(mime)) return 'image'
  if (mime === 'application/pdf') return file.size <= MAX_PDF_BYTES ? 'document' : 'rag'
  if (RAG_TYPES.includes(mime) || name.endsWith('.docx') || name.endsWith('.doc')) return 'rag'
  if (TEXT_TYPES.includes(mime) || TEXT_EXTENSIONS.some(ext => name.endsWith(ext))) return 'text'
  return null
}

async function processFile(file: File): Promise<Omit<PendingAttachment, 'id' | 'status'>> {
  const kind = classifyFile(file)

  if (!kind) throw new Error(`Unsupported file type: ${file.type || 'unknown'}`)

  if (kind === 'image') {
    if (file.size > MAX_IMAGE_BYTES) throw new Error('Image must be under 5MB')
    const data = await toBase64(file)
    return { type: 'image', fileName: file.name, mimeType: file.type, data, preview: `data:${file.type};base64,${data}` }
  }

  if (kind === 'document') {
    if (file.size > MAX_PDF_BYTES) throw new Error('PDF must be under 20MB for direct attachment')
    const data = await toBase64(file)
    return { type: 'document', fileName: file.name, mimeType: 'application/pdf', data }
  }

  if (kind === 'text') {
    if (file.size > MAX_TEXT_BYTES) throw new Error('Text file must be under 1MB')
    const content = await file.text()
    return { type: 'text', fileName: file.name, content }
  }

  // RAG — will be processed server-side
  if (file.size > MAX_RAG_BYTES) throw new Error('File must be under 50MB')
  return { type: 'rag', fileName: file.name, mimeType: file.type }
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix, return just the base64 data
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ChatUI({ orgId, orgName, orgSlug, projectId }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const userScrolledUp = useRef(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const dragCounter = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const storageKey = `sp_session_${orgSlug}${projectId ? `_${projectId}` : ''}`
    let sid = localStorage.getItem(storageKey)
    if (!sid) { sid = crypto.randomUUID(); localStorage.setItem(storageKey, sid) }
    setSessionId(sid)

    async function load(sid: string) {
      try {
        const [msgRes, skillRes] = await Promise.all([
          fetch(`/api/messages?orgId=${orgId}&sessionId=${sid}&limit=20`),
          fetch(`/api/org-skills?orgId=${orgId}`),
        ])
        if (msgRes.ok) { const d = await msgRes.json(); setMessages(d.messages ?? []) }
        if (skillRes.ok) { const d = await skillRes.json(); setSkills(d.skills ?? []) }
      } catch { setError('Failed to load') }
      finally { setIsLoading(false) }
    }
    load(sid)
  }, [orgId, orgSlug, projectId])

  useEffect(() => {
    if (!userScrolledUp.current) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const onScroll = () => {
      userScrolledUp.current = container.scrollHeight - container.scrollTop - container.clientHeight > 50
    }
    container.addEventListener('scroll', onScroll)
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [input])

  const addFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      const id = crypto.randomUUID()
      // Add as processing
      setPendingAttachments(prev => [...prev, {
        id, fileName: file.name, type: 'text', status: 'processing',
      }])

      try {
        const processed = await processFile(file)

        if (processed.type === 'rag') {
          // Send to server for RAG ingestion
          const formData = new FormData()
          formData.append('file', file)
          formData.append('orgId', orgId)
          if (projectId) formData.append('projectId', projectId)

          const res = await fetch('/api/upload', { method: 'POST', body: formData })
          const data = await res.json()

          if (!res.ok) throw new Error(data.error ?? 'Upload failed')

          setPendingAttachments(prev => prev.map(a => a.id === id
            ? { ...a, ...processed, fileId: data.fileId, chunkCount: data.chunkCount, status: 'ready' }
            : a
          ))
        } else {
          setPendingAttachments(prev => prev.map(a => a.id === id
            ? { ...a, ...processed, status: 'ready' }
            : a
          ))
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to process file'
        setPendingAttachments(prev => prev.map(a => a.id === id
          ? { ...a, status: 'error', error: msg }
          : a
        ))
      }
    }
  }, [orgId, projectId])

  // Drag and drop
  const onDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setIsDragging(true)
  }, [])
  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }, [])
  const onDragOver = useCallback((e: DragEvent) => { e.preventDefault() }, [])
  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) addFiles(files)
  }, [addFiles])

  // Paste handler
  const onPaste = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files)
    if (files.length) {
      e.preventDefault()
      addFiles(files)
    }
    // Text paste falls through naturally
  }, [addFiles])

  async function handleSend() {
    if ((!input.trim() && pendingAttachments.filter(a => a.status === 'ready').length === 0) || isStreaming || !sessionId) return

    const userMessage = input.trim()
    const readyAttachments = pendingAttachments.filter(a => a.status === 'ready')
    setInput('')
    setPendingAttachments([])
    setError(null)
    userScrolledUp.current = false

    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage, attachments: readyAttachments },
      { role: 'assistant', content: '' },
    ])
    setIsStreaming(true)

    const abort = new AbortController()
    abortControllerRef.current = abort

    try {
      const apiAttachments = readyAttachments
        .filter(a => a.type !== 'rag')
        .map(({ type, fileName, mimeType, data, content }) => ({ type, fileName, mimeType, data, content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          message: userMessage || '(see attached file)',
          session_id: sessionId,
          project_id: projectId ?? null,
          attachments: apiAttachments,
        }),
        signal: abort.signal,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? 'Request failed')
      }

      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break outer
          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = { ...last, content: last.content + parsed.text }
                return updated
              })
            }
            if (parsed.deliverable) {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { ...updated[updated.length - 1], deliverable: parsed.deliverable }
                return updated
              })
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') throw parseErr
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User stopped — keep whatever was streamed
        return
      }
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && last.content === '') return prev.slice(0, -1)
        return prev
      })
    } finally {
      abortControllerRef.current = null
      setIsStreaming(false)
    }
  }

  function removeAttachment(id: string) {
    setPendingAttachments(prev => prev.filter(a => a.id !== id))
  }

  function handleSkillClick(slug: string) {
    const prefix = `/${slug} `
    setInput(prev => prev.startsWith(prefix) ? prev : prefix + prev)
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const skillsToShow = skills.slice(0, 5)
  const extraCount = Math.max(0, skills.length - 5)
  const hasReady = pendingAttachments.some(a => a.status === 'ready')
  const canSend = (input.trim() || hasReady) && !isStreaming && !pendingAttachments.some(a => a.status === 'processing')

  return (
    <div
      className="flex flex-col h-screen bg-white relative"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-indigo-50/90 border-2 border-dashed border-indigo-400 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-semibold text-indigo-700">Drop files here</p>
            <p className="text-sm text-indigo-500 mt-1">Images, PDFs, DOCX, text, code, CSV…</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">{orgName}</h1>
          <p className="text-xs text-gray-400">StratPartner.ai</p>
        </div>
        <a href={`/dashboard/${orgSlug}`} className="text-xs text-indigo-600 hover:underline">Dashboard</a>
      </header>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-gray-400">Loading…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <p className="text-gray-700 text-lg font-medium">StratPartner is ready.</p>
            <p className="text-gray-400 text-sm max-w-sm">Ask a question, run a framework, or drop in any file — images, PDFs, docs, spreadsheets, code.</p>
            <p className="text-gray-300 text-xs">Try /journey-map, /trend-scan, or just start talking.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'system' ? (
                <div className="w-full flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs text-indigo-600">
                    {msg.content}
                  </span>
                </div>
              ) : (
                <div className={`max-w-[85%] sm:max-w-[70%] space-y-2 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                  {/* Attachment previews */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {msg.attachments.map((att) => (
                        <div key={att.id} className="relative">
                          {att.type === 'image' && att.preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={att.preview} alt={att.fileName} className="h-32 w-32 object-cover rounded-xl border border-gray-200" />
                          ) : (
                            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${att.type === 'rag' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700'}`}>
                              <span>{fileIcon(att.type)}</span>
                              <span className="max-w-[120px] truncate">{att.fileName}</span>
                              {att.chunkCount && <span className="text-gray-400">·{att.chunkCount} chunks</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm whitespace-pre-wrap'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}
                    style={msg.role === 'assistant' ? { whiteSpace: 'pre-wrap' } : {}}
                  >
                    {msg.content || (
                      <span className="inline-flex gap-0.5 items-center h-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                  {msg.deliverable && (
                    <ArtifactCard deliverable={msg.deliverable} orgSlug={orgSlug} />
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="shrink-0 mx-4 mb-2 rounded-lg bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600 text-xs">✕</button>
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 pt-3 pb-4">
        {/* Skill chips */}
        {skillsToShow.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
            {skillsToShow.map((skill) => (
              <button
                key={skill.slug}
                onClick={() => handleSkillClick(skill.slug)}
                disabled={isStreaming}
                className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-40"
              >
                /{skill.slug}
              </button>
            ))}
            {extraCount > 0 && <span className="shrink-0 text-xs text-gray-400">+{extraCount}</span>}
          </div>
        )}

        {/* Pending attachments */}
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingAttachments.map((att) => (
              <div
                key={att.id}
                className={`relative flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium ${
                  att.status === 'error'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : att.status === 'processing'
                    ? 'bg-gray-50 border-gray-200 text-gray-400'
                    : att.type === 'rag'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                }`}
              >
                {att.type === 'image' && att.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={att.preview} alt="" className="h-6 w-6 rounded object-cover" />
                ) : (
                  <span>{att.status === 'processing' ? '⏳' : att.status === 'error' ? '⚠️' : fileIcon(att.type)}</span>
                )}
                <span className="max-w-[140px] truncate">
                  {att.status === 'processing' ? `Processing ${att.fileName}…` : att.status === 'error' ? (att.error ?? 'Error') : att.fileName}
                </span>
                {att.type === 'rag' && att.chunkCount && (
                  <span className="text-green-500">·{att.chunkCount} chunks</span>
                )}
                {att.status !== 'processing' && (
                  <button onClick={() => removeAttachment(att.id)} className="ml-1 opacity-50 hover:opacity-100">✕</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.docx,.doc,.txt,.md,.csv,.json,.xml,.yaml,.yml,.ts,.tsx,.js,.jsx,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.css,.sql"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              if (files.length) addFiles(files)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            title="Attach files (or drag & drop / paste)"
            className="shrink-0 rounded-xl border border-gray-300 p-2.5 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={onPaste}
            disabled={isStreaming}
            placeholder="Ask anything, or drop / paste files…"
            rows={1}
            className="flex-1 resize-none overflow-hidden rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 min-h-[44px]"
          />
          {isStreaming ? (
            <button
              onClick={() => abortControllerRef.current?.abort()}
              className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors min-h-[44px]"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function fileIcon(type: PendingAttachment['type']): string {
  switch (type) {
    case 'image': return '🖼️'
    case 'document': return '📄'
    case 'rag': return '📚'
    case 'text': return '📝'
    default: return '📎'
  }
}

function ArtifactCard({ deliverable, orgSlug }: { deliverable: Deliverable; orgSlug: string }) {
  function downloadMd() {
    const blob = new Blob([deliverable.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${deliverable.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadHtml() {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${deliverable.title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 860px; margin: 60px auto; padding: 0 24px; color: #1a1a1a; line-height: 1.7; }
  h1,h2,h3,h4 { font-weight: 700; margin-top: 2em; }
  h1 { font-size: 2em; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5em; }
  h2 { font-size: 1.4em; }
  code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #6366f1; margin: 0; padding-left: 16px; color: #6b7280; }
  table { border-collapse: collapse; width: 100%; }
  th,td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
  th { background: #f9fafb; font-weight: 600; }
  .meta { color: #6b7280; font-size: 0.85em; margin-bottom: 2em; }
  .badge { display: inline-block; background: #eef2ff; color: #4f46e5; padding: 2px 10px; border-radius: 999px; font-size: 0.8em; font-weight: 600; }
</style>
</head>
<body>
<p class="meta"><span class="badge">${deliverable.type}</span> &nbsp; Generated by StratPartner.ai</p>
<h1>${deliverable.title}</h1>
<div id="content"></div>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(deliverable.content)});
</script>
</body>
</html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${deliverable.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-2 rounded-xl border border-indigo-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-b border-indigo-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">📋</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{deliverable.title}</p>
            <p className="text-xs text-indigo-500">{deliverable.type} · saved to outputs</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          <button
            onClick={downloadMd}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            .md
          </button>
          <button
            onClick={downloadHtml}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            .html
          </button>
          <a
            href={`/dashboard/${orgSlug}/sources`}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            View outputs
          </a>
        </div>
      </div>
    </div>
  )
}
