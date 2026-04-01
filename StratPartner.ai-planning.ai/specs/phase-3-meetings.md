# stratpartner.ai — Phase 3 Build Spec
## Meetings: Recall.ai + Post-Meeting Intelligence + Live Context
**Sessions 9–11. Build after Phase 2 is live.**

---

## What You're Building

stratpartner joins your client's Zoom meetings as a participant. It listens to everything, transcribes in real-time, and — when the meeting ends — automatically extracts decisions made, new strategic context, and updates its memory. During the meeting, the client can ask it questions in a sidebar and it answers using both the live transcript and all existing memory.

This is the feature that makes the "never reset between sessions" promise real.

---

## Prerequisites

- Recall.ai account + API key
- Zoom app registered following Recall.ai's guide (15 minutes — do this before Session 9)
- Google Meet support is automatic — no extra setup needed

---

## Environment Variables (add)

```
RECALL_API_KEY=
RECALL_WEBHOOK_SECRET=
```

---

## Database Additions

```sql
create table meetings (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid references orgs(id) on delete cascade,
  recall_bot_id text unique,
  meeting_url   text,
  title         text,
  status        text default 'pending',   -- 'pending' | 'joining' | 'active' | 'processing' | 'complete' | 'failed'
  transcript    text default '',          -- accumulated live transcript
  summary       text,                     -- generated post-meeting
  findings      jsonb,                    -- structured extraction results
  started_at    timestamptz,
  ended_at      timestamptz,
  created_at    timestamptz default now()
);
```

---

## Session 9 — Recall.ai Integration

**Goal:** Paste a meeting URL, bot joins, transcript accumulates in Supabase.

### POST /api/meetings/start

**Request body:**
```typescript
{
  orgId: string
  meetingUrl: string
  title?: string
}
```

**Processing:**
1. Validate org exists
2. Create meeting record in Supabase with status 'pending'
3. Call Recall.ai API to deploy a bot:
   ```typescript
   POST https://us-west-2.recall.ai/api/v1/bot
   {
     "meeting_url": meetingUrl,
     "bot_name": `${orgName} · stratpartner`,
     "transcription_options": { "provider": "assembly_ai" },
     "webhook": {
       "url": `${NEXT_PUBLIC_URL}/api/meetings/webhook`,
       "events": ["bot.status_change", "transcript.data"]
     },
     "metadata": {
       "orgId": orgId,
       "meetingId": meetingRecord.id
     }
   }
   ```
4. Save `recall_bot_id` to meeting record, update status to 'joining'
5. Return `{ meetingId }`

### POST /api/meetings/webhook

Recall.ai calls this on meeting events. Verify signature first.

**bot.status_change:**
```typescript
switch (event.data.status.code) {
  case 'joining_call':
    updateMeeting(meetingId, { status: 'joining' })
    break
  case 'in_call_transcribing':
    updateMeeting(meetingId, { status: 'active', started_at: new Date() })
    break
  case 'done':
    updateMeeting(meetingId, { status: 'processing', ended_at: new Date() })
    triggerPostMeetingExtraction(meetingId)  // async, don't await
    break
  case 'call_ended':
    // Meeting ended before bot could transcribe — mark accordingly
    updateMeeting(meetingId, { status: 'failed' })
    break
}
```

**transcript.data:**
```typescript
// Append speaker + text to transcript
const line = `${event.data.words[0].speaker}: ${event.data.words.map(w => w.text).join(' ')}`
supabase.from('meetings')
  .update({ transcript: supabase.raw(`transcript || '\n' || ?`, [line]) })
  .eq('id', meetingId)
```

### Meetings Page in Dashboard

Route: `/dashboard/[orgSlug]/meetings`

```
┌────────────────────────────────────────────────────────────────┐
│ Meetings                                    [+ Join a Meeting] │
├────────────────────────────────────────────────────────────────┤
│ Past Meetings                                                  │
│                                                                │
│ Q1 Leadership Review          Mar 28, 2025   54 min  [View]   │
│ CX Roadmap Working Session    Mar 21, 2025   38 min  [View]   │
│ Stakeholder Briefing          Mar 14, 2025   22 min  [View]   │
└────────────────────────────────────────────────────────────────┘
```

"Join a Meeting" opens a modal:
```
┌────────────────────────────────────────┐
│ Join a Meeting                         │
│                                        │
│ Meeting title (optional)               │
│ [_________________________________]    │
│                                        │
│ Zoom or Google Meet link               │
│ [_________________________________]    │
│                                        │
│                     [ Cancel ]  [ Join]│
└────────────────────────────────────────┘
```

