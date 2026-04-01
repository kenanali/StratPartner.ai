'use client'

import Link from 'next/link'

interface Org {
  id: string
  name: string
  slug: string
}

interface Props {
  orgs: Org[]
  currentSlug: string
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

export default function OrgRail({ orgs, currentSlug }: Props) {
  return (
    <aside
      className="flex flex-col items-center w-12 h-screen bg-primary border-r border-gray-800 py-3 shrink-0 gap-2 overflow-y-auto"
      aria-label="Organisation switcher"
    >
      {/* Logo mark at top */}
      <div
        className="flex items-center justify-center w-8 h-8 rounded-xl bg-accent shrink-0 mb-1"
        aria-label="StratPartner.ai"
      >
        <span className="text-white font-display font-bold text-xs">SP</span>
      </div>

      {/* Subtle separator */}
      <div className="w-6 h-px bg-gray-800 shrink-0" />

      {/* Org avatars */}
      {orgs.map((org) => {
        const isActive = org.slug === currentSlug
        return (
          <Link
            key={org.id}
            href={`/dashboard/${org.slug}`}
            title={org.name}
            className={[
              'flex items-center justify-center w-9 h-9 rounded-full bg-gray-800 text-white text-xs font-semibold font-display shrink-0 transition-all hover:bg-gray-700',
              isActive
                ? 'ring-2 ring-accent ring-offset-2 ring-offset-primary'
                : 'ring-2 ring-transparent',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            {getInitials(org.name)}
          </Link>
        )
      })}

      {/* Spacer pushes "+" to bottom */}
      <div className="flex-1" />

      <Link
        href="/admin"
        title="Admin"
        className="flex items-center justify-center w-9 h-9 rounded-full text-gray-600 hover:text-accent border border-gray-800 hover:border-gray-700 text-lg font-semibold transition-colors shrink-0"
        aria-label="Admin"
      >
        +
      </Link>
    </aside>
  )
}
