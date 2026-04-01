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

  // Fetch all global skills, then overlay org-specific enabled state
  const [{ data: allSkills }, { data: orgSkills }] = await Promise.all([
    supabase.from('skills').select('*').order('name'),
    supabase.from('org_skills').select('skill_id, enabled').eq('org_id', org.id),
  ])

  const enabledMap = new Map((orgSkills ?? []).map((r) => [r.skill_id as string, r.enabled as boolean]))

  const skills: Skill[] = (allSkills ?? []).map((s) => ({
    ...(s as unknown as Skill),
    enabled: enabledMap.has(s.id) ? (enabledMap.get(s.id) ?? true) : true,
  }))

  return (
    <div className="p-8">
      <SkillCatalogClient skills={skills} orgSlug={orgSlug} />
    </div>
  )
}
