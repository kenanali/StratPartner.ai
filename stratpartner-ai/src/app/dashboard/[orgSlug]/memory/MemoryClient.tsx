'use client'

import { useState, useCallback, useId } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type Category = 'Goals' | 'People' | 'Constraints' | 'Decisions' | 'Context'
type Confidence = 'Confirmed' | 'Inferred' | 'Outdated'
type Scope = 'org' | 'project'

interface MemoryCard {
  id: string
  text: string
  category: Category
  confidence: Confidence
  scope: Scope
  scopeLabel: string // e.g. "Organization" or project name
  pinned: boolean
  source: string // provenance — "AI-inferred" for now
}

interface ConflictPair {
  a: MemoryCard
  b: MemoryCard
}

interface ProjectWithMemory {
  id: string
  name: string
  memory: string | null
}

interface Props {
  orgId: string
  orgSlug: string
  initialOrgMemory: string
  projects: ProjectWithMemory[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Split prose into individual fact sentences. */
function parseSentences(prose: string): string[] {
  if (!prose.trim()) return []
  const lines = prose.split('\n').map((l) => l.trim()).filter(Boolean)
  const results: string[] = []

  for (const line of lines) {
    if (line.startsWith('- ')) {
      results.push(line.slice(2).trim())
    } else {
      const sentences = line
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      results.push(...sentences)
    }
  }

  return results.filter((s) => s.length > 0)
}

/** Auto-detect category from the card text using keyword heuristics. */
function detectCategory(text: string): Category {
  const lower = text.toLowerCase()

  // People: mentions names, roles, stakeholders
  if (
    /\b(ceo|cto|cfo|vp|director|manager|lead|owner|client|team|stakeholder|sponsor|champion|[A-Z][a-z]+ [A-Z][a-z]+)\b/.test(text) ||
    /\b(he|she|they|his|her|their)\b/.test(lower)
  ) {
    return 'People'
  }

  // Goals: objectives, targets, aims
  if (
    /\b(goal|objective|target|aim|want|need|plan|intend|vision|mission|priority|outcome|success|achieve|deliver)\b/.test(lower)
  ) {
    return 'Goals'
  }

  // Constraints: limits, blockers, cannot, budget, deadline
  if (
    /\b(constraint|blocker|block|limit|cannot|can't|won't|won't|budget|deadline|timeline|risk|issue|problem|concern|challenge|barrier)\b/.test(lower)
  ) {
    return 'Constraints'
  }

  // Decisions: decided, agreed, approved, chosen, selected
  if (
    /\b(decided|decision|agreed|agree|approved|approve|chosen|choose|selected|select|committed|commit|confirmed|confirm|resolved|resolve)\b/.test(lower)
  ) {
    return 'Decisions'
  }

  return 'Context'
}

let _cardCounter = 0
function buildCards(
  prose: string,
  scope: Scope,
  scopeLabel: string
): MemoryCard[] {
  return parseSentences(prose).map((text) => ({
    id: `card-${++_cardCounter}`,
    text,
    category: detectCategory(text),
    confidence: 'Inferred' as Confidence,
    scope,
    scopeLabel,
    pinned: false,
    source: 'AI-inferred',
  }))
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function removeCardFromProse(prose: string, card: string): string {
  const bulletPattern = new RegExp(`^- ?${escapeRegex(card)}\\s*$`, 'im')
  if (bulletPattern.test(prose)) {
    return prose.replace(bulletPattern, '').replace(/\n{2,}/g, '\n\n').trim()
  }
  const sentencePattern = new RegExp(`\\s*${escapeRegex(card)}`, 'g')
  return prose.replace(sentencePattern, '').replace(/\n{2,}/g, '\n\n').trim()
}

/** Simple conflict detection: same first 3 words, different endings. */
function detectConflicts(cards: MemoryCard[]): ConflictPair[] {
  const conflicts: ConflictPair[] = []
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i]
      const b = cards[j]
      const aWords = a.text.toLowerCase().split(/\s+/).slice(0, 3).join(' ')
      const bWords = b.text.toLowerCase().split(/\s+/).slice(0, 3).join(' ')
      if (aWords.length >= 3 && aWords === bWords && a.text !== b.text) {
        conflicts.push({ a, b })
      }
    }
  }
  return conflicts
}

// ── Badges ───────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<Category, string> = {
  Goals: 'bg-blue-50 text-blue-700 ring-blue-200',
  People: 'bg-purple-50 text-purple-700 ring-purple-200',
  Constraints: 'bg-red-50 text-red-700 ring-red-200',
  Decisions: 'bg-green-50 text-green-700 ring-green-200',
  Context: 'bg-gray-100 text-gray-600 ring-gray-200',
}

