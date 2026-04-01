'use client'

import { useState } from 'react'

interface Props {
  orgId: string
  projectId: string
  projectName: string
}

export default function InviteToMeetingButton({ orgId, projectId, projectName }: Props) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/meetings/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          projectId,
          meetingUrl: url.trim(),
          title: title.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to start meeting bot')
      }

      setOpen(false)
      setUrl('')
      setTitle('')
      showToast('success', 'StratPartner is joining your meeting. You\'ll get a briefing when it ends.')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition-colors"
      >
        <span>🎙</span>
        Invite to meeting
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="font-display font-semibold text-base text-primary">Invite StratPartner to a meeting</h2>
              <p className="text-xs text-gray-400 mt-1">Bot will join, take notes, and send you a full briefing after.</p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Meeting URL <span className="text-danger">*</span></label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="Paste Zoom / Meet / Teams link…"
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Meeting title <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Week 4 client strategy session"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Project</label>
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  {projectName}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setUrl(''); setTitle('') }}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Inviting…' : 'Invite StratPartner →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg max-w-sm ${
          toast.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {toast.message}
        </div>
      )}
    </>
  )
}
