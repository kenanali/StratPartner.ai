# stratpartner.ai — Engagement Model Spec
## The Junior Strategist Workflow: Projects · Research · Sessions · Deliverables
**This spec supersedes the "chat-first" mental model in Phase 1. Read before Session 1.**

---

## The Conceptual Shift

The original plan treated stratpartner as a chat interface where skills are triggered on demand. That's the wrong mental model.

The right mental model is a **junior strategist**. A junior strategist doesn't sit in a chat window. They work on a project. They get assigned research tasks. They come to a strategy session with findings. They produce deliverables — a journey map, a set of brand building blocks, a CX vision. Those deliverables live somewhere and can be referenced, revised, and built upon.

The chat interface is still the primary way you communicate with stratpartner. But the chat happens **inside a project**, not instead of one.

**What this changes:**

| Old model | New model |
|-----------|-----------|
| One chat per org | Multiple projects per org |
| Skills triggered ad-hoc in chat | Skills produce named deliverables tied to a project phase |
| Memory is a single blob | Memory is layered: org-level + project-level |
| No concept of "research" | Agent can be given research tasks and returns findings |
| Meetings just produce transcripts | Strategy sessions produce decisions + task assignments |
| Outputs live in chat thread | Deliverables library stores versioned documents |

---

## The Workflow (What You're Replicating)

```
INTAKE
└─ Client kicks off a new engagement
└─ Structured intake captures: goals, timeline, key stakeholders,
   what deliverables are needed
└─ stratpartner seeds project memory from intake responses

RESEARCH PHASE
└─ Tasks assigned: "landscape analysis", "market analysis", "competitor scan"
└─ stratpartner goes out and does the research:
   • Web search + synthesis
   • Draws on uploaded documents
   • Returns a structured research brief
└─ Research brief stored as a deliverable (versioned)

STRATEGY SESSION
└─ A meeting (Zoom/Meet) or a deep-work chat session
└─ Findings from research are reviewed
└─ Decisions made, priorities set
└─ stratpartner captures decisions + assigns next tasks
└─ Session summary stored

DELIVERABLES
└─ Skills produce named, stored documents:
   • Customer Journey Map
   • Brand Building Blocks
   • CX Vision Inputs
   • Persona Set
   • Prioritisation Roadmap
└─ Each deliverable is associated with the project + phase
└─ Deliverables can be revised (new version created)
└─ Client and strategist both have access
```

---

## Database Additions

Add these tables to the existing schema.

