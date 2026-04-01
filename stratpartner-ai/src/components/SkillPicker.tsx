'use client'

import { useState, useEffect, useRef } from 'react'
import type { Skill } from '@/types/skill'

interface Props {
  skills: Skill[]
  onSelect: (skill: Skill) => void
  onClose: () => void
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

export default function SkillPicker({ skills, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = skills.filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Select a skill"
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <h2 className="font-display font-semibold text-base text-primary">Select a Skill</h2>
          <div className="flex-1">
            <input
              ref={searchRef}
              type="search"
              placeholder="Search skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Skill list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No skills match your search.</p>
          ) : (
            filtered.map((skill) => (
              <button
                key={skill.id}
                onClick={() => { onSelect(skill); onClose() }}
                onMouseEnter={() => setHovered(skill.id)}
                onMouseLeave={() => setHovered(null)}
                className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-base mt-0.5 shrink-0">{TYPE_ICON[skill.skill_type] ?? '⚡'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                      {skill.category && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {skill.category}
                        </span>
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${TYPE_BADGE[skill.skill_type] ?? TYPE_BADGE.strategy}`}>
                        {skill.skill_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{skill.description}</p>

                    {/* Expanded inputs/outputs on hover */}
                    {hovered === skill.id && (skill.inputs?.length > 0 || skill.outputs?.length > 0) && (
                      <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                        {skill.inputs?.slice(0, 3).length > 0 && (
                          <div>
                            <p className="font-semibold text-gray-400 uppercase tracking-wide mb-1" style={{ fontSize: '10px' }}>Inputs</p>
                            <ul className="space-y-0.5 text-gray-600">
                              {skill.inputs.slice(0, 3).map((inp, i) => (
                                <li key={i} className="truncate">• {inp.name}</li>
                              ))}
                              {skill.inputs.length > 3 && (
                                <li className="text-gray-400">+{skill.inputs.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                        {skill.outputs?.slice(0, 3).length > 0 && (
                          <div>
                            <p className="font-semibold text-gray-400 uppercase tracking-wide mb-1" style={{ fontSize: '10px' }}>Outputs</p>
                            <ul className="space-y-0.5 text-gray-600">
                              {skill.outputs.slice(0, 3).map((out, i) => (
                                <li key={i} className="truncate">→ {out.name}</li>
                              ))}
                              {skill.outputs.length > 3 && (
                                <li className="text-gray-400">+{skill.outputs.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
