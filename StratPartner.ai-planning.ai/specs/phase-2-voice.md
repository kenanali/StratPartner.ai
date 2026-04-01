# stratpartner.ai — Phase 2 Build Spec
## Voice Interface: Discovery Interviews + Live Voice Chat
**Sessions 7–8. Build after Phase 1 is fully live and you have your first client.**

---

## What You're Building

Two distinct voice modes that share the same Vapi infrastructure but serve different purposes:

**Mode 1 — Discovery Interview:** The agent conducts a structured, autonomous interview with a stakeholder. It asks questions, probes on answers, handles evasiveness, and synthesises findings at the end. No human needed. Triggered from the dashboard.

**Mode 2 — Voice Chat:** The client speaks to stratpartner.ai in real-time. Same brain as the web chat — SOUL, memory, skills, files — but voice-first. Useful when typing feels too slow or when the client is walking, driving, or thinking out loud.

---

## Tech Stack for Voice

| Component | Tool | Purpose |
|-----------|------|---------|
| STT + orchestration | Vapi | Manages WebRTC call, speech-to-text, turn-taking |
| Voice LLM | Anthropic Claude Sonnet (via your Anthropic key, configured in Vapi) | The brain — same model as web chat |
| TTS | ElevenLabs | Branded voice — consistent, premium |
| Webhook receiver | Next.js `/api/vapi/webhook` | Handles Vapi lifecycle events |

---

## Vapi Setup (Dashboard Configuration)

Create two Vapi assistants in the Vapi dashboard. These are configured once and referenced by ID in the codebase.

### Assistant 1: stratpartner Interview

- **Name:** stratpartner Interview
- **Model:** Claude Sonnet — provide your Anthropic API key
- **Voice:** ElevenLabs — your chosen voice ID (consistent across both assistants)
- **System prompt:** Interview framework (see Session 8) + SOUL + org memory (injected via webhook on call-start)
- **First message:** `"Hi, I'm stratpartner — a strategic AI working with [org name]. I'm here to ask you some questions about your CX program. This should take about 20 minutes. Before we start, can you tell me your name and your role?"`
- **End call phrases:** ["that's all my questions", "thanks, that's everything I need", "let's end here"]
- **Max call duration:** 30 minutes

### Assistant 2: stratpartner Voice

- **Name:** stratpartner Voice
- **Model:** Claude Sonnet
- **Voice:** Same ElevenLabs voice ID
- **System prompt:** SOUL + org memory + active skills index (injected on call-start)
- **First message:** `"Hi. I'm ready when you are."`
- **End call phrases:** ["goodbye", "thanks, bye", "end call"]
- **Max call duration:** 60 minutes

---

## Session 7 — Vapi Integration

**Goal:** Both voice modes live in the browser. Calls connect, transcripts save, memory updates.

### Environment Variables (add to .env.local)

```
VAPI_API_KEY=
VAPI_WEBHOOK_SECRET=         ← set in Vapi dashboard, verify in webhook
VAPI_INTERVIEW_ASSISTANT_ID= ← from Vapi dashboard after creating Assistant 1
VAPI_VOICE_ASSISTANT_ID=     ← from Vapi dashboard after creating Assistant 2
ELEVENLABS_VOICE_ID=         ← the voice ID you've chosen
```

### Webhook: POST /api/vapi/webhook

Vapi calls this URL on these events. Verify the request signature first using `VAPI_WEBHOOK_SECRET`.

**call-start:**
- Extract `orgId` from `call.metadata.orgId` (passed when initiating the call)
- Load org memory from Supabase
- Call Vapi API to update the assistant's system prompt mid-call with injected memory:
  ```
  SOUL + memory content + (interview framework if interview mode)
  ```
- Return 200

**transcript (partial):**
- These arrive frequently during the call with partial transcript text
- Append to a temporary in-memory store (Redis or Supabase realtime — see note below)
- Return 200