```sql
-- Engagements (a project within an org)
create table projects (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references orgs(id) on delete cascade,
  name         text not null,                    -- "Q2 CX Transformation" or "Brand Strategy 2025"
  status       text default 'active',            -- 'active' | 'paused' | 'complete'
  phase        text default 'intake',            -- 'intake' | 'research' | 'strategy' | 'delivery'
  description  text,                             -- brief description of what this project is trying to accomplish
  memory       text default '',                  -- project-specific memory (separate from org memory)
  created_at   timestamptz default now()
);

-- Tasks (work assigned to stratpartner or the human)
create table tasks (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  org_id       uuid references orgs(id) on delete cascade,
  title        text not null,                    -- "Landscape Analysis — CX SaaS market"
  type         text not null,                    -- 'research' | 'deliverable' | 'review' | 'meeting'
  assigned_to  text default 'agent',             -- 'agent' | 'human'
  status       text default 'pending',           -- 'pending' | 'in_progress' | 'done' | 'blocked'
  brief        text,                             -- what needs to be done and why
  output       text,                             -- the agent's completed work (raw content before deliverable creation)
  created_at   timestamptz default now(),
  completed_at timestamptz
);

-- Deliverables (stored strategic outputs)
create table deliverables (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  org_id       uuid references orgs(id) on delete cascade,
  title        text not null,                    -- "Customer Journey Map — Enterprise Onboarding"
  type         text not null,                    -- skill slug: 'journey-map', 'brand-building-blocks', etc. or 'research-brief'
  phase        text,                             -- which phase this belongs to: 'research' | 'strategy' | 'delivery'
  content      text not null,                    -- full markdown content of the deliverable
  version      integer default 1,
  task_id      uuid references tasks(id),        -- which task produced this (if any)
  session_id   uuid,                             -- which chat session produced this (if any)
  created_at   timestamptz default now()
);

-- Strategy sessions (structured meetings or deep-work chat sessions)
-- Extends the existing messages/meetings tables with session-level structure
create table sessions (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id) on delete cascade,
  org_id        uuid references orgs(id) on delete cascade,
  type          text not null,                   -- 'strategy' | 'review' | 'working'
  title         text,                            -- "Q2 Roadmap Strategy Session"
  channel       text default 'chat',             -- 'chat' | 'meeting' | 'voice'
  meeting_id    uuid references meetings(id),    -- if this maps to a Recall.ai meeting
  decisions     jsonb,                           -- structured decisions extracted from session
  tasks_created jsonb,                           -- task items that came out of this session
  summary       text,                            -- human-readable session summary
  started_at    timestamptz,
  ended_at      timestamptz,
  created_at    timestamptz default now()
);

-- Intake responses (structured onboarding of a new project)
create table intakes (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects(id) on delete cascade,
  org_id        uuid references orgs(id) on delete cascade,
  responses     jsonb not null,                  -- key-value pairs from intake form/interview
  completed_at  timestamptz,
  created_at    timestamptz default now()
);
```

**Update existing tables:**
```sql
-- Link messages to a project (nullable — not all messages are in a project)
alter table messages add column project_id uuid references projects(id);

-- Link file uploads to a project
alter table files add column project_id uuid references projects(id);

-- Link meetings to a project
alter table meetings add column project_id uuid references projects(id);
```

---

## System Prompt Update: Project Context Layer

When inside a project, the system prompt gains a new layer between SOUL and MEMORY:

```
[SOUL]

[PROJECT CONTEXT]
You are working on: {project.name}
Current phase: {project.phase}
Project goal: {project.description}

Project memory:
{project.memory}
[/PROJECT CONTEXT]

[ORG MEMORY]
{org.memory}
[/ORG MEMORY]

[CONTEXT FROM UPLOADED DOCUMENTS]
...
[/CONTEXT]

[AVAILABLE SKILLS → DELIVERABLES]
When you run a skill in this context, the output will be saved as a named deliverable
associated with this project. After generating the output, end with:
---DELIVERABLE---
Title: [descriptive title for this deliverable]
---
[/AVAILABLE SKILLS]
```

The `---DELIVERABLE---` marker tells the API route to automatically save the output as a deliverable and strip the marker from what's shown in chat.

---

## Feature 1: Intake

### What It Is

A structured form + optional voice interview that kicks off a new project. This replaces the "seed initial memory" textarea in the admin panel as the primary way to configure a project.

### Intake Form Fields

```
Project name:           [text]
What are you trying to achieve?  [textarea — free form, 3-4 sentences]
Timeline / deadline:    [text — e.g. "Q2 2025 board presentation"]
Key stakeholders:       [text — names and roles]
What deliverables do you need?
  [x] Customer Journey Map
  [x] CX Vision / Pillars
  [x] Brand Building Blocks
  [x] Brand Territories
  [x] Competitive Landscape
  [x] Customer Persona(s)
  [x] Prioritisation Roadmap
  [ ] Other: [text]
What research do you have already?  [textarea]
What's the biggest risk or challenge?  [textarea]
```

### Intake Processing

After form submission:

1. Save responses to `intakes` table
2. Feed responses to Anthropic with this prompt:
   ```
   Based on this intake for a CX strategy engagement, generate:
   1. Project memory seed (3-5 sentences about the org's strategic context)
   2. Suggested research tasks (3-5 task titles + briefs)
   3. The phase order for this engagement (which deliverables come first)

   Intake: {intake.responses}
   ```
