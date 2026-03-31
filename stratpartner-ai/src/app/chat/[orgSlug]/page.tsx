import { getSupabaseAdmin } from '@/lib/supabase'
import ChatUI from './ChatUI'

interface PageProps {
  params: { orgSlug: string }
}

export default async function ChatPage({ params }: PageProps) {
  const { orgSlug } = params
  const supabase = getSupabaseAdmin()

  const { data: org } = await supabase
    .from('orgs')
    .select('id, slug, name')
    .eq('slug', orgSlug)
    .single()

  if (!org) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Organization not found</h1>
          <p className="mt-2 text-gray-500">
            No org with slug &quot;{orgSlug}&quot; exists.
          </p>
        </div>
      </div>
    )
  }

  return <ChatUI orgId={org.id} orgName={org.name} orgSlug={org.slug} />
}
