---
name: icp-persona-builder
type: capability
source: gooseworks-ai/goose-skills
description: Build 4-6 detailed synthetic buyer personas through web research. Each persona includes demographics, motivations, skepticism profile, decision criteria, and exact language patterns. Saves as reusable client asset.
tags: [research, persona, icp]
---

# ICP Persona Builder

## When to Use
- "Build personas for my buyers"
- "Who is my ideal customer and what do they care about?"
- "Create buyer profiles for [company/product]"

## Quick Start
- Basic: "Build ICP personas for [company]. Their site is [url]."
- Known segments: "Build personas for [company]. Their ICPs are: [ICP 1], [ICP 2]."

## Phase 1 — Company Research
Use WebSearch and WebFetch to gather:
- Homepage, product pages, pricing page
- Customer case studies and testimonials
- G2 / Capterra / Trustpilot reviews (search: `site:g2.com [product name]`)
- Competitor comparison pages
- Job postings (reveals buyer language and org structure)

## Phase 2 — Segment Identification
Extract 4–6 distinct buyer segments. For each, define:
- Role / title range
- Company profile (size, industry, stage)
- Core pain points
- Buying triggers (what causes them to look for a solution NOW)
- Decision criteria (what they evaluate)
- Sophistication level (novice / intermediate / expert)

## Phase 3 — Persona Development
For each segment, create a named, realistic persona with:

```
Name: [Fictional name]
Title: [Specific title]
Company: [Fictional company matching segment profile]

Situation: [2-3 sentences on their current context]

Jobs to be Done:
  - Functional: [what they need to accomplish]
  - Emotional: [how they want to feel]
  - Social: [how they want to be perceived]

Pain Points: [top 3, in their language]
Buying Triggers: [what causes them to act]
Skepticism Profile: [what objections they raise, why they hesitate]
Decision Criteria: [how they evaluate options]
Success Metrics: [how they'll know it worked]

Language Patterns:
  - Words they use to describe the problem: [...]
  - Words they'd use to describe the ideal solution: [...]
  - Words that repel them: [...]
```

## Phase 4 — Asset Storage
Save personas as:
- `personas/[company]-personas.md` — human-readable markdown
- Reference in all downstream skills (outreach copy, journey maps, etc.)

## Critical Rules
- Use their language, not vendor language
- Skepticism profiles are as important as motivations — include both
- Never create generic personas (e.g. "Marketing Manager") — be specific
