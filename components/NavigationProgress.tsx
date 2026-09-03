'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function NavigationProgress() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [width,   setWidth]   = useState(0)
  const [opacity, setOpacity] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const doneRef     = useRef(false)

  // ── Mulai bar ──────────────────────────────────────────────
  function startBar() {
    doneRef.current = false
    setOpacity(1)
    setWidth(0)

    let current = 0
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      if (doneRef.current) return
      // Naik cepat di awal, lambat di akhir
      const step = current < 30 ? 8 : current < 60 ? 4 : current < 80 ? 2 : 0.5
      current = Math.min(current + step, 90)
      setWidth(current)
    }, 120)
  }

  // ── Selesaikan bar ─────────────────────────────────────────
  function completeBar() {
    doneRef.current = true
    if (intervalRef.current) clearInterval(intervalRef.current)
    setWidth(100)
    // Fade out setelah selesai
    setTimeout(() => {
      setOpacity(0)
      setTimeout(() => setWidth(0), 400)
    }, 200)
  }

  // Setiap URL berubah → selesaikan bar
  useEffect(() => {
    completeBar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  // Deteksi klik link → mulai bar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href) return
      // Skip: anchor link, eksternal, mailto, download
      if (
        href.startsWith('#') ||
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('mailto') ||
        href.startsWith('tel') ||
        anchor.hasAttribute('download') ||
        anchor.target === '_blank'
      ) return

      startBar()
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        position:     'fixed',
        top:          0,
        left:         0,
        zIndex:       99999,
        height:       '3px',
        width:        `${width}%`,
        opacity,
        background:   'linear-gradient(to right, #1D4ED8, #60A5FA)',
        borderRadius: '0 2px 2px 0',
        boxShadow:    '0 0 10px #3B82F680',
        transition:   width === 100
          ? 'width 0.15s ease'
          : 'width 0.12s linear',
        pointerEvents: 'none',
      }}
    />
  )
}
