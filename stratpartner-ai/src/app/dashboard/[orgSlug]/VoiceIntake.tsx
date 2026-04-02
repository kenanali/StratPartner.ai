'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { VoiceIntakeSummary } from '@/app/api/intake/voice/route'

interface Props {
  orgId: string
  orgSlug: string
  isOpen: boolean
  onClose: () => void
}

type Mode = 'choose' | 'voice' | 'text' | 'processing' | 'confirm'
type VoiceState = 'idle' | 'connecting' | 'listening' | 'done' | 'error'

const CLIENT_TYPE_LABELS: Record<string, string> = {
  boutique_consultancy: 'Boutique consultancy',
  agency: 'Agency',
  in_house: 'In-house team',
  other: 'Other',
}

export default function VoiceIntake({ orgId, orgSlug, isOpen, onClose }: Props) {
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('choose')
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [typedInput, setTypedInput] = useState('')
  const [editedSummary, setEditedSummary] = useState<VoiceIntakeSummary | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vapiRef = useRef<any>(null)
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('choose')
      setVoiceState('idle')
      setTranscript('')
      setTypedInput('')
      setEditedSummary(null)
      setError(null)
    }
  }, [isOpen])

  // Cleanup VAPI on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        try { vapiRef.current.stop() } catch { /* ignore */ }
      }
      if (silenceTimer.current) clearTimeout(silenceTimer.current)
    }
  }, [])

  async function startVoice() {
    setMode('voice')
    setVoiceState('connecting')
    setError(null)

    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
    if (!publicKey) {
      setError('Voice not configured. Use the text option instead.')
      setVoiceState('error')
      return
    }

    try {
      // Dynamically import Vapi to avoid SSR issues
      const { default: Vapi } = await import('@vapi-ai/web')
      const vapi = new Vapi(publicKey)
      vapiRef.current = vapi

      let fullTranscript = ''

      vapi.on('speech-start', () => {
        setVoiceState('listening')
        if (silenceTimer.current) clearTimeout(silenceTimer.current)
      })

      vapi.on('speech-end', () => {
        // 3 seconds of silence → stop
        silenceTimer.current = setTimeout(() => {
          stopVoice(fullTranscript)
        }, 3000)
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vapi.on('message', (msg: any) => {
        if (msg?.type !== 'transcript' || msg?.role !== 'user') return
        if (msg.transcriptType === 'partial') {
          // Live preview only — don't commit yet
          setTranscript((fullTranscript + ' ' + msg.transcript).trim())
        } else if (msg.transcriptType === 'final' && msg.transcript) {
          // Commit to accumulated transcript
          fullTranscript += ' ' + msg.transcript
          setTranscript(fullTranscript.trim())
        }
      })

      vapi.on('call-end', () => {
        if (fullTranscript.trim()) {
          processTranscript(fullTranscript.trim())
        } else {
          setVoiceState('done')
        }
      })

      vapi.on('error', () => {
        setVoiceState('error')
        setError('Voice connection failed. Use the text option instead.')
      })

      await vapi.start({
        transcriber: { provider: 'deepgram', model: 'nova-2' },
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: `You are StratPartner, a senior strategy advisor. Ask the user: "Tell me about your project — who's the client, what are you trying to achieve, and what does success look like?" Listen attentively and ask at most one follow-up question. Keep the conversation under 2 minutes.`,
          }],
        },
        voice: { provider: '11labs', voiceId: 'rachel' },
      })

      setVoiceState('listening')
    } catch {
      setVoiceState('error')
      setError('Could not start voice session. Use the text option instead.')
    }
  }

  function stopVoice(currentTranscript?: string) {
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
    if (vapiRef.current) {
      try { vapiRef.current.stop() } catch { /* ignore */ }
      vapiRef.current = null
    }
    const text = currentTranscript ?? transcript
    if (text.trim()) {
      processTranscript(text.trim())
    } else {
      setVoiceState('done')
    }
  }

  async function processTranscript(text: string) {
    setMode('processing')
    try {
      const res = await fetch('/api/intake/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, orgId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Processing failed')
      setEditedSummary(data.summary)
      setMode('confirm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed')
      setMode('voice')
      setVoiceState('error')
    }
  }

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!typedInput.trim()) return
    await processTranscript(typedInput.trim())
  }

  async function handleConfirm() {
    if (!editedSummary) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          projectName: editedSummary.project_name,
          goal: editedSummary.goal,
          industry: editedSummary.client_type,
          timeline: '',
          stakeholders: '',
          biggestChallenge: editedSummary.key_challenges.join(', '),
          deliverables: [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create project')

      onClose()
      router.push(`/chat/${orgSlug}?session=${crypto.randomUUID()}&projectId=${data.projectId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">

        {/* Choose mode */}
        {mode === 'choose' && (
          <>
            <div className="px-8 pt-8 pb-6 text-center">
              <h2 className="font-display font-bold text-xl text-primary mb-2">Tell me about this project.</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Who&apos;s the client, what are you trying to achieve, and what does success look like?
              </p>
            </div>

            <div className="px-8 pb-8 grid grid-cols-2 gap-4">
              <button
                onClick={startVoice}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 p-6 text-center hover:border-accent hover:bg-violet-50 transition-all group"
              >
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <span className="text-2xl">🎙</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-primary">Talk to StratPartner</p>
                  <p className="text-xs text-gray-400 mt-0.5">Speak freely — I&apos;ll listen</p>
                </div>
              </button>

              <button
                onClick={() => setMode('text')}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 p-6 text-center hover:border-accent hover:bg-violet-50 transition-all group"
              >
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <span className="text-2xl">✍️</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-primary">Type instead</p>
                  <p className="text-xs text-gray-400 mt-0.5">Write it in your own words</p>
                </div>
              </button>
            </div>

            <div className="px-8 pb-6 text-center">
              <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Skip for now
              </button>
            </div>
          </>
        )}

        {/* Voice recording */}
        {mode === 'voice' && (
          <div className="px-8 py-10 text-center">
            <div className="mb-6">
              {voiceState === 'connecting' && (
                <>
                  <div className="h-16 w-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Connecting…</p>
                </>
              )}
              {voiceState === 'listening' && (
                <>
                  <div className="h-16 w-16 mx-auto rounded-full bg-accent flex items-center justify-center mb-4 animate-pulse">
                    <span className="text-white text-2xl">🎙</span>
                  </div>
                  <p className="font-semibold text-sm text-primary mb-1">Listening…</p>
                  <p className="text-xs text-gray-400">Speak freely. I&apos;ll capture everything.</p>
                </>
              )}
              {(voiceState === 'error') && (
                <>
                  <div className="h-16 w-16 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
                </>
              )}
            </div>

            {transcript && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-left mb-6 max-h-32 overflow-y-auto">
                <p className="text-xs text-gray-500 italic">&ldquo;{transcript}&rdquo;</p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {voiceState === 'listening' && (
                <button
                  onClick={() => stopVoice()}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                >
                  Done talking
                </button>
              )}
              <button
                onClick={() => { stopVoice(); setMode('text') }}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Switch to text
              </button>
              <button onClick={() => setMode('choose')} className="text-xs text-gray-400 hover:text-gray-600 px-2">
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Text input */}
        {mode === 'text' && (
          <form onSubmit={handleTextSubmit} className="px-8 py-8">
            <h2 className="font-display font-bold text-lg text-primary mb-1">Tell me about this project</h2>
            <p className="text-sm text-gray-400 mb-5">Describe the client, the goal, and what success looks like.</p>

            <textarea
              value={typedInput}
              onChange={e => setTypedInput(e.target.value)}
              placeholder="e.g. We're working with a mid-size boutique consultancy to reposition their go-to-market approach. They've been losing competitive deals to larger firms and need to sharpen their differentiation. Success looks like a clear positioning narrative and pipeline within 90 days…"
              rows={6}
              autoFocus
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition resize-none"
            />

            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setMode('choose')} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                ← Back
              </button>
              <button
                type="submit"
                disabled={!typedInput.trim()}
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-40 transition-colors"
              >
                Continue →
              </button>
            </div>
          </form>
        )}

        {/* Processing */}
        {mode === 'processing' && (
          <div className="px-8 py-16 text-center">
            <svg className="h-8 w-8 animate-spin text-accent mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="font-display font-semibold text-sm text-primary mb-1">Capturing your project…</p>
            <p className="text-xs text-gray-400">StratPartner is structuring what you shared</p>
          </div>
        )}

        {/* Confirmation screen */}
        {mode === 'confirm' && editedSummary && (
          <div className="px-8 py-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">✅</span>
              <h2 className="font-display font-bold text-lg text-primary">Here&apos;s what I understood</h2>
            </div>
            <p className="text-xs text-gray-400 mb-5">Does this look right? Edit anything before confirming.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Project name</label>
                <input
                  value={editedSummary.project_name}
                  onChange={e => setEditedSummary({ ...editedSummary, project_name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Goal</label>
                <textarea
                  value={editedSummary.goal}
                  onChange={e => setEditedSummary({ ...editedSummary, goal: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client type</label>
                <select
                  value={editedSummary.client_type}
                  onChange={e => setEditedSummary({ ...editedSummary, client_type: e.target.value as VoiceIntakeSummary['client_type'] })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent bg-white"
                >
                  {Object.entries(CLIENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {editedSummary.key_challenges.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Key challenges</label>
                  <ul className="space-y-1">
                    {editedSummary.key_challenges.map((c, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-accent text-xs">•</span>
                        <span className="text-sm text-gray-700">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setMode('choose')} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Start over
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Creating project…' : 'Confirm & open chat →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