3. Auto-create suggested research tasks in `tasks` table (status: 'pending')
4. Seed `project.memory` with the generated memory
5. Update `project.phase` to 'research'
6. Show the client their project dashboard with suggested tasks

### Intake via Voice (Phase 2)

The voice interview (Session 8 in Phase 2) is an alternative/supplement to the form. When a voice interview is completed and linked to a project, its findings auto-populate the intake fields. The user can review and confirm before tasks are generated.

---

## Feature 2: Research Tasks

### What It Is

The agent is assigned a specific research task — "Landscape Analysis: AI tools in CX" — and goes off and does it. It uses web search and any uploaded documents to produce a structured research brief. This is returned as a **deliverable**, not just a chat message.

### How Tasks Work

**Creating a task:**
- Auto-generated from intake processing
- Or manually created by the client/admin: "Run a landscape analysis on [topic]"
- Or suggested by stratpartner during a chat session: "It sounds like you need a competitor analysis here. Want me to run one?"

**Task card UI:**
```
┌───────────────────────────────────────────────────────┐
│ 🔍 Landscape Analysis — CX SaaS tools                 │
│ Research task · Assigned to stratpartner              │
│                                                       │
│ Brief: Analyse the competitive landscape for AI-      │
│ powered CX tools. Focus on: positioning, pricing,     │
│ target market, key differentiators, and gaps.         │
│                                                       │
│ [ Run Task ]                      Pending             │
└───────────────────────────────────────────────────────┘
```

**Running a task (POST /api/tasks/run):**

```typescript
async function runResearchTask(taskId: string, orgId: string, projectId: string) {
  const task = await getTask(taskId)
  const orgMemory = await getOrgMemory(orgId)
  const projectMemory = await getProjectMemory(projectId)

  // 1. Search the web for relevant content
  const searchResults = await runWebSearch(task.brief)

  // 2. Retrieve relevant file chunks
  const fileChunks = await retrieveRelevantChunks(task.brief, orgId)

  // 3. Generate the research brief
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `${SOUL}

Project context: ${projectMemory}
Org context: ${orgMemory}

You have been assigned this research task: ${task.title}
Brief: ${task.brief}

Web research gathered:
${searchResults.map(r => `Source: ${r.url}\n${r.content}`).join('\n\n')}

Relevant documents:
${fileChunks.map(c => `Source: ${c.fileName}\n${c.content}`).join('\n\n')}

Produce a structured research brief. Use this format:
## [Task Title]
*stratpartner.ai · [date]*

### Executive Summary
[3-4 sentences]

### Key Findings
[5-8 specific, evidenced findings]

### Landscape / Competitor Map
[Table or structured analysis]

### Implications for [client/project]
[3-5 specific implications, not generic]

### Sources
[List all sources cited]

---DELIVERABLE---
Title: [descriptive deliverable title]
---`
    }]
  })

  // 4. Extract deliverable content
  const [mainContent, deliverableMeta] = parseDeliverableMarker(response.content[0].text)

  // 5. Save deliverable
  await createDeliverable({
    projectId,
    orgId,
    title: deliverableMeta.title,
    type: 'research-brief',
    phase: 'research',
    content: mainContent,
    taskId
  })

  // 6. Update task status
  await updateTask(taskId, { status: 'done', output: mainContent, completedAt: new Date() })

  // 7. Update project memory with key findings
  await runProjectMemoryExtraction(projectId, mainContent)
}
```

**Web search integration:** Use the Brave Search API (simple, $3/mo for 2,000 queries) or Serper.dev. Install: `npm install axios`. This is a one-day add-on in Session 4 or 5.

