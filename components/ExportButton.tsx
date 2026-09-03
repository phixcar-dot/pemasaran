'use client'

import { useState } from 'react'

interface ExportButtonProps {
  /** URL endpoint export, sudah termasuk query params filter */
  href: string
  label?: string
  /** Ekstensi fallback jika Content-Disposition tidak tersedia, default 'xlsx' */
  downloadExt?: string
}

export default function ExportButton({
  href,
  label = 'Export Excel',
  downloadExt = 'xlsx',
}: ExportButtonProps) {
  const [status, setStatus]     = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isPdf = downloadExt === 'pdf'

  async function handleExport() {
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch(href)

      if (!res.ok) {
        const contentType = res.headers.get('content-type') ?? ''
        if (contentType.includes('application/json')) {
          const json = await res.json()
          setErrorMsg(json.message ?? 'Export gagal.')
        } else {
          setErrorMsg('Export gagal. Coba lagi.')
        }
        setStatus('error')
        return
      }

      // Ambil nama file dari header Content-Disposition
      const disposition = res.headers.get('content-disposition') ?? ''
      const match       = disposition.match(/filename="?([^"]+)"?/)
      const fileName    = match?.[1] ?? `export.${downloadExt}`

      // Trigger download
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      setStatus('idle')
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan.')
      setStatus('error')
    }
  }

  // Warna tombol: merah untuk PDF, hijau untuk Excel
  const btnClass = isPdf
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={status === 'loading'}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                   text-white rounded-lg focus:outline-none focus:ring-2
                   disabled:opacity-60 disabled:cursor-not-allowed transition-colors
                   ${btnClass}`}
      >
        {status === 'loading' ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Mengekspor...
          </>
        ) : isPdf ? (
          <>
            {/* Ikon PDF */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 13h6M9 17h4" />
            </svg>
            {label}
          </>
        ) : (
          <>
            {/* Ikon download */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {label}
          </>
        )}
      </button>

      {status === 'error' && (
        <p role="alert" className="text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd" />
          </svg>
          {errorMsg}
        </p>
      )}
    </div>
  )
}
