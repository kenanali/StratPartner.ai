---
name: icp-identification
type: capability
source: gooseworks-ai/goose-skills
description: Research a company or product and define a precise Ideal Customer Profile with inclusion/exclusion criteria. Routes to TAM mapping or immediate lead finding.
tags: [research, icp, lead-generation]
---

# ICP Identification

## When to Use
- "Who should I target?"
- "Define my ICP"
- "Who is the ideal buyer for [product]?"

## Phase 0 — Gather Context
Ask the user for:
- Product / service description
- Current customers (if any) — who they are, what problem they solved
- Pricing tier (ballpark)
- Who to explicitly exclude

## Phase 1 — Research
Use WebSearch to investigate:
- The company/product website (homepage, pricing, use cases)
- Customer reviews and case studies
- Competitor positioning and their stated ICPs
- Job postings referencing the buyer persona
- LinkedIn profiles of current customers (if known)

Validate findings with the user before proceeding.

## Phase 2 — Define ICP
Produce a structured ICP table:

| Dimension | Inclusion Criteria | Exclusion Criteria |
|-----------|-------------------|--------------------|
| Job Titles | | |
| Seniority Level | | |
| Company Size | | |
| Industry / Verticals | | |
| Geography | | |
| Buying Signals | | |
| Tech Stack / Tools Used | | |

Be specific. "Senior leader" is not an ICP. "Head of CX or VP Customer Experience at a 500–5000 person professional services or financial services firm" is.

## Phase 3 — Choose Path
After ICP is confirmed, offer:
- **Map TAM** → estimate total addressable market size
- **Find Leads Now** → immediately run prospecting against defined criteria

## Critical Rules
- Never assume ICP without research
- Always get user confirmation before passing to downstream skills
- Specificity in exclusions prevents noisy lead lists downstream