**call-end:**
- Full transcript arrives in the payload
- Determine mode (interview or voice) from `call.assistantId`
- **If interview mode:**
  - Save transcript to `interviews` table
  - Run interview extraction (see below)
- **If voice mode:**
  - Save messages to `messages` table (role: 'user' and 'assistant', channel: 'voice')
  - Run memory extraction (same as web chat)
- Return 200

> **Note on live transcript streaming:** For Phase 2, don't bother with real-time transcript display in the browser. Save the full transcript on call-end. Live display is a Phase 3 nice-to-have.

### API: POST /api/vapi/start

Initiates a Vapi call from the browser.

**Request body:**
```typescript
{
  orgId: string
  mode: 'interview' | 'voice'
}
```

**Processing:**
1. Validate org exists
2. Choose assistant ID based on mode
3. Call Vapi API to create a web call:
   ```typescript
   POST https://api.vapi.ai/call/web
   {
     "assistantId": assistantId,
     "metadata": { "orgId": orgId, "mode": mode }
   }
   ```
4. Return `{ callId, token }` — the token is used by the Vapi web SDK to connect

**Response:**
```typescript
{
  callId: string
  token: string
}
```

### Frontend: Vapi Web SDK

Install: `npm install @vapi-ai/web`

**VoiceWidget component** (`components/VoiceWidget.tsx`):

States the component manages:
- `idle` — call not started
- `connecting` — call being initiated
- `active` — call in progress
- `ending` — hang-up in progress
- `processing` — call ended, extraction running
- `done` — complete

```
┌──────────────────────────────────────┐
│                                      │
│  [mode: Interview | Voice Chat]      │
│                                      │
│     ┌──────────────────────┐         │
│     │  🎙️  stratpartner    │         │
│     │    is listening...   │         │
│     └──────────────────────┘         │
│                                      │
│     [──── audio level bar ────]      │
│                                      │
│     [ End Call ]                     │
│                                      │
│  Live transcript will appear here    │
│  after the call ends.                │
│                                      │
└──────────────────────────────────────┘
```

- Audio level bar: visualise microphone input during the call using Web Audio API
- On call-end: poll `/api/vapi/status/[callId]` every 3 seconds until processing is complete, then show summary

### Interview Summary Display

After an interview call ends and extraction is complete, show:

```
┌──────────────────────────────────────────────────┐
│ Interview Complete                               │
│ 24 minutes · 847 words                          │
├──────────────────────────────────────────────────┤
│ KEY FINDINGS                                     │
│ • [extracted finding 1]                          │
│ • [extracted finding 2]                          │
│ • [extracted finding 3]                          │
├──────────────────────────────────────────────────┤
│ TENSIONS IDENTIFIED                              │
│ • [tension 1]                                    │
│ • [tension 2]                                    │
├──────────────────────────────────────────────────┤
│ WHAT STRATPARTNER NOW KNOWS                      │
│ [3-4 sentences added to org memory]              │
├──────────────────────────────────────────────────┤
│ [View Full Transcript]  [Start Another Interview]│
└──────────────────────────────────────────────────┘
```

### Dashboard Integration

Add to the client dashboard sidebar:

```
• Interviews
```

On the Interviews page (`/dashboard/[orgSlug]/interviews`):

- "Start Interview" button → opens VoiceWidget in interview mode
- "Start Voice Chat" button → opens VoiceWidget in voice mode
- Table of past interviews: Date | Duration | Status | Findings summary | [View]
- Interview detail: full transcript + extracted findings

### Acceptance Criteria
- [ ] Clicking "Start Interview" initiates a Vapi call in the browser
- [ ] The call connects and the assistant speaks the first message
- [ ] Call ends cleanly when end phrase is spoken or button clicked
- [ ] Transcript is saved to `interviews` table in Supabase
- [ ] Memory is updated after call-end
- [ ] Org isolation: voice calls can only update memory for the org they were initiated from
- [ ] Call fails gracefully if microphone permission denied (show error, not crash)

