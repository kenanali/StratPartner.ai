---
slug: retention-risk-scan
name: Retention Risk Scan
description: Identify which customer segments are most at risk of churn and why. Analyses client-provided data (NPS scores, support themes, usage patterns, churn interviews) to produce a risk-tiered account map, root cause hypotheses, and specific intervention plays.
track: cx
triggers:
  - "retention risk"
  - "churn risk"
  - "at-risk customers"
  - "who might churn"
  - "customer health"
  - "who are we about to lose"
  - "retention analysis"
auto-save: true
---

# Retention Risk Scan

## Purpose

Most CX programs spend 80% of their time on acquisition experience and 20% on retention — even when the data says retention is where the economic value lives. Retention Risk Scan flips the lens: it looks at the customer base systematically to identify who is at risk, why, and what can be done about it before they leave.

This skill works from data the client provides. It does not connect to live systems. It produces a risk assessment — not a monitoring system. The output is a strategic brief that informs CX program priorities, not a weekly operational dashboard.

**When to use:** When the client is running a CX transformation and needs to understand where retention risk is concentrated before designing interventions. When NPS is declining and you need to understand the pattern. When churn is happening and leadership wants to know why.

---

## Inputs Required

Confirm what data you have available. Any combination works, but more data produces a more precise analysis:

**Quantitative signals (ask client to provide where possible):**
- NPS scores by segment, cohort, or time period
- CSAT scores (support, onboarding, or product-specific)
- Churn rate by segment or product line (if known)
- Usage metrics (if client can summarise: what declining usage looks like)
- Contract renewal data (renewal rate, discount requests)

**Qualitative signals:**
- Churn interview summaries or verbatims
- Support ticket themes (top contact reasons, escalation patterns)
- Sales-to-CS handoff notes (what was promised vs. what was delivered)
- NPS verbatims (especially detractors and passives)
- Account manager notes on at-risk accounts

**Context:**
- Client company type, product, and customer segments
- Average contract value and contract length
- Definition of "at risk" in this business (is it no logins for 30 days? Low NPS? A support ticket?)
- Are there any accounts the client already knows are at risk?

If data is limited, say so explicitly and note what the analysis can and cannot claim with confidence.

---

## Phase 1: Signal Inventory

List all signals available:
- Source, type, coverage period, segment coverage
- Volume of data (how many accounts, how many feedback items)
- Confidence level (high / medium / low — based on how representative the data is)

Flag what's missing: "You have NPS verbatims but no usage data — this means I can identify why customers are unhappy but not which ones are showing behavioural churn signals."

---

## Phase 2: Risk Signal Extraction

From the available data, identify the specific signals that indicate elevated churn risk. Categorise by signal type:

**Experience signals (from VoC / NPS data):**
- Detractor and passive themes (what unhappy customers are saying)
- Escalating sentiment (scores declining over time or across cohorts)
- Specific pain points with high frequency AND high emotional intensity
- Silence (customers who have stopped engaging with surveys — often more at-risk than vocal detractors)

