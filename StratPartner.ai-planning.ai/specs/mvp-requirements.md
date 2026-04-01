# stratpartner.ai — MVP Requirements
## Complete Interaction Model, Key Flows, and Feature Specifications
**Master document. Claude Code reads this before every session.**

---

## 1. Mental Model and Design Principles

### The Core Analogy

stratpartner behaves like a **junior strategist on a consulting engagement**. Not a chatbot. Not a search engine. A person with tasks, deliverables, and a seat at the table.

The interaction pattern Paperclip.ing gets right: **work is organised into tasks, tasks produce outputs, outputs are traceable**. Every piece of work the agent does is visible — you can see what it searched, what it read, what it concluded. This is the mental model stratpartner adopts.

The key difference from Paperclip: stratpartner is not an autonomous company. The **human strategist (Kenan) remains in the loop at every significant decision point**. The agent handles research, synthesis, and deliverable drafting. The human handles judgment calls, client relationships, and strategy sessions.

### Design System

All UI is built on the **Paper design system by typeui.sh**. Before writing any component code, run:

```bash
npx typeui.sh pull paper
```

Paper is a minimal, print-inspired component library. Its tokens and components are the only approved styling primitives — no raw hex values, no ad-hoc Tailwind, no custom component from scratch when a Paper component covers the need. Full guidance is in `CLAUDE.md` under the Design System section.

---

### Design Principles

**1. Tasks, not messages.** Significant work units are tasks with a lifecycle (pending → in progress → done → reviewed). Chat is for discussion and iteration. Tasks are for production work.

**2. Deliverables are first-class objects.** A journey map, a brand building blocks output, a research brief — these are not chat messages. They are versioned documents that live in a deliverables library, associated with a project phase, referenceable in future sessions.

**3. Goal ancestry.** Every task knows why it was created. A journey map task was created because a strategy session decided it was the next step, which was created because the research phase revealed a gap in onboarding experience, which was kicked off by the intake that said the client's NPS was 32. That chain is preserved and surfaced when the agent runs the task.

**4. Sessions capture decisions, not just transcripts.** When a strategy session ends (whether it was a Zoom meeting or a chat working session), the output is a structured set of decisions and task assignments — not just a summary paragraph.

**5. Memory compounds.** Org-level memory accumulates across all projects. Project-level memory captures what's specific to this engagement. The agent always operates with both layers in context.

**6. Work is visible.** When the agent is running a research task, the user sees what's happening — which sources it's searching, that it's synthesising, that it's done. No black boxes.

---

## 2. Information Architecture

### Navigation Hierarchy

```
stratpartner.ai
│
├── [Org level — persistent across all projects]
│   ├── Home / Dashboard
│   ├── Projects (list of all engagements)
│   ├── Documents (org-level file library)
│   ├── Memory (org-level strategic memory, viewable)
│   ├── Interviews (voice interviews, not tied to a project)
│   └── Meetings (all Zoom/Meet sessions)
│
└── [Project level — within a specific project]
    ├── Overview (project dashboard)
    ├── Intake (form + status)
    ├── Tasks (research and deliverable tasks)
    ├── Chat (project-scoped strategy chat)
    ├── Sessions (strategy sessions and their decisions)
    └── Deliverables (all outputs from this project)
```

### Key Screens

1. **Org Home** — landing after login. Activity feed, memory snapshot, active project summary, quick actions.
2. **Projects List** — all engagements for this org, with phase and status.
3. **Project Overview** — single-project dashboard: phase indicator, open tasks, recent activity, deliverables count.
4. **Intake** — structured form to kick off a project. Shows completion status and generated tasks after submission.
5. **Tasks Board** — all tasks for a project, organised by status. Research tasks and deliverable tasks distinguished visually.
6. **Task Detail** — single task view with: brief, goal ancestry, agent execution log (what it searched/read), output, discussion thread.
7. **Chat** — project-scoped chat interface. Same as the general chat but memory includes project context. Skills available. Outputs can be saved as deliverables from here.
8. **Sessions** — list of strategy sessions (chat-based and meeting-based). Each session shows decisions made and tasks created.
9. **Session Detail** — full session record: summary, decisions, tasks created, discussion thread or transcript.
10. **Deliverables Library** — all deliverables for the project, organised by type and phase.
11. **Deliverable Detail** — full rendered deliverable, version history, discussion thread for iteration.
12. **Documents** (org-level) — all uploaded files, active/inactive toggle, chunk count, project association.
13. **Admin Panel** — Kenan's view. Org list, org detail, memory editor, skills toggles, activity monitor.

---

## 3. Data Model Summary

All entities and their relationships. This drives what's possible in the UI.

