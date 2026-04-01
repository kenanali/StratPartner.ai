-- =============================================================================
-- Migration 0002: Schema updates for Sessions 4-6
-- Run this in the Supabase SQL editor (it is safe to run multiple times)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. files table — add missing columns
-- ---------------------------------------------------------------------------
alter table files
  add column if not exists name text,
  add column if not exists mime_type text,
  add column if not exists is_active boolean default true,
  add column if not exists project_id uuid references projects(id) on delete set null;

-- Backfill name from filename for existing rows
update files set name = filename where name is null;

-- ---------------------------------------------------------------------------
-- 2. file_chunks table — add content column + vector index
-- ---------------------------------------------------------------------------
alter table file_chunks
  add column if not exists content text generated always as (chunk_text) stored,
  add column if not exists chunk_index integer;

-- Vector index for cosine similarity search
create index if not exists file_chunks_embedding_idx
  on file_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ---------------------------------------------------------------------------
-- 3. skills table — add missing columns
-- ---------------------------------------------------------------------------
alter table skills
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists content text,
  add column if not exists track text default 'cx';

-- Backfill name from title for existing rows
update skills set name = title where name is null;

-- ---------------------------------------------------------------------------
-- 4. messages table — add missing columns
-- ---------------------------------------------------------------------------
alter table messages
  add column if not exists channel text default 'web',
  add column if not exists skill_used text,
  add column if not exists project_id uuid;

-- ---------------------------------------------------------------------------
-- 5. orgs table — add user_id for auth
-- ---------------------------------------------------------------------------
alter table orgs
  add column if not exists user_id uuid,
  add column if not exists tier text default 'agent';

-- ---------------------------------------------------------------------------
-- 6. Engagement model tables
-- ---------------------------------------------------------------------------

-- Projects (engagements within an org)
create table if not exists projects (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references orgs(id) on delete cascade,
  name         text not null,
  status       text default 'active',
  phase        text default 'intake',
  description  text,
  memory       text default '',
  created_at   timestamptz default now()
);

create index if not exists projects_org_id_idx on projects(org_id);

-- Tasks (research and deliverable tasks)
create table if not exists tasks (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  org_id       uuid references orgs(id) on delete cascade,
  title        text not null,
  type         text not null,
  assigned_to  text default 'agent',
  status       text default 'pending',
  brief        text,
  output       text,
  created_at   timestamptz default now(),
  completed_at timestamptz
);

create index if not exists tasks_project_id_idx on tasks(project_id);

-- Deliverables (stored strategic outputs)
create table if not exists deliverables (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  org_id       uuid references orgs(id) on delete cascade,
  title        text not null,
  type         text not null,
  phase        text,
  content      text not null,
  version      integer default 1,
  task_id      uuid references tasks(id) on delete set null,
  session_id   uuid,
  created_at   timestamptz default now()
);

create index if not exists deliverables_project_id_idx on deliverables(project_id);

-- Sessions (strategy sessions — chat, meeting, or voice)
create table if not exists sessions (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id) on delete cascade,
  org_id        uuid references orgs(id) on delete cascade,
  type          text not null default 'working',
  title         text,
  channel       text default 'chat',
  meeting_id    uuid references meetings(id) on delete set null,
  decisions     jsonb,
  tasks_created jsonb,
  summary       text,
  started_at    timestamptz,
  ended_at      timestamptz,
  created_at    timestamptz default now()
);

-- Intakes (structured project onboarding)
create table if not exists intakes (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id) on delete cascade,
  org_id        uuid references orgs(id) on delete cascade,
  responses     jsonb not null default '{}',
  completed_at  timestamptz,
  created_at    timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 7. match_file_chunks RPC function for vector similarity search
-- ---------------------------------------------------------------------------
create or replace function match_file_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_org_id uuid
)
returns table (
  content text,
  file_name text,
  similarity float
)
language sql stable
as $$
  select
    fc.chunk_text as content,
    coalesce(f.name, f.filename) as file_name,
    1 - (fc.embedding <=> query_embedding) as similarity
  from file_chunks fc
  join files f on fc.file_id = f.id
  where fc.org_id = filter_org_id
    and coalesce(f.is_active, true) = true
    and 1 - (fc.embedding <=> query_embedding) > match_threshold
  order by fc.embedding <=> query_embedding
  limit match_count;
$$;