**Relationship signals (from CS / account data):**
- Champion departure (key stakeholder has left the account)
- Engagement gaps (no contact for 60+ days in an active account)
- Scope creep complaints (client feels they're not getting what was promised)
- Discount requests or contract renegotiation attempts

**Outcome signals (from usage / business data):**
- Declining activation or feature adoption
- Reduced seat usage in a seat-based model
- Support escalations increasing
- Failure to reach stated business outcomes

For each signal identified, note: signal type, source, affected segment(s), and severity (Critical / High / Medium / Low).

---

## Phase 3: Risk Tiers

Organise the client's customer base into risk tiers based on signal concentration. Use the data you have — if you can get segment-level precision, use it. If you can only work at the level of customer type or cohort, work at that level.

**Red (Critical — act this week):**
Accounts or segments where multiple high-severity signals are present simultaneously. Intervention required immediately.

**Orange (Elevated — act within 30 days):**
Accounts or segments with 2-3 medium-to-high signals. On a trajectory toward Red if not addressed.

**Yellow (Early warning — monitor):**
Single signals or low-severity patterns. Worth watching and probing in next QBR or check-in.

**Green (Healthy):**
No significant risk signals. Routine relationship management.

For each tier, describe: what signals define it, which segment or customer type is most represented there, and the estimated proportion of the customer base in each tier (where data supports this).

---

## Phase 4: Root Cause Analysis

For each risk tier, develop a root cause hypothesis. What is actually causing these signals?

Structure the root cause analysis around three levels:

**Surface cause** (what the customer says): "The product is hard to use." "Implementation took too long." "We're not getting ROI."

**Operational cause** (what's happening in the business): Inadequate implementation support. CSM-to-account ratio too high. Onboarding handoff breaks down at the 30-day mark.

**Systemic cause** (what's driving the operational failure): No post-sales playbook. CSM team inherited accounts with no context from sales. Leadership KPIs incentivise new logos over retention.

Do not stay at the surface cause level. That's where all CX programs get stuck.

---

## Phase 5: Intervention Plays

For each risk tier, recommend specific interventions. Be concrete — not "improve the onboarding experience" but "conduct a structured re-onboarding call with the economic buyer, not just the operational contact, within the next 14 days."

**For Red accounts:**
Specific, immediate actions. Who should do what, with whom, and by when.

**For Orange accounts:**
Proactive interventions to prevent escalation to Red. Playbook-level recommendations.

**For Yellow accounts:**
Monitoring approach and triggers that would move an account to Orange.

**For systemic issues:**
If the same root cause is driving risk across multiple tiers, flag it as a systemic CX program priority. Recommend whether this is a process fix, a tooling fix, a people/capacity fix, or a product fix.

---

## Output Format

```markdown
## Retention Risk Scan: [Client Name]
*stratpartner.ai · [Date]*

**Data sources used:** [list]
**Coverage:** [segments / cohorts / time period]
**Confidence level:** [High / Medium / Limited — and why]

---

### Signal Summary

| Signal | Type | Severity | Affected Segment |
|--------|------|----------|-----------------|
| [Signal 1] | Experience | Critical | [Segment] |
| [Signal 2] | Relationship | High | [Segment] |
| ... | | | |

---

### Risk Tier Map

**🔴 Red — Critical ([estimate]% of customer base)**
[Description of which accounts/segments are here and why]
[Key signals present]

**🟠 Orange — Elevated ([estimate]% of customer base)**
[Description]

**🟡 Yellow — Early Warning ([estimate]% of customer base)**
[Description]

**🟢 Green — Healthy ([estimate]% of customer base)**
[Description]

---

### Root Cause Analysis

**Red tier root causes**
Surface: [what customers say]
Operational: [what's failing]
Systemic: [why it's failing]

**Patterns across tiers**
[If there's a systemic cause driving multiple risk tiers, surface it here]

---

### Intervention Plays

**For Red accounts — act this week**
1. [Specific play] — [who does what, with whom, by when]
2. ...

**For Orange accounts — act within 30 days**
1. [Proactive play]
2. ...

**For systemic issues — CX program recommendation**
[What needs to change structurally and why]

---

*What I now know:*
- [Retention intelligence insight 1]
- [Retention intelligence insight 2]
- [Retention intelligence insight 3]

*Suggested next step:* [Specific recommendation — e.g., run /scan-blockers on the onboarding process, or run /biz-case to quantify the revenue at risk]
```

---

## Quality Standards

- Risk tiers must be based on signal evidence, not intuition. Cite the data.
- Root cause analysis must go at least two levels deep. "Poor onboarding" is not a root cause — it's a symptom.
- Intervention plays must be specific enough for a CS leader to act on tomorrow. Vague recommendations are worse than no recommendations.
- If the data genuinely isn't sufficient to make confident tier assignments, say so — and explain what data would resolve the uncertainty. A partially evidenced analysis is still useful. An overconfident analysis is dangerous.
- Always flag the revenue implication of the Red tier where data supports it. Risk becomes real to leadership when it's attached to a number.