```
Org
 └── has many Projects
 └── has one Memory (org-level)
 └── has many Files (documents)
 └── has many Messages
 └── has many Meetings
 └── has many Interviews

Project
 └── belongs to Org
 └── has one Intake
 └── has one Memory (project-level)
 └── has many Tasks
 └── has many Sessions
 └── has many Deliverables
 └── has many Messages (project-scoped chat)
 └── has many Files (project-scoped uploads)

Task
 └── belongs to Project
 └── type: 'research' | 'deliverable' | 'review'
 └── assigned_to: 'agent' | 'human'
 └── status: 'pending' | 'in_progress' | 'done' | 'blocked'
 └── has one source (intake | session | manual | agent-suggested)
 └── has one Deliverable (produced output, if type = research or deliverable)
 └── has many ExecutionEvents (traceable log of agent work)

Session
 └── belongs to Project
 └── type: 'chat' | 'meeting' | 'voice'
 └── optionally references a Meeting or Interview
 └── has many Decisions
 └── has many Tasks (created from this session)

Decision
 └── belongs to Session
 └── text: string
 └── owner: 'agent' | 'human' | 'client'
 └── creates_task: boolean (if true, a task was auto-created)

Deliverable
 └── belongs to Project
 └── type: skill slug or 'research-brief' or 'session-summary'
 └── version: integer (incremented on each revision)
 └── linked to Task or Session (source)
 └── has many Messages (discussion thread on this deliverable)
```

---

## 4. Key Flows

### Flow 1: First-Time Setup (Admin)

**Actor:** Kenan (admin)
**Entry point:** `/admin`
**Trigger:** A new client engagement begins

```
1. Kenan logs into /admin
2. Clicks "Create Org"
3. Fills in:
   - Org name (e.g. "Acme Corporation")
   - Slug (auto-generated, editable: "acme-corp")
   - Tier (Agent / Advisory / Fractional)
   - Client email (for magic link login)
   - Optional: seed memory (paste any prior context Kenan already has)
4. System creates org record + empty memory record + sends magic link to client email
5. Kenan optionally creates the first project from admin, or leaves it for the client
6. Client receives email: "stratpartner is ready. Click here to set up your first project."
```

**State after:** Org exists. Client has access. Memory may be pre-seeded.

---

### Flow 2: New Project Creation + Intake

**Actor:** Client (or Kenan on behalf of client)
**Entry point:** Org Home → "New Project" button
**Trigger:** Beginning a new engagement (e.g. CX transformation, brand strategy)

```
1. Client clicks "New Project"
2. Names the project (e.g. "Q2 CX Transformation")
3. Selects project type:
   - CX Transformation
   - Brand Strategy
   - Discovery / Maturity Assessment
   - Custom
   (Selection pre-fills relevant deliverable types in the intake)

4. Lands on Intake screen with structured form:

   SECTION 1: The Goal
   - What are you trying to achieve? [textarea, 3-4 sentences]
   - What does success look like? [textarea]
   - Timeline / key deadline: [text]

   SECTION 2: The Context
   - What research or context do you already have? [textarea]
   - What's the biggest risk or unknown? [textarea]
   - Who are the key stakeholders? [name + role pairs, add up to 5]

   SECTION 3: The Deliverables
   - Which deliverables do you need? [multi-select checkboxes]
     [ ] Customer Journey Map
     [ ] CX Vision & Pillars
     [ ] Brand Building Blocks
     [ ] Brand Territories
     [ ] Competitive Landscape Analysis
     [ ] Customer Persona(s)
     [ ] Stakeholder Research Brief
     [ ] Prioritisation Roadmap
     [ ] Business Case
     [ ] Other: [text field]

   SECTION 4: Documents
   - Upload any existing research (PDF or DOCX, multiple files)
   [drag-and-drop zone]

5. Client submits intake

6. System processes intake:
   a. Files are ingested (extracted, chunked, embedded)
   b. Anthropic call generates:
      - Project memory seed (3-5 sentences of strategic context)
      - Suggested research tasks (3-5 task titles + briefs)
      - Recommended phase order (which deliverables come first)
   c. Project memory is seeded
   d. Research tasks are auto-created with status 'pending'
   e. Project phase set to 'research'

7. Client lands on Project Overview showing:
   - "Intake complete ✓"
   - List of auto-generated research tasks
   - Message from stratpartner: "I've reviewed your intake. Here's what I'll work on first..."
```

**State after:** Project exists, memory seeded, research tasks queued.

