-- Migration 0005: Inbox / read receipts
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_messages_inbox
  ON messages(org_id, role, channel, created_at DESC)
  WHERE role = 'assistant' AND channel IS NOT NULL;
