'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Ikon sidebar per menu
function IconDashboard({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-blue-300'}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3
           m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}
function IconImport({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-blue-300'}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}
function IconHistory({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-blue-300'}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function IconRekap({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-blue-300'}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0
           V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5
           a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
function IconProfile({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-blue-300'}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

const MENU = [
  { href: '/dashboard',          label: 'Dashboard',       Icon: IconDashboard },
  { href: '/dashboard/import',   label: 'Import Data',     Icon: IconImport    },
  { href: '/dashboard/imports',  label: 'Riwayat Import',  Icon: IconHistory   },
  { href: '/dashboard/rekap',    label: 'Rekap Tunggakan', Icon: IconRekap     },
  { href: '/dashboard/profile',  label: 'Profil',          Icon: IconProfile   },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Menu navigasi">
      {MENU.map(({ href, label, Icon }) => {
        const isActive =
          href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === href || pathname.startsWith(href + '/')

        return (
          <Link
            key={href}
            href={href}
            className={[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-white/15 text-white'
                : 'text-blue-200 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            <Icon active={isActive} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
