---
name: company-current-gtm-analysis
type: composite
source: gooseworks-ai/goose-skills
description: Deep-research audit of a company's current GTM motion across 14 dimensions. Identifies what's working, what's missing, and highest-leverage white space opportunities.
tags: [gtm, research, strategy, audit]
---

# Company Current GTM Analysis

## When to Use
- "Audit my own GTM"
- "What is [competitor] doing for GTM?"
- "Analyse the go-to-market strategy of [company]"

## Input
- Company name
- Website URL
- Optional: known channels, target ICP

## The 7 Parallel Research Threads

Run these simultaneously via WebSearch and WebFetch:

### Thread 1 — Blog & Content
- Fetch blog page, catalog last 10–20 posts
- Note: topics covered, content types (how-to, thought leadership, case studies, data), posting frequency
- Assess: funnel coverage (awareness vs. consideration vs. decision)

### Thread 2 — Founder / Team LinkedIn
- Search: `[founder name] linkedin`
- Note: posting frequency, engagement levels, topics, whether thought leadership is active
- A quiet founder LinkedIn = untapped distribution channel

### Thread 3 — SEO & Traffic
- Search: `[company] traffic site:similarweb.com` or `site:semrush.com`
- Look for: estimated monthly visits, top organic keywords, any paid ad presence
- Check: `[company] site:ahrefs.com`

### Thread 4 — Hiring Signals
- Search: `[company] jobs careers`
- Check LinkedIn Jobs, their careers page
- Note: which departments are hiring, senior hires in past 6 months
- Hiring = investment signal; what they hire reveals strategic direction

### Thread 5 — Social Media Presence
- Twitter/X: search `[company]`, check posting frequency and engagement
- Reddit: `site:reddit.com [company name]` — what do people say?
- YouTube: any video content?
- Product Hunt: any launches?

### Thread 6 — Podcast & Earned Media
- Search: `[company] podcast interview`
- Search: `[company name] [founder name] press`
- Note: which shows, what topics, how recent

### Thread 7 — Customer Acquisition Signals
- G2 / Capterra: rating, review volume, review recency
- Customer logos on website
- Case studies: industries, company sizes represented
- Referral or affiliate programs

## Deliverable Format

```
## GTM Analysis: [Company Name]
**Primary GTM Motion:** [content / outbound / community / PLG / sales-led / etc.]

### Channel Scorecard
| Channel | Grade | Notes |
|---------|-------|-------|
| Content / SEO | | |
| Founder LinkedIn | | |
| Cold Outbound | | |
| Paid Ads | | |
| Community | | |
| Events / Speaking | | |
| Partnerships | | |

### What's Working
[2–3 specific observations with evidence]

### Critical Gaps
[What they're not doing that their ICP would respond to]

### White Space Opportunities
[Ranked by: Impact × Effort. Be specific — "own the CX transformation LinkedIn conversation" not "do more content"]

### Competitive Positioning Map
[How they sit relative to 2–3 alternatives the ICP considers]
```

## Grading Guidance
Grade relative to company stage — a 10-person startup with a B+ content operation is different from a Series B with a C+.
- A: Best-in-class for stage; clear competitive moat
- B: Solid execution; room for improvement
- C: Present but inconsistent; not a source of advantage
- D: Weak; likely a drag on growth
- F: Absent entirely
