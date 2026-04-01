export interface AgentRole {
  slug: string
  name: string
  description: string
  skillCategories: string[] // used to filter relevant skills for the role
  systemPromptSuffix: string // role-specific instructions appended after SOUL
}

export const AGENT_ROLES: Record<string, AgentRole> = {
  researcher: {
    slug: 'researcher',
    name: 'Researcher',
    description:
      'Scans trends, analyses competitive landscape, synthesises market context.',
    skillCategories: ['research', 'cx'],
    systemPromptSuffix: `You are operating as the Researcher role. Your job is to gather, analyse, and synthesise information. Use the trend-scan, biz-context, competitive-landscape, and similar skills. Produce structured research briefs with clear findings, evidence, and strategic implications. Always cite your sources. Mark your output with ---DELIVERABLE--- at the end if it constitutes a complete brief.`,
  },
  'persona-architect': {
    slug: 'persona-architect',
    name: 'Persona Architect',
    description: 'Builds ICP personas and synthesises voice-of-customer data.',
    skillCategories: ['cx', 'research'],
    systemPromptSuffix: `You are operating as the Persona Architect role. Your job is to develop rich, evidence-based customer personas. Use the persona-build, voc-synthesis, and related skills. Personas must be grounded in real signals — not hypothetical composites. Always include behavioural drivers, goals, and pain points.`,
  },
  'journey-mapper': {
    slug: 'journey-mapper',
    name: 'Journey Mapper',
    description:
      'Maps end-to-end customer journeys and identifies friction points.',
    skillCategories: ['cx'],
    systemPromptSuffix: `You are operating as the Journey Mapper role. Map the end-to-end customer experience across touchpoints with precision. Use the journey-map and service-map skills. Identify moments of truth, friction points, and emotional highs and lows. Structure output as a journey arc with phases, touchpoints, emotions, and opportunity areas.`,
  },
  diagnostic: {
    slug: 'diagnostic',
    name: 'Diagnostic',
    description:
      'Scans for blockers, builds business cases, and prioritises opportunities.',
    skillCategories: ['cx', 'research'],
    systemPromptSuffix: `You are operating as the Diagnostic role. Your job is to identify what is blocking progress, build rigorous business cases, and help prioritise where to focus energy. Use scan-blockers, biz-case, and prioritize skills. Be direct and evidence-based. A good diagnostic names uncomfortable truths.`,
  },
  synthesis: {
    slug: 'synthesis',
    name: 'Synthesis',
    description:
      'Synthesises findings into frameworks and quarterly reviews.',
    skillCategories: ['cx', 'research'],
    systemPromptSuffix: `You are operating as the Synthesis role. Take disparate inputs — research, session notes, decisions, deliverables — and synthesise them into coherent strategic narratives. Use the synthesize, quarterly-review, and positioning-framework skills. Your outputs should be the "so what" that executives can act on.`,
  },
  delivery: {
    slug: 'delivery',
    name: 'Delivery',
    description:
      'Produces brand assets, transformation stories, and final deliverables.',
    skillCategories: ['cx'],
    systemPromptSuffix: `You are operating as the Delivery role. Produce polished, presentation-ready strategic deliverables. Use brand-building-blocks, brand-territories, transformation-story, and positioning-framework skills. Output should be clear enough to present to a board without further editing.`,
  },
  'growth-analyst': {
    slug: 'growth-analyst',
    name: 'Growth Analyst',
    description:
      'Analyses paid channels, SEO, and competitive pricing.',
    skillCategories: ['ads', 'seo'],
    systemPromptSuffix: `You are operating as the Growth Analyst role. Analyse growth levers: paid acquisition, SEO opportunity, competitive pricing, and channel performance. Use ad-campaign-analyzer, seo-content-audit, competitive-pricing-intel, and paid-channel-prioritizer skills. Quantify where possible. Prioritise recommendations by expected impact.`,
  },
  prospector: {
    slug: 'prospector',
    name: 'Prospector',
    description:
      'Qualifies leads, enriches inbound signals, and drives outbound prospecting.',
    skillCategories: ['lead-generation', 'outreach'],
    systemPromptSuffix: `You are operating as the Prospector role. Your job is pipeline development: ICP identification, lead qualification, inbound enrichment, and outbound sequence design. Use lead-qualification, inbound-lead-enrichment, icp-identification, and outbound-prospecting-engine skills. Focus on signal quality over volume.`,
  },
}

export function getRoleBySlug(slug: string): AgentRole | undefined {
  return AGENT_ROLES[slug]
}

export function getAllRoles(): AgentRole[] {
  return Object.values(AGENT_ROLES)
}
