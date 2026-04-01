export interface DeliverableMeta {
  title: string
}

/**
 * Extracts the ---DELIVERABLE--- marker from skill output.
 * Returns the main content (without the marker) and the parsed metadata.
 * If no marker is found, returns null for meta.
 */
export function parseDeliverable(text: string): {
  mainContent: string
  meta: DeliverableMeta | null
} {
  const markerRegex = /---DELIVERABLE---[\s\S]*?\nTitle:\s*(.+?)\s*\n---/

  const match = text.match(markerRegex)
  if (!match) {
    return { mainContent: text, meta: null }
  }

  const title = match[1].trim()
  const mainContent = text.replace(markerRegex, '').trim()

  return {
    mainContent,
    meta: { title },
  }
}

/**
 * Saves a deliverable to the database.
 * Returns the saved deliverable id.
 */
export async function saveDeliverable(params: {
  orgId: string
  projectId: string | null
  title: string
  type: string
  content: string
  sessionId?: string
  taskId?: string
}): Promise<string | null> {
  const { getSupabaseAdmin } = await import('./supabase')
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('deliverables')
    .insert({
      org_id: params.orgId,
      project_id: params.projectId,
      title: params.title,
      type: params.type,
      content: params.content,
      session_id: params.sessionId ?? null,
      task_id: params.taskId ?? null,
      version: 1,
    })
    .select('id')
    .single()

  if (error || !data) return null
  return data.id
}
