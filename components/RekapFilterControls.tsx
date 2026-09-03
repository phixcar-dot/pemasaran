'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

interface ImportOption {
  id:        number
  fileName:  string
  createdAt: string   // ISO string agar aman di-pass dari Server Component
  totalRows: number
}

interface RekapFilterControlsProps {
  isKogolMode:    boolean
  importOptions:  ImportOption[]
  selectedImport: number | null
}

export default function RekapFilterControls({
  isKogolMode,
  importOptions,
  selectedImport,
}: RekapFilterControlsProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const [checked,    setChecked]    = useState(isKogolMode)
  const [importId,   setImportId]   = useState<string>(selectedImport ? String(selectedImport) : '')

  function buildQuery(kogol: boolean, impId: string): string {
    const p = new URLSearchParams()
    if (kogol)  p.set('kogol', '1')
    if (impId)  p.set('importId', impId)
    const qs = p.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(buildQuery(checked, importId))
  }

  function handleReset() {
    setChecked(false)
    setImportId('')
    router.push(pathname)
  }

  const isDirty =
    checked !== isKogolMode ||
    importId !== (selectedImport ? String(selectedImport) : '')

  const hasActiveFilter = isKogolMode || selectedImport !== null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4 mb-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Filter Data
      </p>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-4">

        {/* Dropdown pilih import */}
        <div className="flex flex-col gap-1">
          <label htmlFor="rekap-import-select" className="text-xs font-medium text-gray-500">
            File Import
          </label>
          <select
            id="rekap-import-select"
            value={importId}
            onChange={(e) => setImportId(e.target.value)}
            className="min-w-[220px] rounded-lg border border-gray-300 bg-white px-3 py-2
                       text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                       focus:border-blue-500 transition-colors"
          >
            <option value="">Semua Import</option>
            {importOptions.map((imp) => {
              const date = new Date(imp.createdAt).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric',
              })
              return (
                <option key={imp.id} value={String(imp.id)}>
                  {imp.fileName} — {date} ({imp.totalRows.toLocaleString('id-ID')} baris)
                </option>
              )
            })}
          </select>
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-8 w-px bg-gray-200" aria-hidden="true" />

        {/* Checkbox Kogol */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="w-4 h-4 rounded border-gray-400 text-blue-600
                       focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">Rekap per Kogol</span>
        </label>

        {/* Tombol Tampilkan */}
        {isDirty && (
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                       bg-blue-700 text-white rounded-lg hover:bg-blue-800
                       focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Tampilkan
          </button>
        )}

        {/* Tombol Reset */}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                       border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50
                       focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor"
                 viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reset
          </button>
        )}
      </form>

      {/* Badge aktif */}
      {hasActiveFilter && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedImport !== null && (
            <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
              {importOptions.find((i) => i.id === selectedImport)?.fileName ?? `Import #${selectedImport}`}
            </span>
          )}
          {isKogolMode && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
              Mode: Per Kogol
            </span>
          )}
        </div>
      )}
    </div>
  )
}