**Edge cases:**
- Client abandons intake mid-way: save progress, allow resuming. Do not create tasks until submitted.
- Client uploads files but doesn't complete the form: files are held but not embedded until intake is submitted (to ensure project association).
- No deliverables selected: show a warning but allow continuation. stratpartner will ask for clarification in the first chat.

---

### Flow 3: Research Task Execution

**Actor:** stratpartner (agent), initiated by client
**Entry point:** Project → Tasks → a pending research task
**Trigger:** Client clicks "Run" on a research task card

```
Task card shows:
  Title: "Competitive Landscape — AI tools in CX"
  Type: Research
  Assigned to: stratpartner
  Brief: "Analyse the AI-powered CX tools market. Focus on: direct competitors,
          positioning, pricing tiers, key differentiators, and gaps in the market
          that stratpartner.ai could occupy."
  Source: Generated from intake
  Goal ancestry: "Q2 CX Transformation > Research Phase > Intake: 'We need to
                  understand where stratpartner.ai sits relative to alternatives'"

  [ Run Task ]    [ Edit Brief ]    [ Dismiss ]

1. Client clicks "Run Task"
2. Task status changes to 'in_progress'
3. An execution log appears below the task card, updating in real-time:

   STRATPARTNER IS WORKING
   ──────────────────────
   ✓ Loaded project context
   ✓ Loaded org memory
   ↻ Searching: "AI-powered CX tools 2025 competitive landscape"
   ↻ Searching: "CX strategy AI tools enterprise pricing"
   ✓ Found 8 relevant sources
   ↻ Reading: Zendesk AI pricing page
   ↻ Reading: Salesforce Einstein CX overview
   ✓ Retrieving relevant sections from your uploaded documents...
   ✓ Found 3 relevant excerpts from "CX Maturity Report Q3.pdf"
   ↻ Synthesising findings...

4. Agent runs the research task:
   - Web searches (Brave Search API, 3-5 queries)
   - RAG retrieval against uploaded org documents
   - Synthesises into a research brief using the Research Brief skill
   - Research brief includes goal-specific implications ("What this means for stratpartner.ai")

5. Task status changes to 'done'
6. Execution log shows "Complete"
7. A deliverable is automatically created and linked to the task
8. Project memory is updated with key findings
9. Client sees:

   TASK COMPLETE
   ──────────────────────
   ✓ Competitive Landscape — AI tools in CX
   Created deliverable: "Competitive Landscape Brief" →
   Memory updated with 3 new findings

   [View Deliverable]   [Discuss]   [Request Revision]
```

**State after:** Task is 'done'. Deliverable exists. Project memory updated.

**Edge cases:**
- Web search returns no useful results: agent falls back to uploaded documents only. Notes in the deliverable that web research was limited.
- Task brief is too vague: before running, agent asks one clarifying question: "Before I start, can you tell me whether you want me to focus on direct competitors (same category) or adjacent tools (meeting notetakers, project management)?"
- Task fails mid-execution: status set to 'blocked'. Execution log shows where it failed. Client sees a "Retry" option.
- Client edits the brief before running: allowed. System logs the edit with a timestamp.

---

### Flow 4: Strategy Session (Chat-Based)

**Actor:** Client and stratpartner
**Entry point:** Project → Chat tab
**Trigger:** Client wants to review research findings and make decisions

```
1. Client opens the Chat tab within a project
2. Chat UI loads with project context pre-loaded:
   - Project memory visible in a collapsible panel on the right
   - Recent deliverables listed in right panel ("Context available: 2 deliverables")
   - Session type defaults to 'working' — client can change to 'strategy' to activate decision capture

3. Client can say: "Let's review the competitive landscape brief and decide on our positioning"
4. stratpartner loads the relevant deliverable content into context and begins the discussion
5. During the session, the agent proactively:
   - Surfaces tensions ("The brief shows Salesforce Einstein has the same price point as your Agent tier. That's worth resolving.")
   - Asks strategic questions ("Before we define positioning, do you want to go head-to-head with Salesforce or find a gap they're not covering?")
   - Suggests next steps ("Based on what we've decided, I'd recommend running the Brand Building Blocks skill next. Want me to add that as a task?")

6. Decision capture:
   - When a decision is made (detected by the agent or explicit: "Mark that as a decision"),
     a decision card appears in the right panel:
     ┌─────────────────────────────────────────┐
     │ ✓ Decision captured                     │
     │ "Position stratpartner against mid-market│
     │ consultancies, not enterprise tools"     │
     │ [Edit] [Remove]                         │
     └─────────────────────────────────────────┘
   - Decisions accumulate during the session

7. Task creation from session:
   - Agent suggests tasks as they emerge: "I'll add 'Run Brand Building Blocks' as a task for the next phase. Confirm?"
   - Client confirms → task created with source = this session

8. Client ends the session (or closes the chat)
9. Session is automatically saved as a Session record:
   - Summary generated (3-4 sentences)
   - Decisions array saved
   - Tasks created array saved
   - Project phase may advance (e.g., research → strategy)

10. Client sees a session summary card:
    "Strategy Session · March 28 · 47 minutes
     3 decisions captured · 2 tasks created
     [View Session Record]"
```

