'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SidebarLogoutButton from '@/components/SidebarLogoutButton'
import { useSidebar } from '@/components/SidebarContext'

const SIDEBAR_COLLAPSED = 64
const SIDEBAR_EXPANDED  = 240

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconDashboard = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const IconImport = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
)
const IconHistory = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconRekap = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)
const IconProfile = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const IconLogout = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const MENU = [
  { href: '/dashboard',         label: 'Dashboard',       Icon: IconDashboard },
  { href: '/dashboard/import',  label: 'Import Data',     Icon: IconImport    },
  { href: '/dashboard/imports', label: 'Riwayat Import',  Icon: IconHistory   },
  { href: '/dashboard/rekap',   label: 'Rekap Tunggakan', Icon: IconRekap     },
  { href: '/dashboard/profile', label: 'Profil',          Icon: IconProfile   },
]

// ── Inner sidebar UI ──────────────────────────────────────────────────────────
function SidebarInner({ name, expanded, onToggle }: {
  name: string
  expanded: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full" style={{
      background: 'linear-gradient(180deg,#0D1B4B 0%,#0a1538 100%)',
    }}>
      {/* Logo header */}
      <div className="flex items-center border-b border-white/10 shrink-0"
        style={{ height: 64, paddingInline: expanded ? 16 : 0, justifyContent: expanded ? 'space-between' : 'center' }}>
        {expanded ? (
          <>
            <div className="flex items-center gap-3">
              <img src="/logo-pln.png" alt="PLN" className="w-9 h-9 object-contain" />
              <div>
                <p className="text-white font-bold text-sm">PLN</p>
                <p className="text-blue-300 text-[10px] uppercase tracking-widest">UP3 Medan</p>
              </div>
            </div>
            <button onClick={onToggle} className="text-blue-300 hover:text-white p-1 rounded" aria-label="Collapse">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
              </svg>
            </button>
          </>
        ) : (
          <button onClick={onToggle} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10" aria-label="Expand">
            <img src="/logo-pln.png" alt="PLN" className="w-7 h-7 object-contain" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {MENU.map(({ href, label, Icon }) => {
          const active = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} title={expanded ? undefined : label}
              className={[
                'relative flex items-center rounded-xl transition-all duration-150',
                expanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5',
                active ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white',
              ].join(' ')}>
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-yellow-400 rounded-r-full" />}
              <Icon />
              {expanded && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 px-2 py-3 space-y-2">
        <SidebarLogoutButton expanded={expanded} Icon={IconLogout} />
        {expanded && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">
                {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{name}</p>
              <p className="text-blue-400 text-[10px]">Administrator</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function Sidebar({ name }: { name: string }) {
  const { expanded, setExpanded } = useSidebar()
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggle = () => setExpanded(!expanded)

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside
        className="hidden lg:block fixed inset-y-0 left-0 z-40 overflow-hidden"
        style={{ width: expanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED, transition: 'width 0.25s ease' }}
      >
        <SidebarInner name={name} expanded={expanded} onToggle={toggle} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className="fixed inset-y-0 left-0 z-50 lg:hidden"
        style={{ width: SIDEBAR_EXPANDED, transform: mobileOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_EXPANDED}px)`, transition: 'transform 0.25s ease' }}
      >
        <SidebarInner name={name} expanded={true} onToggle={() => setMobileOpen(false)} />
      </aside>

      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 left-4 z-30 lg:hidden w-11 h-11 rounded-full bg-[#0D1B4B] text-white shadow-lg flex items-center justify-center"
        aria-label="Buka menu">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  )
}
