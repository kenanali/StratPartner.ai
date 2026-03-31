-- Enable pgvector extension for embeddings
create extension if not exists vector;

-- Orgs table
create table orgs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Memory table
create table memory (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  type text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Messages table
create table messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  session_id uuid not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

-- Files table
create table files (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  created_at timestamptz default now()
);

-- File chunks table (with vector embedding)
create table file_chunks (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references files(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  chunk_text text not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Skills table
create table skills (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  prompt_injection text not null,
  created_at timestamptz default now()
);

-- Org skills (junction table)
create table org_skills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  enabled boolean default true,
  unique(org_id, skill_id)
);

-- Meetings table
create table meetings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  zoom_url text,
  transcript text,
  summary text,
  learnings text,
  created_at timestamptz default now()
);

-- Interviews table
create table interviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  call_id text,
  transcript text,
  summary text,
  created_at timestamptz default now()
);

-- Indexes for common lookups
create index on memory(org_id);
create index on messages(org_id, session_id);
create index on files(org_id);
create index on file_chunks(file_id);
create index on file_chunks(org_id);
create index on org_skills(org_id);
create index on meetings(org_id);
create index on interviews(org_id);