**State after:** Session saved with decisions and tasks. Project memory updated. New tasks in task board.

**Edge cases:**
- Client doesn't want decisions captured: can disable decision capture mode. Session still saves as a summary.
- Agent suggests a task but client doesn't confirm: task is saved as 'suggested' status. Surfaces in task board as a suggestion, not an active task.
- Very long session: session is summarised incrementally every 30 messages to avoid context length issues.

---

### Flow 5: Deliverable Creation from Chat

**Actor:** Client (via chat) or system (auto-save)
**Entry point:** Project Chat, skill is activated
**Trigger:** Client types /journey-map or agent detects the need

```
1. Client types: "/journey-map Map the enterprise onboarding experience
   for a client who has just signed a contract and needs to activate
   3,000 users across 5 countries."

2. Agent detects skill trigger, loads the Journey Map SKILL.md into system prompt

3. Chat area shows: "⚡ Running Journey Map framework..."

4. Agent streams the journey map output into the chat thread

5. After output completes, a prompt appears below the message:
   ┌──────────────────────────────────────────────────────────────┐
   │ Save this as a project deliverable?                          │
   │                                                              │
   │ Title: [Customer Journey Map — Enterprise Onboarding      ]  │
   │ Phase: [ Research ▾ ]  Type: Journey Map                    │
   │                                                              │
   │ [Save Deliverable]              [Dismiss — keep in chat only]│
   └──────────────────────────────────────────────────────────────┘

   For auto-save skills (journey-map, persona-build, brand-building-blocks,
   brand-territories, biz-case, prioritize), this prompt auto-saves after
   5 seconds unless the client dismisses it.

6. If saved:
   - Deliverable created in database
   - Linked to current project and phase
   - Linked to current chat session
   - Project memory updated with key findings from the deliverable
   - Chat shows a small card: "Saved as deliverable →  [Customer Journey Map — Enterprise Onboarding]"

7. Deliverable appears in the Deliverables Library immediately
```

**State after:** Deliverable exists and is linked to the project. Memory updated.

**Edge cases:**
- Client dismisses the save prompt and then changes their mind: a "Save" button persists on the message card in the chat thread (on hover) for the duration of the session.
- Same skill run twice in one session (different scenarios): both outputs get distinct deliverable titles. System doesn't merge them.
- Skill output is partial/unsatisfactory: client says "That's not quite right — the onboarding actually starts 2 weeks before contract signature." Agent revises and outputs a new version. The save prompt appears again. If client saves, it's saved as v2 of the same deliverable if one was already saved, or a new deliverable.

---

### Flow 6: Deliverable Revision

**Actor:** Client
**Entry point:** Deliverables Library → a specific deliverable
**Trigger:** Client wants to update or improve a deliverable

```
1. Client opens a deliverable (e.g., "Customer Journey Map — Enterprise Onboarding, v1")

2. Deliverable detail view shows:
   - Full rendered Markdown content
   - Metadata: type, phase, created, version, source (which task or session)
   - Goal ancestry: "Created in strategy session March 28 → from task 'Map enterprise onboarding' → from intake goal: 'Improve NPS'"
   - A discussion thread below the content
   - Version history (v1, v2... etc.) in a dropdown

3. Three revision paths:

   PATH A — Discuss and revise in thread:
   Client types in the discussion thread: "Stage 3 is wrong — we don't have a
   dedicated CSM for the first 90 days. It's all self-serve."
   → stratpartner responds in the thread, proposes specific edits
   → Client confirms: "Yes, update it"
   → stratpartner generates revised content, creates v2
   → v2 appears in the deliverable view. v1 preserved in version history.

   PATH B — Start a revision chat session:
   Client clicks "Revise in Chat"
   → Opens chat with the deliverable content pre-loaded as context
   → Client and stratpartner work through the revisions conversationally
   → At end of session, client can save as new version

   PATH C — Run the skill again:
   Client clicks "Re-run with updated context"
   → Reopens the task/skill with the current deliverable as a starting point
   → Agent runs the skill with: original brief + current deliverable + "improve this based on: [new context]"
   → Output saved as new version
```

**State after:** New version exists. Previous versions preserved. Memory updated with revision context.

---

