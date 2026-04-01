import { getSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import MemoryEditor from './MemoryEditor'
import SkillsToggles from './SkillsToggles'

interface PageProps {
  params: { slug: string }
}

export default async function AdminOrgPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, slug, name, tier')
    .eq('slug', params.slug)
    .single()

  if (!org) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Org not found</p>
      </div>
    )
  }

  // Load memory
  const { data: memRows } = await supabase
    .from('memory')
    .select('content')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })

  const memory = memRows?.map((r) => r.content).join('\n\n') ?? ''

  // Load skills with enabled status
  const { data: orgSkills } = await supabase
    .from('org_skills')
    .select('skill_id, enabled, skills(id, slug, name, track)')
    .eq('org_id', org.id)

  // Load recent messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, created_at, skill_used')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const skills = (orgSkills ?? []).map((row) => ({
    skillId: row.skill_id,
    enabled: row.enabled,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(Array.isArray(row.skills) ? row.skills[0] : row.skills as any),
  }))

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-sm text-indigo-600 hover:underline">Admin</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
          <span className="text-xs rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 font-medium">{org.tier}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Memory */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Strategic Memory</h2>
            <MemoryEditor orgId={org.id} initialMemory={memory} />
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Skills</h2>
            <SkillsToggles orgId={org.id} skills={skills} />
          </div>
        </div>

        {/* Recent messages */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Messages</h2>
          <div className="space-y-2">
            {messages?.map((msg) => (
              <div key={msg.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold uppercase ${msg.role === 'user' ? 'text-gray-600' : 'text-indigo-600'}`}>
                    {msg.role}
                  </span>
                  <div className="flex items-center gap-2">
                    {msg.skill_used && (
                      <span className="text-xs rounded-full bg-indigo-50 text-indigo-600 px-2 py-0.5">{msg.skill_used}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{msg.content}</p>
              </div>
            ))}
            {(!messages || messages.length === 0) && (
              <p className="text-sm text-gray-400">No messages yet.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
