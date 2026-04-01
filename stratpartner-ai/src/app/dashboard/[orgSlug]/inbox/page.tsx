import { getSupabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import InboxClient from './InboxClient'
import type { InboxMessage } from '@/app/api/inbox/route'

interface PageProps {
  params: { orgSlug: string }
}

export const dynamic = 'force-dynamic'

export default async function InboxPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, name, slug')
    .eq('slug', params.orgSlug)
    .single()

  if (!org) notFound()

  const { data } = await supabase
    .from('messages')
    .select('id, content, channel, created_at, read_at, session_id')
    .eq('org_id', org.id)
    .eq('role', 'assistant')
    .not('channel', 'is', null)
    .in('channel', ['agent', 'recall', 'heartbeat'])
    .order('read_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false })
    .limit(50)

  const initialMessages = (data ?? []) as InboxMessage[]

  return (
    <InboxClient
      orgId={org.id}
      orgSlug={params.orgSlug}
      initialMessages={initialMessages}
    />
  )
}