const CONFIDENCE_STYLES: Record<Confidence, string> = {
  Confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Inferred: 'bg-gray-100 text-gray-500 ring-gray-200',
  Outdated: 'bg-amber-50 text-amber-700 ring-amber-200',
}

function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${CATEGORY_COLORS[category]}`}
    >
      {category}
    </span>
  )
}

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${CONFIDENCE_STYLES[confidence]}`}
    >
      {confidence}
    </span>
  )
}

function ScopeBadge({ scope, scopeLabel }: { scope: Scope; scopeLabel: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
      {scope === 'org' ? 'Org' : `Project: ${scopeLabel}`}
    </span>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface Toast {
  id: string
  message: string
  undoFn?: () => void
}

// ── Card component ────────────────────────────────────────────────────────────

interface CardProps {
  card: MemoryCard
  onDelete: (card: MemoryCard) => void
  onEdit: (card: MemoryCard, newText: string) => void
  onPin: (card: MemoryCard) => void
  onConfidenceChange: (card: MemoryCard, confidence: Confidence) => void
}

function MemoryCardItem({ card, onDelete, onEdit, onPin, onConfidenceChange }: CardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(card.text)
  const inputId = useId()

  const handleEditSave = () => {
    if (editText.trim() && editText.trim() !== card.text) {
      onEdit(card, editText.trim())
    }
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setEditText(card.text)
    setIsEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    }
    if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  return (
    <div
      className={`group relative rounded-xl border bg-white transition-all duration-150 ${
        card.pinned
          ? 'border-accent/30 shadow-sm ring-1 ring-accent/20'
          : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
      }`}
    >
      {card.pinned && (
        <div className="absolute -top-1.5 left-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-px text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm">
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-2.5 w-2.5" aria-hidden="true">
              <path d="M9.5 1.5a1 1 0 0 1 1 1v1l1 1v1l-2 2v3l-1.5 1.5L7.5 11.5V8.5l-2-2v-1l1-1v-1a1 1 0 0 1 1-1h2z" />
            </svg>
            Pinned
          </span>
        </div>
      )}

      <div className="px-4 py-3">
        {/* Badge row */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={card.category} />
          <ConfidenceBadge confidence={card.confidence} />
          <ScopeBadge scope={card.scope} scopeLabel={card.scopeLabel} />
          <span className="ml-auto text-[10px] text-gray-300 italic">
            {card.source}
          </span>
        </div>

        {/* Text / inline edit */}
        {isEditing ? (
          <div className="mt-1">
            <label htmlFor={inputId} className="sr-only">Edit memory fact</label>
            <textarea
              id={inputId}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              autoFocus
              rows={2}
              className="w-full resize-none rounded-lg border border-accent/40 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            />
            <div className="mt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleEditSave}
                className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-white hover:bg-violet-600 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleEditCancel}
                className="rounded-md border border-gray-200 px-2.5 py-1 text-[11px] text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{card.text}</p>
        )}
      </div>

      {/* Hover action bar */}
      {!isEditing && (
        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {/* Pin */}
          <button
            type="button"
            onClick={() => onPin(card)}
            aria-label={card.pinned ? 'Unpin card' : 'Pin card to top'}
            title={card.pinned ? 'Unpin' : 'Pin to top'}
            className={`flex h-6 w-6 items-center justify-center rounded text-xs transition-colors ${
              card.pinned
                ? 'text-accent hover:text-violet-700'
                : 'text-gray-300 hover:text-accent hover:bg-violet-50'
            }`}
          >
            <svg viewBox="0 0 16 16" fill={card.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 1.5a1 1 0 0 1 1 1v1l1 1v1l-2 2v3l-1.5 1.5L7.5 11.5V8.5l-2-2v-1l1-1v-1a1 1 0 0 1 1-1h2z" />
            </svg>
          </button>

          {/* Confidence toggle: mark confirmed */}
          {card.confidence !== 'Confirmed' && (
            <button
              type="button"
              onClick={() => onConfidenceChange(card, 'Confirmed')}
              aria-label="Mark as confirmed"
              title="Mark as Confirmed"
              className="flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 8.5l3.5 3.5 7-7" />
              </svg>
            </button>
          )}

          {/* Mark outdated */}
          {card.confidence !== 'Outdated' && (
            <button
              type="button"
              onClick={() => onConfidenceChange(card, 'Outdated')}
              aria-label="Flag as outdated"
              title="Flag as Outdated"
              className="flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5v4M8 11.5v.5" />
                <circle cx="8" cy="8" r="6" />
              </svg>
            </button>
          )}

          {/* Edit */}
          <button
            type="button"
            onClick={() => {
              setEditText(card.text)
              setIsEditing(true)
            }}
            aria-label="Edit this memory card"
            title="Edit"
            className="flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 2.5l2.5 2.5-8 8H3v-2.5l8-8z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(card)}
            aria-label={`Delete memory: ${card.text.slice(0, 40)}`}
            title="Delete"
            className="flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className="h-3.5 w-3.5">
              <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Conflict panel ────────────────────────────────────────────────────────────

interface ConflictPanelProps {
  conflicts: ConflictPair[]
  onResolve: (keep: MemoryCard, discard: MemoryCard) => void
}

function ConflictPanel({ conflicts, onResolve }: ConflictPanelProps) {
  if (conflicts.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 2.5L13.5 12.5H2.5L8 2.5zM8 6v3.5M8 11.5v.5" />
        </svg>
        <p className="text-xs font-semibold text-amber-800">
          {conflicts.length === 1 ? '1 potential conflict detected' : `${conflicts.length} potential conflicts detected`}
        </p>
      </div>

      {conflicts.map((conflict, i) => (
        <div key={i} className="grid grid-cols-2 gap-3">
          {[conflict.a, conflict.b].map((card, j) => (
            <div key={card.id} className="rounded-lg border border-amber-200 bg-white p-3">
              <p className="text-xs text-gray-700 mb-2 leading-relaxed">{card.text}</p>
              <button
                type="button"
                onClick={() =>
                  onResolve(card, j === 0 ? conflict.b : conflict.a)
                }
                className="rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-amber-700 transition-colors"
              >
                Keep this
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────

const FILTER_OPTIONS: Array<Category | 'All'> = [
  'All',
  'Goals',
  'People',
  'Constraints',
  'Decisions',
  'Context',
]

interface FilterBarProps {
  active: Category | 'All'
  counts: Partial<Record<Category | 'All', number>>
  onChange: (f: Category | 'All') => void
}

function FilterBar({ active, counts, onChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap" role="group" aria-label="Filter memory cards by category">
      {FILTER_OPTIONS.map((opt) => {
        const count = counts[opt] ?? 0
        const isActive = active === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={isActive}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              isActive
                ? 'bg-accent text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
          >
            {opt}
            {count > 0 && (
              <span
                className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MemoryClient({ orgId, projects, initialOrgMemory }: Props) {
  // Build initial cards from org + project prose
  const buildAllCards = useCallback(() => {
    const orgCards = buildCards(initialOrgMemory, 'org', 'Organization')
    const projectCards = projects.flatMap((p) =>
      buildCards(p.memory ?? '', 'project', p.name)
    )
    return [...orgCards, ...projectCards]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [cards, setCards] = useState<MemoryCard[]>(buildAllCards)
  const [activeFilter, setActiveFilter] = useState<Category | 'All'>('All')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Keep raw prose state so we can persist changes
  const [orgProse, setOrgProse] = useState(initialOrgMemory)
  const [projectProses, setProjectProses] = useState<Record<string, string>>(
    Object.fromEntries(projects.map((p) => [p.id, p.memory ?? '']))
  )

  // ── Toast helpers ──────────────────────────────────────────────────────────

  const addToast = useCallback((message: string, undoFn?: () => void) => {
    const id = `toast-${Date.now()}`
    setToasts((prev) => [...prev, { id, message, undoFn }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // ── Persist helpers ────────────────────────────────────────────────────────

  const persistOrgMemory = useCallback(
    async (prose: string) => {
      setIsSaving(true)
      try {
        const res = await fetch('/api/memory', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgId, content: prose }),
        })
        if (!res.ok) throw new Error('Save failed')
        setOrgProse(prose)
      } catch {
        addToast('Failed to save. Please try again.')
      } finally {
        setIsSaving(false)
      }
    },
    [orgId, addToast]
  )

  const persistProjectMemory = useCallback(
    async (projectId: string, prose: string) => {
      setIsSaving(true)
      try {
        const res = await fetch('/api/memory/project', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, content: prose }),
        })
        if (!res.ok) throw new Error('Save failed')
        setProjectProses((prev) => ({ ...prev, [projectId]: prose }))
      } catch {
        addToast('Failed to save. Please try again.')
      } finally {
        setIsSaving(false)
      }
    },
    [addToast]
  )

  // ── Card actions ──────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    (card: MemoryCard) => {
      // Optimistic removal
      setCards((prev) => prev.filter((c) => c.id !== card.id))

      // Persist deletion
      if (card.scope === 'org') {
        const updated = removeCardFromProse(orgProse, card.text)
        persistOrgMemory(updated)
      } else {
        const project = projects.find((p) => p.name === card.scopeLabel)
        if (project) {
          const current = projectProses[project.id] ?? ''
          const updated = removeCardFromProse(current, card.text)
          persistProjectMemory(project.id, updated)
        }
      }

      // Undo
      addToast('Memory deleted.', () => {
        setCards((prev) => {
          // Re-insert at approximately the right position — just append for simplicity
          if (prev.find((c) => c.id === card.id)) return prev
          return [...prev, card]
        })
      })
    },
    [orgProse, projects, projectProses, persistOrgMemory, persistProjectMemory, addToast]
  )

  const handleEdit = useCallback(
    (card: MemoryCard, newText: string) => {
      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id
            ? { ...c, text: newText, confidence: 'Confirmed', category: detectCategory(newText) }
            : c
        )
      )

      // Persist: replace old text with new text in raw prose
      if (card.scope === 'org') {
        const escaped = escapeRegex(card.text)
        const updated = orgProse.replace(new RegExp(escaped, 'g'), newText)
        persistOrgMemory(updated)
      } else {
        const project = projects.find((p) => p.name === card.scopeLabel)
        if (project) {
          const current = projectProses[project.id] ?? ''
          const escaped = escapeRegex(card.text)
          const updated = current.replace(new RegExp(escaped, 'g'), newText)
          persistProjectMemory(project.id, updated)
        }
      }

      addToast('Memory updated.')
    },
    [orgProse, projects, projectProses, persistOrgMemory, persistProjectMemory, addToast]
  )

  const handlePin = useCallback((card: MemoryCard) => {
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, pinned: !c.pinned } : c))
    )
  }, [])

  const handleConfidenceChange = useCallback(
    (card: MemoryCard, confidence: Confidence) => {
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, confidence } : c))
      )
      addToast(
        confidence === 'Confirmed'
          ? 'Marked as Confirmed.'
          : 'Flagged as Outdated.'
      )
    },
    [addToast]
  )

  const handleResolveConflict = useCallback(
    (keep: MemoryCard, discard: MemoryCard) => {
      setCards((prev) => prev.filter((c) => c.id !== discard.id))
      if (discard.scope === 'org') {
        const updated = removeCardFromProse(orgProse, discard.text)
        persistOrgMemory(updated)
      } else {
        const project = projects.find((p) => p.name === discard.scopeLabel)
        if (project) {
          const current = projectProses[project.id] ?? ''
          const updated = removeCardFromProse(current, discard.text)
          persistProjectMemory(project.id, updated)
        }
      }
      addToast('Conflict resolved.')
    },
    [orgProse, projects, projectProses, persistOrgMemory, persistProjectMemory, addToast]
  )

  // ── Regenerate ─────────────────────────────────────────────────────────────

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true)
    try {
      const res = await fetch('/api/memory/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      })
      if (!res.ok) throw new Error('Regenerate failed')
      const data = (await res.json()) as { content?: string; skipped?: boolean }
      if (data.skipped) {
        addToast('No interactions found to build memory from.')
      } else {
        const newProse = data.content ?? ''
        setOrgProse(newProse)
        const newCards = buildCards(newProse, 'org', 'Organization')
        // Replace all org cards with freshly built ones, keep project cards
        setCards((prev) => {
          const projectCards = prev.filter((c) => c.scope === 'project')
          return [...newCards, ...projectCards]
        })
        addToast('Memory regenerated from recent interactions.')
      }
    } catch {
      addToast('Failed to regenerate. Please try again.')
    } finally {
      setIsRegenerating(false)
    }
  }, [orgId, addToast])

  // ── Derived state ─────────────────────────────────────────────────────────

  // Sort: pinned first, then by order
  const sortedCards = [...cards].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  })

  const filteredCards =
    activeFilter === 'All'
      ? sortedCards
      : sortedCards.filter((c) => c.category === activeFilter)

  // Count per category for filter bar
  const counts = cards.reduce<Partial<Record<Category | 'All', number>>>(
    (acc, card) => {
      acc[card.category] = (acc[card.category] ?? 0) + 1
      acc['All'] = (acc['All'] ?? 0) + 1
      return acc
    },
    {}
  )

  const conflicts = detectConflicts(cards)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary">Memory</h1>
          <p className="mt-1 text-sm text-gray-400">
            StratPartner builds context automatically from meetings, chats, and documents. Review, correct, or pin facts here.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isRegenerating || isSaving}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-50 transition-colors"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
            className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 8a5.5 5.5 0 1 1-1.5-3.8M13.5 2v3.5H10"
            />
          </svg>
          {isRegenerating ? 'Regenerating…' : 'Regenerate'}
        </button>
      </div>

      {/* Conflict panel */}
      {conflicts.length > 0 && (
        <ConflictPanel conflicts={conflicts} onResolve={handleResolveConflict} />
      )}

      {/* Filter bar */}
      <FilterBar active={activeFilter} counts={counts} onChange={setActiveFilter} />

      {/* Card grid */}
      {filteredCards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 px-4 py-12 text-center">
          <p className="text-sm text-gray-400">
            {activeFilter === 'All'
              ? 'No memory recorded yet. Memory is built automatically from meetings, chats, and documents.'
              : `No ${activeFilter} cards yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCards.map((card) => (
            <MemoryCardItem
              key={card.id}
              card={card}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onPin={handlePin}
              onConfidenceChange={handleConfidenceChange}
            />
          ))}
        </div>
      )}

      {/* Toast stack */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-sm text-white shadow-lg animate-in fade-in slide-in-from-bottom-2"
          >
            <span>{toast.message}</span>
            {toast.undoFn && (
              <button
                type="button"
                onClick={() => {
                  toast.undoFn!()
                  dismissToast(toast.id)
                }}
                className="text-xs font-semibold text-accent hover:text-violet-300 underline underline-offset-2 transition-colors"
              >
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="ml-1 text-white/50 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className="h-3 w-3">
                <path strokeLinecap="round" d="M1 1l10 10M11 1L1 11" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
