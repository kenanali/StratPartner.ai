'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

interface Deliverable {
  id: string
  project_id: string
  org_id: string
  title: string
  type: string
  phase: string | null
  content: string | null
  version: number | null
  task_id: string | null
  session_id: string | null
  created_at: string
}

interface Props {
  deliverable: Deliverable
  orgSlug: string
  projectId: string
}

// ---------------------------------------------------------------------------
// Type metadata
// ---------------------------------------------------------------------------

interface TypeMeta {
  icon: string
  label: string
}

const TYPE_META: Record<string, TypeMeta> = {
  'research-brief':          { icon: '🔍', label: 'Research Brief' },
  'journey-map':             { icon: '🗺', label: 'Journey Map' },
  'persona-build':           { icon: '👤', label: 'Persona' },
  'brand-building-blocks':   { icon: '🧱', label: 'Brand Building Blocks' },
  'brand-territories':       { icon: '🏔', label: 'Brand Territories' },
  'biz-case':                { icon: '💼', label: 'Business Case' },
  'prioritize':              { icon: '🎯', label: 'Prioritization' },
}
const DEFAULT_META: TypeMeta = { icon: '📄', label: 'Deliverable' }

function getTypeMeta(type: string): TypeMeta {
  return TYPE_META[type] ?? DEFAULT_META
}

// ---------------------------------------------------------------------------
// Markdown renderer (mirrors ChatUI SimpleMarkdown)
// ---------------------------------------------------------------------------

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/)
  return parts.map((part, i) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-primary">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="font-mono text-xs bg-gray-100 text-primary px-1.5 py-0.5 rounded">{part.slice(1, -1)}</code>
    if (part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)) {
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (m) return <a key={i} href={m[2]} className="text-accent underline" target="_blank" rel="noopener noreferrer">{m[1]}</a>
    }
    return part
  })
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n')
  let inCodeBlock = false

  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-gray-800">
      {lines.map((line, i) => {
        if (line.startsWith('```')) {
          inCodeBlock = !inCodeBlock
          return null
        }
        if (inCodeBlock) {
          return (
            <pre key={i} className="font-mono text-xs bg-gray-50 text-primary px-3 py-1 rounded border border-gray-100 overflow-x-auto">
              {line}
            </pre>
          )
        }
        if (line.startsWith('### '))
          return <h3 key={i} className="font-display font-semibold text-sm text-primary mt-4 mb-0.5 uppercase tracking-wide">{line.slice(4)}</h3>
        if (line.startsWith('## '))
          return <h2 key={i} className="font-display font-semibold text-base text-primary mt-5 mb-1">{line.slice(3)}</h2>
        if (line.startsWith('# '))
          return <h1 key={i} className="font-display font-bold text-lg text-primary mt-6 mb-1">{line.slice(2)}</h1>
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
          return <hr key={i} className="border-gray-200 my-3" />
        if (!line.trim())
          return <div key={i} className="h-1" />
        return <p key={i}>{renderInline(line)}</p>
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Download helper
// ---------------------------------------------------------------------------

function downloadMarkdown(title: string, content: string) {
  const filename = `${title.replace(/\s+/g, '-').toLowerCase()}.md`
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DeliverableDetailClient({ deliverable, orgSlug, projectId }: Props) {
  const router = useRouter()
  const meta = getTypeMeta(deliverable.type)

  async function createRevisionTask() {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        org_id: deliverable.org_id,
        title: `Revise: ${deliverable.title}`,
        type: deliverable.type,
        context: `Revision of deliverable ${deliverable.id}. Previous version: ${deliverable.version ?? 1}.`,
      }),
    })
    if (res.ok) {
      router.push(`/dashboard/${orgSlug}/projects/${projectId}`)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Left column — 60% */}
      <div className="flex-[3] overflow-y-auto p-8 border-r border-gray-100">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl mt-0.5 shrink-0" role="img" aria-label={meta.label}>
            {meta.icon}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5">
                {meta.label}
              </span>
              {deliverable.version != null && (
                <span className="text-xs font-medium bg-accent/10 text-accent rounded-full px-2.5 py-0.5">
                  v{deliverable.version}
                </span>
              )}
              {deliverable.phase && (
                <span className="text-xs font-medium bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5 capitalize">
                  {deliverable.phase} phase
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-xl text-primary leading-snug">
              {deliverable.title}
            </h1>
          </div>
        </div>

        {/* Date + source */}
        <p className="text-xs text-gray-400 mb-6">
          {formatDate(deliverable.created_at)}
          {(deliverable.task_id || deliverable.session_id) && (
            <span>
              {' · '}Created from{' '}
              {deliverable.task_id ? 'a task' : 'a chat session'}
            </span>
          )}
        </p>

        {/* Content */}
        {deliverable.content ? (
          <SimpleMarkdown content={deliverable.content} />
        ) : (
          <p className="text-sm text-gray-400 italic">No content available.</p>
        )}

        {/* Bottom actions */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
          <Link
            href={`/dashboard/${orgSlug}/projects/${projectId}/deliverables`}
            className="text-sm text-gray-500 hover:text-primary transition-colors"
          >
            ← Back to deliverables
          </Link>
          {deliverable.content && (
            <button
              onClick={() => downloadMarkdown(deliverable.title, deliverable.content!)}
              className="ml-auto text-sm font-medium border border-gray-200 text-gray-600 rounded-xl px-4 py-2 hover:border-gray-300 hover:text-primary transition-colors"
            >
              Download .md
            </button>
          )}
        </div>
      </div>

      {/* Right column — 40%, sticky */}
      <div className="flex-[2] overflow-y-auto p-6 space-y-4">
        {/* Discuss card */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="font-display font-semibold text-sm text-primary mb-1">
            Discuss this deliverable
          </h3>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Open a chat session with this deliverable loaded as context.
          </p>
          <Link
            href={`/chat/${orgSlug}?deliverable=${deliverable.id}`}
            className="block w-full text-center text-sm font-medium bg-accent text-white rounded-xl px-4 py-2.5 hover:bg-accent/90 transition-colors"
          >
            Open in Chat
          </Link>
        </div>

        {/* New version card */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="font-display font-semibold text-sm text-primary mb-1">
            Create new version
          </h3>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Queue a revision task for this deliverable. You&apos;ll be redirected to the project page.
          </p>
          <button
            onClick={createRevisionTask}
            className="w-full text-sm font-medium bg-white border border-gray-200 text-primary rounded-xl px-4 py-2.5 hover:border-accent hover:text-accent transition-colors"
          >
            Create Revision Task
          </button>
        </div>
      </div>
    </div>
  )
}