After clicking Join:
- Show "stratpartner is joining the meeting..." with a spinner
- Poll `/api/meetings/status/[meetingId]` every 5 seconds
- Once status = 'active': show the Live Meeting View (see Session 11)

### Acceptance Criteria
- [ ] Pasting a Zoom link deploys a Recall.ai bot
- [ ] Bot appears as a participant in the Zoom call
- [ ] Transcript accumulates in Supabase during the call
- [ ] Meeting status updates correctly through the lifecycle
- [ ] Past meetings appear in the dashboard table
- [ ] Bot handles a call that ends before it joins (status: 'failed', no crash)

---

## Session 10 — Post-Meeting Intelligence

**Goal:** After every meeting, stratpartner automatically extracts decisions, updates memory, and sends the client a summary.

### lib/meetingExtraction.ts

```typescript
export async function extractMeetingIntelligence(
  meetingId: string,
  orgId: string
): Promise<void> {

  // Load transcript + current memory
  const meeting = await getMeeting(meetingId)
  const memory = await getOrgMemory(orgId)

  if (!meeting.transcript || meeting.transcript.length < 100) {
    await updateMeeting(meetingId, {
      status: 'complete',
      summary: 'Meeting was too short to extract meaningful content.'
    })
    return
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `You are analysing a meeting transcript for a CX transformation program.

Current strategic memory for this organisation:
${memory.content}

Meeting transcript:
${meeting.transcript}

Extract the following. Be specific and direct — do not pad with generic statements.

Return as JSON:
{
  "summary": "3-5 sentence executive summary of what happened in this meeting",
  "decisions": ["decision 1", "decision 2", ...],
  "newContext": ["new piece of strategic context learned 1", ...],
  "openQuestions": ["question raised but not resolved 1", ...],
  "memoryUpdate": "prose paragraph(s) to append to strategic memory — only genuinely new information"
}`
    }]
  })

  const extracted = JSON.parse(response.content[0].text)

  // Update memory
  if (extracted.memoryUpdate) {
    await supabase.from('memory')
      .upsert({
        org_id: orgId,
        content: memory.content + '\n\n' + extracted.memoryUpdate,
        updated_at: new Date().toISOString()
      }, { onConflict: 'org_id' })
  }

  // Save findings to meeting record
  await updateMeeting(meetingId, {
    status: 'complete',
    summary: extracted.summary,
    findings: extracted
  })
}
```

### Meeting Detail View (`/dashboard/[orgSlug]/meetings/[meetingId]`)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Q1 Leadership Review                    Mar 28, 2025 · 54 min       │
├───────────────────────────────────────┬─────────────────────────────┤
│ SUMMARY                               │ WHAT STRATPARTNER LEARNED   │
│                                       │                             │
│ [3-5 sentence meeting summary]        │ Decisions made:             │
│                                       │ • [decision 1]              │
│                                       │ • [decision 2]              │
│                                       │                             │
│                                       │ New context:                │
│                                       │ • [context 1]               │
│                                       │                             │
│                                       │ Open questions:             │
│                                       │ • [question 1]              │
├───────────────────────────────────────┴─────────────────────────────┤
│ FULL TRANSCRIPT                                            [Expand ▼]│
│ [collapsible, scrollable transcript with speaker labels]            │
└─────────────────────────────────────────────────────────────────────┘
```

### Acceptance Criteria
- [ ] Within 2 minutes of meeting end, summary and findings appear in Supabase
- [ ] Memory is updated with genuinely new information (test with a real meeting)
- [ ] "Open questions" only contains things that were actually unresolved
- [ ] Meeting detail page renders all four sections
- [ ] Very short meetings (<3 min) are handled gracefully with a "too short" message
- [ ] Extraction doesn't fail if transcript contains speaker labels or overlapping speech

---

## Session 11 — Live Meeting Context

**Goal:** During an active meeting, the client can ask stratpartner questions in a sidebar and get answers that combine live transcript + all existing memory.

### Live Meeting View

Shown when a meeting is active (status = 'active'). The client keeps this tab open in a browser while the Zoom meeting is happening in a separate window.

```
┌─────────────────────────────────────────────────────────────────┐
│ ● LIVE  Q1 Leadership Review                      [End Session] │
├────────────────────────────────┬────────────────────────────────┤
│ LIVE TRANSCRIPT                │ ASK STRATPARTNER               │
│                                │                                │
│ Sarah: We need to decide on    │ [chat thread — questions +     │
│   the measurement framework    │  answers appear here]          │
│   before end of Q1.            │                                │
│                                │                                │
│ Marcus: Agreed, but I think    │                                │
│   we need alignment from       │                                │
│   the board first.             │                                │
│                                │                                │
│ Sarah: The NPS baseline is     │                                │
│   still unclear to me.         │                                │
│                                │                                │
│ [transcript auto-scrolls]      │                                │
│                                │ [What have we decided so far?] │
└────────────────────────────────┴────────────────────────────────┘
```

### Live Transcript Panel

- Poll `/api/meetings/transcript/[meetingId]` every 5 seconds
- Append new lines with speaker name in a muted colour
- Auto-scroll to bottom
- Speaker names come from Recall.ai's transcript data

### Live Chat

Questions in the sidebar hit a modified version of `/api/chat`:

**POST /api/meetings/ask**
```typescript
{
  orgId: string
  meetingId: string
  message: string
}
```

System prompt for live meeting context:
```
[SOUL]

