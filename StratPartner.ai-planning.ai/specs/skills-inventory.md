# stratpartner.ai — Skills Inventory
## What's in, what's adapted, what's excluded, and why

---

## The Full Skills Set (18 skills)

### Tier 1 — Kstack Skills (Kenan's originals, copy directly)
These are seeded into the `skills` table verbatim from Kstack. No adaptation needed.

| Slug | Name | Track | Trigger Phrases |
|------|------|-------|-----------------|
| `journey-map` | Journey Map | CX | journey map, customer journey, map the journey, touchpoints |
| `persona-build` | Persona Build | Research | persona, who is the customer, customer profile |
| `service-map` | Service Map | CX | service blueprint, backstage, operations behind |
| `scan-blockers` | Scan Blockers | CX | blockers, what's in the way, why isn't this working, obstacles |
| `synthesize` | Synthesize | Research | synthesize, synthesis, pull this together, what does this mean |
| `biz-context` | Business Context | CX | business context, company health, competitive position |
| `trend-scan` | Trend Scan | CX | trend, macro, PESTLE, forces, what's shaping |
| `biz-case` | Business Case | CX | business case, ROI, investment committee, justify the spend |
| `prioritize` | Prioritize | CX | prioritize, where should we start, sequence, roadmap |
| `brand-building-blocks` | Brand Building Blocks | Brand | brand building blocks, brand insights, brand strategy |
| `brand-territories` | Brand Territories | Brand | brand territories, brand direction, strategic territories |

**Note on Kstack `session-start`:** This is a file system utility for the Kstack CLI. In stratpartner, its function is replaced by the project creation + intake flow. Do not seed it as a skill.

---

### Tier 2 — Adapted from Goose-Skills (rebuilt for stratpartner's context)
These are NOT copied from goose-skills. They are new skills *inspired by* goose-skills capabilities, rebuilt with a CX consulting frame and stratpartner's output format. No code scripts. No external integrations. Agent-executed via reasoning + web search + RAG.

| Slug | Name | Track | Based On | Key Difference |
|------|------|-------|----------|----------------|
| `voc-synthesis` | VoC Synthesis | Research | voice-of-customer-synthesizer | Strips automated scraping. Synthesizes client-provided feedback data into themes, sentiments, and strategic implications. |
| `brand-voice-analysis` | Brand Voice Analysis | Brand | brand-voice-extractor | Strips code scripts. Analyzes a brand's published content or uploaded materials to extract voice, tone, and communication patterns. Input to brand strategy. |
| `competitive-landscape` | Competitive Landscape | Research | competitor-intel | Strips automated monitoring/cron. One-time deep competitive research brief: positioning, gaps, and implications for the client. |
| `retention-risk-scan` | Retention Risk Scan | CX | churn-risk-detector | Strips technical data integrations. Analyzes client-provided data (NPS scores, support themes, usage patterns) to identify at-risk customer segments and save plays. |
| `quarterly-review` | Quarterly Review | CX | qbr-deck-builder | Reframed from CS QBR to CX transformation program review. Produces structured executive narrative for leadership reporting. |
| `positioning-framework` | Positioning Framework | Brand | launch-positioning-builder | Stripped of ad/scraping focus. Reframed as brand strategy tool: category decision, competitive alternatives map, positioning statement, and messaging hierarchy. |
| `transformation-story` | Transformation Story | CX | customer-story-builder | Completely reframed from case study / content marketing to CX change management narrative. Audience-adaptive story architecture for internal alignment. |

---

### Excluded Goose-Skills and Why

**Overlaps with Kstack (not additive enough):**
- `icp-persona-builder` → Covered by `persona-build`. Kstack's version is richer for CX use (JTBD, emotional drivers, unmet needs). Goose version is buyer/sales-persona focused.
- `industry-scanner` → Covered by `trend-scan`. Kstack version is more rigorous (PESTLE + tech waves + CX implications).
- `voice-of-customer-synthesizer` (general synthesize aspects) → Partially covered by `synthesize`. But the VoC-specific flavour is distinct enough to keep as `voc-synthesis`.

