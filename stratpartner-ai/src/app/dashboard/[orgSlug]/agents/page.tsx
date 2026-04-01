import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: { orgSlug: string }
}

const AGENT_ROLES = [
  {
    slug: 'researcher',
    name: 'Researcher',
    description: 'Scans trends, analyses competitive landscape, synthesises market context.',
    icon: '🔍',
    skillCategories: ['research', 'cx'],
  },
  {
    slug: 'persona-architect',
    name: 'Persona Architect',
    description: 'Builds ICP personas and synthesises voice-of-customer data.',
    icon: '👤',
    skillCategories: ['cx', 'research'],
  },
  {
    slug: 'journey-mapper',
    name: 'Journey Mapper',
    description: 'Maps end-to-end customer journeys and identifies friction points.',
    icon: '🗺',
    skillCategories: ['cx'],
  },
  {
    slug: 'diagnostic',
    name: 'Diagnostic',
    description: 'Scans for blockers, builds business cases, and prioritises opportunities.',
    icon: '🔬',
    skillCategories: ['cx', 'research'],
  },
  {
    slug: 'synthesis',
    name: 'Synthesis',
    description: 'Synthesises findings into frameworks and quarterly reviews.',
    icon: '💡',
    skillCategories: ['cx', 'research'],
  },
  {
    slug: 'delivery',
    name: 'Delivery',
    description: 'Produces brand assets, transformation stories, and final deliverables.',
    icon: '📦',
    skillCategories: ['cx'],
  },
  {
    slug: 'growth-analyst',
    name: 'Growth Analyst',
    description: 'Analyses paid channels, SEO, and competitive pricing.',
    icon: '📈',
    skillCategories: ['ads', 'seo'],
  },
  {
    slug: 'prospector',
    name: 'Prospector',
    description: 'Qualifies leads, enriches inbound signals, and drives outbound prospecting.',
    icon: '🎯',
    skillCategories: ['lead-generation', 'outreach'],
  },
]

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default async function AgentsPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('slug', params.orgSlug)
    .single()

  if (!org) redirect('/')

  type RunRow = { agent_role: string; status: string; created_at: string }
  let runStats: RunRow[] = []

  try {
    const { data, error } = await supabase
      .from('agent_runs')
      .select('agent_role, status, created_at')
      .eq('org_id', org.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    if (!error) runStats = (data ?? []) as RunRow[]
  } catch {
    // table may not exist yet
  }

  // Build per-role stats
  const statsMap: Record<string, { total: number; running: boolean; lastRun: string | null }> = {}
  for (const row of runStats) {
    const key = row.agent_role
    if (!statsMap[key]) statsMap[key] = { total: 0, running: false, lastRun: null }
    statsMap[key].total += 1
    if (row.status === 'running') statsMap[key].running = true
    if (!statsMap[key].lastRun || row.created_at > statsMap[key].lastRun!) {
      statsMap[key].lastRun = row.created_at
    }
  }

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold text-primary mb-1">Agents</h1>
      <p className="text-sm text-gray-500 mb-6">
        Specialist agents that execute tasks autonomously within your engagement.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AGENT_ROLES.map((role) => {
          const stats = statsMap[role.slug]
          const isRunning = stats?.running ?? false
          const runCount = stats?.total ?? 0
          const lastRun = stats?.lastRun

          return (
            <div
              key={role.slug}
              className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-3 hover:border-violet-200 transition-colors"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0" aria-hidden="true">{role.icon}</span>
                  <span className="font-display font-semibold text-sm text-gray-900 truncate">
                    {role.name}
                  </span>
                </div>
                {isRunning ? (
                  <span className="shrink-0 flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-600" />
                    </span>
                    Running
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    Active
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 leading-relaxed flex-1">
                {role.description}
              </p>

              {/* Run stats */}
              <div className="text-xs text-gray-400 space-y-0.5">
                <p>{runCount} {runCount === 1 ? 'run' : 'runs'} this month</p>
                {lastRun && (
                  <p>Last run: {relativeTime(lastRun)}</p>
                )}
              </div>

              {/* CTA */}
              <Link
                href={`/dashboard/${params.orgSlug}/agents/${role.slug}`}
                className="self-end text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
                aria-label={`View runs for ${role.name}`}
              >
                View runs →
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
