---
name: event-prospecting-pipeline
type: playbook
source: gooseworks-ai/goose-skills
description: Discover qualified leads from conferences and industry events. Find attendees/speakers, filter against ICP, locate contacts, and prepare targeted outreach.
tags: [gtm, events, prospecting, lead-generation]
---

# Event Prospecting Pipeline

## When to Use
- "Find leads from [event name/URL]"
- "Who is attending [conference]?"
- "Identify decision-makers at [industry event]"

## The 7-Step Pipeline

### Step 1 — Discover the Event
Input: Event name, URL, or topic area.

If topic given (no specific event):
- Search: `[topic] conference 2025 2026`
- Search: `[topic] summit event speakers attendees`
- Search: `luma [topic]` for smaller community events

Collect: Event name, date, URL, target audience description.

### Step 2 — Find Attendees / Speakers
Sources to check (in order of reliability):
1. Official speaker/attendee page on event website
2. Conference app (Whova, Hopin, etc.) — search event app
3. LinkedIn: search `[event name] [year]` in posts
4. Twitter/X: search event hashtag
5. YouTube: find session recordings → presenter names

Output: Name | Company | Title | Evidence Source

### Step 3 — Research Companies
For each company in the attendee list:
- Quick web search to confirm they match ICP
- Check company size, industry, relevant signals

### Step 4 — Filter Against ICP
Apply ICP inclusion/exclusion criteria.
Score each prospect 1–3 (3 = strong ICP fit + decision-maker title).

### Step 5 — Find Contact Information
For each qualified prospect:
- LinkedIn profile URL
- Email (search pattern: `[firstname] [lastname] [company] email`)
- Common patterns: firstname@domain, f.lastname@domain

### Step 6 — Deduplicate
Cross-reference against any existing outreach history.
Remove anyone contacted within 84 days.

### Step 7 — Export + Optional Outreach
Export as CSV: Name | Company | Title | Email | LinkedIn | ICP Score | Event | Outreach Angle

If launching outreach:
- Personalise first line with event reference: "I saw you spoke at / attended [event]..."
- Connect outreach angle to a specific ICP pain point

**⚠ Human checkpoint: Review before sending any outreach.**

## High-Value Events for CX / Digital Transformation ICP
- Qualtrics X4 Summit
- CXPA Insight Exchange
- Gartner Customer Experience & Technologies Summit
- NICE Interactions
- Forrester CX North America
- Service Design Network Global Conference
- European Customer Experience Conference
- Local CMO/CDO roundtables and CXPA chapter events
