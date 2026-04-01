# stratpartner.ai — Phase 1 Build Spec
## Core Agent: Chat · RAG · Skills · Auth
**For Claude Code. One session at a time.**

---

## What You're Building

A working, chargeable product. A client can log in, have a strategic conversation that draws on their uploaded research, trigger any of eleven CX strategy skills, and walk away with outputs that feel like they came from a senior strategist — not a chatbot. You as admin can create orgs, manage skills per client, and see everything happening across all accounts.

This spec covers Sessions 1–6. Read it once before Session 1. Reference the relevant session section before each session starts.

---

## Project Conventions

- **Framework:** Next.js 14 App Router, TypeScript strict mode, Tailwind CSS
- **Database:** Supabase (Postgres + pgvector + Auth)
- **AI:** Anthropic Claude Sonnet via `@anthropic-ai/sdk` — streaming where user-facing
- **Embeddings:** OpenAI `text-embedding-3-small` (1536 dimensions)
- **File parsing:** `pdf-parse` for PDFs, `mammoth` for DOCX
- **Folder structure:**
  ```
  app/
    api/
      chat/route.ts
      upload/route.ts
      orgs/route.ts
    chat/[orgSlug]/page.tsx
    dashboard/[orgSlug]/page.tsx
    admin/page.tsx
    login/page.tsx
  lib/
    soul.ts          ← SOUL.md as exported TypeScript string
    skills.ts        ← all skill content as a typed map
    ingest.ts        ← file parsing + chunking + embedding
    retrieve.ts      ← semantic search against file_chunks
    memory.ts        ← memory read/write/extract helpers
    supabase.ts      ← typed client
  components/
    ChatThread.tsx
    MessageBubble.tsx
    SkillBadge.tsx
    SourceCard.tsx
    FileList.tsx
```

- **Naming:** kebab-case files, PascalCase components, camelCase functions
- **Error handling:** Every API route returns `{ error: string }` with appropriate HTTP status. Never expose raw Supabase or Anthropic errors to the client.
- **Streaming:** Use `ReadableStream` / `TransformStream` for all chat responses. Never buffer the full response before sending.

---

## Environment Variables

```
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=       ← service role, server-side only
SUPABASE_ANON_KEY=          ← public, safe for client
OPENAI_API_KEY=             ← embeddings only
ADMIN_EMAIL=                ← gates /admin route
```

---

## Database Schema

Run this once in Supabase SQL editor. Do not modify without updating this spec.

```sql
create extension if not exists vector;

-- Organisations (one per client engagement)
create table orgs (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique not null,           -- used in URLs: /chat/acme-cx
  tier         text default 'agent',           -- 'agent' | 'advisory' | 'fractional'
  created_at   timestamptz default now()
);

-- Persistent strategic memory (one row per org, updated continuously)
create table memory (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references orgs(id) on delete cascade unique,
  content     text not null default '',        -- free prose, not JSON
  updated_at  timestamptz default now()
);

-- All messages (web chat, voice, meeting — all land here)
create table messages (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references orgs(id) on delete cascade,
  role        text not null,                   -- 'user' | 'assistant'
  content     text not null,
  channel     text default 'web',             -- 'web' | 'voice' | 'meeting'
  session_id  uuid,                            -- groups messages into conversations
  skill_used  text,                            -- slug of skill if one activated this turn
  created_at  timestamptz default now()
);

-- Uploaded files
create table files (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references orgs(id) on delete cascade,
  name        text not null,
  mime_type   text,
  is_active   boolean default true,            -- inactive = excluded from retrieval
  created_at  timestamptz default now()
);

-- Chunked + embedded file content
create table file_chunks (
  id          uuid primary key default gen_random_uuid(),
  file_id     uuid references files(id) on delete cascade,
  org_id      uuid references orgs(id) on delete cascade,
  content     text not null,
  embedding   vector(1536),
  chunk_index integer,
  created_at  timestamptz default now()
);

create index on file_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Skills library (seeded, not user-editable)
create table skills (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,            -- 'journey-map', 'trend-scan', etc.
  name        text not null,
  description text not null,                  -- one line, shown in UI
  content     text not null,                  -- full SKILL.md content
  track       text not null,                  -- 'cx' | 'brand' | 'research'
  created_at  timestamptz default now()
);

-- Per-org skill activation
create table org_skills (
  org_id      uuid references orgs(id) on delete cascade,
  skill_id    uuid references skills(id) on delete cascade,
  is_active   boolean default true,
  primary key (org_id, skill_id)
);
```

