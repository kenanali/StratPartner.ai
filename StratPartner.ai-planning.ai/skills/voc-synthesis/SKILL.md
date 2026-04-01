---
slug: voc-synthesis
name: VoC Synthesis
description: Synthesize raw customer feedback data into strategic themes, sentiment patterns, and actionable implications. Takes uploaded feedback (NPS verbatims, interview transcripts, support themes, review data) and produces a structured Voice of Customer brief.
track: research
triggers:
  - "what are customers saying"
  - "voc"
  - "voice of customer"
  - "synthesize customer feedback"
  - "customer feedback themes"
  - "NPS verbatims"
  - "customer sentiment"
auto-save: true
---

# VoC Synthesis

## Purpose

Voice of Customer Synthesis takes raw customer feedback — in whatever form it exists — and transforms it into strategic intelligence. Not a summary of what customers said. An analysis of what they mean, what tensions it reveals, and what it implies for the CX program.

This skill is distinct from `synthesize`, which synthesizes strategic research outputs across frameworks. VoC Synthesis works specifically with raw customer voice data: verbatim quotes, ratings, interview excerpts, support ticket themes, review content. It gives you the customer's unfiltered perspective before you layer your strategic interpretation on top.

**When to use:** Before running persona-build, journey-map, or synthesize. When you have customer data and need to understand what it's telling you before you decide what to do about it.

---

## Inputs Required

Before running, confirm you have at least one of the following:
- NPS or CSAT verbatim responses (pasted text or uploaded file)
- Customer interview transcripts or summaries
- Support ticket theme summaries or contact reason data
- Review excerpts (G2, Capterra, internal surveys, social)
- Churn survey responses

Also ask:
- What is the client's product or service?
- What time period does this data cover?
- Are there specific customer segments to analyse separately (enterprise vs. SMB, new vs. tenured, etc.)?
- Is there a specific hypothesis or question the client is trying to answer?

If no data has been provided, ask the client to upload it before proceeding. Do not fabricate or invent customer feedback.

---

## Phase 1: Data Inventory

Acknowledge what data you have received. For each source:
- Source name (NPS Q3 2024, Churn Survey, G2 Reviews, etc.)
- Volume (how many responses / data points)
- Time period
- Customer segment (if known)

Flag any gaps: "I notice you have NPS verbatims but no post-churn data — this means the analysis will reflect current customers' perspectives, not lost customers'."

---

## Phase 2: Theme Clustering

Read through all feedback and identify recurring themes. A theme qualifies if:
- It appears in 3+ distinct feedback items, OR
- It appears in fewer items but with high emotional intensity, OR
- It represents a single extreme case that is strategically significant

For each theme, record:
1. **Theme name** (concise, active: "Slow onboarding kills momentum")
2. **Frequency** (how many feedback items reference this)
3. **Sentiment** (Positive / Neutral / Negative / Critical)
4. **Trend** (if data covers multiple periods: growing / stable / declining)
5. **Representative quotes** (2-3 verbatim quotes that best capture the theme — keep them verbatim, not paraphrased)
6. **Affected segments** (if discernible from data)

Do not collapse different problems into a single theme to make the list shorter. Be specific. "Support is slow" and "Support gives wrong answers" are different themes even if both are about support.

---

## Phase 3: Sentiment Overview

Provide a structured sentiment breakdown:

```
OVERALL SENTIMENT
Positive: [%] — [primary driver]
Neutral: [%] — [primary driver]
Negative: [%] — [primary driver]
Critical (churn threat): [%] — [primary driver]

BY SEGMENT (if data supports this)
[Segment A]: [sentiment distribution]
[Segment B]: [sentiment distribution]

TREND (if multi-period data available)
[Direction and what's driving it]
```

Be precise. If you cannot calculate percentages because the data doesn't support it, say so and give qualitative directional reads instead.

---

## Phase 4: Strategic Analysis

This is where VoC Synthesis becomes more than a summary.

**What customers value most:**
What do the positive themes tell you about what's actually working and why customers stay? Frame this in terms of outcomes, not features.

**What's most at risk:**
Which negative themes represent the highest likelihood of driving churn or reducing advocacy? Consider both frequency and severity.

**What's being asked for but not heard:**
What feature requests, service requests, or experience expectations appear repeatedly but don't seem to be on the company's radar?

**Tensions in the feedback:**
Where do different customer segments contradict each other? Where does positive feedback in one area mask a problem in another? Example: "Customers love the product but hate the implementation — the product is being given credit for work the customer did themselves."

**The thing nobody's saying (but the data implies):**
What inference can you draw from the pattern of what's mentioned and what's absent? A good VoC analyst notices what customers don't complain about because they've given up expecting better.

---

## Output Format

```markdown
## VoC Synthesis: [Client/Org Name]
*stratpartner.ai · [Date]*

**Data sources:** [list] · **Total feedback items:** [n] · **Period:** [date range]

---

### Theme Analysis

| Theme | Frequency | Sentiment | Representative Quote |
|-------|-----------|-----------|---------------------|
| [Theme 1] | [n items] | [Negative] | "[verbatim quote]" |
| [Theme 2] | [n items] | [Positive] | "[verbatim quote]" |
| ... | | | |

---

### Sentiment Overview
[Structured breakdown as per Phase 3]

---

### Strategic Analysis

**What customers value most**
[2-3 paragraphs]

**What's most at risk**
[2-3 paragraphs]

**What's being asked for but not heard**
[1-2 paragraphs]

**Tensions in the data**
[1-2 paragraphs]

**The thing nobody's saying**
[1 paragraph — the analyst's inference]

---

### Implications for [Project / Program Name]
[3-5 specific, direct implications for the client's CX program — not generic recommendations]

---

*What I now know:*
- [New piece of strategic intelligence 1]
- [New piece of strategic intelligence 2]
- [New piece of strategic intelligence 3]

*Suggested next step:* [One concrete recommendation — which skill to run next, or what decision to make]
```

---

## Quality Standards

- Never paraphrase quotes — always use the customer's exact words when citing evidence
- Never extrapolate beyond what the data supports — flag when you're inferring vs. reporting
- If the feedback is uniformly positive (rare but possible), say so and note the risk: "Either this data source has selection bias or there's a genuine satisfaction story here — you'd want to validate against churn and NPS trend data"
- If different segments tell contradictory stories, do not average them — report both truths and flag the tension
- The "Tensions" and "Thing nobody's saying" sections are where your value shows. Do not skip them.
