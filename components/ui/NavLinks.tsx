'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * NavLinks — the desktop inline nav links with an active-page indicator.
 *
 * Client island (usePathname): the link whose href matches the current route is
 * highlighted (gold text + underline). A route counts as active when the pathname
 * equals the href or is nested under it (e.g. /board/everything activates the
 * /leaderboard link — see ACTIVE_PREFIX). Server <Nav/> stays a server component;
 * only this list needs the client hook.
 */

// Some links own routes beyond their own href. /leaderboard is the entry but the
// board lives at /board/* (redirect target); treat those as the same active tab.
const ACTIVE_PREFIX: Record<string, string[]> = {
  '/leaderboard': ['/leaderboard', '/board'],
  '/compare': ['/compare'],
  '/hall': ['/hall'],
  '/wiki': ['/wiki'],
}

function isActive(pathname: string, href: string): boolean {
  const prefixes = ACTIVE_PREFIX[href] ?? [href]
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname() ?? ''
  return (
    <ul className="hidden flex-wrap items-center gap-1 md:flex">
      {links.map((link) => {
        const active = isActive(pathname, link.href)
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'rounded-md px-2.5 py-1.5 font-sans text-sm font-semibold text-gold underline decoration-gold/60 underline-offset-4'
                  : 'rounded-md px-2.5 py-1.5 font-sans text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary'
              }
            >
              {link.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