### Flow 7: Strategy Session (Meeting-Backed, Phase 3)

**Actor:** Client + meeting participants (via Zoom/Meet)
**Entry point:** Project → Chat (or Meetings) → "Join a Meeting"
**Trigger:** A strategy session is happening on Zoom

```
1. Client pastes a Zoom or Google Meet URL
2. Names the session: "Q2 Roadmap Strategy Session" (optional, auto-named if skipped)
3. Associates it with a project (dropdown, defaults to active project)
4. Clicks "Join Meeting"

5. System deploys Recall.ai bot:
   - Bot joins the meeting as "stratpartner · [Org Name]"
   - Bot name visible to all participants
   - Bot has no camera/video — audio only via transcription

6. Live view appears in the browser:

   LEFT PANEL — Live Transcript
   Real-time transcript with speaker labels updating every 5 seconds:
   "Sarah: The issue isn't the CSM handoff, it's the 48 hours before that."
   "Marcus: Agreed. Can we quantify what that gap is costing us?"
   [auto-scrolls to bottom]

   RIGHT PANEL — Ask stratpartner
   A chat input where the client can ask questions mid-meeting.
   stratpartner responds using: live transcript so far + project memory + uploaded docs.
   Examples:
   - "What have we decided so far?" → list of proto-decisions
   - "What's our NPS baseline?" → pulls from uploaded CX Maturity Report
   - "Is there anything important we haven't discussed yet?" → flags open questions from project tasks

   DECISIONS BAR (top of right panel)
   Decisions detected or confirmed during the meeting appear here as they're captured.

7. Meeting ends (bot leaves or is removed)
8. Post-meeting extraction runs automatically (within 2-3 minutes):
   - Full session summary
   - Decisions extracted
   - Tasks created from decisions
   - Memory updated

9. Session record created under the project's Sessions tab:
   "Q2 Roadmap Strategy Session · Mar 28 · 54 min
    5 decisions captured · 3 tasks created · Memory updated"
   [View full transcript] [View decisions] [View tasks created]
```

**State after:** Session record with decisions and tasks. Memory updated. Tasks appear in project task board.

---

### Flow 8: Voice Discovery Interview (Phase 2)

**Actor:** Client (alone, interviewing a stakeholder) or the stakeholder directly
**Entry point:** Project → Tasks → Interview task, OR Interviews (org level)
**Trigger:** Client needs to capture stakeholder perspectives on the CX program

```
1. Client navigates to an interview task or clicks "Start Interview" at org level
2. Selects: "This interview is for project: Q2 CX Transformation" (links to project)
3. Optional: names the interviewee ("Sarah Chen, VP Customer Success")
4. Clicks "Start Interview"

5. VoiceWidget activates in the browser:
   - Requests microphone permission
   - Connects to Vapi (Acme's stratpartner Interview assistant)
   - stratpartner speaks: "Hi, I'm stratpartner. I'm working with [org name] on their
     CX transformation program. I have about 20 minutes of questions for you. Can you
     start by telling me your name and role?"

6. The interview follows the CX Discovery Interview Framework:
   Phase 1 (5 min): Role + context
   Phase 2 (10 min): Program maturity, blockers, stakeholder dynamics
   Phase 3 (5 min): Synthesis + validation

   During the interview:
   - stratpartner probes on vague answers
   - stratpartner asks for specific examples when it gets abstractions
   - stratpartner synthesises back to validate before ending

7. Interview ends
8. Post-interview extraction runs:
   - Key findings (3-5 bullets)
   - Tensions identified (2-3 contradictions or conflicts)
   - Memory update (what's new vs. what was already known)

9. Interview record appears under project Sessions:
   "Discovery Interview · Sarah Chen · 22 min · 4 findings"
   [View transcript] [View findings]

10. If the interview was created from an intake task, that task is marked 'done'
```

**State after:** Interview findings in Sessions. Memory updated. Task (if applicable) marked done.

---

### Flow 9: Admin Org Monitoring

**Actor:** Kenan
**Entry point:** `/admin`
**Trigger:** Routine check-in or client setup