---

## Session 1 — Foundation

**Goal:** Repo connected to Vercel. Supabase schema live. Nothing breaks.

### Steps

1. Create Next.js 14 project:
   ```bash
   npx create-next-app@latest stratpartner --typescript --tailwind --app --no-src-dir
   ```

2. Install dependencies:
   ```bash
   npm install @anthropic-ai/sdk @supabase/supabase-js @supabase/ssr openai pdf-parse mammoth
   npm install -D @types/pdf-parse
   ```

3. Create `.env.local` with all five variables (values from your secure note).

4. Create `lib/supabase.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js'

   export const supabase = createClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_KEY!
   )
   ```

5. Run schema in Supabase SQL editor.

6. Push to GitHub. Connect Vercel. Add env vars to Vercel dashboard.

### Acceptance Criteria
- [ ] `npm run dev` starts without error
- [ ] Supabase tables visible in dashboard
- [ ] Vercel preview URL loads the default Next.js page
- [ ] No TypeScript errors on `npm run build`

---

## Session 2 — Agent Loop

**Goal:** The brain. One API route that thinks with your methodology, updates memory, and streams back.

### SOUL.md Integration

`lib/soul.ts` exports your SOUL.md as a single string. This file is the heart of the product — update it regularly as you learn what works.

```typescript
export const SOUL = `
[paste your SOUL.md content here — 400-600 words of your methodology in prose]
`
```

The SOUL is prepended to every system prompt, before memory, before skills, before context. It is never optional and never summarised.

### POST /api/chat

**Request body:**
```typescript
{
  orgSlug: string
  message: string
  sessionId: string   // UUID, generated client-side per conversation
}
```

**Processing order — this sequence matters:**

1. Load org by slug → validate exists
2. Load last 10 messages for this org (across all sessions) → conversation history
3. Load memory record for this org → may be empty string on first use
4. Embed the incoming message → retrieve top 5 file chunks (cosine similarity ≥ 0.75)
5. Detect skill trigger (see Skills section below)
6. Assemble system prompt (see System Prompt Assembly below)
7. Call Anthropic with streaming, messages array, system prompt
8. As tokens stream: pipe to client response, accumulate full response text
9. After stream completes:
   - Save user message to `messages` table (with skill_used if activated)
   - Save assistant response to `messages` table
   - Run memory extraction (lightweight async call — do not await, do not block response)

**Response:** `text/event-stream`, each chunk is raw text delta. Client renders incrementally.

**Error response:** `{ error: "human readable message" }` with 400 or 500.

### System Prompt Assembly

Assemble in this exact order. Each section is separated by a blank line.

```
[SOUL — your full methodology, always]

[MEMORY]
Here is what I know about this client's organisation:
{memory.content or "No memory yet — this is the beginning of the engagement."}
[/MEMORY]

[CONTEXT FROM UPLOADED DOCUMENTS]
{if retrieved chunks exist:}
The following excerpts are from documents the client has uploaded. Use them when relevant. Always cite the source file name when you draw on them.

Source: {file.name}
{chunk.content}

Source: {file.name}
{chunk.content}
...
{if no chunks retrieved:}
No relevant excerpts found in uploaded documents for this query.
[/CONTEXT]

[AVAILABLE SKILLS]
You have access to the following strategy frameworks. If the user explicitly triggers one with /{slug} or if their request clearly calls for it, run that framework in full.
{for each active skill: "- /{slug}: {name} — {description}"}
{if skill was detected:}
[ACTIVE SKILL: {skill.name}]
{skill.content — full SKILL.md}
[/ACTIVE SKILL]
[/AVAILABLE SKILLS]
```

### Memory Extraction

After each response, fire a separate Anthropic call (non-streaming, fast model if available, else Sonnet):

**Prompt:**
```
You are updating the strategic memory for a CX transformation engagement.

Current memory:
{memory.content}

New conversation:
User: {user message}
Assistant: {assistant response}

Identify any NEW information that should be added to or replace existing memory entries. Focus on: decisions made, strategic context revealed, client priorities, blockers mentioned, stakeholder names/dynamics, program status changes.

Do not repeat what's already in memory. Do not add conversational filler. Return the UPDATED full memory as prose — max 800 words. If nothing new was learned, return the existing memory unchanged.
```

Write result back to `memory` table.

### Skill Detection

Before calling Anthropic, run this logic:

