-- Add suggested_skills column to messages for meeting → skill activation loop
ALTER TABLE messages ADD COLUMN IF NOT EXISTS suggested_skills text[] DEFAULT '{}';
