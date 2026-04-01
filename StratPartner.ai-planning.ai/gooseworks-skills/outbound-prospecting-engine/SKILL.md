---
name: outbound-prospecting-engine
type: playbook
source: gooseworks-ai/goose-skills
description: End-to-end system for identifying and engaging qualified prospects through multiple buying signal sources. Runs signal detection → qualification → contact finding → personalised outreach → campaign monitoring.
tags: [gtm, outbound, prospecting, lead-generation]
---

# Outbound Prospecting Engine

## When to Use
- "Find me qualified prospects for [product]"
- "Build an outbound pipeline"
- "I need to find my first [N] users"

## The 8-Step Engine

### Step 1 — Define Signal Sources
Choose which signals to monitor based on ICP. Run in parallel where possible:

| Signal | Meaning | Skill |
|--------|---------|-------|
| Job postings | Budget allocated, pain acknowledged | job-posting-intent |
| Funding announcements | Fresh capital, growth mandate | funding-signal-monitor |
| LinkedIn activity | Practitioners discussing the problem | linkedin-post-research |
| Conference attendance | Active market engagement | event-prospecting-pipeline |
| Competitor customers | Already buying similar solutions | customer-discovery |

### Step 2 — Run Signal Detection
For each active signal source, execute the relevant capability skill.
Document: Company, Signal Type, Signal Date, Context.

### Step 3 — Qualify Leads
Score each prospect against ICP criteria:
- **High intent**: Job posting + funding signal (2+ signals)
- **Medium intent**: LinkedIn engagement OR conference attendance
- **Low intent**: Single social mention

Filter out exclusion criteria. Pass only High and Medium intent leads forward.

**⚠ Human checkpoint: Review qualified list before proceeding.**

### Step 4 — Find Decision-Maker Contacts
For each qualified company, find the specific person to reach:
- Use LinkedIn to identify correct title
- Use WebSearch for email patterns: `[name] [company] email` or `@[domain]`
- Verify email format with hunter.io or similar

### Step 5 — Deduplicate
Check against prior outreach log. Enforce minimum 84-day cooldown on re-contact.

### Step 6 — Personalise Outreach
For each lead, write personalised first line referencing:
- The specific signal that triggered inclusion
- A concrete pain point from the ICP persona
- A specific, credible value claim (not generic)

**⚠ Human checkpoint: Review personalisation quality before sending.**

### Step 7 — Launch Campaign
Default sequence structure:
- Email 1 (Day 1): Signal-aware cold intro
- Email 2 (Day 5): Value-forward follow-up, different angle
- Email 3 (Day 12): Breakup email with soft CTA

### Step 8 — Monitor Results
Track: open rate, reply rate, positive reply rate, meetings booked.
Review weekly. Adjust subject lines and messaging based on patterns.

## Maintenance Cadence
- Weekly: Re-run signal detection
- Bi-weekly: Review campaign performance
- Monthly: Strategic assessment — ICP refinement, new signal sources

## Critical Rules
- Multi-signal leads always take priority
- Never send without human review of personalisation
- 84-day cooldown is non-negotiable