```typescript
// lib/webSearch.ts
export async function runWebSearch(query: string, maxResults = 5) {
  const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
    params: { q: query, count: maxResults },
    headers: { 'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY }
  })
  return response.data.web.results.map(r => ({
    title: r.title,
    url: r.url,
    content: r.description
  }))
}
```

Add to env: `BRAVE_SEARCH_API_KEY=`

---

## Feature 3: Deliverables Library

### What It Is

Every skill output that matters gets saved as a named deliverable and lives in the Deliverables Library — not just in the chat thread. Deliverables are versioned. They can be downloaded. They can be referenced in future sessions.

### How Deliverables Are Created

**From a task:** When the agent completes a research task, the output is automatically saved as a deliverable (see Feature 2 above).

**From a chat session:** When a skill is run in chat and the output is significant (journey map, persona, brand building blocks, etc.), the user sees a "Save as Deliverable" button. The content is saved with a title they can edit.

Better: the agent proactively suggests saving. After generating a journey map: "I've drafted the journey map. Do you want me to save this as a deliverable for the project?" If yes, it's saved automatically.

**Auto-save for certain skills:** Configure these skills to always auto-save their output as deliverables:
- `journey-map`
- `persona-build`
- `brand-building-blocks`
- `brand-territories`
- `biz-case`
- `prioritize`

Do not auto-save: `trend-scan`, `scan-blockers`, `synthesize`, `biz-context`, `service-map` — these are more exploratory and the user may want to iterate before saving.

### Deliverable Types and Icons

| Type | Icon | Description |
|------|------|-------------|
| `research-brief` | 🔍 | Landscape, market, or competitor analysis |
| `journey-map` | 🗺 | Customer journey map |
| `persona-build` | 👤 | Customer persona |
| `brand-building-blocks` | 🧱 | Brand building blocks |
| `brand-territories` | 🏔 | Brand territory directions |
| `biz-case` | 💼 | Business case |
| `prioritize` | 🎯 | Prioritisation roadmap |
| `cx-vision` | ✨ | CX vision and pillars |
| `session-summary` | 📋 | Strategy session summary |

### Deliverable Detail View

Each deliverable has its own page (`/dashboard/[orgSlug]/projects/[projectId]/deliverables/[deliverableId]`):

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back to project                                    v1 · Mar 28     │
│                                                                      │
│ 🗺 Customer Journey Map: Enterprise Onboarding       [Download .md]  │
│ Research phase · Created from chat session                           │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ [Full markdown-rendered content of the deliverable]                  │
│                                                                      │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ [💬 Discuss this deliverable]   [✏ Create new version]              │
└──────────────────────────────────────────────────────────────────────┘
```

**"Discuss this deliverable"** opens a chat session with this deliverable pre-loaded as context. The user can say "The stage 2 mapping looks wrong — here's what actually happens..." and the agent updates the deliverable in the next version.

**"Create new version"** creates a v2 of the deliverable. Previous versions are preserved.

---

## Feature 4: Strategy Sessions

### What It Is

A strategy session is a structured work session — either a Zoom meeting or a focused chat session — where findings are reviewed and decisions made. It produces a session summary with decisions and task assignments.

### Session Types

**Meeting-backed session:** A Zoom call captured by Recall.ai. At the end, the meeting extraction runs and its output is stored as a `sessions` record with decisions and task assignments.

**Chat-based session:** The user opens a chat in "Strategy Session" mode. The interface changes slightly — there's a "Decisions" panel on the right. During the session, the agent can be asked to record decisions: "Mark that as a decision: we're prioritising onboarding before retention." The agent extracts and stores these.

### Strategy Session Extraction Prompt

```
You are summarising a strategy session for a CX transformation engagement.

Project: {project.name}
Phase: {project.phase}

[transcript or chat thread]

