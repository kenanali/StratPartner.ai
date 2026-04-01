'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RunTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)

  async function run() {
    setRunning(true)
    await fetch('/api/tasks/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    })
    setRunning(false)
    router.refresh()
  }

  return (
    <button
      onClick={run}
      disabled={running}
      className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
    >
      {running ? 'Running…' : 'Run'}
    </button>
  )
}
