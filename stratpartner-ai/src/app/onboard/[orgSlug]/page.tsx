import { getSupabaseAdmin } from '@/lib/supabase'
import OnboardForm from './OnboardForm'

interface PageProps {
  params: { orgSlug: string }
  searchParams: { project?: string; token?: string }
}

export default async function OnboardPage({ searchParams }: PageProps) {
  const { project: projectId, token } = searchParams

  let isValid = false
  let orgName = 'StratPartner.ai'

  if (projectId && token) {
    const supabase = getSupabaseAdmin()

    const { data: project } = await supabase
      .from('projects')
      .select('id, name, orgs(name)')
      .eq('id', projectId)
      .eq('intake_token', token)
      .single()

    if (project) {
      isValid = true
      const orgData = project.orgs as unknown as { name: string } | null
      if (orgData?.name) orgName = orgData.name
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="font-display font-bold text-base text-primary tracking-tight">
            stratpartner.ai
          </span>
          {isValid && (
            <span className="text-xs text-gray-400">{orgName}</span>
          )}
        </div>
      </header>

      {/* Body */}
      <main className="max-w-lg mx-auto px-6 py-12">
        {!isValid ? (
          <div className="text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <svg
                className="h-7 w-7 text-danger"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="font-display font-bold text-xl text-primary">
              Invalid invite link
            </h1>
            <p className="text-sm text-gray-400">
              This link is invalid or has expired. Please ask your team lead to share a new
              one.
            </p>
          </div>
        ) : (
          <OnboardForm projectId={projectId!} token={token!} />
        )}
      </main>
    </div>
  )
}
