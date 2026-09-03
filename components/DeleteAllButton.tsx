'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithCsrf } from '@/lib/fetchWithCsrf'

export default function DeleteAllButton() {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleDelete() {
    setIsLoading(true)
    setMessage(null)

    try {
      const res = await fetchWithCsrf('/api/import', { method: 'DELETE' })
      const data: { success: boolean; message: string } = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        setShowConfirm(false)
        router.refresh()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan. Coba lagi.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Tombol pemicu */}
      {!showConfirm && (
        <button
          type="button"
          onClick={() => { setMessage(null); setShowConfirm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-300
                     text-red-600 text-sm font-medium hover:bg-red-50
                     focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
          aria-label="Hapus semua data Excel yang diupload"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Hapus Semua Data
        </button>
      )}

      {/* Panel konfirmasi */}
      {showConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-desc"
          className="bg-red-50 border border-red-200 rounded-xl p-5"
        >
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 id="confirm-title" className="font-semibold text-red-800 text-base">
                Hapus Semua Data?
              </h3>
              <p id="confirm-desc" className="text-sm text-red-700 mt-1">
                Semua data tunggakan hasil upload Excel akan dihapus permanen dari database.
                Tindakan ini <strong>tidak dapat dibatalkan</strong>.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg
                             text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2
                             focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Menghapus...
                    </>
                  ) : (
                    'Ya, Hapus Semua'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm
                             font-medium hover:bg-gray-50 focus:outline-none focus:ring-2
                             focus:ring-gray-300 disabled:opacity-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pesan hasil */}
      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-3 flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd" />
            </svg>
          )}
          {message.text}
        </div>
      )}
    </div>
  )
}
