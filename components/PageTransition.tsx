'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prevPath = useRef(pathname)
  const [key,     setKey]     = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (pathname === prevPath.current) return

    // Fade + scale out
    setVisible(false)

    const t = setTimeout(() => {
      prevPath.current = pathname
      setKey(k => k + 1)   // remount konten baru
      setVisible(true)      // fade + scale in
    }, 150)

    return () => clearTimeout(t)
  }, [pathname])

  return (
    <div
      key={key}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'scale(1)' : 'scale(0.97)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        transformOrigin: 'top center',
      }}
    >
      {children}
    </div>
  )
}
