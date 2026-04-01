-- Migration 0006: Intake + onboarding columns
-- Run in Supabase SQL editor after 0005_inbox.sql

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS memory       text,
  ADD COLUMN IF NOT EXISTS phase        text DEFAULT 'intake',
  ADD COLUMN IF NOT EXISTS intake_token text;

CREATE TABLE IF NOT EXISTS intakes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid REFERENCES projects(id) ON DELETE CASCADE,
  org_id       uuid REFERENCES orgs(id) ON DELETE CASCADE,
  responses    jsonb NOT NULL DEFAULT '{}',
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE intakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation_intakes" ON intakes
  USING (org_id IN (SELECT id FROM orgs WHERE slug = current_setting('app.org_slug', true)));

CREATE INDEX IF NOT EXISTS idx_intakes_project_id ON intakes(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_intake_token ON projects(intake_token) WHERE intake_token IS NOT NULL;
