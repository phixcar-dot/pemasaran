'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id:      number
  type:    ToastType
  message: string
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ── Icon per tipe ─────────────────────────────────────────────────────────────
function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') return (
    <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor"
         viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
  if (type === 'error') return (
    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor"
         viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
  if (type === 'warning') return (
    <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor"
         viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
  return (
    <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor"
         viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

const BORDER_COLOR: Record<ToastType, string> = {
  success: 'border-l-green-500',
  error:   'border-l-red-500',
  warning: 'border-l-amber-500',
  info:    'border-l-blue-500',
}

// ── Item toast ────────────────────────────────────────────────────────────────
function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  const [visible, setVisible] = useState(false)

  // Animasi masuk
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  // Auto-dismiss setelah 3.5 detik
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onClose(toast.id), 300)
    }, 3500)
    return () => clearTimeout(t)
  }, [toast.id, onClose])

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{ transition: 'opacity 0.3s, transform 0.3s' }}
      className={[
        'flex items-center gap-3 bg-white rounded-xl shadow-lg border border-gray-100',
        'border-l-4 px-4 py-3 min-w-[280px] max-w-sm',
        BORDER_COLOR[toast.type],
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
      ].join(' ')}
    >
      <ToastIcon type={toast.type} />
      <p className="flex-1 text-sm text-gray-700 font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={() => { setVisible(false); setTimeout(() => onClose(toast.id), 300) }}
        className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
        aria-label="Tutup notifikasi"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ── Provider ──────────────────────────────────────────────────────────────────
export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter.current
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Container toast — pojok kanan atas, di bawah TopBar */}
      <div
        aria-live="polite"
        className="fixed top-16 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
