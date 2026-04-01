import { getSupabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import RoutinesClient from './RoutinesClient'

interface PageProps {
  params: { orgSlug: string }
}

interface Routine {
  id: string
  name: string
  description: string | null
  cron_schedule: string | null
  agent_role: string | null
  trigger_instruction: string | null
  concurrency_policy: string | null
  status: string
  last_run_at: string | null
  created_at: string
}

export default async function RoutinesPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('slug', params.orgSlug)
    .single()

  if (!org) redirect('/')

  let routines: Routine[] = []
  try {
    const { data, error } = await supabase
      .from('routines')
      .select(
        'id, name, description, cron_schedule, agent_role, trigger_instruction, concurrency_policy, status, last_run_at, created_at'
      )
      .eq('org_id', org.id)
      .order('created_at', { ascending: false })
    if (!error) routines = (data ?? []) as Routine[]
  } catch {
    // table may not exist yet
  }

  return <RoutinesClient routines={routines} />
}
