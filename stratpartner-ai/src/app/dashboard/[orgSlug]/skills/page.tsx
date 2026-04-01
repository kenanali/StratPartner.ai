import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Skill } from '@/types/skill'
import SkillCatalogClient from './SkillCatalogClient'

interface Props {
  params: { orgSlug: string }
}

export default async function SkillsPage({ params }: Props) {
  const { orgSlug } = params
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase.from('orgs').select('id').eq('slug', orgSlug).single()
  if (!org) redirect('/')

  let skills: Skill[] = []

  // Try org_skills join first, fall back to all skills
  try {
    const { data: orgSkills } = await supabase
      .from('org_skills')
      .select('enabled, skills(*)')
      .eq('org_id', org.id)

    if (orgSkills && orgSkills.length > 0) {
      skills = orgSkills.map((row) => ({
        ...(row.skills as unknown as Skill),
        enabled: row.enabled ?? true,
      }))
    } else {
      throw new Error('fallback')
    }
  } catch {
    const { data } = await supabase
      .from('skills')
      .select('*')
      .order('name')
    skills = (data ?? []).map((s) => ({ ...s, enabled: true })) as Skill[]
  }

  return (
    <div className="p-8">
      <SkillCatalogClient skills={skills} orgSlug={orgSlug} />
    </div>
  )
}