```
ORGS TABLE
Shows all orgs with:
  - Name, slug, tier
  - Client email
  - Active projects count
  - Last activity timestamp
  - Total conversations
  - Rough infrastructure cost this month

Actions per org:
  - Edit org (name, tier, slug, email)
  - Open org detail (full edit panel)

ORG DETAIL PANEL (slide-in drawer):
  - Settings: name, tier, slug, client email
  - Memory editor: full org memory in a textarea. Save button.
  - Projects: list of projects with phase + status. Can open each.
  - Skills toggles: all 11 skills, active/inactive per org.
  - Activity: last 10 messages across all channels.
  - Files: list of uploaded files with active/inactive toggle.
  - Danger zone: Reset Memory, Deactivate Org.

ACTIVITY MONITOR (separate tab):
  Across all orgs, a reverse-chronological feed:
  - [ACME] 💬 Chat: "What's our NPS baseline?" — 2 hrs ago
  - [POLARIS] ⚡ Skill: Prioritize activated — 3 hrs ago
  - [MEDHEALTH] 🎥 Meeting: Q2 Review · 54 min · 5 decisions — yesterday
  Useful for spotting clients who need attention and understanding usage patterns.

SOUL.md EDITOR:
  A textarea with the current SOUL.md content.
  Version history (last 5 saves, with timestamps).
  Save button — changes take effect immediately on next agent call.
  Note: this is the most sensitive part of the product. Changes here affect all clients.
```

---

## 5. Feature Requirements by Area

### 5A. Chat Interface

**Required behaviours:**
- Chat can be loaded at org level (no project) or project level (with project context)
- At project level: project memory + org memory both loaded into system prompt
- At project level: recent deliverables are accessible to the agent (summaries injected into context, full content retrievable on demand)
- Skill detection: explicit `/slug` command OR keyword detection from the skill keyword map
- Skill activation: full SKILL.md injected for that turn only
- Streaming: response streams token-by-token. No buffering.
- Auto-scroll to bottom on new message. Stop auto-scroll if user has scrolled up.
- Skill shortcut chips: horizontal scrollable row above input. Clicking inserts `/slug ` into input.
- File upload: paperclip icon in input bar. Uploads to current project (if in project) or org-level. Shows processing indicator.
- Save as deliverable prompt: appears after any auto-save skill activates. Manual save option on all messages.
- Empty state: time-aware greeting + 3-4 suggested starting prompts relevant to project phase.

**Input behaviour:**
- Enter sends (no modifier needed)
- Shift+Enter inserts newline
- Textarea auto-grows to 6 lines maximum
- Disabled while streaming (with spinner on send button)
- Placeholder text changes based on context: project-level shows phase-relevant suggestions

**Message display:**
- User messages: right-aligned, dark pill
- Assistant messages: left-aligned, white card, full Markdown rendering (including tables)
- Skill badge displayed above assistant message if a skill was used
- Source cards displayed below assistant message for each cited document
- Export options (copy as Markdown, download as .md) appear on hover on any assistant message
- Session-type indicator: if in 'strategy' mode, a subtle banner shows "Decision capture is on"
- Decision cards: when a decision is captured, a small card appears in the right sidebar (visible in strategy mode)

---

### 5B. Task Board

**Layout:** Kanban-style columns OR list view (toggle). Default: list.

**Columns/filters:**
- All tasks
- Pending
- In Progress
- Done
- Blocked
- Suggested (not yet confirmed)

**Task card — compact view:**
- Icon (🔍 research, 🛠 deliverable, 👤 review)
- Title
- Brief excerpt (1 line)
- Assigned to (agent icon or human icon)
- Status badge
- Source (intake / session / manual)
- "Run" button (if assigned to agent + pending)

**Task card — expanded view (on click):**
- Full brief
- Goal ancestry: breadcrumb trail from org goal → project goal → phase → session decision that created this task
- Execution log (if task has been run): collapsible, shows each step
- Output preview (if done): first 200 words of the output
- Link to deliverable (if output was saved as one)
- Discussion thread: client can comment, ask questions, request changes

**Creating a task manually:**
- "New Task" button on the task board
- Title, type (research/deliverable), brief, assigned to (agent/human)
- If type = deliverable, select which skill to use
- System auto-links to current project and phase

**Agent-suggested tasks:**
When stratpartner suggests a task in chat ("I'd recommend running a persona build next"), a task appears in the board with status 'suggested'. Client sees:
- "stratpartner suggested this" label
- [Accept] [Edit & Accept] [Dismiss] actions
- Accepting changes status to 'pending'

---

### 5C. Deliverables Library

**Layout:** Grid or list (toggle). Default: list.

**Filtering:**
- All deliverables
- By type (Journey Map, Persona, Research Brief, etc.)
- By phase (Research, Strategy, Delivery)
- By version (latest only vs. all versions)

**Deliverable card:**
- Type icon
- Title
- Phase
- Version (v1, v2...)
- Date created/updated
- Source (which task or session)
- Brief excerpt (3 lines of content)

