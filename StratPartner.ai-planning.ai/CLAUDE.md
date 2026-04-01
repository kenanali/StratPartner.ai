# stratpartner.ai — Build Guide for Claude Code
**Read this file before every session. Then read the spec for the session you're working on.**

---

## What You're Building

An AI strategist platform for CX and digital transformation leaders. The agent behaves like a junior strategist: it takes research tasks, produces deliverables (journey maps, brand building blocks, competitive landscapes), joins meetings, conducts discovery interviews, and holds the institutional knowledge of an engagement permanently. The human strategist (Kenan) stays in the loop at decision points.

This is not a chatbot with bolted-on features. It is a project-based engagement tool where work is organised into tasks, tasks produce deliverables, and deliverables accumulate into a client's strategic record.

---

## Absolute Rules

1. **Org isolation is non-negotiable.** Every database query that touches client data must be scoped to `org_id`. Use Supabase Row Level Security (RLS). Test with two orgs after every data layer change.

2. **SOUL.md runs before everything.** The content of `lib/soul.ts` is prepended to every system prompt, every time, without exception. It is never summarised or shortened.

3. **Streaming, always.** All user-facing AI responses must stream. Never buffer the full response before sending. Use `ReadableStream`.

4. **Never expose API keys client-side.** Anthropic, OpenAI, Vapi, Recall.ai keys are server-only. The only key safe for the browser is `SUPABASE_ANON_KEY`.

5. **Deliverables are saved objects, not chat messages.** When a skill produces a significant output (journey map, persona, brand building blocks, etc.), it must be offered for saving as a `deliverable` record linked to the active project. Auto-save skills are defined in the skills inventory.

6. **Tasks carry goal ancestry.** Every task in the system must be traceable to: the project it belongs to, the phase it's in, and the session or intake that created it. This context travels with the task when the agent runs it.

7. **TypeScript strict mode.** No `any` types. No implicit `any`. `npm run build` must pass before any session is considered done.

---

## Design System

**stratpartner.ai uses the Paper design system from typeui.sh.**

Before writing any UI code in a session, run:

```bash
npx typeui.sh pull paper
```

This installs the Paper component library and its design tokens into the project. Do not skip this step — all UI must be built with Paper components, not custom CSS or ad-hoc Tailwind.

**Paper foundations (non-negotiable):**
- Typography: Roboto (body), Montserrat (display), PT Mono (code) — weights 100–900, scale 14/16/18/24/32/40
- Color tokens: `primary=#111111`, `secondary=#8B5CF6`, `success=#16A34A`, `warning=#D97706`, `danger=#DC2626`, `surface=#FFFFFF`, `text=#111827`
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32
- Visual character: minimal, clean, paper-textured, print-inspired

**Rules:**
- Always use Paper semantic tokens (e.g. `color-primary`, `spacing-4`) — never raw hex values or arbitrary Tailwind spacing in component code
- Every interactive component must implement all required states: default, hover, focus-visible, active, disabled, loading, error
- Accessibility standard: WCAG 2.2 AA, keyboard-first, visible focus states on all interactive elements
- Paper covers the full component range needed: buttons, inputs, forms, cards, tables, modals, drawers, navigation, sidebars, command palette, skeletons, toasts — use the library component before reaching for a custom one

**Available Paper component families:**
buttons · inputs · forms · selects/comboboxes · checkboxes/radios/switches · textareas · date/time pickers · file uploaders · cards · tables · data grids · charts · stats/metrics · badges/chips · avatars · breadcrumbs · pagination · steppers · modals · drawers/sheets · tooltips · popovers/menus · navigation · sidebars · top bars/headers · command palette · tabs · accordions · progress indicators · skeletons · alerts/toasts · notifications · search · empty states · onboarding · authentication screens · settings pages

**Session acceptance gate:** Run `npx typeui.sh pull paper` at the start of every UI session. If the design system is not installed, do not build UI — install it first.

---

## Repository Structure