```typescript
function detectSkill(message: string, activeSkills: Skill[]): Skill | null {
  // 1. Explicit trigger: message starts with /{slug}
  const explicitMatch = activeSkills.find(s =>
    message.trim().toLowerCase().startsWith(`/${s.slug}`)
  )
  if (explicitMatch) return explicitMatch

  // 2. Keyword detection (basic NLP — no AI needed here)
  const keywordMap: Record<string, string[]> = {
    'journey-map': ['journey map', 'customer journey', 'map the journey', 'touchpoints'],
    'trend-scan': ['trend', 'macro', 'pestle', 'forces', 'what\'s shaping'],
    'persona-build': ['persona', 'who is the customer', 'customer profile'],
    'scan-blockers': ['blockers', 'what\'s in the way', 'obstacles', 'why isn\'t this working'],
    'synthesize': ['synthesize', 'synthesis', 'pull this together', 'what does this mean'],
    'prioritize': ['prioritize', 'prioritisation', 'where should we start', 'roadmap'],
    'biz-context': ['business context', 'company health', 'revenue', 'competitive position'],
    'service-map': ['service blueprint', 'backstage', 'service map', 'operations behind'],
    'biz-case': ['business case', 'roi', 'investment committee', 'justify the spend'],
    'brand-building-blocks': ['brand building blocks', 'brand insights', 'brand strategy'],
    'brand-territories': ['brand territories', 'brand direction', 'strategic territories'],
  }

  const lower = message.toLowerCase()
  for (const [slug, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(k => lower.includes(k))) {
      return activeSkills.find(s => s.slug === slug) || null
    }
  }

  return null
}
```

### Acceptance Criteria
- [ ] `curl -X POST /api/chat -d '{"orgSlug":"test","message":"What is CX maturity?","sessionId":"..."}' -H 'Content-Type: application/json'` returns a streaming response
- [ ] Response reads like your methodology, not a generic AI
- [ ] Memory record updates in Supabase after the call
- [ ] No API keys exposed in client-side code
- [ ] Streaming works — tokens appear incrementally, not all at once

---

## Session 3 — Chat Interface

**Goal:** The screen clients actually use. Premium, not demo.

### Route: `/chat/[orgSlug]`

**Data loading:** Server component fetches org by slug. If not found → 404. Passes `orgId`, `orgName` to client component.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ SIDEBAR (260px, dark)         │ MAIN CHAT AREA          │
│                               │                         │
│ stratpartner.ai logo          │ [conversation thread]   │
│                               │                         │
│ ─────────────────────         │                         │
│ [Org name]                    │                         │
│ Tier badge                    │                         │
│                               │                         │
│ ─────────────────────         │                         │
│ Navigation:                   │                         │
│ • Chat (active)               │                         │
│ • Files                       │ [skill chips row]       │
│ • Memory                      │ [input + send button]   │
│ • Interviews  (Phase 2)       │                         │
│ • Meetings    (Phase 3)       │                         │
│                               │                         │
│ [bottom: avatar + email]      │                         │
└─────────────────────────────────────────────────────────┘
```

### Chat Thread Component (`ChatThread.tsx`)

- User messages: right-aligned, dark pill, white text
- Assistant messages: left-aligned, white card with subtle border, rendered as Markdown
- Skill badge: when a skill was used, show a small `⚡ Journey Map` badge above the assistant message
- Citations: when the response includes uploaded document references, render `SourceCard` components below the message (see below)
- Auto-scroll: scroll to bottom on new message; stop auto-scrolling if user manually scrolls up
- Streaming: render assistant response token by token as it arrives
- Loading state: animated "thinking" dots while waiting for first token
- Empty state (no messages yet):
  ```
  Centered in main area:
  "Good [morning/afternoon], [first name]."
  "stratpartner.ai is ready. What would you like to work on?"
  Subtitle: "Try /journey-map, /trend-scan, or just start talking."
  ```

### Source Cards (`SourceCard.tsx`)

When the assistant response includes a file citation, render a card below the message:

```
┌────────────────────────────────────┐
│ 📄 CX Maturity Report Q3 2024.pdf  │
│ "...excerpt of the relevant chunk  │
│  that was retrieved..."            │
└────────────────────────────────────┘
```

Parse citations from the response: look for the pattern `Source: {filename}` in the raw response. Strip from rendered Markdown and render as cards instead.

### Skill Chips Row

Horizontal scrollable row of chips sitting directly above the input field. Show the 5 most commonly useful skills, truncated with "more" overflow:

```
[ ⚡ Journey Map ]  [ 📊 Trend Scan ]  [ 👤 Persona ]  [ 🚧 Scan Blockers ]  [ 📈 Prioritize ]  [+6]
```

Clicking a chip inserts `/{slug} ` into the input field — user still writes the context and sends.

### Input Field

- Full-width textarea (auto-grows, max 6 lines)
- Send on Enter (Shift+Enter for newline)
- Disabled while streaming (show spinner on send button)
- Placeholder: `"Ask a question, run a framework, or upload a document..."`

### File Upload in Chat

- A paperclip icon in the input bar opens a file picker (PDF, DOCX only, max 50MB)
- Upload triggers POST /api/upload
- While processing: show a progress indicator in the chat area (`Processing "filename.pdf"...`)
- On success: file appears in the Files panel (sidebar nav → Files), and a system message appears in chat: `"I've read and embedded filename.pdf. You can now ask me questions about it."`
- On failure: error toast

### Skill Output Presentation

Skills produce structured, long-form output. The chat thread handles this differently from a normal response:

- **Render as Markdown** — all skill outputs use `##` headers, tables, and bullet points. The Markdown renderer must support tables.
- **Skill header badge** visible above the message card: `⚡ Running: Journey Map Framework`
- **Export button** (top-right of assistant card on hover): "Copy as Markdown" | "Download as .md"
- No truncation. Skill outputs can be long — let them scroll within the thread.

