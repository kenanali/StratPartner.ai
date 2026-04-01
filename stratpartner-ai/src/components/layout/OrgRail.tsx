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
      className="flex flex-col items-center w-12 h-screen bg-primary py-3 shrink-0 gap-2 overflow-y-auto"
      aria-label="Organisation switcher"
    >
      {orgs.map((org) => {
        const isActive = org.slug === currentSlug
        return (
          <Link
            key={org.id}
            href={`/dashboard/${org.slug}`}
            title={org.name}
            className={[
              'flex items-center justify-center w-9 h-9 rounded-full bg-gray-700 text-white text-xs font-semibold shrink-0 transition-all hover:bg-gray-600',
              isActive ? 'ring-2 ring-accent ring-offset-1 ring-offset-primary' : '',
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
        className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-700 text-white text-lg font-semibold hover:bg-gray-600 transition-colors shrink-0"
        aria-label="Admin"
      >
        +
      </Link>
    </aside>
  )
}