```
stratpartner/
├── CLAUDE.md                    ← you are here
├── app/
│   ├── api/
│   │   ├── chat/route.ts        ← main agent loop, streaming
│   │   ├── upload/route.ts      ← file ingestion
│   │   ├── tasks/
│   │   │   ├── run/route.ts     ← research task execution
│   │   │   └── [id]/route.ts
│   │   ├── projects/route.ts
│   │   ├── intake/route.ts
│   │   ├── meetings/
│   │   │   ├── start/route.ts   ← Recall.ai bot deployment
│   │   │   └── webhook/route.ts ← Recall.ai events
│   │   ├── vapi/
│   │   │   ├── start/route.ts   ← initiate Vapi call
│   │   │   └── webhook/route.ts ← Vapi lifecycle events
│   │   └── orgs/route.ts
│   ├── chat/[orgSlug]/page.tsx
│   ├── dashboard/[orgSlug]/
│   │   ├── page.tsx             ← org home
│   │   ├── projects/
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx     ← project overview
│   │   │       ├── tasks/page.tsx
│   │   │       ├── chat/page.tsx
│   │   │       ├── sessions/page.tsx
│   │   │       └── deliverables/page.tsx
│   │   ├── documents/page.tsx
│   │   └── interviews/page.tsx
│   ├── admin/
│   │   ├── page.tsx             ← org list
│   │   └── orgs/[slug]/page.tsx ← org detail
│   └── login/page.tsx
├── lib/
│   ├── soul.ts                  ← SOUL.md as exported string
│   ├── skills.ts                ← all 18 skills as typed map
│   ├── ingest.ts                ← file parsing + chunking + embedding
│   ├── retrieve.ts              ← semantic search against file_chunks
│   ├── memory.ts                ← org memory + project memory helpers
│   ├── systemPrompt.ts          ← assembles full system prompt from parts
│   ├── detectSkill.ts           ← slash command + keyword detection
│   ├── parseDeliverable.ts      ← extracts ---DELIVERABLE--- markers
│   ├── webSearch.ts             ← Brave Search API wrapper
│   ├── meetingExtraction.ts     ← post-meeting intelligence extraction
│   ├── interviewExtraction.ts   ← post-interview findings extraction
│   ├── sessionExtraction.ts     ← post-session decisions + tasks
│   └── supabase.ts              ← typed Supabase client
├── components/
│   ├── ChatThread.tsx
│   ├── MessageBubble.tsx
│   ├── SkillBadge.tsx
│   ├── SourceCard.tsx
│   ├── DeliverableSavePrompt.tsx
│   ├── TaskCard.tsx
│   ├── DecisionPanel.tsx
│   ├── VoiceWidget.tsx
│   └── FileList.tsx
├── scripts/
│   └── seed-skills.ts           ← seeds all 18 skills into DB
└── middleware.ts                ← auth protection for /dashboard + /admin
```

---

## Environment Variables

```bash
# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=               # embeddings only

# Database + Auth
SUPABASE_URL=
SUPABASE_SERVICE_KEY=         # server-side only, never expose
SUPABASE_ANON_KEY=            # safe for browser

# Voice
VAPI_API_KEY=
VAPI_WEBHOOK_SECRET=
VAPI_INTERVIEW_ASSISTANT_ID=
VAPI_VOICE_ASSISTANT_ID=
ELEVENLABS_VOICE_ID=

# Meetings
RECALL_API_KEY=
RECALL_WEBHOOK_SECRET=

# Research
BRAVE_SEARCH_API_KEY=

# Admin
ADMIN_EMAIL=
NEXT_PUBLIC_URL=              # base URL for webhook registration
```

---

## Database Schema

The full schema is in `specs/phase-1-core-agent.md`. Run it once in the Supabase SQL editor. The schema covers:

- `orgs` — one per client engagement
- `memory` — org-level strategic memory (one row per org)
- `projects` — engagements within an org (multiple per org)
- `tasks` — research and deliverable tasks within a project
- `deliverables` — stored strategic outputs (versioned)
- `sessions` — strategy sessions (chat, meeting, or voice)
- `decisions` — structured decisions from sessions
- `intakes` — structured project onboarding responses
- `messages` — all chat messages across all channels
- `files` + `file_chunks` — uploaded documents + vector embeddings
- `skills` + `org_skills` — skills library + per-org activation
- `meetings` — Recall.ai meeting records
- `interviews` — Vapi interview records

---

## System Prompt Assembly

`lib/systemPrompt.ts` assembles prompts in this order. Order matters. Never change it without updating this file.

```
1. SOUL (always — full content of lib/soul.ts)
2. PROJECT CONTEXT (if projectId provided — project name, phase, goal, project memory)
3. ORG MEMORY (always — org-level strategic memory)
4. RAG CONTEXT (if retrieved chunks exist — labelled by source file)
5. ACTIVE SKILL (if skill detected — full SKILL.md injected for this turn only)
6. SKILLS INDEX (always — list of available skills with slug + description)
7. DELIVERABLE INSTRUCTION (if inside a project — the ---DELIVERABLE--- marker instruction)
```

---

## Skills System

**18 user-triggerable skills.** Full inventory and rationale in `specs/skills-inventory.md`. Full SKILL.md content for each in `skills/[slug]/SKILL.md`.

