'use client'

import { useState } from 'react'
import Link from 'next/link'

interface DeliverableSummary {
  id: string
  title: string
  type: string
  phase: string | null
  version: number | null
  content: string | null
  created_at: string
}

interface Project {
  id: string
  name: string
  phase: string | null
}

interface Props {
  orgSlug: string
  project: Project
  deliverables: DeliverableSummary[]
}

// ---------------------------------------------------------------------------
// Type metadata
// ---------------------------------------------------------------------------

interface TypeMeta {
  icon: string
  bg: string
  label: string
}

const TYPE_META: Record<string, TypeMeta> = {
  'research-brief':          { icon: '🔍', bg: 'bg-blue-50',   label: 'Research Brief' },
  'journey-map':             { icon: '🗺', bg: 'bg-violet-50', label: 'Journey Map' },
  'persona-build':           { icon: '👤', bg: 'bg-amber-50',  label: 'Persona' },
  'brand-building-blocks':   { icon: '🧱', bg: 'bg-green-50',  label: 'Brand Blocks' },
  'brand-territories':       { icon: '🏔', bg: 'bg-indigo-50', label: 'Brand Territories' },
  'biz-case':                { icon: '💼', bg: 'bg-gray-50',   label: 'Biz Case' },
  'prioritize':              { icon: '🎯', bg: 'bg-red-50',    label: 'Prioritization' },
}
const DEFAULT_META: TypeMeta = { icon: '📄', bg: 'bg-gray-50', label: 'Deliverable' }

function getTypeMeta(type: string): TypeMeta {
  return TYPE_META[type] ?? DEFAULT_META
}

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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DeliverablesClient({ orgSlug, project, deliverables }: Props) {
  const [activeFilter, setActiveFilter] = useState('All')

  const presentTypes = ['All', ...Array.from(new Set(deliverables.map(d => d.type)))]

  const filtered = activeFilter === 'All'
    ? deliverables
    : deliverables.filter(d => d.type === activeFilter)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 mb-3 text-sm">
          <Link href={`/dashboard/${orgSlug}`} className="text-violet-600 hover:underline">
            Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <Link
            href={`/dashboard/${orgSlug}/projects/${project.id}`}
            className="text-violet-600 hover:underline"
          >
            {project.name}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-medium">Deliverables</span>
        </nav>

        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-primary">Deliverables</h1>
          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5 font-medium">
            {deliverables.length}
          </span>
        </div>
      </div>

      {/* Filter bar */}
      {deliverables.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {presentTypes.map(type => {
            const meta = type === 'All' ? null : getTypeMeta(type)
            const isActive = activeFilter === type
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                  isActive
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-primary bg-white'
                }`}
              >
                {meta ? `${meta.icon} ${meta.label}` : 'All'}
              </button>
            )
          })}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No deliverables yet.</p>
          <p className="text-gray-300 text-xs mt-1">Use the chat to generate strategy outputs.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(d => (
            <DeliverableCard
              key={d.id}
              deliverable={d}
              orgSlug={orgSlug}
              projectId={project.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Deliverable card
// ---------------------------------------------------------------------------

interface CardProps {
  deliverable: DeliverableSummary
  orgSlug: string
  projectId: string
}

function DeliverableCard({ deliverable, orgSlug, projectId }: CardProps) {
  const meta = getTypeMeta(deliverable.type)
  const preview = deliverable.content?.slice(0, 200) ?? ''

  return (
    <div className={`rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow ${meta.bg}`}>
      {/* Type badge */}
      <div className="flex items-center gap-2">
        <span className="text-xl" role="img" aria-label={meta.label}>{meta.icon}</span>
        <span className="text-xs font-medium text-gray-500 bg-white/70 rounded-full px-2.5 py-0.5 border border-gray-200">
          {meta.label}
        </span>
      </div>

      {/* Title */}
      <p className="font-display font-semibold text-sm text-primary leading-snug line-clamp-2">
        {deliverable.title}
      </p>

      {/* Meta row */}
      <p className="text-xs text-gray-400">
        {deliverable.phase && <span className="capitalize">{deliverable.phase} phase</span>}
        {deliverable.phase && deliverable.version != null && <span> · </span>}
        {deliverable.version != null && <span>v{deliverable.version}</span>}
        {(deliverable.phase || deliverable.version != null) && <span> · </span>}
        <span>{formatDate(deliverable.created_at)}</span>
      </p>

      {/* Preview */}
      {preview && (
        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed bg-white/60 rounded-xl p-2.5">
          {preview}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <Link
          href={`/dashboard/${orgSlug}/projects/${projectId}/deliverables/${deliverable.id}`}
          className="flex-1 text-center text-xs font-medium bg-white border border-gray-200 text-primary rounded-lg px-3 py-2 hover:border-accent hover:text-accent transition-colors"
        >
          View
        </Link>
        {deliverable.content && (
          <button
            onClick={() => downloadMarkdown(deliverable.title, deliverable.content!)}
            className="flex-1 text-center text-xs font-medium bg-white border border-gray-200 text-gray-500 rounded-lg px-3 py-2 hover:border-gray-300 hover:text-primary transition-colors"
          >
            Download .md
          </button>
        )}
      </div>
    </div>
  )
}
