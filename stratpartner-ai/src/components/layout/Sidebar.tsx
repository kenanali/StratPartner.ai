'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface Props {
  orgSlug: string
  orgName: string
  activeRunsByRole: Record<string, number>
  isAdmin?: boolean
  inboxUnread?: number
}

interface NavItem {
  label: string
  href: string
  roleKey?: string // key in activeRunsByRole
}

interface NavSection {
  title: string
  items: NavItem[]
  collapsible?: boolean
}

const SECTION_HEADER =
  'px-3 py-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider select-none'

const NAV_ITEM_BASE =
  'flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors border-l-2'
const NAV_ITEM_ACTIVE = 'text-accent font-medium bg-violet-50 border-accent'
const NAV_ITEM_INACTIVE =
  'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

export default function Sidebar({ orgSlug, orgName, activeRunsByRole, isAdmin = false, inboxUnread = 0 }: Props) {
  const pathname = usePathname()
  const [agentsOpen, setAgentsOpen] = useState(true)

  const sections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: `/dashboard/${orgSlug}` },
        { label: 'Activity', href: `/dashboard/${orgSlug}/activity` },
      ],
    },
    {
      title: 'Work',
      items: [
        { label: 'Projects', href: `/dashboard/${orgSlug}/projects` },
        { label: 'Tasks', href: `/dashboard/${orgSlug}/tasks` },
        { label: 'Routines', href: `/dashboard/${orgSlug}/routines` },
        { label: 'Interviews', href: `/dashboard/${orgSlug}/interviews` },
        { label: 'Meetings', href: `/dashboard/${orgSlug}/meetings` },
      ],
    },
    {
      title: 'Settings',
      items: [
        { label: 'Inbox', href: `/dashboard/${orgSlug}/inbox` },
        { label: 'Sources', href: `/dashboard/${orgSlug}/sources` },
        { label: 'Memory', href: `/dashboard/${orgSlug}/memory` },
        { label: 'Skills', href: `/dashboard/${orgSlug}/skills` },
        { label: 'Chat', href: `/chat/${orgSlug}` },
        ...(isAdmin ? [{ label: 'Admin', href: '/admin' }] : []),
      ],
    },
  ]

  const agentItems: NavItem[] = [
    { label: 'Researcher', href: `/dashboard/${orgSlug}/agents/researcher`, roleKey: 'researcher' },
    { label: 'Persona Architect', href: `/dashboard/${orgSlug}/agents/persona-architect`, roleKey: 'persona-architect' },
    { label: 'Journey Mapper', href: `/dashboard/${orgSlug}/agents/journey-mapper`, roleKey: 'journey-mapper' },
    { label: 'Diagnostic', href: `/dashboard/${orgSlug}/agents/diagnostic`, roleKey: 'diagnostic' },
    { label: 'Synthesis', href: `/dashboard/${orgSlug}/agents/synthesis`, roleKey: 'synthesis' },
    { label: 'Delivery', href: `/dashboard/${orgSlug}/agents/delivery`, roleKey: 'delivery' },
  ]

  function isActive(href: string): boolean {
    // Exact match for the root dashboard, prefix match for sub-pages
    if (href === `/dashboard/${orgSlug}`) {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside
      className="flex flex-col w-60 h-screen bg-white border-r border-gray-200 shrink-0 overflow-y-auto pb-6"
      aria-label="Main navigation"
    >
      {/* Org heading */}
      <div className="px-4 pt-5 pb-3">
        <p
          className="font-display font-semibold text-sm text-gray-900 truncate"
          title={orgName}
        >
          {orgName}
        </p>
        {/* ⌘K search placeholder */}
        <button
          type="button"
          disabled
          aria-label="Search (coming soon)"
          className="mt-2 w-full flex items-center gap-2 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-400 cursor-default hover:border-gray-300 transition-colors"
        >
          <kbd className="text-xs text-gray-300 font-mono">⌘K</kbd>
          <span>Search…</span>
        </button>
      </div>

      {/* Subtle divider between org header and nav */}
      <div className="mx-4 h-px bg-gray-100 mb-1" />

      {/* Nav sections */}
      <nav className="flex-1 px-2 py-3 space-y-4">
        {sections.slice(0, 2).map((section) => (
          <div key={section.title}>
            <p className={SECTION_HEADER}>{section.title}</p>
            <ul className="mt-0.5 space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${NAV_ITEM_BASE} ${
                      isActive(item.href) ? NAV_ITEM_ACTIVE : NAV_ITEM_INACTIVE
                    }`}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Collapsible AGENTS section */}
        <div>
          <button
            type="button"
            onClick={() => setAgentsOpen((o) => !o)}
            className={`${SECTION_HEADER} w-full flex items-center justify-between hover:text-gray-500 transition-colors`}
            aria-expanded={agentsOpen}
          >
            <span>Agents</span>
            <ChevronIcon open={agentsOpen} />
          </button>

          {agentsOpen && (
            <ul className="mt-0.5 space-y-0.5">
              {agentItems.map((item) => {
                const hasActiveRun =
                  item.roleKey && (activeRunsByRole[item.roleKey] ?? 0) > 0
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${NAV_ITEM_BASE} ${
                        isActive(item.href) ? NAV_ITEM_ACTIVE : NAV_ITEM_INACTIVE
                      }`}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      <span>{item.label}</span>
                      {hasActiveRun && (
                        <span
                          className="text-success text-xs"
                          aria-label="Active run"
                          title="Agent is currently running"
                        >
                          ●
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Settings section (last) */}
        {sections.slice(2).map((section) => (
          <div key={section.title}>
            <p className={SECTION_HEADER}>{section.title}</p>
            <ul className="mt-0.5 space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${NAV_ITEM_BASE} ${
                      isActive(item.href) ? NAV_ITEM_ACTIVE : NAV_ITEM_INACTIVE
                    }`}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <span>{item.label}</span>
                    {item.label === 'Inbox' && inboxUnread > 0 && (
                      <span
                        className="ml-auto text-xs bg-accent text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-tight"
                        aria-label={`${inboxUnread} unread messages`}
                      >
                        {inboxUnread > 99 ? '99+' : inboxUnread}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
