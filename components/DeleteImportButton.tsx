'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import { fetchWithCsrf } from '@/lib/fetchWithCsrf'

interface DeleteImportButtonProps {
  importId: number
  fileName: string
  /** 'button' = tombol teks (default, untuk halaman detail), 'icon' = ikon kecil (untuk tabel) */
  variant?: 'button' | 'icon'
}

export default function DeleteImportButton({ importId, fileName, variant = 'button' }: DeleteImportButtonProps) {
  const router     = useRouter()
  const { showToast } = useToast()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetchWithCsrf(`/api/imports/${importId}`, { method: 'DELETE' })
      const data: { success: boolean; message: string } = await res.json()
      if (data.success) {
        setShowConfirm(false)
        showToast(`File "${fileName}" berhasil dihapus.`, 'success')
        router.refresh()
      } else {
        setError(data.message)
        setIsLoading(false)
      }
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.')
      showToast('Gagal menghapus. Coba lagi.', 'error')
      setIsLoading(false)
    }
  }

  function openConfirm() {
    setError(null)
    setShowConfirm(true)
  }

  function closeConfirm() {
    if (isLoading) return
    setShowConfirm(false)
    setError(null)
  }

  return (
    <>
      {/* ── Tombol trigger ── */}
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={openConfirm}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                     text-gray-400 hover:text-red-600 hover:bg-red-50
                     transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label={`Hapus import ${fileName}`}
          title="Hapus"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={openConfirm}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                     border border-red-300 text-red-600 rounded-lg hover:bg-red-50
                     focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
          aria-label={`Hapus import ${fileName}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Hapus
        </button>
      )}

      {/* ── Modal overlay konfirmasi ── */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`modal-title-${importId}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeConfirm}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">

            {/* Ikon peringatan */}
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor"
                     viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>

            {/* Teks */}
            <div className="text-center">
              <h2
                id={`modal-title-${importId}`}
                className="text-lg font-bold text-gray-800 mb-1"
              >
                Hapus import ini?
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Semua data dari file{' '}
                <span className="font-semibold text-gray-700 break-all">
                  &ldquo;{fileName}&rdquo;
                </span>{' '}
                akan dihapus permanen. Data dari import lain tidak akan terpengaruh.
              </p>
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="text-xs text-red-600 bg-red-50 border border-red-200
                           rounded-lg px-3 py-2 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}

            {/* Tombol aksi */}
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl
                           text-sm font-medium hover:bg-gray-50 focus:outline-none
                           focus:ring-2 focus:ring-gray-300 disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                           bg-red-600 text-white rounded-xl text-sm font-medium
                           hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                              stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menghapus...
                  </>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
