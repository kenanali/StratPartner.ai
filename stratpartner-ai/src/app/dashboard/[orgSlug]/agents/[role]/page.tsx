import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect, notFound } from 'next/navigation'
import AgentDetailTabs from './AgentDetailTabs'

interface PageProps {
  params: { orgSlug: string; role: string }
}

const AGENT_ROLES = [
  {
    slug: 'researcher',
    name: 'Researcher',
    description: 'Scans trends, analyses competitive landscape, synthesises market context.',
    skillCategories: ['research', 'cx'],
  },
  {
    slug: 'persona-architect',
    name: 'Persona Architect',
    description: 'Builds ICP personas and synthesises voice-of-customer data.',
    skillCategories: ['cx', 'research'],
  },
  {
    slug: 'journey-mapper',
    name: 'Journey Mapper',
    description: 'Maps end-to-end customer journeys and identifies friction points.',
    skillCategories: ['cx'],
  },
  {
    slug: 'diagnostic',
    name: 'Diagnostic',
    description: 'Scans for blockers, builds business cases, and prioritises opportunities.',
    skillCategories: ['cx', 'research'],
  },
  {
    slug: 'synthesis',
    name: 'Synthesis',
    description: 'Synthesises findings into frameworks and quarterly reviews.',
    skillCategories: ['cx', 'research'],
  },
  {
    slug: 'delivery',
    name: 'Delivery',
    description: 'Produces brand assets, transformation stories, and final deliverables.',
    skillCategories: ['cx'],
  },
  {
    slug: 'growth-analyst',
    name: 'Growth Analyst',
    description: 'Analyses paid channels, SEO, and competitive pricing.',
    skillCategories: ['ads', 'seo'],
  },
  {
    slug: 'prospector',
    name: 'Prospector',
    description: 'Qualifies leads, enriches inbound signals, and drives outbound prospecting.',
    skillCategories: ['lead-generation', 'outreach'],
  },
]

export default async function AgentDetailPage({ params }: PageProps) {
  const roleConfig = AGENT_ROLES.find((r) => r.slug === params.role)
  if (!roleConfig) notFound()

  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('slug', params.orgSlug)
    .single()

  if (!org) redirect('/')

  type RunRow = {
    id: string
    status: string
    tokens_used: number | null
    started_at: string | null
    completed_at: string | null
    created_at: string
    tasks: { title: string } | null
    deliverables: { title: string } | null
  }

  let runs: RunRow[] = []
  try {
    const { data, error } = await supabase
      .from('agent_runs')
      .select('id, status, tokens_used, started_at, completed_at, created_at, tasks(title), deliverables(title)')
      .eq('org_id', org.id)
      .eq('agent_role', params.role)
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error) runs = (data ?? []) as unknown as RunRow[]
  } catch {
    // table may not exist yet
  }

  return (
    <div className="p-8">
      <AgentDetailTabs
        runs={runs}
        roleName={roleConfig.name}
        roleDescription={roleConfig.description}
        skillCategories={roleConfig.skillCategories}
        orgSlug={params.orgSlug}
      />
    </div>
  )
}
