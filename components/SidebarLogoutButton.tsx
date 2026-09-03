'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  expanded?: boolean
  Icon?: () => React.ReactElement
}

export default function SidebarLogoutButton({ expanded = true, Icon }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title={!expanded ? 'Logout' : undefined}
      className={[
        'flex items-center rounded-xl w-full transition-colors disabled:opacity-60',
        'text-blue-200 hover:bg-white/10 hover:text-white',
        expanded ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5',
      ].join(' ')}
    >
      {Icon ? (
        <span className="text-blue-300">
          <Icon />
        </span>
      ) : (
        <svg className="w-5 h-5 shrink-0 text-blue-300" fill="none" stroke="currentColor"
          viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7
               a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      )}
      {expanded && (
        <span className="text-sm font-medium">{loading ? 'Keluar...' : 'Logout'}</span>
      )}
    </button>
  )
}
