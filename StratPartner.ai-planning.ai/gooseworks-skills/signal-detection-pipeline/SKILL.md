---
name: signal-detection-pipeline
type: playbook
source: gooseworks-ai/goose-skills
description: Monitor multiple signal sources (job postings, funding, LinkedIn, Reddit, conferences) to find companies actively in-market. Combines signals for higher-confidence leads.
tags: [gtm, signals, lead-generation, outbound]
---

# Signal Detection Pipeline

## When to Use
- "Find companies that might need [our product]"
- "Run signal detection for [problem area]"
- "Find buying signals in [industry/topic]"

## Signal Sources

Run relevant sources in parallel. Each is independent.

### Job Posting Signals (Strongest Signal)
Companies hiring for roles in the problem area = budget allocated and pain acknowledged.
- Search: `site:linkedin.com/jobs [role keywords] [industry]`
- Also: `site:lever.co OR site:greenhouse.io [role keywords]`
- Output: Company name, role, posting date, outreach angle

### Funding Signals
Recently funded companies = budget available, growth mandate.
- Search: `[industry] startup funding announcement 2025 2026`
- Also check: Crunchbase, TechCrunch funding rounds
- Filter: Seed to Series B most likely to be early adopters
- Output: Company, round size, date, focus area

### Conference Attendance Signals
People attending events in the problem space = actively engaged.
- Find relevant upcoming events via WebSearch
- Look for speaker lists, attendee lists, Luma pages
- Output: Person name, company, role, event attended

### Reddit Pain Signals
People complaining about or discussing the problem = experiencing it now.
- Search relevant subreddits for problem keywords
- Look for posts asking "how do you handle X?" or "frustrated with Y"
- Output: Post author, company (if identifiable), pain context

### LinkedIn Content Signals
People posting about or engaging with the problem = thought leaders or active practitioners.
- Search: `site:linkedin.com/posts [problem keywords]`
- Look at commenters on influential posts in the space
- Output: Person, company, engagement context

## Combining Signals

After running sources:

1. **Deduplicate** — companies appearing in multiple signals are highest priority
2. **Score** each lead:
   - Job posting + funding = highest intent
   - LinkedIn post + Reddit complaint = validated pain
   - Single conference attendance = lowest (awareness only)
3. **Enrich** top leads with a web search for company background
4. **Consolidate** into a table: Company | Signal Sources | Signal Strength | Context | Outreach Angle

## ⚠ Human Checkpoint
Review consolidated list before passing to outreach. Confirm:
- Company fits ICP
- Signal is recent (< 60 days ideally)
- Outreach angle is specific and credible
