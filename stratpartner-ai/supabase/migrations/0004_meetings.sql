-- Migration 0004: Meetings Integration (Recall.ai)
-- Run this in the Supabase SQL editor

-- ── Extend meetings table ────────────────────────────────────────────────────
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS recall_bot_id          text,
  ADD COLUMN IF NOT EXISTS meeting_url            text,
  ADD COLUMN IF NOT EXISTS title                  text,
  ADD COLUMN IF NOT EXISTS status                 text DEFAULT 'pending',
  -- pending | joining | in_progress | processing | complete | failed
  ADD COLUMN IF NOT EXISTS platform               text,
  -- 'zoom' | 'meet' | 'teams' | 'unknown'
  ADD COLUMN IF NOT EXISTS project_id             uuid REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS session_id             uuid,
  ADD COLUMN IF NOT EXISTS transcript_raw         jsonb DEFAULT '[]',
  -- [{ speaker, words: [{ text, start_ms, end_ms }] }]
  ADD COLUMN IF NOT EXISTS transcript_text        text,
  ADD COLUMN IF NOT EXISTS findings               jsonb,
  -- { summary, decisions[], action_items[], new_context[], open_questions[], memory_update }
  ADD COLUMN IF NOT EXISTS source_file_id         uuid REFERENCES files(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS proactive_message_id   uuid,
  ADD COLUMN IF NOT EXISTS proactive_message_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tasks_created          jsonb DEFAULT '[]',
  -- [{ task_id, title }]
  ADD COLUMN IF NOT EXISTS started_at             timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at               timestamptz;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_meetings" ON meetings
  USING (org_id IN (SELECT id FROM orgs WHERE slug = current_setting('app.org_slug', true)));

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_meetings_recall_bot_id ON meetings(recall_bot_id);
CREATE INDEX IF NOT EXISTS idx_meetings_org_id        ON meetings(org_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status        ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_project_id    ON meetings(project_id);
