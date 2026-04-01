'use client'

import { useState } from 'react'

interface SkillRow {
  skillId: string
  enabled: boolean
  slug: string
  name: string
  track: string
}

interface Props {
  orgId: string
  skills: SkillRow[]
}

export default function SkillsToggles({ orgId, skills: initial }: Props) {
  const [skills, setSkills] = useState(initial)
  const [saving, setSaving] = useState<string | null>(null)

  async function toggle(skillId: string, enabled: boolean) {
    setSaving(skillId)
    await fetch('/api/admin/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, skillId, enabled }),
    })
    setSkills((prev) => prev.map((s) => s.skillId === skillId ? { ...s, enabled } : s))
    setSaving(null)
  }

  const byTrack = skills.reduce<Record<string, SkillRow[]>>((acc, s) => {
    const t = s.track ?? 'cx'
    if (!acc[t]) acc[t] = []
    acc[t].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {Object.entries(byTrack).map(([track, trackSkills]) => (
        <div key={track}>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{track}</p>
          <div className="space-y-1.5">
            {trackSkills.map((skill) => (
              <label
                key={skill.skillId}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 cursor-pointer hover:border-indigo-200"
              >
                <span className="text-sm text-gray-800">{skill.name ?? skill.slug}</span>
                <input
                  type="checkbox"
                  checked={skill.enabled}
                  disabled={saving === skill.skillId}
                  onChange={(e) => toggle(skill.skillId, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