Extract:
1. DECISIONS MADE: specific, concrete decisions (e.g. "Prioritise enterprise onboarding over retention programs")
2. NEXT TASKS: work items that need to be done as a result of this session (e.g. "Run journey map for enterprise onboarding flow")
3. OPEN QUESTIONS: things raised but not resolved
4. SESSION SUMMARY: 3-4 sentence summary of what happened and why it matters

Return as JSON:
{
  "decisions": [{"text": "...", "owner": "agent|human|client"}],
  "tasks": [{"title": "...", "type": "research|deliverable|review", "assignedTo": "agent|human", "brief": "..."}],
  "openQuestions": ["..."],
  "summary": "..."
}
```

Tasks extracted from a session are automatically created in the `tasks` table with status 'pending'.

---

## Updated Navigation Model

The sidebar changes significantly. Projects become the primary navigation layer.

```
stratpartner.ai
────────────────
PROJECTS
○ Q2 CX Transformation (active)
  ○ Intake ✓
  ○ Research (3 tasks)
  ○ Strategy
  ○ Deliverables (2)
○ Brand Strategy 2025
  ○ Intake ✓
  ○ Research ✓
  ○ Strategy (1 session)
  ○ Deliverables (4)

────────────────
ORG
○ Documents
○ Meetings
○ Interviews
○ Memory

────────────────
[+ New Project]
```

Projects collapse/expand. The active project is highlighted. Phases show completion status.

---

## Phase Progression

Projects move through phases. stratpartner tracks which phase is current and suggests appropriate next actions.

**Phase 1: Intake**
- Intake form completed
- Initial research tasks generated
- Project memory seeded
→ Advances to Research when intake is marked complete

**Phase 2: Research**
- Research tasks assigned and run
- Research briefs produced as deliverables
- Uploaded documents embedded
→ Advances to Strategy when all research tasks are done (or user manually advances)

**Phase 3: Strategy**
- Strategy session(s) held
- Decisions captured
- Deliverable tasks assigned from session
→ Advances to Delivery when strategy sessions are complete

**Phase 4: Delivery**
- Deliverable tasks run (journey maps, personas, brand building blocks, etc.)
- Deliverables reviewed and iterated
- Final deliverable set is the project output

---

## Revised Build Sequencing

This model adds complexity but not as much as it looks. Here's where each piece lands in the session plan:

**Session 1-2 (Foundation + Agent Loop):** Add `projects`, `tasks`, `deliverables`, `sessions`, `intakes` tables to the schema. The agent loop stays the same but the API route now accepts optional `projectId` and loads project memory alongside org memory.

**Session 3 (Chat UI):** Chat now lives inside a project context. Add project selector above the chat thread. The `---DELIVERABLE---` marker parsing is implemented here.

**Session 4 (Files + RAG):** File uploads are now linked to a project. Add `project_id` to upload flow.

**Session 5 (Skills Layer):** Skills now produce deliverables instead of just chat messages. Auto-save logic for the 6 deliverable-generating skills is implemented here.

**New Session 5b — Intake + Tasks + Research (3-4 hours):**
- Intake form UI
- Project creation flow
- Task card UI
- Research task runner (web search integration)
- Deliverables library page

**Session 6 (Auth + Admin):** Admin panel gains project overview per org. Project list and deliverables visible per org.

**Sessions 7-8 (Voice):** Voice interview is now optionally linked to a project intake.

**Sessions 9-11 (Meetings):** Meetings are now optionally linked to a project as strategy sessions. Post-meeting extraction creates a `sessions` record with decisions and tasks.

**Total additional work:** ~4-6 hours (one extra session). Worth it — this is the difference between a chatbot and a product.

---

## What This Doesn't Change

- The chat interface is still the primary communication surface
- SOUL.md still runs before everything
- Memory (org-level) still accumulates across all projects
- Skills still activate via slash commands or AI detection
- All Phase 2 (Voice) and Phase 3 (Meetings) work applies as-is

The only thing that changes is: everything now happens inside a project context, and significant outputs become deliverables rather than chat messages.
