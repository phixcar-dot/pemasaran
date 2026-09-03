'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':          'Dashboard',
  '/dashboard/import':   'Import Data',
  '/dashboard/imports':  'Riwayat Import',
  '/dashboard/rekap':    'Rekap Tunggakan',
  '/dashboard/profile':  'Profil Administrator',
}

function getTitle(pathname: string): string {
  // Exact match dulu
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  // Prefix match untuk sub-halaman (misal /dashboard/imports/[id])
  const match = Object.keys(PAGE_TITLES)
    .filter(k => k !== '/dashboard' && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
  return match ? PAGE_TITLES[match] : 'Dashboard'
}

interface TopBarProps {
  initials: string
  name: string
}

export default function TopBar({ initials, name }: TopBarProps) {
  const pathname = usePathname()
  const title = getTitle(pathname)

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200
                       flex items-center justify-between h-14 px-6 shrink-0">
      <h2 className="text-base font-semibold text-gray-700">{title}</h2>

      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2.5 rounded-xl px-2 py-1
                     hover:bg-gray-100 transition-colors"
          title="Lihat profil"
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center
                          text-gray-600 text-xs font-bold select-none shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-gray-700 leading-none">{name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Administrator</p>
          </div>
        </Link>
      </div>
    </header>
  )
}