---

## Session 8 — Interview Framework

**Goal:** The interview agent conducts a real discovery interview, not a chat. It knows when to probe, when to move on, how to surface tensions.

### The Interview Skill

This is a SKILL.md equivalent for the voice interview. It becomes part of the Vapi Interview assistant's system prompt.

Write this as a framework with judgment, not a script. Structure:

```
INTERVIEW FRAMEWORK: CX Discovery

PURPOSE
You are conducting a structured discovery interview to understand the organisation's CX program maturity, key blockers, stakeholder dynamics, and strategic context. You will synthesise findings at the end into a findings summary that updates the organisation's strategic memory.

OPENING (5 min)
...

PROGRAM MATURITY (10 min)
Questions to explore:
- Where would you place your CX program on a maturity scale from 1-5?
- What does your measurement framework look like today?
- How does the leadership team talk about customer experience?

Probe when: the answer is vague, contradicts earlier answers, or sounds like aspiration rather than current reality.
Move on when: you have a clear picture of current state and have captured one specific example.

BLOCKERS (5 min)
...

STAKEHOLDER DYNAMICS (5 min)
...

SYNTHESIS (5 min)
When all topics are covered, say: "Let me reflect back what I've heard and tell you what I think is most important..."
Deliver a 3-4 sentence synthesis. Then ask: "Does that feel accurate? Is there anything I'm missing?"

END
"That's all my questions. Thank you. I'll be sharing a summary with [org contact] shortly."
```

### Interview Extraction (lib/interviewExtraction.ts)

```typescript
export async function extractInterviewFindings(
  transcript: string,
  orgMemory: string,
  orgId: string
): Promise<{ findings: string; tensionsIdentified: string[]; memoryUpdate: string }> {

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are analysing a CX discovery interview transcript.

Current org memory:
${orgMemory}

Interview transcript:
${transcript}

Extract:
1. KEY FINDINGS: 3-5 bullet points of the most strategically important things learned
2. TENSIONS: 2-3 contradictions or conflicts in what was said (e.g., "says CX is a priority but has no measurement framework")
3. MEMORY UPDATE: 4-6 sentences to add to or update the org's strategic memory — focus on new information not already captured

Format your response as JSON:
{
  "findings": ["finding 1", "finding 2", ...],
  "tensions": ["tension 1", "tension 2", ...],
  "memoryAddition": "prose sentences to add to memory"
}`
    }]
  })

  const parsed = JSON.parse(response.content[0].text)

  // Update memory
  await supabase.from('memory')
    .upsert({
      org_id: orgId,
      content: orgMemory + '\n\n' + parsed.memoryAddition,
      updated_at: new Date().toISOString()
    }, { onConflict: 'org_id' })

  return {
    findings: parsed.findings.join('\n'),
    tensionsIdentified: parsed.tensions,
    memoryUpdate: parsed.memoryAddition
  }
}
```

### Acceptance Criteria
- [ ] Interview agent asks opening question, probes appropriately, and synthesises at the end
- [ ] When given an evasive or vague answer, the agent probes specifically ("You mentioned maturity — can you give me a concrete example of what that looks like today?")
- [ ] Interview extraction produces findings, tensions, and memory update
- [ ] Memory update appears in the org's memory record in Supabase
- [ ] Running `/synthesize` in web chat after an interview draws on the interview findings
- [ ] Interview findings are visible in the dashboard interview history

---

## Voice in Zoom (Deferred — Phase 3+)

Having stratpartner in a Zoom call as a participant is a separate capability that requires Recall.ai and is covered in Phase 3. The voice interface built in Phase 2 is browser-only.

The eventual Zoom voice capability works differently: the bot joins the meeting, listens to all participants via Recall.ai, and the client can type questions in a sidebar while on the call. Live voice-in-meeting (where the bot speaks into Zoom) is technically possible via Recall.ai's output audio feature but complex — defer until Phase 3 is stable and a client is asking for it specifically.