### Acceptance Criteria
- [ ] Chat loads for a valid orgSlug, 404 for invalid
- [ ] Streaming response renders token-by-token
- [ ] Skill chips insert the slash command into the input
- [ ] `/journey-map Tell me about Acme's onboarding flow` triggers the skill and shows the badge
- [ ] Source cards appear when the response draws on uploaded files
- [ ] Empty state renders on first load
- [ ] File upload works and shows a system message on success
- [ ] No layout shift during streaming
- [ ] Mobile-responsive (sidebar collapses to hamburger below 768px)

---

## Session 4 — File Uploads + RAG

**Goal:** Client uploads research, agent reads and cites it.

### POST /api/upload

**Request:** `multipart/form-data` with `file` and `orgId` fields.

**Processing pipeline:**

```typescript
// lib/ingest.ts

export async function ingestFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  orgId: string
): Promise<{ fileId: string; chunkCount: number }> {

  // 1. Extract raw text
  let text: string
  if (mimeType === 'application/pdf') {
    const parsed = await pdfParse(buffer)
    text = parsed.text
  } else if (mimeType includes 'wordprocessingml') {
    const result = await mammoth.extractRawText({ buffer })
    text = result.value
  } else {
    throw new Error('Unsupported file type. Upload PDF or DOCX only.')
  }

  // 2. Clean text
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  // 3. Chunk: 500 words, 50-word overlap
  const chunks = chunkText(text, 500, 50)

  // 4. Save file record
  const { data: file } = await supabase
    .from('files')
    .insert({ org_id: orgId, name: fileName, mime_type: mimeType })
    .select().single()

  // 5. Embed and save all chunks (batch in groups of 20)
  const openai = new OpenAI()
  for (const batch of chunkIntoBatches(chunks, 20)) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch.map(c => c.text)
    })

    await supabase.from('file_chunks').insert(
      batch.map((chunk, i) => ({
        file_id: file.id,
        org_id: orgId,
        content: chunk.text,
        embedding: response.data[i].embedding,
        chunk_index: chunk.index
      }))
    )
  }

  return { fileId: file.id, chunkCount: chunks.length }
}
```

