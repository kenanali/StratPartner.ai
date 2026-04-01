'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  orgSlug: string
  orgName: string
  isAdmin?: boolean
  inboxUnread?: number
}

interface NavItem {
  label: string
  href: string
}

const NAV_ITEM_BASE =
  'flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors border-l-2'
const NAV_ITEM_ACTIVE = 'text-accent font-medium bg-violet-50 border-accent'
const NAV_ITEM_INACTIVE =
  'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent'

export default function Sidebar({ orgSlug, orgName, isAdmin = false, inboxUnread = 0 }: Props) {
  const pathname = usePathname()

  const primaryItems: NavItem[] = [
    { label: 'Chat', href: `/chat/${orgSlug}` },
    { label: 'Projects', href: `/dashboard/${orgSlug}/projects` },
    { label: 'Meetings', href: `/dashboard/${orgSlug}/meetings` },
  ]

  const settingsItems: NavItem[] = [
    { label: 'Inbox', href: `/dashboard/${orgSlug}/inbox` },
    { label: 'Skills', href: `/dashboard/${orgSlug}/skills` },
    { label: 'Memory', href: `/dashboard/${orgSlug}/memory` },
    { label: 'Files', href: `/dashboard/${orgSlug}/files` },
    ...(isAdmin ? [{ label: 'Admin', href: '/admin' }] : []),
  ]

  function isActive(href: string): boolean {
    if (href === `/dashboard/${orgSlug}`) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  function renderItem(item: NavItem) {
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={`${NAV_ITEM_BASE} ${isActive(item.href) ? NAV_ITEM_ACTIVE : NAV_ITEM_INACTIVE}`}
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
    )
  }

  return (
    <aside
      className="flex flex-col w-60 h-screen bg-white border-r border-gray-200 shrink-0 overflow-y-auto pb-6"
      aria-label="Main navigation"
    >
      {/* Org heading */}
      <div className="px-4 pt-5 pb-3">
        <Link
          href={`/dashboard/${orgSlug}`}
          className="font-display font-semibold text-sm text-gray-900 truncate hover:text-accent transition-colors block"
          title={orgName}
        >
          {orgName}
        </Link>
      </div>

      <div className="mx-4 h-px bg-gray-100 mb-1" />

      <nav className="flex-1 px-2 py-3 space-y-4">
        {/* Primary — the three core workflows */}
        <ul className="space-y-0.5">
          {primaryItems.map(renderItem)}
        </ul>

        <div className="mx-2 h-px bg-gray-100" />

        {/* Settings */}
        <ul className="space-y-0.5">
          {settingsItems.map(renderItem)}
        </ul>
      </nav>
    </aside>
  )
}
