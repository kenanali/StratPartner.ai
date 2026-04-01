'use client'

import { useState } from 'react'

interface Props {
  orgId: string
  initialMemory: string
}

export default function MemoryEditor({ orgId, initialMemory }: Props) {
  const [memory, setMemory] = useState(initialMemory)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/admin/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, content: memory }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-2">
      <textarea
        value={memory}
        onChange={(e) => setMemory(e.target.value)}
        rows={10}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
        placeholder="No memory yet. This will be populated automatically as the org uses the assistant."
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save memory'}
      </button>
    </div>
  )
}
