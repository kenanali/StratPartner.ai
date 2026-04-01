'use client'

import { useState, useEffect, useRef } from 'react'
import type { Skill } from '@/types/skill'

interface Props {
  skills: Skill[]
  orgSlug: string
}

const TYPE_ICON: Record<string, string> = {
  strategy: '⚡',
  tool: '🔧',
  workflow: '🔄',
  playbook: '📋',
}

const TYPE_BADGE: Record<string, string> = {
  strategy: 'bg-violet-100 text-violet-700',
  tool: 'bg-blue-100 text-blue-700',
  workflow: 'bg-amber-100 text-amber-700',
  playbook: 'bg-green-100 text-green-700',
}

function SkillDetailDrawer({
  skill,
  orgSlug,
  onClose,
}: {
  skill: Skill
  orgSlug: string
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />
      {/* Drawer */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        className="w-full max-w-xl bg-white shadow-2xl overflow-y-auto outline-none"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span>{TYPE_ICON[skill.skill_type] ?? '⚡'}</span>
              <h2 id="drawer-title" className="font-display font-semibold text-lg text-primary truncate">
                {skill.name}
              </h2>
              {skill.auto_save && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">auto-save</span>
              )}
            </div>
            <div className="mt-1.5 flex gap-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[skill.skill_type] ?? TYPE_BADGE.strategy}`}>
                {skill.skill_type}
              </span>
              {skill.category && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {skill.category}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <p className="text-sm text-gray-700 leading-relaxed">{skill.description}</p>

          {skill.inputs?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Inputs</p>
              <ul className="space-y-2">
                {skill.inputs.map((inp, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className={`shrink-0 mt-0.5 text-xs font-medium ${inp.required ? 'text-red-500' : 'text-gray-300'}`}>
                      {inp.required ? '●' : '○'}
                    </span>
                    <div>
                      <span className="font-medium text-gray-800">{inp.name}</span>
                      {inp.description && (
                        <span className="text-gray-500"> — {inp.description}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {skill.outputs?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Outputs</p>
              <ul className="space-y-2">
                {skill.outputs.map((out, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-accent shrink-0 mt-0.5">→</span>
                    <div>
                      <span className="font-medium text-gray-800">{out.name}</span>
                      {out.description && (
                        <span className="text-gray-500"> — {out.description}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {skill.trigger_phrases?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Trigger phrases</p>
              <div className="flex flex-wrap gap-1.5">
                {skill.trigger_phrases.map((t, i) => (
                  <code key={i} className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {t}
                  </code>
                ))}
              </div>
            </div>
          )}

          {skill.connects_to && skill.connects_to.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Orchestrates</p>
              <div className="flex flex-wrap gap-1.5">
                {skill.connects_to.map((s, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          <a
            href={`/chat/${orgSlug}`}
            className="block w-full rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-violet-600 transition-colors"
          >
            Use in Chat
          </a>
        </div>
      </div>
    </div>
  )
}

function SkillCard({ skill, onDetails }: { skill: Skill; onDetails: (s: Skill) => void }) {
  const maxItems = 3
  const extraInputs = (skill.inputs?.length ?? 0) - maxItems
  const extraOutputs = (skill.outputs?.length ?? 0) - maxItems

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-5 hover:border-accent/40 hover:shadow-sm transition-all cursor-pointer flex flex-col gap-3"
      onClick={() => onDetails(skill)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{TYPE_ICON[skill.skill_type] ?? '⚡'}</span>
          <p className="font-display font-semibold text-sm text-primary truncate">{skill.name}</p>
        </div>
        <div className="flex gap-1 shrink-0 flex-wrap justify-end">
          {skill.category && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {skill.category}
            </span>
          )}
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TYPE_BADGE[skill.skill_type] ?? TYPE_BADGE.strategy}`}>
            {skill.skill_type}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{skill.description}</p>

      {/* Inputs / Outputs */}
      {(skill.inputs?.length > 0 || skill.outputs?.length > 0) && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          {skill.inputs?.length > 0 && (
            <div>
              <p className="font-semibold uppercase tracking-wide text-gray-400 mb-1" style={{ fontSize: '10px' }}>Inputs</p>
              <ul className="space-y-0.5 text-gray-600">
                {skill.inputs.slice(0, maxItems).map((inp, i) => (
                  <li key={i} className="truncate">• {inp.name}</li>
                ))}
                {extraInputs > 0 && <li className="text-gray-400">+{extraInputs} more</li>}
              </ul>
            </div>
          )}
          {skill.outputs?.length > 0 && (
            <div>
              <p className="font-semibold uppercase tracking-wide text-gray-400 mb-1" style={{ fontSize: '10px' }}>Outputs</p>
              <ul className="space-y-0.5 text-gray-600">
                {skill.outputs.slice(0, maxItems).map((out, i) => (
                  <li key={i} className="truncate">→ {out.name}</li>
                ))}
                {extraOutputs > 0 && <li className="text-gray-400">+{extraOutputs} more</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-2">
          {skill.auto_save && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              auto-save
            </span>
          )}
          {skill.trigger_phrases?.[0] && (
            <code className="font-mono text-xs text-gray-400 truncate max-w-24">{skill.trigger_phrases[0]}</code>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDetails(skill) }}
          className="text-xs text-accent hover:text-violet-700 font-medium transition-colors"
        >
          Details →
        </button>
      </div>
    </div>
  )
}

export default function SkillCatalogClient({ skills, orgSlug }: Props) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

  const categories = Array.from(new Set(skills.map((s) => s.category).filter(Boolean))).sort()

  const filtered = skills.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || s.skill_type === filterType
    const matchCat = !filterCategory || s.category === filterCategory
    return matchSearch && matchType && matchCat
  })

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Skills</h1>
          <p className="mt-1 text-sm text-gray-500">{skills.length} skills available</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search skills…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-accent"
        >
          <option value="">All types</option>
          <option value="strategy">Strategy</option>
          <option value="tool">Tool</option>
          <option value="workflow">Workflow</option>
          <option value="playbook">Playbook</option>
        </select>
        {categories.length > 0 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        {(search || filterType || filterCategory) && (
          <button
            onClick={() => { setSearch(''); setFilterType(''); setFilterCategory('') }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results label */}
      <p className="text-xs text-gray-400 mb-4">
        {filtered.length} of {skills.length} skills
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center">
          <p className="text-sm text-gray-400">No skills match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((skill) => (
            <SkillCard key={skill.id} skill={skill} onDetails={setSelectedSkill} />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {selectedSkill && (
        <SkillDetailDrawer
          skill={selectedSkill}
          orgSlug={orgSlug}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </>
  )
}
