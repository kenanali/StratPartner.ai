'use client'

import { useEffect, useRef, useState } from 'react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface Skill {
  slug: string
  title: string
}

interface ChatUIProps {
  orgId: string
  orgName: string
  orgSlug: string
  projectId?: string
}

export default function ChatUI({ orgId, orgName, orgSlug, projectId }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const userScrolledUp = useRef(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storageKey = `sp_session_${orgSlug}${projectId ? `_${projectId}` : ''}`
    let sid = localStorage.getItem(storageKey)
    if (!sid) {
      sid = crypto.randomUUID()
      localStorage.setItem(storageKey, sid)
    }
    setSessionId(sid)

    async function loadHistory(sid: string) {
      try {
        const res = await fetch(
          `/api/messages?orgId=${orgId}&sessionId=${sid}&limit=20`
        )
        if (!res.ok) throw new Error('Failed to load history')
        const data = await res.json()
        setMessages(data.messages ?? [])
      } catch {
        setError('Failed to load chat history')
      } finally {
        setIsLoading(false)
      }
    }

    async function loadSkills() {
      try {
        const res = await fetch(`/api/org-skills?orgId=${orgId}`)
        if (res.ok) {
          const data = await res.json()
          setSkills(data.skills ?? [])
        }
      } catch {
        // skills are non-critical
      }
    }

    loadHistory(sid)
    loadSkills()
  }, [orgId, orgSlug, projectId])

  // Auto-scroll unless user scrolled up manually
  useEffect(() => {
    if (!userScrolledUp.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Track manual scroll
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const handleScroll = () => {
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 50
      userScrolledUp.current = !isAtBottom
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [input])

  async function handleSend() {
    if (!input.trim() || isStreaming || !sessionId) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    userScrolledUp.current = false
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsStreaming(true)
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          message: userMessage,
          session_id: sessionId,
          project_id: projectId ?? null,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? 'Request failed')
      }

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break
          try {
            const parsed = JSON.parse(payload)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              setMessages((prev) => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: last.content + parsed.text,
                }
                return updated
              })
            }
          } catch (parseErr) {
            if (
              parseErr instanceof Error &&
              parseErr.message !== 'Unexpected end of JSON input'
            ) {
              throw parseErr
            }
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && last.content === '') {
          return prev.slice(0, -1)
        }
        return prev
      })
    } finally {
      setIsStreaming(false)
    }
  }

  async function handleFileUpload(file: File) {
    if (!file || isUploading) return

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    const isAllowed = allowedTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.docx')

    if (!isAllowed) {
      setError('Only PDF and DOCX files are supported.')
      return
    }

    setIsUploading(true)
    setError(null)

    // Show processing message in chat
    setMessages((prev) => [
      ...prev,
      { role: 'system', content: `Processing "${file.name}"…` },
    ])

    const formData = new FormData()
    formData.append('file', file)
    formData.append('orgId', orgId)
    if (projectId) formData.append('projectId', projectId)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Upload failed')
      }

      // Replace processing message with success message
      setMessages((prev) => {
        const updated = [...prev]
        const lastIdx = updated.length - 1
        if (updated[lastIdx]?.role === 'system' && updated[lastIdx].content.startsWith('Processing')) {
          updated[lastIdx] = {
            role: 'system',
            content: `I've read and embedded "${data.fileName}" (${data.chunkCount} chunks). You can now ask me questions about it.`,
          }
        }
        return updated
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      // Remove the processing message
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'system' && last.content.startsWith('Processing')) {
          return prev.slice(0, -1)
        }
        return prev
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleSkillClick(slug: string) {
    const prefix = `/${slug} `
    setInput((prev) => (prev.startsWith(prefix) ? prev : prefix + prev))
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const skillsToShow = skills.slice(0, 5)
  const extraCount = Math.max(0, skills.length - 5)

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">{orgName}</h1>
          <p className="text-xs text-gray-400">StratPartner.ai</p>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-gray-400">Loading…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <p className="text-gray-700 text-lg font-medium">
              StratPartner is ready.
            </p>
            <p className="text-gray-400 text-sm max-w-sm">
              Ask a strategic question, run a framework, or upload a document to get started.
            </p>
            <p className="text-gray-300 text-xs">
              Try /journey-map, /trend-scan, or just start talking.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'system' ? (
                <div className="w-full flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs text-indigo-600">
                    {msg.content}
                  </span>
                </div>
              ) : (
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-600 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 pt-3 pb-4">
        {/* Skill chips */}
        {skillsToShow.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
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
            {extraCount > 0 && (
              <span className="shrink-0 text-xs text-gray-400">+{extraCount}</span>
            )}
          </div>
        )}

        {/* Input row */}
        <div className="flex gap-2 items-end">
          {/* File upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming || isUploading}
            title="Upload PDF or DOCX"
            className="shrink-0 rounded-xl border border-gray-300 p-2.5 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-40 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {isUploading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Ask a strategic question, run a framework, or upload a document…"
            rows={1}
            className="flex-1 resize-none overflow-hidden rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 min-h-[44px]"
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            {isStreaming ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