**Chunking strategy:**
- Split on sentence boundaries where possible (don't cut mid-sentence)
- 500-word target, 50-word overlap between adjacent chunks
- Include file name and chunk index in a comment at the top of each chunk: `[Source: filename.pdf, chunk 3/24]` — this helps the LLM cite correctly

### lib/retrieve.ts

```typescript
export async function retrieveRelevantChunks(
  query: string,
  orgId: string,
  topK: number = 5,
  similarityThreshold: number = 0.72
): Promise<{ content: string; fileName: string; similarity: number }[]> {

  const openai = new OpenAI()
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  })
  const queryEmbedding = embeddingResponse.data[0].embedding

  const { data } = await supabase.rpc('match_file_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: similarityThreshold,
    match_count: topK,
    filter_org_id: orgId
  })

  return data.map(row => ({
    content: row.content,
    fileName: row.file_name,
    similarity: row.similarity
  }))
}
```

Create the Supabase RPC function:

```sql
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
    fc.content,
    f.name as file_name,
    1 - (fc.embedding <=> query_embedding) as similarity
  from file_chunks fc
  join files f on fc.file_id = f.id
  where fc.org_id = filter_org_id
    and f.is_active = true
    and 1 - (fc.embedding <=> query_embedding) > match_threshold
  order by fc.embedding <=> query_embedding
  limit match_count;
$$;
```

### Files Management Screen

Route: `/dashboard/[orgSlug]/files`

Display a table of uploaded files:
```
Name                        | Uploaded        | Chunks | Status   | Actions
CX Maturity Report Q3.pdf   | Mar 15, 2025    | 42     | Active   | [Deactivate] [Delete]
Stakeholder Research.docx   | Mar 20, 2025    | 18     | Active   | [Deactivate] [Delete]
Old Strategy Deck v1.pdf    | Feb 2, 2025     | 31     | Inactive | [Activate]  [Delete]
```

- **Deactivate/Activate** toggles `is_active` — deactivated files are excluded from retrieval but not deleted
- **Delete** deletes file and all chunks (cascades in DB)
- Upload button at top triggers the same flow as chat upload
- Empty state: "No documents uploaded yet. Upload a PDF or Word doc to give stratpartner.ai more context about your organisation."

### Acceptance Criteria
- [ ] PDF upload extracts text and creates chunks in Supabase
- [ ] DOCX upload works the same way
- [ ] Asking a question about uploaded content returns relevant chunks with ≥0.72 similarity
- [ ] Source card cites the correct file name
- [ ] Deactivating a file removes its chunks from retrieval
- [ ] Large files (>10MB PDF) process without timeout (use background processing if needed)
- [ ] Duplicate upload of same filename is handled gracefully (allow it — different version)

---

## Session 5 — Skills Layer

**Goal:** Eleven strategy skills seeded and selectable. Skill outputs feel like methodology, not chat.

### Seed Script

Create `scripts/seed-skills.ts`. Run with `npx tsx scripts/seed-skills.ts`.

Each skill entry:

```typescript
const skills = [
  {
    slug: 'journey-map',
    name: 'Journey Map',
    description: 'Map a customer journey moment-by-moment with emotional truth, pain points, and opportunity areas.',
    track: 'cx',
    content: `[paste full journey-map SKILL.md content]`
  },
  {
    slug: 'trend-scan',
    name: 'Trend Scan',
    description: 'Identify the 5-8 macro forces most relevant to a company\'s CX challenge, scored for disruption potential.',
    track: 'cx',
    content: `[paste full trend-scan SKILL.md content]`
  },
  {
    slug: 'persona-build',
    name: 'Persona Build',
    description: 'Build a research-grounded customer persona using Jobs-to-be-Done and emotional driver mapping.',
    track: 'research',
    content: `[paste full persona-build SKILL.md content]`
  },
  {
    slug: 'scan-blockers',
    name: 'Scan Blockers',
    description: 'Map internal and external blockers preventing CX improvement, with severity and addressability ratings.',
    track: 'cx',
    content: `[paste full scan-blockers SKILL.md content]`
  },
  {
    slug: 'synthesize',
    name: 'Synthesize',
    description: 'Cluster research findings into strategic insights, tensions, and How Might We opportunities.',
    track: 'research',
    content: `[paste full synthesize SKILL.md content]`
  },
  {
    slug: 'prioritize',
    name: 'Prioritize',
    description: 'Score initiatives across strategic alignment, customer impact, and feasibility into a three-phase roadmap.',
    track: 'cx',
    content: `[paste full prioritize SKILL.md content]`
  },
  {
    slug: 'biz-context',
    name: 'Biz Context',
    description: 'Diagnose a company\'s health across revenue, customer metrics, operational health, and market position.',
    track: 'cx',
    content: `[paste full biz-context SKILL.md content]`
  },
  {
    slug: 'service-map',
    name: 'Service Map',
    description: 'Blueprint the people, processes, and systems delivering a customer journey across five layers.',
    track: 'cx',
    content: `[paste full service-map SKILL.md content]`
  },
  {
    slug: 'biz-case',
    name: 'Business Case',
    description: 'Build an executive-ready business case using Value Engineering structure.',
    track: 'cx',
    content: `[paste full biz-case SKILL.md content]`
  },
  {
    slug: 'brand-building-blocks',
    name: 'Brand Building Blocks',
    description: 'Synthesize research into foundational brand insights across Audience, Company, and Moment.',
    track: 'brand',
    content: `[paste full brand-building-blocks SKILL.md content]`
  },
  {
    slug: 'brand-territories',
    name: 'Brand Territories',
    description: 'Develop 3 distinct strategic brand territory directions from building blocks.',
    track: 'brand',
    content: `[paste full brand-territories SKILL.md content]`
  }
]
```

After seeding, create `org_skills` rows for each org (all skills active by default).

### Skill Output Format Contract

Every skill — when activated — should produce output in this structure (enforced via system prompt):

```markdown
## [Skill Name]: [Client/Scenario Name]
*stratpartner.ai | [Date]*

---

[skill body — varies by skill, follows SKILL.md format]

---

**What I now know that I didn't before:**
[1-3 bullet points of new strategic intelligence extracted from this output]

**Suggested next step:**
[One concrete recommendation — what to do with this output]
```

The "What I now know" section feeds directly into memory extraction. The "Suggested next step" gives the client momentum.

### Acceptance Criteria
- [ ] All 11 skills seeded in database
- [ ] `/journey-map` in chat triggers journey map with full SKILL.md methodology
- [ ] Keyword detection: "map the customer journey" also triggers journey-map
- [ ] Skill badge appears on the assistant message card
- [ ] Skill output includes the standardised footer (What I now know / Suggested next step)
- [ ] Skills can be toggled per-org in admin (see Session 6)
- [ ] If a skill is triggered but the user provides no context, agent asks for the context it needs rather than inventing it

---

## Session 6 — Auth + Admin

**Goal:** Client login is real. Your admin panel shows you everything. Orgs are isolated.

### Authentication

Use Supabase Auth with email magic link (no password — simpler, more secure for this use case).

**Login flow:**
1. Client visits `/login`
2. Enters email → Supabase sends magic link
3. Clicks link → redirected to `/dashboard/[their-orgSlug]`

**Org ↔ User linking:** Add `user_id` column to `orgs` table:
```sql
alter table orgs add column user_id uuid references auth.users(id);
```

When admin creates an org, they specify the client's email. On first login, the user's Supabase `user_id` is linked to their org. All subsequent data loads check `org.user_id = auth.user.id`.

**Middleware:** `middleware.ts` protects all routes under `/dashboard` and `/chat`. Redirect unauthenticated users to `/login`. Admin email check gates `/admin`.

### Client Dashboard

Route: `/dashboard/[orgSlug]`

See UX spec (separate wireframe) for full layout. Data to load:

- Org name + tier
- Memory: last 3 meaningful sentences extracted from memory.content (show as a "What I know" snippet)
- Recent activity: last 5 messages (user messages only, truncated to 80 chars)
- Uploaded files count (active only)
- Quick action buttons: Start Chat, Upload Document, Start Interview (greyed out until Phase 2)

### Admin Panel

Route: `/admin` — gated by `ADMIN_EMAIL` env var. No Supabase auth needed here — just server-side email comparison.

**Sections:**

**1. Orgs**
Table of all orgs: Name | Slug | Tier | Created | User Email | Actions

"Create Org" button opens a form:
- Org name (text)
- Slug (auto-generated from name, editable)
- Tier dropdown: Agent / Advisory / Fractional
- Client email (to link Supabase user)
- Initial memory seed (textarea — paste discovery notes or onboarding context here)

**2. Org Detail** (`/admin/orgs/[slug]`)
- Edit org settings
- Memory editor: full `memory.content` in a textarea, save button
- Skills toggle: list of all 11 skills with on/off per this org
- Message history: paginated list of all messages
- Files: list of all uploaded files with chunk counts

**3. All Activity Feed**
Across all orgs: most recent messages, grouped by org. Lets you see who's using the product and what they're asking.

### Acceptance Criteria
- [ ] Unauthenticated user visiting `/chat/any-slug` is redirected to `/login`
- [ ] Magic link login works end-to-end
- [ ] Logged-in user can only see their own org's data
- [ ] Admin at `/admin` can create a new org
- [ ] Admin can edit memory for any org
- [ ] Admin can toggle skills per org
- [ ] Two orgs created and verified as fully isolated (no data leakage)
- [ ] `npm run build` passes with no TypeScript errors

---

## What You Have After Session 6

A complete, chargeable v1 product:

- A client can log in and have a strategy conversation
- The agent uses your methodology (SOUL.md) in every response
- It draws on their uploaded research and cites it
- It can run any of 11 CX strategy frameworks on demand
- It remembers everything and gets smarter every session
- You can manage all clients from a single admin panel

**The next session is Phase 2 — Voice.**