**Deliverable detail page:**
- Header: title, type, version, date, phase, source
- Goal ancestry (same as tasks — full chain from org goal to this deliverable)
- Full Markdown-rendered content (tables, headers, bullets)
- Version history dropdown (v1, v2...) — selecting a version loads that version's content
- "Revise in chat" button → opens chat with this deliverable pre-loaded
- "Re-run skill" button → creates a new task to re-run the source skill with updated context
- Discussion thread below the content
- Download as .md button

**Versioning rules:**
- A new version is created when: the client explicitly saves a revision, OR the agent revises and the client confirms, OR the skill is re-run
- Previous versions are never deleted
- The "latest" version is always what's shown by default
- Version diff view is a Phase 2 nice-to-have — not in MVP

---

### 5D. Sessions

**Session types:**
- **Chat session:** A focused chat that the client marks as a strategy session, OR any chat that captures at least one decision
- **Meeting session:** A Zoom/Meet meeting recorded via Recall.ai and linked to a project
- **Voice session:** A voice interview linked to a project

**Session list:**
- Reverse chronological
- Shows: type icon, title, date, duration, decisions count, tasks created count
- Filtered by project automatically when inside a project

**Session detail:**
- Header: title, type, date, duration
- Summary: 3-4 sentence summary
- Decisions: ordered list with owner labels
- Tasks created: list with links to task detail
- Full transcript or chat thread (collapsible)
- "Discuss" button → opens chat with this session loaded as context

---

### 5E. Memory

**Two levels:**

**Org-level memory** (`/memory` at org level):
- Full prose text, continuously updated
- Last updated timestamp + trigger (which session updated it)
- "History" tab: last 10 memory states with diffs (who said what that changed it)
- Read-only for clients. Editable by admin.
- Shown as a summary (first 3 sentences) on the org home dashboard

**Project-level memory** (accessible within project Overview):
- Same structure as org memory but scoped to this project
- Gets seeded from intake. Updated by tasks, sessions, and chat.
- Shown prominently on the project Overview — it's the agent's "understanding of this engagement"

---

### 5F. Documents

**Org-level Documents page** (`/documents`):
- List of all uploaded files across all projects
- Columns: name, type, project (if associated), active status, chunks, uploaded date
- Active/inactive toggle per file
- Delete option (with confirmation: "This will remove 42 chunks from retrieval")
- Upload button: drag-and-drop or file picker. Accepts PDF and DOCX. Max 50MB per file.
- Shows processing status while chunking/embedding: "Processing... 12/42 chunks embedded"

**Project-level file association:**
- Files uploaded within a project are tagged with that project
- During RAG retrieval: retrieve from project-level files first, then fall back to org-level files if insufficient results

---

### 5G. Admin Panel (Kenan's View)

**Access:** `/admin` — gated by ADMIN_EMAIL env var. No Supabase Auth check needed here.

**Sections:**

1. **Orgs table:** All orgs, one row each. Key stats visible. Clicking an org opens the detail drawer.

2. **Org detail drawer (slide-in):**
   - Settings: name, tier, slug, client email, save button
   - Memory editor: full org memory textarea + save button
   - Projects: list with phase/status, link to project detail (Kenan can see everything the client sees)
   - Skills: all 11 skills with per-org toggles
   - Activity: last 10 messages, all channels
   - Danger zone: Reset Memory (confirm modal), Deactivate Org (confirm modal)

3. **Activity monitor:** All orgs, reverse chronological. Org name pill + event description. Useful for identifying who needs a check-in.

4. **SOUL.md editor:** Textarea. Version history (last 5 saves). Save immediately affects all new agent calls. No per-org override in MVP.

5. **Skills library:** List of all 11 skills. Click to view/edit the full SKILL.md content. Changes affect all orgs using that skill.

6. **Usage & Costs (basic):** Per org: number of Anthropic API calls this month, estimated token cost, number of Recall.ai meetings. Not real-time — runs a nightly aggregation.

---

## 6. Interaction Patterns Borrowed from Paperclip

These specific patterns are worth implementing explicitly, inspired by Paperclip's task-based model:

**Goal ancestry:** Every task and deliverable shows its full origin chain. Not just "why was this created" but the full breadcrumb: Org goal → Project goal → Phase → Session decision → This task. This is displayed on task detail pages and deliverable detail pages. It makes work feel purposeful, not arbitrary.

**Execution tracing:** When the agent runs a task, every step is logged and displayed in real-time. Not a spinner — a visible log. "Searching web for X... Reading Y... Retrieving from your documents... Synthesising..." This builds trust and lets clients see the agent working.

**Task carries context, not just title:** When a task is passed to the agent for execution, it doesn't just receive "Competitive landscape analysis." It receives: what the project is trying to achieve, what the client said in their intake, what research has already been done, and which deliverables are already complete. The "why" travels with the work.