[MEMORY]
{org memory}
[/MEMORY]

[LIVE MEETING TRANSCRIPT — IN PROGRESS]
This meeting is currently happening. The transcript below is live — use it to answer questions about what's been said, decided, or raised in this meeting.

{current meeting transcript}
[/LIVE MEETING TRANSCRIPT]

[AVAILABLE SKILLS]
{skills index}
[/AVAILABLE SKILLS]
```

This means when the client asks "What have we decided so far?" — stratpartner answers from both the live transcript AND all historical memory. When they ask "What's our NPS baseline?" — it checks uploaded files and memory.

### Acceptance Criteria
- [ ] Live transcript panel updates every 5 seconds during an active call
- [ ] Asking "What have we decided so far?" returns a summary of decisions from the current meeting
- [ ] Asking "What's our approach to X?" draws on both live transcript and memory
- [ ] "End Session" button stops the bot and triggers post-meeting extraction
- [ ] The sidebar works without breaking the Zoom call (no audio/video interference — it's browser-only)
- [ ] Polling stops cleanly when meeting ends

---

## Session 12 — Dashboard Polish

**Goal:** A dashboard you'd be proud to demo to a CMO.

### Design Principles
- Dark sidebar (#0f1117), light content area (#ffffff)
- Primary accent: a deep indigo (#4f46e5) — not pure blue
- Typography: Inter (available via Google Fonts or next/font)
- No gradients. No shadows that look like 2014.
- Empty states are helpful, not apologetic

### Dashboard Home Redesign (`/dashboard/[orgSlug]`)

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR                        │ MAIN CONTENT                    │
│ (dark, 260px)                  │                                 │
│                                │ Good morning, [first name].     │
│ [logo]                         │                                 │
│                                │ ┌────────────────────────────┐  │
│ ─────────────                  │ │ WHAT I KNOW                │  │
│ Acme Co.                       │ │                            │  │
│ Agent tier                     │ │ [3 most recent memory      │  │
│                                │ │  entries as sentences]     │  │
│ ─────────────                  │ └────────────────────────────┘  │
│ ○ Home                         │                                 │
│ ○ Chat                         │ RECENT ACTIVITY                 │
│ ○ Files                        │                                 │
│ ○ Interviews                   │ Today                           │
│ ○ Meetings                     │ 🗨  Asked about Q2 roadmap      │
│                                │ 📄  Uploaded Stakeholder.docx   │
│ ─────────────                  │                                 │
│ [avatar] kenan@...             │ Yesterday                       │
│                                │ 🗨  Ran Journey Map framework   │
│                                │ 🎙  Completed discovery call    │
│                                │                                 │
│                                │ ┌──────────────────────────────┐│
│                                │ │ [ Start Chat ]               ││
│                                │ │ [ Upload Document ]          ││
│                                │ │ [ Start Interview ]          ││
│                                │ └──────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Loading + Empty States

Every panel needs a loading state (skeleton loaders, not spinners) and an empty state:

- **Memory — empty:** "stratpartner hasn't learned anything about your organisation yet. Start a conversation or upload a document to begin."
- **Activity — empty:** "No activity yet. Try starting a chat or uploading a research document."
- **Files — empty:** "No documents uploaded. Upload a PDF or Word doc to give stratpartner context about your organisation."
- **Meetings — empty:** "No meetings joined yet. Paste a Zoom or Google Meet link to have stratpartner join your next meeting."
- **Interviews — empty:** "No interviews completed yet. Start a discovery interview to capture stakeholder perspectives."

### Acceptance Criteria
- [ ] Dashboard loads within 2 seconds on a real network
- [ ] All five navigation items work and are correctly active-highlighted
- [ ] Memory snippet shows on dashboard home (truncated to 3 sentences)
- [ ] Activity feed correctly shows last 5 items across all channels (chat, voice, meetings)
- [ ] All three quick action buttons work
- [ ] Every panel has a proper empty state (no blank white boxes)
- [ ] Layout is correct on mobile (sidebar collapses)
- [ ] Design looks premium enough to demo to a CMO without apology
