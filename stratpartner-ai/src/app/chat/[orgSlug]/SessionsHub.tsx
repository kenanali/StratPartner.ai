'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ChatUI from './ChatUI'

interface Session {
  id: string
  title: string | null
  channel: string
  project_id: string | null
  created_at: string
}

interface Props {
  orgId: string
  orgName: string
  orgSlug: string
  initialSessionId?: string
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function SessionsHub({ orgId, orgName, orgSlug, initialSessionId }: Props) {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(initialSessionId)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSessions()
  }, [orgId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchSessions() {
    const res = await fetch(`/api/sessions?orgId=${orgId}`)
    if (res.ok) {
      const data = await res.json() as { sessions: Session[] }
      setSessions(data.sessions)
    }
  }

  async function createSession() {
    if (isCreating) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      })
      if (res.ok) {
        const data = await res.json() as { id: string }
        const newSession: Session = {
          id: data.id,
          title: null,
          channel: 'chat',
          project_id: null,
          created_at: new Date().toISOString(),
        }
        setSessions(prev => [newSession, ...prev])
        setActiveSessionId(data.id)
        router.replace(`/chat/${orgSlug}?session=${data.id}`)
      }
    } finally {
      setIsCreating(false)
    }
  }

  async function deleteSession(sessionId: string) {
    setOpenMenuId(null)
    const res = await fetch(`/api/sessions?id=${sessionId}&orgId=${orgId}`, { method: 'DELETE' })
    if (res.ok) {
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (activeSessionId === sessionId) {
        setActiveSessionId(undefined)
        router.replace(`/chat/${orgSlug}`)
      }
    }
  }

  function selectSession(sessionId: string) {
    setActiveSessionId(sessionId)
    router.replace(`/chat/${orgSlug}?session=${sessionId}`)
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left panel */}
      <div className="w-[280px] shrink-0 border-r border-gray-100 flex flex-col">
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <span className="font-display font-semibold text-sm text-primary">Chats</span>
          <button
            onClick={createSession}
            disabled={isCreating}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
            aria-label="New chat"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto py-1">
          {sessions.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400">No chats yet.</p>
              <button
                onClick={createSession}
                className="mt-2 text-sm text-accent hover:text-accent/80 transition-colors"
              >
                Start one →
              </button>
            </div>
          ) : (
            sessions.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={activeSessionId === session.id}
                isMenuOpen={openMenuId === session.id}
                onSelect={() => selectSession(session.id)}
                onMenuToggle={() => setOpenMenuId(openMenuId === session.id ? null : session.id)}
                onDelete={() => deleteSession(session.id)}
                menuRef={activeSessionId === session.id || openMenuId === session.id ? menuRef : undefined}
              />
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 min-w-0">
        {activeSessionId ? (
          <ChatUI
            orgId={orgId}
            orgName={orgName}
            orgSlug={orgSlug}
            sessionId={activeSessionId}
            onSessionTitle={(title) => {
              setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title } : s))
            }}
          />
        ) : (
          <EmptyState onNewChat={createSession} isCreating={isCreating} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Session list item
// ---------------------------------------------------------------------------

interface SessionItemProps {
  session: Session
  isActive: boolean
  isMenuOpen: boolean
  onSelect: () => void
  onMenuToggle: () => void
  onDelete: () => void
  menuRef?: React.RefObject<HTMLDivElement>
}

function SessionItem({
  session,
  isActive,
  isMenuOpen,
  onSelect,
  onMenuToggle,
  onDelete,
  menuRef,
}: SessionItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative group ${isActive ? 'border-r-2 border-accent bg-gray-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onSelect}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-2 pr-6">
          <p className={`text-sm truncate leading-snug ${session.title ? 'text-primary' : 'text-gray-400'}`}>
            {session.title ?? 'New conversation'}
          </p>
          <span className="text-xs text-gray-300 shrink-0 mt-0.5 whitespace-nowrap">
            {relativeTime(session.created_at)}
          </span>
        </div>
      </button>

      {/* Kebab menu button — shown on hover or when menu open */}
      {(isHovered || isMenuOpen) && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); onMenuToggle() }}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-primary hover:bg-gray-200 transition-colors"
            aria-label="Session options"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <circle cx="6" cy="2" r="1.2" />
              <circle cx="6" cy="6" r="1.2" />
              <circle cx="6" cy="10" r="1.2" />
            </svg>
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-md py-1 min-w-[120px]">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state (no session selected)
// ---------------------------------------------------------------------------

function EmptyState({ onNewChat, isCreating }: { onNewChat: () => void; isCreating: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <h2 className="font-display text-2xl font-bold text-primary">Ready to work.</h2>
      <p className="text-sm text-gray-400 mt-2">Select a conversation or start a new one.</p>
      <button
        onClick={onNewChat}
        disabled={isCreating}
        className="mt-6 bg-accent text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
      >
        {isCreating ? 'Creating...' : 'New Chat'}
      </button>
    </div>
  )
}