**Decisions as first-class objects:** A decision is not a bullet point in a summary. It's a typed record with an owner and a link to what it created. Decisions can be referenced: "Going back to the March 28 decision to prioritise onboarding — has anything changed that would make us revisit that?"

**Work is interruptible:** A task can be paused, its brief edited, and re-run. The agent doesn't need to start from scratch — it receives the previous output as context and the specific change requested.

---

## 7. What's NOT in MVP

Be clear about what's deferred to avoid scope creep.

**Not in Phase 1:**
- Real-time collaboration (two users editing the same deliverable simultaneously)
- Deliverable version diffs (show what changed between v1 and v2)
- Export to PowerPoint or Google Slides
- Email digest ("here's what stratpartner did this week")
- Client-visible cost tracking (they don't see the API cost)
- Slack integration
- Multi-user orgs (one login per org in MVP)

**Not in Phase 2:**
- Voice-in-Zoom (stratpartner speaks in the Zoom call). The bot joins Zoom but is text-only. Voice in browser is separate.

**Not in Phase 3:**
- Automated task scheduling (agent proactively runs tasks on a schedule without client initiation)
- Cross-project synthesis ("based on everything you've done across all projects...")
- Custom skill creation by clients (they can request skills from Kenan)

---

## 8. Non-Functional Requirements

**Performance:**
- Chat streaming must produce first token within 2 seconds of send
- Task execution log must begin updating within 3 seconds of "Run" click
- Page load time under 2 seconds on a standard broadband connection
- File ingestion for a 10MB PDF must complete within 60 seconds

**Security:**
- Org isolation is absolute: no query should ever return data from another org, even in error cases. Row-level security (RLS) enforced in Supabase.
- ADMIN_EMAIL env var gates the admin panel. Admin panel uses server-side check only — not a client-side redirect.
- API keys never exposed to client-side code
- File uploads validated for type (PDF/DOCX only) and size (50MB max) before processing

**Error handling:**
- Every failure state has a human-readable message visible in the UI
- Failed tasks show what failed and offer a retry option
- Failed file ingestion shows which file failed and why (size? format? corrupt?)
- If Anthropic API is unavailable, show a degraded state message ("stratpartner is temporarily unavailable — usually resolves in a few minutes")
- If Recall.ai bot fails to join a meeting, notify client immediately (don't leave them wondering)

**Mobile:**
- Sidebar collapses on screens narrower than 768px (hamburger menu)
- Chat interface is usable on mobile
- Task board is usable on mobile (list view only on mobile — kanban doesn't work on small screens)
- Deliverable detail is readable on mobile (scrollable)
- Admin panel is desktop-only (acceptable — admin use case is always on desktop)

---

## 9. Build Sequencing (Updated)

This supersedes the original session plan where it conflicts.

**Session 1 — Foundation**
Schema includes all new tables: projects, tasks, deliverables, sessions, intakes, decisions.
No UI yet. Just make sure the data model is right before building on top of it.

**Session 2 — Agent Loop**
API route accepts projectId (optional). Loads org memory + project memory (if project context provided). System prompt assembly includes project context layer.

**Session 3 — Chat UI**
Chat at org level and project level. Skill activation. Deliverable save prompt. Session decision capture panel (right sidebar, strategy mode).

**Session 4 — Intake + Project Creation**
New Project flow. Intake form. Intake processing (memory seeding + task generation). Project overview screen. Project navigation.

**Session 5 — Files + RAG**
File upload linked to project. RAG retrieval checks project files first, falls back to org files. Files page at org and project level.

**Session 6 — Tasks + Research**
Task board. Task detail with execution log. Research task runner (web search integration). Execution tracing (real-time log in UI).

**Session 7 — Deliverables Library**
Deliverables library page. Deliverable detail page. Version creation. Goal ancestry display. Discussion thread on deliverables. Skills auto-save.

**Session 8 — Sessions + Decisions**
Session record creation (from chat + from meetings). Decision capture in chat. Session detail page. Tasks auto-created from sessions.

**Session 9 — Auth + Admin**
Login flow. Admin panel with full org detail. SOUL.md editor. Skills library editor. Activity monitor.

**Session 10 — Voice (Vapi)**
Vapi interview + voice chat. Linked to project when initiated from project context. Findings feed into project session record.

**Session 11 — Meetings (Recall.ai)**
Recall.ai bot. Live meeting view (transcript + ask sidebar). Post-meeting extraction creates session record with decisions and tasks.

**Session 12 — Polish**
Performance, empty states, mobile, loading states, error states. The dashboard should be something you'd be proud to open in front of a CMO.
