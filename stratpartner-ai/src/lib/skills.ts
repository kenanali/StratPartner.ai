export interface Skill {
  slug: string
  name: string
  description: string
  track: 'cx' | 'brand' | 'research'
  content: string
  autoSave: boolean
  triggers: string[]
}

export const SKILLS: Record<string, Skill> = {
  'journey-map': {
    slug: 'journey-map',
    name: 'Journey Map',
    description: 'Map a customer journey moment-by-moment with emotional truth, pain points, and opportunity areas.',
    track: 'cx',
    autoSave: true,
    triggers: ['journey map', 'customer journey', 'map the journey', 'touchpoints', 'experience map', 'map the experience'],
    content: `# Journey Map

I build stage-by-stage journey maps that capture what customers actually experience — their emotions, unmet needs, friction points, and moments that determine loyalty. Not process diagrams. Not sanitized flows. Real journeys, grounded in research.

Every map includes:
- **5–8 lifecycle stages** (broader than just the transaction)
- **Emotion scores** (1–5) justified by evidence, not defaulted to neutral
- **User needs** quoted from research and anchored to sources
- **Specific problems** per stage (friction, absence, failure)
- **HMW opportunities** tagged by innovation vector
- **Moments of Truth** — the touchpoints that determine the relationship

## To Build the Map, I Need:
1. Who is the persona? (describe them or reference prior persona work)
2. What triggers the journey? (the starting moment)
3. Where does it end? (what does resolution look like?)
4. Linear or cyclical? (one-time transaction, or does it repeat?)
5. What research do you have? (interview transcripts, complaint data, call notes, surveys)

## Output Format

\`\`\`markdown
## Journey Map: [Persona] — [Journey Name]
*stratpartner.ai · [Date]*

---

### Stage 1: [Stage Name]
**Emotion score:** [1-5] — [justification]
**What they're doing:** [actions]
**What they need:** [needs, quoted from research where possible]
**What's failing:** [friction points, gaps, failures]
**HMW:** [one or two opportunity questions]

[repeat for each stage]

---

### Moments of Truth
[The 2-3 touchpoints that make or break the relationship]

---

### Cross-Cutting Themes
[Patterns that appear across multiple stages]

---

*What I now know:*
- [New strategic intelligence 1]
- [New strategic intelligence 2]
- [New strategic intelligence 3]

*Suggested next step:* [concrete recommendation]
\`\`\`

Do not start mapping without confirming persona and scope. Do not default emotion scores to neutral without justification. Do not skip the lifecycle view and hide inside the purchase funnel.`,
  },

  'persona-build': {
    slug: 'persona-build',
    name: 'Persona Build',
    description: 'Build a research-grounded customer persona using Jobs-to-be-Done and emotional driver mapping.',
    track: 'research',
    autoSave: true,
    triggers: ['persona', 'who is the customer', 'customer profile', 'build a persona', 'customer segment', 'who are we designing for'],
    content: `# Persona Build

I build research-grounded customer personas using Jobs-to-be-Done, emotional driver mapping, and decision architecture. Every claim is tagged as [EVIDENCED], [INFERRED], or [ASSUMED] — assumptions don't get treated as facts.

## What I Need:
1. **Who is this persona?** — customer segment, role, or type
2. **Learning Agenda** — 3-5 specific questions this persona must answer
3. **Research inputs** — interviews, VOC data, survey verbatims, complaint themes, CRM behavioural data

Even 3-5 customer conversations are enough. Without research, every claim becomes [ASSUMED].

## Output Format

\`\`\`markdown
## Persona: [Name], [Role/Segment]
*stratpartner.ai · [Date]*

---

### Who They Are
[Demographic and contextual profile — professional role, company type, career stage]

### Jobs to Be Done
**Functional job:** [What they're trying to accomplish]
**Emotional job:** [How they want to feel]
**Social job:** [How they want to be perceived]

### Trigger Events
[What life or work events cause them to seek a solution]

### Decision Factors
[What they evaluate when choosing — ordered by importance]

### Anxieties and Blockers
[What prevents them from moving forward]

### Unmet Needs
[What they need that isn't being served — evidenced from research]

### In Their Own Words
[2-3 verbatim quotes that capture their world view]

---

*Claim tags: [EVIDENCED] = from research | [INFERRED] = reasonable inference | [ASSUMED] = needs validation*

*What I now know:*
- [New strategic intelligence 1]
- [New strategic intelligence 2]

*Suggested next step:* [recommendation]
\`\`\``,
  },

  'trend-scan': {
    slug: 'trend-scan',
    name: 'Trend Scan',
    description: "Identify the 5-8 macro forces most relevant to a company's CX challenge, scored for disruption potential.",
    track: 'cx',
    autoSave: false,
    triggers: ['trend', 'macro', 'pestle', 'forces', "what's shaping", 'macro forces', 'external environment', 'scan the trends'],
    content: `# Trend Scan

I scan the macro forces shaping a CX challenge and surface the 5-8 most relevant, high-impact signals — not generic trends, but specific forces with named mechanisms of impact on this business.

## Context I Need:
1. **Organisation and industry** — what company, what sector?
2. **The CX challenge** — what specific problem is this scan meant to inform?
3. **Timeframe** — near-term (1-3yr), mid-term (3-5yr), or long-term (5-10yr)?
4. **Known forces** — any trends you're already tracking that I should definitely cover?
5. **Evidence available** — analyst reports, competitor intelligence, customer research, search trend data?

## Output Format

\`\`\`markdown
## Trend Scan: [Organisation] — [CX Challenge]
*stratpartner.ai · [Date]*

---

### Force 1: [Force Name]
**Signal:** [Specific evidence this force is active]
**Mechanism of impact:** [How this specifically affects [org]'s CX]
**Disruption potential:** [High / Medium / Low] — [justification]
**Timeframe:** [When this hits hardest]
**What to watch:** [Specific indicators or actors to monitor]

[repeat for 5-8 forces]

---

### Synthesis: The Strategic Environment
[2-3 paragraphs: what does this force map mean for the CX agenda?]

### The Two Forces That Matter Most
[Which 1-2 forces are most consequential and why]

---

*What I now know:*
- [Strategic intelligence 1]
- [Strategic intelligence 2]
- [Strategic intelligence 3]

*Suggested next step:* [recommendation]
\`\`\`

Mark web-sourced data clearly. Flag when forces interact or amplify each other. The synthesis section is where the value is — don't skip it.`,
  },

  'scan-blockers': {
    slug: 'scan-blockers',
    name: 'Scan Blockers',
    description: "Map internal and external blockers preventing CX improvement, with severity and addressability ratings.",
    track: 'cx',
    autoSave: false,
    triggers: ['blockers', "what's in the way", 'obstacles', "why isn't this working", 'barriers', 'what is stopping us', 'why is progress slow', 'impediments'],
    content: `# Scan Blockers

I systematically identify and map the blockers preventing CX improvement — organizational, operational, political, structural, and capability-based. The output is a blocker map with severity ratings, root causes, and addressability scores.

## Context I Need:
1. **Organisation and industry**
2. **CX outcome under pressure** — what specific improvements are stalling?
3. **Programme timeline and history** — what has been tried before and what stopped it?
4. **Known suspects** — your hypothesis about the main blockers?
5. **Evidence** — stakeholder notes, post-mortems, org charts, complaint data, process docs (anything)

## Output Format

\`\`\`markdown
## Blocker Map: [Organisation] — [CX Programme / Initiative]
*stratpartner.ai · [Date]*

---

### Blocker 1: [Blocker Name]
**Type:** [Structural / Political / Capability / Process / Resource / Cultural]
**Description:** [What the blocker is and how it manifests]
**Root cause:** [Why this blocker exists]
**Severity:** [Critical / High / Medium / Low]
**Addressability:** [High = can be fixed with current authority / Medium = needs executive sponsorship / Low = structural — hard to change]
**Evidence:** [What signals confirm this is real]

[repeat for all blockers]

---

### Blocker Patterns
[Are blockers concentrated in a particular part of the organisation? Do they share a root cause?]

### The Highest-Leverage Fix
[If you could address one blocker, which would unlock the most other blockers?]

---

*What I now know:*
- [Organisational intelligence 1]
- [Organisational intelligence 2]

*Suggested next step:* [recommendation]
\`\`\`

Never sanitise uncomfortable findings. If the biggest blocker is leadership behaviour, name it.`,
  },

  'synthesize': {
    slug: 'synthesize',
    name: 'Synthesize',
    description: "Cluster research findings into strategic insights, tensions, and How Might We opportunities.",
    track: 'research',
    autoSave: false,
    triggers: ['synthesize', 'synthesis', 'pull this together', 'what does this mean', 'make sense of this', 'so what', 'cluster the findings', 'what are the themes'],
    content: `# Synthesize

I move from raw research data — interviews, VoC, journey maps, blocker scans, business diagnostics — into strategic direction. Themes, tensions, HMW opportunities, and the burning platform.

## What I Need:
1. **Research inputs** — paste or reference outputs from other skills, plus any raw data
2. **Learning agenda** — the specific questions this synthesis must answer
3. **Purpose** — what decisions will be made using this synthesis?
4. **Customer segments** — should themes be analysed per segment or across all groups?

## Output Format

\`\`\`markdown
## Synthesis: [Organisation] — [Project / Challenge Name]
*stratpartner.ai · [Date]*

---

### Theme Map

**Theme 1: [Name]**
*[Active statement capturing the pattern: "Customers lose confidence at the handoff, not at the product."]*
Evidence: [sources and signals that support this]
Appears in: [which research inputs]
Strength: [Strong / Moderate / Emerging]

[repeat for 5-8 themes]

---

### Tensions
[Where two true things conflict. e.g., "Customers want speed AND they want to feel understood — the current model trades one against the other."]

### The Burning Platform
[The single most important strategic insight from the synthesis — the thing that, if not addressed, makes everything else moot]

### How Might We (HMW) Opportunities
[3-5 HMW questions that open up the design space without prescribing solutions]

---

*What I now know:*
- [Strategic insight 1]
- [Strategic insight 2]
- [Strategic insight 3]

*Suggested next step:* [recommendation]
\`\`\``,
  },

  'prioritize': {
    slug: 'prioritize',
    name: 'Prioritize',
    description: "Score initiatives across strategic alignment, customer impact, and feasibility into a three-phase roadmap.",
    track: 'cx',
    autoSave: true,
    triggers: ['prioritize', 'prioritisation', 'where should we start', 'roadmap', 'sequence', 'what comes first', 'initiative scoring', 'what to focus on'],
    content: `# Prioritize

I convert a long list of ideas into a defensible three-phase roadmap by scoring each initiative across four dimensions. I refuse to mark everything high priority — trade-offs are surfaced, and deprioritised work gets an honest rationale.

**Scoring dimensions:**
- Strategic Alignment (25%) — connection to top organisational priorities
- Customer Impact (35%) — meaningfulness for key segments
- Feasibility (25%) — Technical / Operational / Channel / Legal readiness
- Time-to-Value (15%) — speed to measurable benefit

## What I Need:
1. **The initiative list** — everything you're considering, however rough
2. **Strategic priorities** — what are the 2-3 things the organisation most needs to achieve?
3. **Constraints** — capacity, budget, timeline, dependencies
4. **Customer insight** — which initiatives matter most to which segments?

## Output Format

\`\`\`markdown
## Prioritisation Roadmap: [Organisation] — [Programme]
*stratpartner.ai · [Date]*

---

### Initiative Scoring

| Initiative | Strategic | Customer | Feasibility | Time-to-Value | Total | Phase |
|------------|-----------|----------|-------------|---------------|-------|-------|
| [Name] | [1-5] | [1-5] | [1-5] | [1-5] | [score] | [1/2/3] |

---

### Phase 01 — Prove and Momentum
*Quick wins using existing capability. Deliver in 0-3 months.*
[List with 1-sentence rationale for each]

### Phase 02 — Build and Enable
*Foundational investments for scale. Deliver in 3-9 months.*
[List with dependency logic]

### Phase 03 — Scale and Lead
*High-impact transformation plays. Deliver in 9-18 months.*
[List with what Phase 02 must achieve first]

---

### Sequencing Rationale
[Why this order specifically — dependency logic, momentum strategy, risk sequencing]

### What We're NOT Doing (and Why)
[Explicitly named deprioritised items with honest rationale]

### Portfolio Risk Assessment
[What makes this roadmap fragile? What would cause it to break?]

---

*What I now know:*
- [Strategic insight 1]
- [Strategic insight 2]

*Suggested next step:* [recommendation]
\`\`\``,
  },

  'biz-context': {
    slug: 'biz-context',
    name: 'Biz Context',
    description: "Diagnose a company's health across revenue, customer metrics, operational health, and market position.",
    track: 'cx',
    autoSave: false,
    triggers: ['business context', 'company health', 'revenue', 'competitive position', 'biz context', 'business diagnostic', 'how is the business doing', 'company situation'],
    content: `# Biz Context

I diagnose business health across five domains and surface strategic tensions that shape CX priorities. Every rating is grounded in evidence. Data gaps are named. Absence of data is itself a signal.

**Five domains:**
1. Revenue and Growth
2. Customer Metrics (NPS, CSAT, churn, LTV)
3. Operational Health
4. Market Position
5. Organisational Capability

**For each domain:** Strong / Adequate / At Risk / Critical / Unassessed — with evidence cited.

## What I Need:
- Annual reports, financial summaries, NPS/CSAT data, VOC reports, competitor analysis, review site sentiment
- What company and industry, and what decision does this analysis inform?
- I'll fill gaps with public data — clearly labelled as web-sourced

## Output Format

\`\`\`markdown
## Biz Context: [Organisation]
*stratpartner.ai · [Date]*

**Decision context:** [What this analysis informs]

---

### Five-Domain Diagnostic

**Revenue and Growth** — [Rating]
[Evidence, gaps, what this means for CX]

**Customer Metrics** — [Rating]
[NPS/CSAT/churn evidence, trends, what this means]

**Operational Health** — [Rating]
[Process, capacity, cost-to-serve evidence]

**Market Position** — [Rating]
[Competitive standing, share signals, positioning evidence]

**Organisational Capability** — [Rating]
[People, skills, structure signals]

---

### Porter's Five Forces
[Competitive rivalry, new entrants, substitutes, buyer power, supplier power — rated for intensity and CX implication]

### Key Tensions
[3-5 specific, evidence-based conflicts — where two true things collide]

### Strategic "So What"
[What CX needs to fix, what happens if it doesn't, what success looks like in measurable terms]

---

*What I now know:*
- [Business intelligence 1]
- [Business intelligence 2]
- [Business intelligence 3]

*Suggested next step:* [recommendation]
\`\`\``,
  },

  'service-map': {
    slug: 'service-map',
    name: 'Service Map',
    description: "Blueprint the people, processes, and systems delivering a customer journey across five layers.",
    track: 'cx',
    autoSave: false,
    triggers: ['service blueprint', 'backstage', 'service map', 'operations behind', 'service design', 'what happens behind the scenes', 'operational blueprint'],
    content: `# Service Map

I build service blueprints that map the operational reality behind a customer journey — identifying where processes break, who decides what, where handoffs fail, and what systemic changes would have the highest impact.

**Five layers:**
1. Customer Actions — what they actually do
2. Frontstage — what they see from your organisation
3. Backstage — internal staff work and decisions
4. Support Processes — cross-team workflows
5. Systems — technology platforms and data flows

## What I Need:
1. **Journey map** — paste output from /journey-map, or describe the journey stages and touchpoints
2. **Systems list** — what platforms/tools deliver this journey?
3. **Team structure** — which org units or teams touch this journey?
4. **Known failure points** — complaint patterns or operational breakdowns you already know about?
5. **Process documentation** — workflow diagrams, procedure docs, org charts (anything you have)

## Output Format

\`\`\`markdown
## Service Map: [Journey Name] — [Organisation]
*stratpartner.ai · [Date]*

---

### [Stage Name]

| Layer | What happens |
|-------|-------------|
| Customer action | [what the customer does] |
| Frontstage | [what customer-facing staff/system does] |
| Backstage | [what happens behind the scenes] |
| Support processes | [cross-team workflows triggered] |
| Systems | [technology involved] |

**Failure points:** [specific breakdowns at this stage]
**Decision rights gap:** [where cases stall because no one is empowered to decide]

[repeat for each stage]

---

### Systemic Findings
[Patterns that appear across multiple stages — the structural problems]

### Highest-Impact Fixes
[Ranked list of operational changes, with type: process / capability / system / incentive]

---

*What I now know:*
- [Operational intelligence 1]
- [Operational intelligence 2]

*Suggested next step:* [recommendation]
\`\`\``,
  },

  'biz-case': {
    slug: 'biz-case',
    name: 'Business Case',
    description: "Build an executive-ready business case using Value Engineering structure.",
    track: 'cx',
    autoSave: true,
    triggers: ['business case', 'roi', 'investment committee', 'justify the spend', 'investment case', 'build the case', 'what is the roi', 'financial case'],
    content: `# Business Case

I build executive-ready business cases for CX initiatives using a Value Engineering structure. All estimates are marked as [DATA], [BENCHMARKED], or [ASSUMPTION] — I don't fabricate numbers.

**Seven components:**
1. Problem Statement — grounded in specific evidence
2. Solution Hypothesis — why this approach, vs. alternatives
3. Target Segment — who specifically benefits
4. Value Drivers — mechanisms by which value is created
5. ROI Logic — investment, expected returns, payback period
6. Risk Register — specific, org-contextualised risks
7. Implementation Roadmap — phased delivery with milestones

## What I Need:
1. **Initiative name and one-line description**
2. **Audience** — who reads this? What matters most to them?
3. **Investment ask** — rough order of magnitude and what you're asking for
4. **Available inputs** — biz-context outputs, journey maps, financial data, operational metrics, benchmarks
5. **Timeline** — when should benefits materialize?

## Output Format

\`\`\`markdown
## Business Case: [Initiative Name]
*stratpartner.ai · [Date]*

**Investment ask:** [Amount and what it covers]
**Audience:** [C-suite / Board / Investment committee]
**Payback period:** [Estimated]

---

### Executive Summary
[4-5 sentences: problem, solution, financial return, and the ask]

---

### Problem Statement
[Evidence-grounded description of the problem and its business cost]

### Solution Hypothesis
[Why this approach specifically — and why alternatives were considered and rejected]

### Value Drivers
| Value driver | Mechanism | Estimate | Confidence |
|-------------|-----------|----------|-----------|
| [e.g. Churn reduction] | [how it works] | [range] | [DATA/BENCHMARKED/ASSUMPTION] |

### ROI Logic
[Investment breakdown + expected returns + payback calculation]
[All figures tagged by confidence level]

### Risk Register
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| [Risk] | [H/M/L] | [Impact] | [Mitigation] |

### Implementation Roadmap
[Phased delivery: Phase 1 (0-3mo), Phase 2 (3-9mo), Phase 3 (9-18mo)]

---

### Assumptions Register
[Full list of assumptions with what would change the estimate if wrong]

---

*What I now know:*
- [Financial intelligence 1]
- [Financial intelligence 2]

*Suggested next step:* [recommendation]
\`\`\``,
  },

  'brand-building-blocks': {
    slug: 'brand-building-blocks',
    name: 'Brand Building Blocks',
    description: "Synthesize research into foundational brand insights across Audience, Company, and Moment.",
    track: 'brand',
    autoSave: true,
    triggers: ['brand building blocks', 'brand insights', 'brand strategy', 'brand foundations', 'what does the brand mean', 'build the brand'],
    content: `# Brand Building Blocks

I transform raw audience, company, and market research into 5-8 building blocks — actionable insights that reveal what a brand could mean, not just what it is. Building blocks are not generic facts. They're surprising, defensible, unrealized truths that anchor distinctive brand territories.

**Three forces of evidence:**
- **Audience** — customer interviews, personas, VoC, community verbatim
- **Company** — business context, stakeholder input, competitive position, capabilities
- **Moment** — trend data, cultural shifts, category disruption signals

## What I Need:
1. Project context — what brand/company, industry, and strategic objective?
2. Evidence across all three forces — uploaded materials or verbal description
3. Any known hypotheses or existing brand positioning to test against

## Output Format

\`\`\`markdown
## Brand Building Blocks: [Brand Name]
*stratpartner.ai · [Date]*

---

### Evidence Inventory
[What was analysed across Audience / Company / Moment — and what gaps exist]

---

### Building Block 1: [Name — active, provocative statement]
**The insight:** [What's true that isn't being acted on]
**Evidence:** [The facts and signals that make this credible]
**Proof points:** [Specific evidence from research]
**Why it matters:** [Strategic implication for the brand]
**Tension:** [What this creates or resolves]

[repeat for 5-8 building blocks]

---

### Tension Map
[Where building blocks pull against each other — these tensions are often where the most interesting brand territory lives]

---

### What This Tells Us About the Brand
[3-4 sentences: what do these building blocks collectively reveal about what this brand could authentically be?]

---

*What I now know:*
- [Brand intelligence 1]
- [Brand intelligence 2]
- [Brand intelligence 3]

*Suggested next step:* Run /brand-territories to develop directional brand concepts from these building blocks.
\`\`\``,
  },

  'brand-territories': {
    slug: 'brand-territories',
    name: 'Brand Territories',
    description: "Develop 3 distinct strategic brand territory directions from building blocks.",
    track: 'brand',
    autoSave: true,
    triggers: ['brand territories', 'brand direction', 'strategic territories', 'brand concepts', 'which direction for the brand', 'territory exploration'],
    content: `# Brand Territories

I develop three distinct strategic brand territory directions — not consumer-facing concepts, but the broad emotional and strategic spaces the brand could authentically own. Territories are distinct, defensible, and rooted in the building blocks.

## What I Need:
1. **Building blocks** — output from /brand-building-blocks, or key insights about audience, company, and moment
2. **Current positioning** — if one exists, what is it?
3. **Competitor positioning** — how is the competitive set positioned?
4. **Any ruled-out directions** — what has already been explored and rejected?
5. **Who will react to these?** — shapes how provocative the territories can be

## Output Format

\`\`\`markdown
## Brand Territories: [Brand Name]
*stratpartner.ai · [Date]*

---

### Territory 1: [Territory Name]
**The core idea:** [One sentence that captures the emotional/strategic space]
**What this territory means:** [2-3 sentences — the strategic logic]
**Brand personality in this territory:** [3-5 defining traits]
**What it would look like:** [How this territory shows up in experience, communication, product]
**"What if we..." scenarios:** [2-3 provocative questions this territory opens up]
**Building blocks it draws on:** [which building blocks anchor this territory]
**Competitive white space:** [where this sits relative to competitors]

### Territory 2: [Territory Name]
[same structure]

### Territory 3: [Territory Name]
[same structure]

---

### Territory Comparison

| Dimension | Territory 1 | Territory 2 | Territory 3 |
|-----------|------------|------------|------------|
| Core emotional register | | | |
| Primary audience resonance | | | |
| Competitive defensibility | | | |
| Internal authenticity | | | |
| Risk level | | | |

---

### A Note on How to Use These
Territories are not final decisions — they're directions for exploration. The next step is testing them: with internal stakeholders, with target audience, against business objectives.

---

*What I now know:*
- [Brand intelligence 1]
- [Brand intelligence 2]
- [Brand intelligence 3]

*Suggested next step:* [recommendation — often /positioning-framework to sharpen the chosen territory into a formal positioning]
\`\`\``,
  },

  'voc-synthesis': {
    slug: 'voc-synthesis',
    name: 'VoC Synthesis',
    description: "Synthesize raw customer feedback into strategic themes, sentiment patterns, and actionable implications.",
    track: 'research',
    autoSave: true,
    triggers: ['what are customers saying', 'voc', 'voice of customer', 'synthesize customer feedback', 'customer feedback themes', 'nps verbatims', 'customer sentiment', 'what does the customer feedback say'],
    content: `# VoC Synthesis

Voice of Customer Synthesis takes raw customer feedback — verbatims, ratings, interview excerpts, support themes, reviews — and transforms it into strategic intelligence. Not a summary of what customers said. An analysis of what they mean, what tensions it reveals, and what it implies for the CX programme.

## Inputs Required:
- NPS or CSAT verbatim responses
- Customer interview transcripts or summaries
- Support ticket theme summaries or contact reason data
- Review excerpts (G2, Capterra, internal surveys, social)
- Churn survey responses

Also confirm: time period, customer segments to analyse separately, and the specific hypothesis the client is trying to answer.

Do not fabricate or invent customer feedback. If no data is provided, ask for it before proceeding.

## Output Format

\`\`\`markdown
## VoC Synthesis: [Client/Org Name]
*stratpartner.ai · [Date]*

**Data sources:** [list] · **Total feedback items:** [n] · **Period:** [date range]

---

### Theme Analysis

| Theme | Frequency | Sentiment | Representative Quote |
|-------|-----------|-----------|---------------------|
| [Theme 1] | [n items] | [Negative] | "[verbatim quote]" |
| [Theme 2] | [n items] | [Positive] | "[verbatim quote]" |

---

### Sentiment Overview
Positive: [%] — [primary driver]
Neutral: [%] — [primary driver]
Negative: [%] — [primary driver]
Critical (churn threat): [%] — [primary driver]

---

### Strategic Analysis

**What customers value most**
[2-3 paragraphs — outcomes, not features]

**What's most at risk**
[Which themes represent highest churn/advocacy risk]

**What's being asked for but not heard**
[Feature/service/experience expectations that appear repeatedly but aren't on the company radar]

**Tensions in the feedback**
[Where different segments contradict each other]

**The thing nobody's saying**
[The inference from what's absent — what customers don't complain about because they've given up expecting better]

---

### Implications for [Project / Programme Name]
[3-5 specific, direct implications for the CX programme]

---

*What I now know:*
- [Customer intelligence 1]
- [Customer intelligence 2]
- [Customer intelligence 3]

*Suggested next step:* [recommendation]
\`\`\``,
  },

  'brand-voice-analysis': {
    slug: 'brand-voice-analysis',
    name: 'Brand Voice Analysis',
    description: "Analyse a brand's current voice and communication style. Reveals where the brand actually sits vs. where it thinks it sits.",
    track: 'brand',
    autoSave: false,
    triggers: ['brand voice', 'tone of voice', 'how do they communicate', "what's their voice like", 'analyse their brand', 'brand communication style', 'current brand expression'],
    content: `# Brand Voice Analysis

Before developing where a brand should go, I produce an honest read of where it actually is. I examine existing communication across channels and formats — and produce a rigorous portrait of how the brand actually sounds, not how it intends to sound.

## Inputs Required:
- Uploaded brand content (PDFs, Word docs of brand copy, website copy, campaign materials)
- Website URL if available
- Specific content samples pasted into the conversation
- Minimum: 1,500 words of real brand copy across at least 2 different content types

Also confirm: B2B/B2C, primary audience, any existing tone of voice guidelines to compare against.

## Analysis Dimensions:
1. **Tone** — formality, authority stance, emotional register, directness
2. **Vocabulary** — reading level, jargon density, signature phrases, conspicuous absences
3. **Sentence structure** — length patterns, active/passive voice, how articles open
4. **Content architecture** — how arguments are structured, self-reference vs. audience-reference
5. **Point of view** — who is the implied author, who is the implied reader
6. **What the voice avoids** — topics, framings, and claims that are conspicuously absent

## Output Format

\`\`\`markdown
## Brand Voice Analysis: [Brand Name]
*stratpartner.ai · [Date]*

---

### Voice Profile

| Dimension | Current State | Evidence |
|-----------|--------------|----------|
| Tone | [e.g., Formally authoritative, emotionally flat] | "[quote]" |
| Vocabulary | [e.g., Technical, jargon-heavy] | "[quote]" |
| Structure | [e.g., Features-first, long paragraphs] | "[quote]" |
| Content architecture | [e.g., Problem → Solution, data-heavy] | "[quote]" |
| Point of view | [e.g., Institutional author, expert reader] | "[quote]" |
| What it avoids | [e.g., Emotion, specific claims] | — |

---

### Intended vs. Actual
[Gap analysis against guidelines if available; or note on absence of guidelines]

---

### Strategic Read

**What the voice reveals about the brand's self-image**
[1-2 paragraphs]

**What the voice reveals about the brand's fear**
[1-2 paragraphs — where it hedges, retreats into corporate language]

**Where the voice is working**
[What's genuinely distinctive and worth preserving]

**Where the voice is working against the brand**
[What should change]

**What the voice signals to a first-time audience**
[The honest external read]

---

### Implications for Brand Strategy
[3-5 specific implications for brand-building-blocks or brand-territories work]

---

*What I now know:*
- [Brand intelligence 1]
- [Brand intelligence 2]
- [Brand intelligence 3]

*Suggested next step:* Run /brand-building-blocks — the voice analysis gives us the current-state anchor we need.
\`\`\``,
  },

  'competitive-landscape': {
    slug: 'competitive-landscape',
    name: 'Competitive Landscape',
    description: "Deep competitive intelligence brief. Maps the competitive space, identifies positioning gaps, and draws out specific implications for strategy.",
    track: 'research',
    autoSave: true,
    triggers: ['competitive landscape', 'competitor analysis', 'who are the competitors', 'what does the market look like', 'competitive positioning', 'how do we compare', 'landscape analysis', 'map the market'],
    content: `# Competitive Landscape

A competitive landscape brief maps the space the client operates in, and finds the gaps, tensions, and opportunities within that space. It is not a list of competitors — it is a strategic read of the competitive environment and what it means for this client, right now.

Uses web research and any uploaded documents. Produces a one-time deep research brief.

## Inputs Required:
- Client company name and brief description
- Who the client considers their competitors (I'll verify and expand)
- Scope: direct competitors only, or also adjacent players and alternatives?
- The strategic question this analysis must inform
- Any uploaded market research or previous competitive analysis

## Three Competitor Tiers:
- **Tier 1:** Direct competitors (same category, same buyer, similar price point)
- **Tier 2:** Adjacent players (different category but competing for same budget or attention)
- **Tier 3:** Alternatives (how buyers solve the problem without the client or their direct competitors — often the most instructive)

## Output Format

\`\`\`markdown
## Competitive Landscape: [Client Name / Category]
*stratpartner.ai · [Date]*

**Scope:** [Direct / Adjacent / Alternatives]
**Strategic question:** [What this analysis informs]

---

### Market Definition

**The category:** [Name and description]
**Size and growth:** [Signal and source]
**Buying context:** [Who buys, what triggers it, how they evaluate]
**Category dynamics:** [Maturity, competitive logic, what's disrupting it]

---

### Competitor Profiles

#### Tier 1: Direct Competitors

**[Competitor]**
| Dimension | Details |
|-----------|---------|
| Core offer | |
| Positioning | |
| Target segment | |
| Key differentiators | |
| Weakness signals | |
| Recent moves | |

[repeat]

#### Tier 2: Adjacent Players
[Briefer profiles]

#### Tier 3: Alternatives
[How buyers solve the problem without any of the above]

---

### Positioning Map

**Key axes:** [Axis 1] vs. [Axis 2]
[Where each player sits and why]

**White space:** [Unoccupied position and what it would mean to be there]

---

### Strategic Analysis

**What the market rewards**
[What it takes to win in this market]

**Where [client] has a genuine edge**
[Not claimed — actual]

**Where [client] is exposed**
[Where a competitor could credibly attack]

**The moves worth watching**
[What to track in next 12-24 months]

**The gap worth occupying**
[Most defensible and attractive unowned position]

---

*What I now know:*
- [Competitive intelligence 1]
- [Competitive intelligence 2]
- [Competitive intelligence 3]

*Suggested next step:* [recommendation]
\`\`\``,
  },

  'retention-risk-scan': {
    slug: 'retention-risk-scan',
    name: 'Retention Risk Scan',
    description: "Identify which customer segments are most at risk of churn and why. Produces a risk-tiered map and specific intervention plays.",
    track: 'cx',
    autoSave: true,
    triggers: ['retention risk', 'churn risk', 'at-risk customers', 'who might churn', 'customer health', 'who are we about to lose', 'retention analysis', 'churn analysis'],
    content: `# Retention Risk Scan

I look at the customer base systematically to identify who is at risk, why, and what can be done before they leave. Produces a risk assessment — not a monitoring system. A strategic brief that informs CX programme priorities.

## Data Required:
**Quantitative:** NPS scores by segment, CSAT scores, churn rate by segment, usage metrics, contract renewal data
**Qualitative:** Churn interview summaries, support ticket themes, sales-to-CS handoff notes, NPS verbatims, account manager notes on at-risk accounts

## Risk Tiers:
- **Red (Critical):** Multiple high-severity signals — act this week
- **Orange (Elevated):** 2-3 medium-to-high signals — act within 30 days
- **Yellow (Early warning):** Single signals — monitor
- **Green (Healthy):** No significant risk signals

## Root Cause Structure:
- **Surface cause** — what the customer says
- **Operational cause** — what's happening in the business
- **Systemic cause** — what's driving the operational failure

## Output Format

\`\`\`markdown
## Retention Risk Scan: [Client Name]
*stratpartner.ai · [Date]*

**Data sources:** [list]
**Coverage:** [segments / cohorts / time period]
**Confidence level:** [High / Medium / Limited — and why]

---

### Signal Summary

| Signal | Type | Severity | Affected Segment |
|--------|------|----------|-----------------|
| [Signal 1] | Experience | Critical | [Segment] |

---

### Risk Tier Map

**🔴 Red — Critical ([estimate]% of customer base)**
[Which accounts/segments are here and why. Key signals present.]

**🟠 Orange — Elevated**
[Description]

**🟡 Yellow — Early Warning**
[Description]

**🟢 Green — Healthy**
[Description]

---

### Root Cause Analysis

**Red tier root causes**
Surface: [what customers say]
Operational: [what's failing]
Systemic: [why it's failing]

**Patterns across tiers**
[Systemic cause driving multiple risk tiers]

---

### Intervention Plays

**For Red accounts — act this week**
1. [Specific play — who does what, with whom, by when]

**For Orange accounts — act within 30 days**
1. [Proactive play]

**For systemic issues — CX programme recommendation**
[What needs to change structurally]

---

*What I now know:*
- [Retention intelligence 1]
- [Retention intelligence 2]
- [Retention intelligence 3]

*Suggested next step:* [recommendation]
\`\`\``,
  },

  'quarterly-review': {
    slug: 'quarterly-review',
    name: 'Quarterly Review',
    description: "Produce a structured executive narrative for a CX transformation programme quarterly review.",
    track: 'cx',
    autoSave: true,
    triggers: ['quarterly review', 'qbr', 'quarterly report', 'board update', 'leadership review', 'programme review', 'quarterly narrative', 'quarterly brief'],
    content: `# Quarterly Review

A quarterly review for a CX transformation programme is a strategic story told to leadership — not a status update. Here's where we started, what we set out to do, what actually happened and why, what we learned, and what we're committing to next quarter.

## Data Required:
**Programme context (from project memory):** Objectives set at start of quarter, prior commitments, key stakeholders
**Quarter data (ask client to provide):** Metric movements, milestones hit/missed, key initiatives status, budget status, decisions made, biggest blockers
**The honest read:** What went better/worse than expected, what would you do differently, single most important thing for next quarter

## Output Format

\`\`\`markdown
## CX Transformation Programme — Quarterly Review
### [Organisation] · Q[N] [Year]
*stratpartner.ai · [Date]*

---

### Commitment Accounting

| Commitment | Status | Notes |
|-----------|--------|-------|
| [Commitment 1] | ✅ Delivered | [Note] |
| [Commitment 2] | ⚠️ Partial | [Honest explanation] |
| [Commitment 3] | ❌ Missed | [Honest explanation] |

---

### Metric Movements

| Metric | Prior Quarter | This Quarter | Change | What it means |
|--------|--------------|--------------|--------|---------------|
| [NPS — Enterprise] | [n] | [n] | [±n] | [Business interpretation] |

**The metric story:**
[2-3 paragraphs interpreting the overall pattern]

---

### Programme Narrative
[4-6 paragraphs: What this quarter was about → What happened → The pivot/learning → Where momentum is building → Where the work is hard]

---

### Next Quarter Commitments

**The one thing:** [Single most important commitment and rationale]

1. [Specific, measurable commitment] · Owner: [Name] · By: [Date]
2. [Commitment] · Owner: [Name] · By: [Date]

**What we need from leadership:** [Direct, specific asks]

---

### Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| [Risk 1] | High | [Impact] | [Mitigation] |

---

*What I now know:*
- [Programme intelligence 1]
- [Programme intelligence 2]

*Suggested next step:* [recommendation]
\`\`\``,
  },

  'positioning-framework': {
    slug: 'positioning-framework',
    name: 'Positioning Framework',
    description: "Define how a brand or product should position itself — choosing a category, articulating genuine differentiation, and building a messaging hierarchy.",
    track: 'brand',
    autoSave: true,
    triggers: ['positioning', 'how should we position', "what's our positioning", 'positioning statement', 'how do we differentiate', 'what makes us different', 'messaging hierarchy'],
    content: `# Positioning Framework

Positioning is the single most important strategic decision a brand makes. This skill produces a positioning framework — the strategic architecture that defines how this brand occupies its market.

## Three Category Options:
- **Option A — Head-to-head:** Compete in an existing category. Best when category is large/growing and client has a defensible advantage.
- **Option B — Niche excellence:** Compete in a subcategory you can genuinely own. Best when the client's advantage is specific to a segment.
- **Option C — New narrative:** Define a new category where you're the obvious leader. Highest risk, highest reward.

## Positioning Statement Structure (Geoffrey Moore):
\`\`\`
For [specific target customer]
who [has this specific problem or need],
[Brand name] is the [category or frame]
that [delivers this specific outcome]
unlike [primary alternative],
because [reason to believe].
\`\`\`

## Positioning Test (four questions):
1. **Is it true?** Can the brand actually deliver this?
2. **Is it different?** Would a competitor be annoyed — or say "yes, that's them"?
3. **Does it matter?** Does it speak to something the buyer genuinely cares about?
4. **Can you own it?** Can the client build evidence and reputation around this over time?

## Output Format

\`\`\`markdown
## Positioning Framework: [Brand/Product Name]
*stratpartner.ai · [Date]*

---

### Category Decision
**Recommendation:** [Option A/B/C — argued for in one paragraph]
**What would need to be true:** [Key conditions for this to succeed]

---

### Competitive Alternatives Map

| Alternative | Positioning | Strength | Vulnerability |
|------------|-------------|----------|--------------|
| [Competitor] | | | |
| [Status quo] | Do nothing | [Why it's sticky] | [Why it's inadequate] |

**Primary competition:** [The one alternative you're most often competing against]

---

### Positioning Statement

**Recommended version:**
> For [target] who [need], [Brand] is the [category] that [outcome], unlike [alternative], because [reason to believe].

**Alternative versions:**
[V2]
[V3]

**Why the recommended version:** [1 paragraph rationale]

---

### Messaging Hierarchy

**Primary headline options:**
1. [Option 1]
2. [Option 2]
3. [Option 3]

**Supporting messages:**
1. **[Message 1]** — [1-2 sentences] · Proof: [evidence] · Speaks to: [audience]
2. **[Message 2]** — [1-2 sentences] · Proof: [evidence] · Speaks to: [audience]
3. **[Message 3]** — [1-2 sentences] · Proof: [evidence] · Speaks to: [audience]

**Message guardrails — what NOT to say:**
- [Guardrail 1 and why]

---

### Positioning Test

| Test | Assessment | Issue (if any) |
|------|-----------|---------------|
| Is it true? | [Pass/Partial/Fail] | |
| Is it different? | [Pass/Partial/Fail] | |
| Does it matter? | [Pass/Partial/Fail] | |
| Can you own it? | [Pass/Partial/Fail] | |

---

*What I now know:*
- [Strategic insight 1]
- [Strategic insight 2]

*Suggested next step:* [recommendation]
\`\`\``,
  },

  'transformation-story': {
    slug: 'transformation-story',
    name: 'Transformation Story',
    description: "Build the narrative that makes a CX transformation programme real to stakeholders — from frontline teams to board.",
    track: 'cx',
    autoSave: true,
    triggers: ['transformation story', 'change narrative', 'tell the story', 'internal communication', 'change management communication', 'why we\'re transforming', 'programme narrative', 'make the case internally'],
    content: `# Transformation Story

CX transformation programmes fail not because the strategy is wrong, but because the organisation doesn't believe in them. This skill produces the narrative that closes those gaps — for any audience level, from frontline to board.

## Inputs Required:
- What is the programme trying to achieve?
- What phase is it in? (Early / Active / Mature)
- What has happened so far?
- **Primary audience:** Frontline teams / Middle management / Senior leadership / Board / Whole organisation
- What does this audience currently believe? (Supportive / Sceptical / Unaware / Fatigued)
- What do they need to believe after hearing this story?
- The burning platform: why does this transformation HAVE to happen?
- Proof of progress (for mid/mature stage): what early wins can be cited?

## Story Architecture by Audience:
- **Frontline:** Empathy → Urgency → Direction → Their role → Support they'll get
- **Middle management:** Business case → Programme status → Their role as enablers → How success is measured
- **Senior leadership:** Strategic context → What we've built → Where we are vs. plan → Decision needed
- **Board:** Market context → Strategic rationale → Investment thesis → Progress vs KPIs → Risk register
- **Whole organisation:** Recognition → Why now → Vision → Progress → What we're asking → How to stay involved

## Output Format

\`\`\`markdown
## Transformation Story: [Programme Name]
### For: [Primary Audience] · [Organisation Name]
*stratpartner.ai · [Date]*

---

### The Burning Platform

**The market/competitive dimension:**
[1-2 paragraphs: the external force making the status quo untenable]

**The internal dimension:**
[1-2 paragraphs: the gap between current and required experience, with data]

**The cost of inaction:**
[Specific, tangible consequences]

**The moment of recognition:**
[The data point, event, or customer story that makes this vivid]

---

### The Direction

**Where we're going:** [One-sentence vision — specific and imageable]
**What changes:** [Specific list]
**What stays the same:** [What this audience can count on]
**What we're asking [audience] to do:** [Specific, behavioural]

---

### The Evidence *(for programmes already underway)*
- [Milestone + what it means]
- [Metric movement + business interpretation]
- [Customer story or quote]

**What's genuinely hard right now:** [Honest acknowledgment]

---

### Narrative Draft
[Full draft in appropriate voice and format for the audience — 300-900 words depending on format]

---

*What I now know:*
- [Change management insight 1]
- [Change management insight 2]

*Suggested next step:* [recommendation]
\`\`\``,
  },
}

export const SKILLS_LIST = Object.values(SKILLS)

export const AUTO_SAVE_SKILLS = SKILLS_LIST
  .filter(s => s.autoSave)
  .map(s => s.slug)
