---
name: cold-email-outreach
type: capability
source: gooseworks-ai/goose-skills
description: Build and execute cold email sequences. Generates personalised multi-touch sequences, enforces cooldown rules, and logs all outreach activity.
tags: [outbound, email, outreach, gtm]
---

# Cold Email Outreach

## When to Use
- "Write cold emails for these leads"
- "Create an outreach sequence for [persona]"
- "Draft follow-up emails for [campaign]"

## Pre-Flight Checklist
Before writing a single email, confirm:
- [ ] ICP persona is defined (reference icp-persona-builder output)
- [ ] Lead list is qualified (reference signal-detection or outbound-prospecting output)
- [ ] Cooldown check done (no one contacted within 84 days)
- [ ] Value proposition is specific — not "we help companies improve CX"

## Sequence Architecture

Default 3-touch sequence:

**Email 1 (Day 1) — Signal-aware cold intro**
Structure:
- Line 1: Specific personalisation (reference the signal that triggered outreach)
- Line 2–3: Name the exact pain you suspect they have (in their language)
- Line 4–5: One specific, credible claim about what you do
- CTA: Low-friction ask (15-min call, or a yes/no question)

Length: 4–6 lines. No more.

**Email 2 (Day 5) — Value-forward, different angle**
Structure:
- Don't re-summarise Email 1
- Lead with a new angle: a relevant insight, a stat, a short example
- Restate CTA differently

Length: 3–5 lines.

**Email 3 (Day 12) — Breakup email**
Structure:
- Acknowledge they're busy / this may not be relevant now
- Leave one final low-friction hook
- Make it easy to say "not now but maybe later"

Length: 2–3 lines.

## Personalisation Depth Levels
- **Level 1 (Generic)**: Merge fields only — name, company, title
- **Level 2 (Signal-aware)**: Reference the specific signal (job posting, event, LinkedIn post)
- **Level 3 (Deep)**: Signal + specific pain observed from their public presence

Always aim for Level 2 minimum. Level 3 for top-priority leads.

## Email Quality Rules
- No buzzwords: "leverage", "synergy", "game-changing", "cutting-edge"
- No feature lists in first email
- No "I hope this finds you well"
- Subject lines: specific > clever. "CX strategy tooling" > "Quick question"
- First line must NOT start with "I" or "My name is"

## Logging
After any outreach is sent, record:
- Date sent
- Lead name + company
- Email used
- Sequence stage
- Response (if any)

**⚠ 84-day cooldown rule: Never contact the same person within 84 days of last outreach. This is non-negotiable.**

## For Founders/Early Stage (No CRM)
Use a simple Google Sheet or Notion table:
| Name | Company | Email | Date Sent | Stage | Response | Next Action |
