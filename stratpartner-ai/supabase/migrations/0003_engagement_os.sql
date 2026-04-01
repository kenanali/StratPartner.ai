-- Migration 0003: Engagement OS layer
-- Run this in the Supabase SQL editor

-- ── Goal ancestry + engagement mission ────────────────────────────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS goal_ancestry jsonb;
-- { "engagement_mission": "...", "phase_goal": "...", "workstream": "...", "task_brief": "..." }

ALTER TABLE projects ADD COLUMN IF NOT EXISTS engagement_mission text;

-- ── Strategy sessions ─────────────────────────────────────────────────────────
-- Captures decisions from chat, voice interviews, or meetings
CREATE TABLE IF NOT EXISTS sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid REFERENCES orgs(id) ON DELETE CASCADE,
  project_id     uuid REFERENCES projects(id) ON DELETE CASCADE,
  type           text DEFAULT 'chat',     -- 'chat' | 'voice' | 'meeting'
  channel        text,                    -- 'web' | 'vapi' | 'recall'
  meeting_id     uuid,
  decisions      jsonb DEFAULT '[]',
  tasks_created  jsonb DEFAULT '[]',
  open_questions jsonb DEFAULT '[]',
  summary        text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_sessions" ON sessions
  USING (org_id IN (SELECT id FROM orgs WHERE slug = current_setting('app.org_slug', true)));

-- ── Agent runs ────────────────────────────────────────────────────────────────
-- Tracks headless task execution by specialist agents
CREATE TABLE IF NOT EXISTS agent_runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        uuid REFERENCES tasks(id) ON DELETE CASCADE,
  org_id         uuid REFERENCES orgs(id) ON DELETE CASCADE,
  project_id     uuid REFERENCES projects(id) ON DELETE SET NULL,
  agent_role     text NOT NULL,           -- researcher | persona-architect | journey-mapper | etc.
  status         text DEFAULT 'pending',  -- pending | running | done | failed
  execution_log  jsonb DEFAULT '[]',      -- [{ step, content, timestamp }]
  deliverable_id uuid REFERENCES deliverables(id) ON DELETE SET NULL,
  tokens_used    integer,
  started_at     timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_agent_runs" ON agent_runs
  USING (org_id IN (SELECT id FROM orgs WHERE slug = current_setting('app.org_slug', true)));

-- ── Routines (heartbeats) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routines (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid REFERENCES orgs(id) ON DELETE CASCADE,
  project_id           uuid REFERENCES projects(id) ON DELETE SET NULL,
  name                 text NOT NULL,
  description          text,
  cron_schedule        text NOT NULL,     -- e.g. "0 9 * * 1-5"
  agent_role           text NOT NULL,
  trigger_instruction  text NOT NULL,
  concurrency_policy   text DEFAULT 'skip_if_active', -- skip_if_active | always_enqueue
  status               text DEFAULT 'active',         -- active | paused | archived
  last_ran_at          timestamptz,
  last_run_status      text,
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_routines" ON routines
  USING (org_id IN (SELECT id FROM orgs WHERE slug = current_setting('app.org_slug', true)));

-- ── Audit log ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid REFERENCES orgs(id) ON DELETE CASCADE,
  project_id  uuid REFERENCES projects(id) ON DELETE SET NULL,
  agent_role  text,
  task_id     uuid,
  routine_id  uuid,
  event_type  text NOT NULL,
  -- task_created | agent_run_started | agent_run_completed | deliverable_saved
  -- session_created | routine_triggered | memory_updated | file_uploaded
  payload     jsonb,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_audit_log" ON audit_log
  USING (org_id IN (SELECT id FROM orgs WHERE slug = current_setting('app.org_slug', true)));

-- ── Skill metadata columns ────────────────────────────────────────────────────
ALTER TABLE skills ADD COLUMN IF NOT EXISTS skill_type    text DEFAULT 'strategy';
-- 'strategy' | 'tool' | 'workflow' | 'playbook'

ALTER TABLE skills ADD COLUMN IF NOT EXISTS category      text;
-- Strategy: 'cx' | 'research' | 'synthesis' | 'delivery' | 'brand'
-- GTM:      'ads' | 'competitive-intel' | 'content' | 'lead-generation'
--           | 'monitoring' | 'outreach' | 'research' | 'seo'

ALTER TABLE skills ADD COLUMN IF NOT EXISTS inputs        jsonb DEFAULT '[]';
-- [{ "name": "...", "description": "...", "required": true }]

ALTER TABLE skills ADD COLUMN IF NOT EXISTS outputs       jsonb DEFAULT '[]';
-- [{ "name": "...", "description": "..." }]

ALTER TABLE skills ADD COLUMN IF NOT EXISTS connects_to   jsonb DEFAULT '[]';
-- For playbooks: slugs of skills this orchestrates

ALTER TABLE skills ADD COLUMN IF NOT EXISTS trigger_phrases jsonb DEFAULT '[]';
-- ["/journey-map", "map the journey", "customer journey"]

ALTER TABLE skills ADD COLUMN IF NOT EXISTS auto_save     boolean DEFAULT false;

-- Mark auto-save strategy skills
UPDATE skills SET auto_save = true WHERE slug IN (
  'journey-map', 'persona-build', 'brand-building-blocks', 'brand-territories',
  'biz-case', 'prioritize', 'positioning-framework', 'transformation-story',
  'quarterly-review', 'competitive-landscape', 'voc-synthesis', 'retention-risk-scan'
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_agent_runs_org_id    ON agent_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_task_id   ON agent_runs(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status    ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_id     ON audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routines_org_id      ON routines(org_id);
CREATE INDEX IF NOT EXISTS idx_sessions_org_id      ON sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_sessions_project_id  ON sessions(project_id);
