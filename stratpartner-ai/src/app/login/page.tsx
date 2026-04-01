'use client'

import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createBrowserSupabase()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSubmitted(true)
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* Left panel — brand statement */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary px-12">
        <div className="w-full max-w-xs">
          {/* Logo mark */}
          <div className="h-12 w-12 rounded-2xl bg-accent flex items-center justify-center mb-8">
            <span className="text-white font-display font-bold text-xl">SP</span>
          </div>

          {/* Heading */}
          <h1 className="font-display font-bold text-3xl text-white leading-tight mb-3">
            Your strategy partner.
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-gray-400 max-w-xs mb-10 leading-relaxed">
            AI-powered strategy execution for CX and transformation leaders.
          </p>

          {/* Feature bullets */}
          <ul className="space-y-3">
            <li className="flex items-start gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
              <span className="text-xs text-gray-500 leading-relaxed">
                Joins meetings, captures decisions, creates tasks
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
              <span className="text-xs text-gray-500 leading-relaxed">
                Runs strategy frameworks from 144 skills
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
              <span className="text-xs text-gray-500 leading-relaxed">
                Proactively follows up based on context
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo — only visible when left panel is hidden */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-2xl bg-accent flex items-center justify-center">
            <span className="text-white font-display font-bold text-lg">SP</span>
          </div>
          <span className="font-display font-bold text-xl text-primary">StratPartner.ai</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display font-semibold text-2xl text-primary">Sign in</h2>
            <p className="mt-1 text-sm text-gray-400">Enter your email to receive a magic link.</p>
          </div>

          {submitted ? (
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-6 text-center">
              <p className="text-sm font-semibold text-primary">Check your email</p>
              <p className="mt-1.5 text-sm text-gray-500">
                We sent a magic link to <strong className="text-primary">{email}</strong>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-primary placeholder-gray-300 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-danger">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