**Activation:** Slash command (`/journey-map`) OR keyword detection (`lib/detectSkill.ts`). The keyword map is defined in the Phase 1 spec.

**Auto-save skills** (prompt to save after generation):
`journey-map`, `persona-build`, `brand-building-blocks`, `brand-territories`, `biz-case`, `prioritize`, `positioning-framework`, `transformation-story`, `quarterly-review`, `competitive-landscape`, `voc-synthesis`, `retention-risk-scan`

**Do not auto-save** (exploratory — user iterates before saving):
`trend-scan`, `scan-blockers`, `synthesize`, `biz-context`, `service-map`, `brand-voice-analysis`

**Deliverable marker:** At the end of every auto-save skill output, the agent appends:
```
---DELIVERABLE---
Title: [descriptive title]
---
```
`lib/parseDeliverable.ts` extracts this marker, saves the deliverable to the DB, and strips the marker before displaying to the user.

---

## The Engagement Workflow

This is the core product loop. Understand it before building any screen.

```
1. INTAKE
   Client creates a project → fills intake form → system generates:
   - Project memory seed
   - 3-5 suggested research tasks
   - Recommended deliverable sequence

2. RESEARCH PHASE
   Research tasks run → agent uses web search + RAG →
   produces research briefs as deliverables →
   project memory updates after each task

3. STRATEGY SESSION
   Chat session (or Zoom meeting) → agent captures decisions →
   decisions auto-create follow-on tasks →
   session saved as Session record with decisions array

4. DELIVERY PHASE
   Deliverable tasks run → skills produce named outputs →
   outputs saved as versioned Deliverables →
   client reviews, revises via discussion thread or new version

5. REVIEW
   Quarterly Review skill produces leadership narrative →
   drawing on all project memory, deliverables, and session records
```

---

## The Skills Files

Kstack skills (Kenan's originals — copy content from https://github.com/kenanali/Kstack):
`journey-map`, `persona-build`, `service-map`, `scan-blockers`, `synthesize`, `biz-context`, `trend-scan`, `biz-case`, `prioritize`, `brand-building-blocks`, `brand-territories`

Adapted skills (written fresh for stratpartner — content in `skills/[slug]/SKILL.md`):
`voc-synthesis`, `brand-voice-analysis`, `competitive-landscape`, `retention-risk-scan`, `quarterly-review`, `positioning-framework`, `transformation-story`

When seeding, load Kstack content by fetching each SKILL.md from the Kstack repo. Load adapted skills from the local `skills/` directory.

---

## Spec Files — Reading Order for Claude Code

Read these before the relevant session. Do not read all of them at once.

| Session(s) | Read first |
|------------|-----------|
| Session 0 | This file (CLAUDE.md) |
| Sessions 1–2 | `specs/phase-1-core-agent.md` — Foundation + Agent Loop sections |
| Session 3 | `specs/phase-1-core-agent.md` — Chat Interface section + `specs/mvp-requirements.md` — Flow 5 (Deliverable from Chat) |
| Session 4 | `specs/engagement-model.md` — Intake + Project Creation + `specs/mvp-requirements.md` — Flows 2, 3 |
| Sessions 5–6 | `specs/phase-1-core-agent.md` — Skills + Auth sections + `specs/skills-inventory.md` |
| Sessions 7–8 | `specs/phase-2-voice.md` + `specs/mvp-requirements.md` — Flows 8 |
| Sessions 9–11 | `specs/phase-3-meetings.md` + `specs/mvp-requirements.md` — Flow 7 |
| Session 12 | `specs/phase-3-meetings.md` — Session 12 Polish section + `specs/mvp-requirements.md` — Section 8 (Non-functional) |

For the engagement model (tasks, deliverables, sessions, decisions), always read `specs/engagement-model.md` and `specs/mvp-requirements.md` together.

---

## Acceptance Criteria (Every Session)

Before closing a session:
- [ ] `npm run build` passes with no TypeScript errors
- [ ] No API keys in client-side code (grep for key names if unsure)
- [ ] Two orgs created and tested for data isolation
- [ ] The feature just built has been tested end-to-end with real input (not synthetic test data)
- [ ] Error states tested (what happens when Anthropic is slow? When a file is corrupt? When a meeting URL is invalid?)

---

## What This Is Not

- Not a chatbot. The chat interface is one surface within a project-based engagement tool.
- Not a note-taker. Everything the agent learns is structured and queryable.
- Not a generic AI assistant. SOUL.md makes it think like a senior CX strategist. The skills make it execute like one.
- Not autonomous. The agent does research and produces drafts. Kenan and the client make decisions.
