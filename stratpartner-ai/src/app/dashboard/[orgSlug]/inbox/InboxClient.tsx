'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { InboxMessage } from '@/app/api/inbox/route'

interface Props {
  orgId: string
  orgSlug: string
  initialMessages: InboxMessage[]
}

// ---------------------------------------------------------------------------
// Channel metadata
// ---------------------------------------------------------------------------

interface ChannelMeta {
  label: string
  icon: string
  badgeClass: string
}

const CHANNEL_META: Record<string, ChannelMeta> = {
  recall: {
    label: 'Meeting Briefing',
    icon: '🎥',
    badgeClass: 'bg-blue-50 text-blue-700',
  },
  agent: {
    label: 'Agent Update',
    icon: '🤖',
    badgeClass: 'bg-violet-50 text-violet-700',
  },
  heartbeat: {
    label: 'Daily Briefing',
    icon: '💡',
    badgeClass: 'bg-amber-50 text-amber-700',
  },
}

function getChannelMeta(channel: string): ChannelMeta {
  return (
    CHANNEL_META[channel] ?? {
      label: channel,
      icon: '📬',
      badgeClass: 'bg-gray-100 text-gray-600',
    }
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim()
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

// Very basic markdown renderer — handles headings, bold, lists, and line breaks
function renderMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-semibold mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-accent underline hover:text-violet-700">$1</a>')
    .replace(/^[-*+] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n{2,}/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br />')
}

// ---------------------------------------------------------------------------
// Single inbox item component
// ---------------------------------------------------------------------------

interface ItemProps {
  message: InboxMessage
  orgSlug: string
  onRead: (id: string) => void
}

function InboxItem({ message, orgSlug, onRead }: ItemProps) {
  const [expanded, setExpanded] = useState(false)
  const isUnread = message.read_at === null
  const meta = getChannelMeta(message.channel)
  const preview = stripMarkdown(message.content)
  const truncated = preview.length > 300 ? preview.slice(0, 300) + '…' : preview

  async function handleExpand() {
    const next = !expanded
    setExpanded(next)
    if (next && isUnread) {
      try {
        await fetch('/api/inbox', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [message.id] }),
        })
        onRead(message.id)
      } catch {
        // non-critical, swallow
      }
    }
  }

  return (
    <li
      className={[
        'border-b border-gray-100 last:border-b-0 transition-colors',
        isUnread
          ? 'border-l-2 border-l-accent bg-gray-50/50'
          : 'border-l-2 border-l-transparent bg-white',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={handleExpand}
        className="w-full text-left px-5 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        aria-expanded={expanded}
      >
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1.5">
          {/* Unread dot */}
          <span
            className={[
              'w-2 h-2 rounded-full shrink-0',
              isUnread ? 'bg-accent' : 'bg-transparent border border-gray-300',
            ].join(' ')}
            aria-hidden="true"
          />

          {/* Channel badge */}
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.badgeClass}`}
          >
            <span aria-hidden="true">{meta.icon}</span>
            {meta.label}
          </span>

          {/* Timestamp */}
          <span className="ml-auto text-xs text-gray-400 shrink-0">
            {formatRelativeTime(message.created_at)}
            {isUnread && (
              <span className="ml-1.5 text-accent font-semibold uppercase tracking-wide text-[10px]">
                UNREAD
              </span>
            )}
          </span>
        </div>

        {/* Content preview / full */}
        {expanded ? (
          <div
            className="text-sm text-gray-700 leading-relaxed mt-2 [&_li]:my-0.5 [&_h2]:text-gray-900 [&_h3]:text-gray-900"
            dangerouslySetInnerHTML={{
              __html: '<p class="mb-2">' + renderMarkdown(message.content) + '</p>',
            }}
          />
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed">{truncated}</p>
        )}
      </button>

      {/* Footer actions (shown when expanded) */}
      {expanded && (
        <div className="px-5 pb-4 space-y-3">
          {/* Skill chips for meeting briefings */}
          {message.channel === 'recall' && message.suggested_skills && message.suggested_skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {message.suggested_skills.slice(0, 3).map((slug) => (
                <Link
                  key={slug}
                  href={`/chat/${orgSlug}?session=${message.session_id}&skill=/${slug}`}
                  className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-3 py-1 text-xs font-medium text-accent hover:bg-accent hover:text-white hover:border-accent transition-colors"
                >
                  <span>⚡</span>
                  {slug}
                </Link>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4">
            {message.session_id && (
              <Link
                href={`/chat/${orgSlug}?session=${message.session_id}`}
                className="text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              >
                View in Chat →
              </Link>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

// ---------------------------------------------------------------------------
// Main InboxClient
// ---------------------------------------------------------------------------

export default function InboxClient({ orgId, orgSlug, initialMessages }: Props) {
  const [messages, setMessages] = useState<InboxMessage[]>(initialMessages)
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const unreadMessages = messages.filter((m) => m.read_at === null)
  const unreadCount = unreadMessages.length

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/inbox?orgId=${encodeURIComponent(orgId)}`)
      if (res.ok) {
        const json = (await res.json()) as { messages: InboxMessage[] }
        setMessages(json.messages)
      }
    } catch {
      // non-critical
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  function handleRead(id: string) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, read_at: new Date().toISOString() } : m
      )
    )
  }

  async function handleMarkAllRead() {
    if (unreadMessages.length === 0) return
    setMarkingAll(true)
    try {
      const ids = unreadMessages.map((m) => m.id)
      const res = await fetch('/api/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (res.ok) {
        const now = new Date().toISOString()
        setMessages((prev) =>
          prev.map((m) => (m.read_at === null ? { ...m, read_at: now } : m))
        )
      }
    } catch {
      // non-critical
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display font-semibold text-xl text-gray-900">Inbox</h1>
          {unreadCount > 0 && (
            <span className="text-xs font-medium bg-accent text-white rounded-full px-2 py-0.5">
              {unreadCount} unread
            </span>
          )}
          {loading && (
            <span className="text-xs text-gray-400 animate-pulse">Refreshing…</span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-sm text-gray-500 hover:text-gray-800 hover:underline disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Message list */}
      {messages.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">
            {loading ? 'Loading…' : 'Your inbox is empty. Agents will check in here when they have updates.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <ul>
            {messages.map((message) => (
              <InboxItem
                key={message.id}
                message={message}
                orgSlug={orgSlug}
                onRead={handleRead}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