**Wrong domain (GTM/sales, not CX consulting):**
- All lead gen skills (apollo-lead-finder, company-contact-finder, etc.) — sales prospecting
- All outreach skills (cold-email-outreach, linkedin-outreach, etc.) — sales automation
- All ad/SEO skills (google-ad-scraper, seo-domain-analyzer, etc.) — marketing ops
- icp-identification → entry point for lead-finding workflows, not consulting
- tam-builder → market sizing for sales, not CX strategy
- All signal-monitoring composites (hiring-signal-outreach, news-signal-outreach, etc.) — sales triggers
- content-asset-creator, create-html-carousel, etc. — content marketing tools

**Too technical/automated for stratpartner's interface:**
- meeting-brief → Requires calendar integration, automated email. Stratpartner handles pre-meeting context via memory and live meeting sidebar.
- competitor-monitoring-system → Continuous monitoring system. Stratpartner uses `competitive-landscape` for one-time deep research.
- customer-discovery → Finds a company's customers via web scraping. GTM-oriented, not CX consulting.

**Playbooks (all excluded):**
- All playbooks in goose-skills are complex multi-step automation systems (outbound prospecting engines, SEO content engines, etc.) designed to run autonomously. Not appropriate for a consulting intelligence tool.

---

## Skills by Phase in the Engagement Workflow

### Research Phase
Skills typically used during the research phase of a project:
- `trend-scan` — What macro forces are shaping this client's CX context
- `biz-context` — How healthy is the business and what's driving the CX agenda
- `competitive-landscape` *(new)* — Where do competitors sit and what gaps exist
- `voc-synthesis` *(new)* — What are customers actually saying (from uploaded data)
- `brand-voice-analysis` *(new)* — Where does the brand's current voice sit

### Strategy Phase (runs during or after strategy sessions)
- `scan-blockers` — What's preventing CX progress
- `synthesize` — What does all the research mean; what are the tensions and opportunities
- `service-map` — What's happening backstage that creates the customer experience
- `retention-risk-scan` *(new)* — Which customers are most at risk and why

### Delivery Phase (produces final deliverables)
- `journey-map` — Map the customer experience moment-by-moment
- `persona-build` — Build the customer persona that informs all CX decisions
- `positioning-framework` *(new)* — Define how the brand positions in its market
- `brand-building-blocks` — Define the foundational brand truths
- `brand-territories` — Develop 3 distinct directions for the brand
- `transformation-story` *(new)* — Build the internal change narrative for stakeholder alignment
- `biz-case` — Build the executive business case for a CX investment
- `prioritize` — Sequence the transformation roadmap
- `quarterly-review` *(new)* — Produce the quarterly leadership narrative

---

## Skills That Still Need to Be Written (Not in Either Repo)

These are needed for the stratpartner engagement model and don't exist anywhere yet:

1. **`stakeholder-interview`** — The CX discovery interview framework for voice interviews. This is the methodology that makes Vapi interviews feel like Kenan rather than a generic AI. Questions, probing logic, evasion handling, synthesis format. **Must be written by Kenan from his own experience before Phase 2 is built.**

2. **`research-brief`** — Standard output format for research tasks (landscape analysis, market analysis, etc.). This isn't a user-triggered skill — it's the format template the agent uses when completing a research task. Needs to be written and loaded as a system-level skill (not user-triggerable).

3. **`intake-analysis`** — Processes a completed intake form to: extract strategic context, generate suggested research tasks, and recommend deliverable sequence. System-level, not user-triggerable. Called automatically when an intake is submitted.

---

## Seeding Order

Seed all 18 user-triggerable skills at once in `scripts/seed-skills.ts`. The 3 system-level skills (stakeholder-interview, research-brief, intake-analysis) are loaded directly in the relevant API routes — they do not need to be in the `skills` table.

Default org_skills: all 16 skills active for every new org. Admin can deactivate per-org as needed (e.g., brand skills deactivated for a CX-only engagement).
