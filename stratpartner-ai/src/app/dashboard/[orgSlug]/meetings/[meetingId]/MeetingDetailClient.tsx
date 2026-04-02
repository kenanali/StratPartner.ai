'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Props {
  meetingId: string
  orgSlug: string
  orgId: string
}

interface DebugData {
  meeting: {
    id: string
    status: string
    recall_bot_id: string
    transcript_segments: number
    transcript_preview: unknown[]
    proactive_message_sent: boolean
    has_findings: boolean
  }
  recall: {
    id: string
    latest_status: string | null
    status_changes: Array<{ code: string; created_at: string }>
    realtime_endpoints: Array<{ url: string; events: string[] }>
    recordings: Array<{ id: string; status: string }>
  } | null
  recall_error: string | null
}

function Row({ label, value, highlight }: { label: string; value?: string; highlight?: 'red' | 'green' | 'yellow' }) {
  const color = highlight === 'red' ? 'text-red-600' : highlight === 'green' ? 'text-green-600' : highlight === 'yellow' ? 'text-amber-600' : 'text-gray-700'
  return (
    <p>
      <span className="text-gray-400 w-48 inline-block">{label}:</span>
      <span className={color}>{value ?? '—'}</span>
    </p>
  )
}

export default function MeetingDetailClient({ meetingId, orgSlug, orgId }: Props) {
  const [data, setData] = useState<DebugData | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractResult, setExtractResult] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState('')
  const [syncExtracting, setSyncExtracting] = useState(false)
  const [syncResult, setSyncResult] = useState<Record<string, unknown> | null>(null)
  const [syncExpanded, setSyncExpanded] = useState(false)

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/meetings/${meetingId}/debug`)
    if (res.ok) {
      setData(await res.json())
      setLastRefresh(new Date().toLocaleTimeString())
    }
  }, [meetingId])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  async function handleExtract() {
    setExtracting(true)
    setExtractResult(null)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      })
      const json = await res.json()
      setExtractResult(res.ok ? '✓ Extraction triggered — check back in ~30s' : `Error: ${json.error}`)
    } catch (e) {
      setExtractResult(`Error: ${String(e)}`)
    } finally {
      setExtracting(false)
    }
  }

  async function handleExtractSync() {
    setSyncExtracting(true)
    setSyncResult(null)
    setSyncExpanded(false)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/extract-sync`, {
        method: 'POST',
      })
      const json = await res.json()
      setSyncResult(json as Record<string, unknown>)
      setSyncExpanded(true)
    } catch (e) {
      setSyncResult({ error: String(e) })
      setSyncExpanded(true)
    } finally {
      setSyncExtracting(false)
    }
  }

  const m = data?.meeting

  return (
    <div className="max-w-3xl mx-auto p-8 font-mono text-sm">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/dashboard/${orgSlug}/meetings`} className="text-xs text-gray-400 hover:text-gray-600">
          ← Meetings
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">auto-refresh 5s · {lastRefresh}</span>
          <button onClick={refresh} className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50">
            Refresh
          </button>
        </div>
      </div>

      {!data ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-6">

          <section>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">DB State</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <Row label="status" value={m?.status} highlight={m?.status === 'failed' ? 'red' : m?.status === 'complete' ? 'green' : 'yellow'} />
              <Row label="recall_bot_id" value={m?.recall_bot_id} />
              <Row label="transcript_segments" value={String(m?.transcript_segments ?? 0)} highlight={(m?.transcript_segments ?? 0) > 0 ? 'green' : 'red'} />
              <Row label="proactive_message_sent" value={String(m?.proactive_message_sent)} />
              <Row label="has_findings" value={String(m?.has_findings)} />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Recall Bot</h2>
            {data.recall_error ? (
              <div className="bg-red-50 text-red-700 rounded-lg p-4 text-xs">{data.recall_error}</div>
            ) : data.recall ? (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <Row label="latest_status" value={data.recall.latest_status ?? 'unknown'} highlight={data.recall.latest_status === 'done' ? 'green' : 'yellow'} />
                <div>
                  <p className="text-gray-400 mb-1">status_changes:</p>
                  {data.recall.status_changes?.map((s, i) => (
                    <p key={i} className="ml-4 text-gray-700">
                      <span className="text-accent">{s.code}</span>
                      <span className="text-gray-400 ml-2 text-xs">{new Date(s.created_at).toLocaleTimeString()}</span>
                    </p>
                  ))}
                </div>
                <div>
                  <p className="text-gray-400 mb-1">webhook_url:</p>
                  <p className="ml-4 text-gray-700 break-all">{data.recall.realtime_endpoints?.[0]?.url ?? 'none'}</p>
                  <p className="ml-4 text-gray-500 text-xs">events: {data.recall.realtime_endpoints?.[0]?.events?.join(', ') ?? 'none'}</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-gray-400">No Recall data</div>
            )}
          </section>

          {m && m.transcript_segments > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Transcript Preview</h2>
              <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-auto max-h-48 text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(data.meeting.transcript_preview, null, 2)}
              </pre>
            </section>
          )}

          <section>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Actions</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleExtract}
                disabled={extracting}
                className="px-4 py-2 bg-accent text-white text-xs rounded-lg hover:bg-violet-600 disabled:opacity-50"
              >
                {extracting ? 'Triggering…' : 'Force Extract'}
              </button>
              <button
                onClick={handleExtractSync}
                disabled={syncExtracting}
                className="px-4 py-2 bg-gray-700 text-white text-xs rounded-lg hover:bg-gray-900 disabled:opacity-50"
              >
                {syncExtracting ? 'Fetching…' : 'Extract Sync (Debug)'}
              </button>
              {m?.has_findings && (
                <Link href={`/chat/${orgSlug}`} className="px-4 py-2 border border-gray-200 text-xs rounded-lg hover:bg-gray-50">
                  View briefing in Chat →
                </Link>
              )}
            </div>
            {extractResult && (
              <p className={`mt-2 text-xs ${extractResult.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                {extractResult}
              </p>
            )}
            {syncResult && (
              <div className="mt-3">
                <button
                  onClick={() => setSyncExpanded((v) => !v)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  {syncExpanded ? 'Hide' : 'Show'} sync result
                </button>
                {syncExpanded && (
                  <pre className="mt-2 bg-gray-50 rounded-lg p-4 text-xs overflow-auto max-h-96 text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(syncResult, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </section>

          <details>
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Raw JSON</summary>
            <pre className="mt-2 bg-gray-50 rounded-lg p-4 text-xs overflow-auto max-h-96 text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>

        </div>
      )}
    </div>
  )
}
