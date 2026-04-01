'use client'

import { useEffect, useRef, useState, useCallback, ClipboardEvent } from 'react'

interface Deliverable {
  id: string
  title: string
  type: string
  content: string
}

interface ToolCallEntry {
  name: string
  input: Record<string, unknown>
  status: 'running' | 'done'
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  attachments?: PendingAttachment[]
  deliverable?: Deliverable
  toolCalls?: ToolCallEntry[]
  suggestedSkills?: string[]
}

interface Skill {
  slug: string
  title: string
  description?: string
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
  sessionId: string
  projectId?: string
  onSessionTitle?: (title: string) => void
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

// ---------------------------------------------------------------------------
// Markdown rendering
// ---------------------------------------------------------------------------

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\)|https?:\/\/[^\s<>")\]]+)/)
  return parts.map((part, i) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-primary">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="font-mono text-xs bg-gray-100 text-primary px-1.5 py-0.5 rounded">{part.slice(1, -1)}</code>
    if (part.startsWith('[') && part.includes('](')) {
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (m) return <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:text-accent/80 break-all">{m[1]}</a>
    }
    if (part.startsWith('http://') || part.startsWith('https://'))
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:text-accent/80 break-all">{part}</a>
    return part
  })
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n')

  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-gray-800">
      {lines.map((line, i) => {
        if (line.startsWith('### '))
          return <h3 key={i} className="font-display font-semibold text-sm text-primary mt-2 mb-0.5 uppercase tracking-wide">{line.slice(4)}</h3>
        if (line.startsWith('## '))
          return <h2 key={i} className="font-display font-semibold text-base text-primary mt-3 mb-1">{line.slice(3)}</h2>
        if (line.startsWith('# '))
          return <h1 key={i} className="font-display font-bold text-lg text-primary mt-3 mb-1">{line.slice(2)}</h1>
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <div key={i} className="flex gap-2 ml-2">
              <span className="text-accent mt-1 shrink-0 text-xs">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          )
        const numMatch = line.match(/^(\d+)\. (.+)/)
        if (numMatch)
          return (
            <div key={i} className="flex gap-2 ml-2">
              <span className="text-accent shrink-0 font-mono text-xs font-medium w-4">{numMatch[1]}.</span>
              <span>{renderInline(numMatch[2])}</span>
            </div>
          )
        if (line === '---' || line === '***')
          return <hr key={i} className="border-gray-200 my-2" />
        if (line.startsWith('```'))
          return null
        if (!line.trim())
          return <div key={i} className="h-1" />
        return <p key={i}>{renderInline(line)}</p>
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tool call UI
// ---------------------------------------------------------------------------

function toolLabel(name: string, input: Record<string, unknown>): string {
  if (name === 'web_search') return `Search: "${String(input.query ?? '').slice(0, 50)}"`
  if (name === 'fetch_url') {
    try { return `Read: ${new URL(String(input.url)).hostname}` } catch { return `Read: ${String(input.url).slice(0, 40)}` }
  }
  return name
}

function toolIndicatorText(tool: ToolCallEntry): string {
  if (tool.name === 'web_search') return `Searching "${String(tool.input.query ?? '').slice(0, 45)}"…`
  if (tool.name === 'fetch_url') {
    try { return `Reading ${new URL(String(tool.input.url)).hostname}…` } catch { return 'Fetching page…' }
  }
  return 'Working…'
}

function ToolCallCard({ call }: { call: ToolCallEntry }) {
  const [elapsed, setElapsed] = useState(0)
  const isSearch = call.name === 'web_search'

  useEffect(() => {
    if (call.status !== 'running') return
    setElapsed(0)
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [call.status])

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
      call.status === 'running'
        ? 'border-accent/30 bg-accent/5 text-accent'
        : 'border-gray-200 bg-gray-50 text-gray-400'
    }`}>
      {call.status === 'running' ? (
        <svg className="h-3 w-3 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="h-3 w-3 text-success shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span>{isSearch ? '🔍' : '🌐'} {toolLabel(call.name, call.input)}</span>
      {call.status === 'running' && elapsed > 0 && (
        <span className="opacity-60 tabular-nums">{elapsed}s</span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ChatUI({ orgId, orgName, orgSlug, sessionId, projectId, onSessionTitle }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [slashHighlight, setSlashHighlight] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const userScrolledUp = useRef(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const dragCounter = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setMessages([])
    setIsLoading(true)
    setError(null)

    async function load() {
      try {
        const [msgRes, skillRes] = await Promise.all([
          fetch(`/api/messages?orgId=${orgId}&sessionId=${sessionId}&limit=20`),
          fetch(`/api/org-skills?orgId=${orgId}`),
        ])
        if (msgRes.ok) { const d = await msgRes.json() as { messages: Message[] }; setMessages(d.messages ?? []) }
        if (skillRes.ok) { const d = await skillRes.json() as { skills: Skill[] }; setSkills(d.skills ?? []) }
      } catch { setError('Failed to load') }
      finally { setIsLoading(false) }
    }
    load()
  }, [orgId, sessionId])

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
      setPendingAttachments(prev => [...prev, {
        id, fileName: file.name, type: 'text', status: 'processing',
      }])

      try {
        const processed = await processFile(file)

        if (processed.type === 'rag') {
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

  // Drag and drop — use native listeners to avoid React synthetic event issues
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onDragEnter = (e: globalThis.DragEvent) => {
      e.preventDefault()
      dragCounter.current++
      setIsDragging(true)
    }
    const onDragLeave = (e: globalThis.DragEvent) => {
      e.preventDefault()
      dragCounter.current--
      if (dragCounter.current <= 0) {
        dragCounter.current = 0
        setIsDragging(false)
      }
    }
    const onDragOver = (e: globalThis.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }
    const onDrop = (e: globalThis.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter.current = 0
      setIsDragging(false)
      const files = Array.from(e.dataTransfer?.files ?? [])
      if (files.length) addFiles(files)
    }

    el.addEventListener('dragenter', onDragEnter)
    el.addEventListener('dragleave', onDragLeave)
    el.addEventListener('dragover', onDragOver)
    el.addEventListener('drop', onDrop)

    return () => {
      el.removeEventListener('dragenter', onDragEnter)
      el.removeEventListener('dragleave', onDragLeave)
      el.removeEventListener('dragover', onDragOver)
      el.removeEventListener('drop', onDrop)
    }
  }, [addFiles])

  // Paste handler
  const onPaste = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files)
    if (files.length) {
      e.preventDefault()
      addFiles(files)
    }
  }, [addFiles])

  async function handleSend() {
    if ((!input.trim() && pendingAttachments.filter(a => a.status === 'ready').length === 0) || isStreaming) return

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
            if (parsed.session_title) {
              onSessionTitle?.(parsed.session_title)
            }
            if (parsed.text) {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = { ...last, content: last.content + parsed.text }
                return updated
              })
            }
            if (parsed.tool_start) {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                const existing = last.toolCalls ?? []
                updated[updated.length - 1] = { ...last, toolCalls: [...existing, { name: parsed.tool_start.name, input: parsed.tool_start.input, status: 'running' as const }] }
                return updated
              })
            }
            if (parsed.tool_end) {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                // Mark the last running call with this name as done
                const toolCalls = (last.toolCalls ?? []).map(tc =>
                  tc.name === parsed.tool_end.name && tc.status === 'running' ? { ...tc, status: 'done' as const } : tc
                )
                updated[updated.length - 1] = { ...last, toolCalls }
                return updated
              })
            }
            if (parsed.suggested_skills) {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { ...updated[updated.length - 1], suggestedSkills: parsed.suggested_skills }
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
    setSlashHighlight(0)
    textareaRef.current?.focus()
  }

  // Slash command popup
  const slashMatch = input.match(/^\/(\S*)$/)
  const slashQuery = slashMatch ? slashMatch[1] : null   // null = popup closed
  const slashMatches = slashQuery !== null
    ? skills.filter(s =>
        !slashQuery ||
        s.slug.includes(slashQuery) ||
        (s.title ?? '').toLowerCase().includes(slashQuery.toLowerCase())
      ).slice(0, 8)
    : []
  const isSlashOpen = slashQuery !== null && slashMatches.length > 0

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (isSlashOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashHighlight(h => Math.min(h + 1, slashMatches.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashHighlight(h => Math.max(h - 1, 0)); return }
      if (e.key === 'Enter') { e.preventDefault(); handleSkillClick(slashMatches[slashHighlight]?.slug ?? ''); return }
      if (e.key === 'Escape') { e.preventDefault(); setInput(''); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // Chips row: use last assistant message's suggested skills if available, else first 5
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.suggestedSkills?.length)
  const suggestedSlugs = lastAssistantMsg?.suggestedSkills ?? []
  const suggestedSkillObjs = suggestedSlugs.map(slug => skills.find(s => s.slug === slug)).filter(Boolean) as Skill[]
  const chipsSkills = suggestedSkillObjs.length > 0 ? suggestedSkillObjs : skills.slice(0, 5)
  const chipsLabel = suggestedSkillObjs.length > 0 ? 'Suggested' : null

  const hasReady = pendingAttachments.some(a => a.status === 'ready')
  const canSend = (input.trim() || hasReady) && !isStreaming && !pendingAttachments.some(a => a.status === 'processing')

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-white relative"
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-accent/5 border-2 border-dashed border-accent/40 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="font-display font-semibold text-base text-primary">Drop files here</p>
            <p className="text-sm text-gray-400 mt-1">Images, PDFs, DOCX, text, code, CSV…</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="shrink-0 border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-display font-bold">SP</span>
          </div>
          <div>
            <p className="font-display font-semibold text-sm text-primary">{orgName}</p>
            <p className="text-xs text-gray-400">StratPartner.ai</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/dashboard/${orgSlug}`}
            className="text-xs text-gray-400 hover:text-primary transition-colors border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300"
          >
            Dashboard ↗
          </a>
        </div>
      </header>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-8 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-sans text-xs">Loading…</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/5 border border-gray-100 flex items-center justify-center">
              <span className="font-display font-bold text-2xl text-primary/30">SP</span>
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-primary mb-2">Ready to work.</h2>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Ask a question, run a strategy framework, or drop in any document — research briefs, transcripts, competitor decks.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {['journey-map', 'persona-build', 'trend-scan', 'competitive-landscape'].map(slug => (
                <button
                  key={slug}
                  onClick={() => handleSkillClick(slug)}
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:border-accent hover:text-accent transition-all"
                >
                  <span className="text-accent/50">⚡</span> /{slug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            if (msg.role === 'system') {
              return (
                <div key={i} className="w-full flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs text-gray-500">
                    {msg.content}
                  </span>
                </div>
              )
            }

            const isMeetingBriefing = msg.role === 'assistant' && msg.content.startsWith('## I was in your meeting')

            if (msg.role === 'user') {
              return (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[75%] sm:max-w-[60%] space-y-2 items-end flex flex-col">
                    {/* Attachment previews */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-end">
                        {msg.attachments.map((att) => (
                          <div key={att.id} className="relative">
                            {att.type === 'image' && att.preview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={att.preview} alt={att.fileName} className="h-32 w-32 object-cover rounded-xl border border-gray-200" />
                            ) : (
                              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${att.type === 'rag' ? 'bg-success/10 text-success border border-success/20' : 'bg-gray-100 text-gray-700'}`}>
                                <span>{fileIcon(att.type)}</span>
                                <span className="max-w-[120px] truncate">{att.fileName}</span>
                                {att.chunkCount && <span className="text-gray-400">· {att.chunkCount} chunks</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed bg-primary text-white">
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            }

            // Assistant message
            const runningTool = msg.toolCalls?.find(tc => tc.status === 'running')
            return (
              <div key={i} className="flex justify-start">
                <div className="max-w-[85%] sm:max-w-[72%]">
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 h-7 w-7 rounded-full border flex items-center justify-center mt-0.5 transition-colors ${runningTool ? 'bg-accent/15 border-accent/30' : 'bg-accent/10 border-accent/20'}`}>
                      {runningTool ? (
                        <svg className="h-3.5 w-3.5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <span className="text-accent text-xs font-display font-bold">SP</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      {isMeetingBriefing && (
                        <div className="flex items-center gap-2 text-xs text-accent">
                          <span>🎙</span>
                          <span className="font-display font-medium">Meeting briefing</span>
                        </div>
                      )}
                      {/* Tool call pills */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {msg.toolCalls.map((tc, ti) => (
                            <ToolCallCard key={ti} call={tc} />
                          ))}
                        </div>
                      )}
                      {/* Content or status indicator */}
                      {msg.content ? (
                        <SimpleMarkdown content={msg.content} />
                      ) : runningTool ? (
                        <div className="flex items-center gap-2 py-0.5">
                          <svg className="h-3 w-3 animate-spin text-accent shrink-0" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="text-xs text-accent/80">{toolIndicatorText(runningTool)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-0.5">
                          <div className="flex items-center gap-1">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs text-gray-400">
                            {msg.toolCalls && msg.toolCalls.length > 0 ? 'Synthesizing research…' : 'Thinking…'}
                          </span>
                        </div>
                      )}
                      {msg.deliverable && (
                        <ArtifactCard deliverable={msg.deliverable} orgSlug={orgSlug} />
                      )}
                      {/* Suggested next skills */}
                      {msg.suggestedSkills && msg.suggestedSkills.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 mt-2">
                          <p className="text-xs text-gray-400 mb-2 font-medium">Try next</p>
                          <div className="flex flex-wrap gap-2">
                            {msg.suggestedSkills.map(slug => {
                              const sk = skills.find(s => s.slug === slug)
                              return (
                                <button
                                  key={slug}
                                  onClick={() => handleSkillClick(slug)}
                                  className="group flex flex-col gap-0.5 rounded-xl border border-gray-200 px-3 py-2 text-left hover:border-accent hover:bg-accent/5 transition-all max-w-[200px]"
                                >
                                  <span className="text-xs font-medium text-primary group-hover:text-accent flex items-center gap-1">
                                    <span className="text-accent/50 group-hover:text-accent">⚡</span>
                                    /{slug}
                                  </span>
                                  {sk?.description && (
                                    <span className="text-[11px] text-gray-400 leading-snug line-clamp-2">{sk.description}</span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="shrink-0 mx-4 mb-2 rounded-lg bg-danger/5 border border-danger/20 px-4 py-2 text-sm text-danger flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-danger/50 hover:text-danger text-xs">✕</button>
        </div>
      )}

      {/* Streaming status bar — always visible when working */}
      {isStreaming && (() => {
        const lastMsg = messages[messages.length - 1]
        const runningTool = lastMsg?.role === 'assistant' ? lastMsg.toolCalls?.find(tc => tc.status === 'running') : undefined
        const hasDoneTools = lastMsg?.role === 'assistant' && (lastMsg.toolCalls?.length ?? 0) > 0 && !runningTool
        const isWriting = hasDoneTools && !lastMsg?.content
        const label = runningTool
          ? toolIndicatorText(runningTool)
          : isWriting
          ? 'Synthesizing research…'
          : 'Thinking…'
        return (
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-accent/5 border-t border-accent/10 text-xs text-accent">
            <svg className="h-3 w-3 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="font-medium">{label}</span>
          </div>
        )
      })()}

      {/* Input area */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-4 pt-3 pb-4">
        {/* Skill chips */}
        {chipsSkills.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
            {chipsLabel && (
              <span className="shrink-0 text-[10px] font-semibold text-accent/70 uppercase tracking-wider mr-0.5">{chipsLabel}</span>
            )}
            {chipsSkills.map((skill) => (
              <button
                key={skill.slug}
                onClick={() => handleSkillClick(skill.slug)}
                disabled={isStreaming}
                title={skill.description}
                className="shrink-0 group flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-accent hover:text-accent hover:bg-accent/5 transition-all disabled:opacity-40"
              >
                <span className="text-accent/50 group-hover:text-accent transition-colors">⚡</span>
                /{skill.slug}
              </button>
            ))}
            <button
              onClick={() => { setInput('/'); textareaRef.current?.focus() }}
              disabled={isStreaming}
              className="shrink-0 text-xs text-gray-400 hover:text-accent transition-colors px-1"
              title="Browse all skills"
            >
              Browse all →
            </button>
          </div>
        )}

        {/* Pending attachments */}
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {pendingAttachments.map((att) => (
              <div
                key={att.id}
                className={`relative flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium ${
                  att.status === 'error'
                    ? 'bg-danger/5 border-danger/20 text-danger'
                    : att.status === 'processing'
                    ? 'bg-gray-50 border-gray-200 text-gray-400'
                    : att.type === 'rag'
                    ? 'bg-success/5 border-success/20 text-success'
                    : 'bg-accent/5 border-accent/20 text-accent'
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
                  <span className="text-success/70">· {att.chunkCount} chunks</span>
                )}
                {att.status !== 'processing' && (
                  <button onClick={() => removeAttachment(att.id)} className="ml-1 opacity-50 hover:opacity-100">✕</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Slash command popup */}
        {isSlashOpen && (
          <div className="mb-2 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Skills</span>
              <span className="text-[10px] text-gray-300">↑↓ navigate · Enter select · Esc close</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {slashMatches.map((skill, idx) => (
                <button
                  key={skill.slug}
                  onClick={() => handleSkillClick(skill.slug)}
                  onMouseEnter={() => setSlashHighlight(idx)}
                  className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors ${idx === slashHighlight ? 'bg-accent/5' : 'hover:bg-gray-50'}`}
                >
                  <span className={`shrink-0 mt-0.5 text-xs font-mono font-semibold ${idx === slashHighlight ? 'text-accent' : 'text-gray-500'}`}>
                    /{skill.slug}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-xs font-medium ${idx === slashHighlight ? 'text-primary' : 'text-gray-700'}`}>{skill.title || skill.slug}</span>
                    {skill.description && (
                      <span className="block text-[11px] text-gray-400 leading-snug truncate">{skill.description}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input row — clean card style */}
        <div className="flex gap-2 items-end rounded-2xl border border-gray-200 bg-white px-3 py-2 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20 transition-all shadow-sm">
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

          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            title="Attach files (or drag & drop / paste)"
            className="shrink-0 p-1.5 text-gray-300 hover:text-accent rounded-lg transition-colors disabled:opacity-40"
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
            className="flex-1 resize-none border-0 outline-none text-sm text-primary placeholder-gray-400 bg-transparent min-h-[28px] max-h-[128px] disabled:opacity-50"
          />

          {isStreaming ? (
            <button
              onClick={() => abortControllerRef.current?.abort()}
              className="shrink-0 h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="shrink-0 h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-white hover:bg-gray-800 disabled:opacity-30 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 mt-2">⏎ to send · ⇧⏎ newline · drag or paste files</p>
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
  blockquote { border-left: 4px solid #8B5CF6; margin: 0; padding-left: 16px; color: #6b7280; }
  table { border-collapse: collapse; width: 100%; }
  th,td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
  th { background: #f9fafb; font-weight: 600; }
  .meta { color: #6b7280; font-size: 0.85em; margin-bottom: 2em; }
  .badge { display: inline-block; background: #f5f3ff; color: #8B5CF6; padding: 2px 10px; border-radius: 999px; font-size: 0.8em; font-weight: 600; }
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
    <div className="mt-3 rounded-xl border border-accent/20 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-accent/5 border-b border-accent/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 h-6 w-6 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-display font-bold leading-none">SP</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-display font-semibold text-primary truncate">{deliverable.title}</p>
            <p className="text-xs text-accent/70">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block bg-accent text-white text-xs font-medium px-1.5 py-px rounded-full leading-none">{deliverable.type}</span>
                <span className="text-gray-400">· saved to outputs</span>
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          <button
            onClick={downloadMd}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-accent hover:text-accent transition-colors"
          >
            .md
          </button>
          <button
            onClick={downloadHtml}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-accent hover:text-accent transition-colors"
          >
            .html
          </button>
          <a
            href={`/dashboard/${orgSlug}/sources`}
            className="rounded-lg border border-accent/30 bg-accent/5 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
          >
            View outputs
          </a>
        </div>
      </div>
    </div>
  )
}
