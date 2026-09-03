'use client'

import { useState, useRef, useCallback } from 'react'
import { fetchWithCsrf } from '@/lib/fetchWithCsrf'

// Batas ukuran file: 10 MB (harus konsisten dengan server)
const MAX_FILE_SIZE = 10 * 1024 * 1024

interface ImportResult {
  success: boolean
  message: string
  import?: {
    id: number
    fileName: string
    totalRows: number
    status: string
    createdAt: string
  }
  sheetNames?: string[]
  detectedHeaders?: string[]
  availableColumns?: string[]
  missingColumns?: string[]
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ALUR_STEPS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Pilih File Excel',
    desc: 'Pilih file Excel (.xls / .xlsx) dari perangkat Anda',
    color: 'bg-blue-100 text-blue-600',
    num: 'bg-blue-600',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    title: 'Upload File',
    desc: 'File akan diupload ke sistem',
    color: 'bg-cyan-100 text-cyan-600',
    num: 'bg-cyan-500',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Validasi Data',
    desc: 'Sistem memvalidasi struktur dan isi data',
    color: 'bg-green-100 text-green-600',
    num: 'bg-green-500',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
    title: 'Simpan Data',
    desc: 'Data yang valid akan disimpan ke database',
    color: 'bg-violet-100 text-violet-600',
    num: 'bg-violet-500',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M5 13l4 4L19 7" />
      </svg>
    ),
    title: 'Selesai',
    desc: 'Proses import selesai dan data siap digunakan',
    color: 'bg-emerald-100 text-emerald-600',
    num: 'bg-emerald-500',
  },
]

const TIPS = [
  'Pastikan file Excel sesuai dengan format yang ditentukan',
  'Jangan mengubah struktur kolom yang sudah ditentukan',
  'Pastikan tidak ada data kosong pada kolom wajib',
  'Gunakan format tanggal yang sesuai (dd/mm/yyyy)',
  'Pastikan nominal menggunakan format angka yang benar',
]

export default function ImportForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError]       = useState<string>('')
  const [isDragOver, setIsDragOver]     = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const [result, setResult]             = useState<ImportResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // State duplikat
  const [dupInfo, setDupInfo]           = useState<{ createdAt: string; totalRows: number } | null>(null)
  const [forceUpload, setForceUpload]   = useState(false)

  async function checkDuplicate(fileName: string) {
    try {
      const res  = await fetch(`/api/import?fileName=${encodeURIComponent(fileName)}`)
      const data = await res.json()
      if (data.exists) {
        setDupInfo({ createdAt: data.createdAt, totalRows: data.totalRows })
      } else {
        setDupInfo(null)
      }
    } catch {
      setDupInfo(null)
    }
  }

  function validateAndSetFile(file: File | null) {
    setResult(null)
    setFileError('')
    setDupInfo(null)
    setForceUpload(false)

    if (!file) { setSelectedFile(null); return }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'xls' && ext !== 'xlsx') {
      setFileError('Format file harus .xls atau .xlsx.')
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    if (file.size === 0) {
      setFileError('File tidak boleh kosong.')
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`Ukuran file melebihi batas maksimum ${MAX_FILE_SIZE / 1024 / 1024} MB.`)
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setSelectedFile(file)
    checkDuplicate(file.name)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    validateAndSetFile(e.target.files?.[0] ?? null)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!isLoading) setIsDragOver(true)
  }, [isLoading])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (isLoading) return
    const file = e.dataTransfer.files?.[0] ?? null
    validateAndSetFile(file)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setResult(null)
    setFileError('')

    if (!selectedFile) { setFileError('File wajib dipilih.'); return }

    // Blok jika duplikat terdeteksi dan belum konfirmasi
    if (dupInfo && !forceUpload) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const response = await fetchWithCsrf('/api/import', { method: 'POST', body: formData })
      const data: ImportResult = await response.json()
      setResult(data)
      if (data.success) {
        setSelectedFile(null)
        setDupInfo(null)
        setForceUpload(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    } catch {
      setResult({ success: false, message: 'Terjadi kesalahan jaringan. Coba lagi.' })
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    setSelectedFile(null)
    setFileError('')
    setResult(null)
    setDupInfo(null)
    setForceUpload(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  /* ── zona drop state ── */
  const dropZoneBase =
    'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer'
  const dropZoneState = fileError
    ? 'border-red-400 bg-red-50'
    : selectedFile
      ? 'border-green-400 bg-green-50'
      : isDragOver
        ? 'border-blue-500 bg-blue-50 scale-[1.01]'
        : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

      {/* ── Kolom kiri: Upload ── */}
      <div className="xl:col-span-3 flex flex-col gap-4">

        {/* Kartu upload utama */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} noValidate>

            {/* Drop zone */}
            <div
              className={`${dropZoneBase} ${dropZoneState}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isLoading && inputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Area drag dan drop file Excel"
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                id="file-input"
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                disabled={isLoading}
                className="hidden"
                aria-label="Pilih file Excel"
              />

              {/* Ikon Excel besar */}
              <div className="flex justify-center mb-4">
                {selectedFile ? (
                  <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
                    <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                ) : fileError ? (
                  <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                    <svg className="w-9 h-9 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center shadow-md">
                    {/* X ikon Excel */}
                    <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" opacity=".3"/>
                      <path d="M14 2l6 6h-6V2z"/>
                      <path d="M10.5 13.5L9 12l1.5-1.5L9 9l1.5 1.5L12 9l-1.5 1.5L12 12l-1.5-1.5L9 12l1.5 1.5zM15 9l-3 3 3 3-1.5-1.5L12 15l-1.5-1.5L9 15l3-3-3-3 1.5 1.5L12 9l1.5 1.5L15 9z" fill="white"/>
                    </svg>
                  </div>
                )}
              </div>

              {selectedFile ? (
                <div>
                  <p className="text-base font-semibold text-green-700">{selectedFile.name}</p>
                  <p className="text-sm text-green-600 mt-1">{formatFileSize(selectedFile.size)}</p>
                  <p className="text-xs text-green-500 mt-1">File siap diupload</p>
                </div>
              ) : (
                <div>
                  <p className="text-base font-semibold text-blue-600">
                    Klik atau drag &amp; drop file Excel disini
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Format yang didukung: .xls / .xlsx</p>
                  <p className="text-sm text-gray-500">Maksimal ukuran file: {MAX_FILE_SIZE / 1024 / 1024} MB</p>
                </div>
              )}
            </div>

            {/* Error validasi */}
            {fileError && (
              <p role="alert" className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd" />
                </svg>
                {fileError}
              </p>
            )}

            {/* Peringatan duplikat */}
            {dupInfo && !forceUpload && (
              <div role="alert" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none"
                       stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800">File ini sudah pernah diimport</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Diimport pada{' '}
                      <span className="font-medium">{formatDate(dupInfo.createdAt)}</span>
                      {' '}·{' '}
                      <span className="font-medium">{dupInfo.totalRows.toLocaleString('id-ID')} baris</span>
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Mengupload ulang akan menambah data dan bisa menyebabkan data ganda di rekap.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setForceUpload(true)}
                        className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white
                                   rounded-lg hover:bg-amber-700 transition-colors
                                   focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        Tetap Upload
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 py-1.5 text-xs font-medium border border-amber-400
                                   text-amber-700 rounded-lg hover:bg-amber-100 transition-colors
                                   focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Konfirmasi setelah pilih Tetap Upload */}
            {dupInfo && forceUpload && (
              <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5
                              flex items-center gap-2 text-xs text-blue-700">
                <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor"
                     viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Klik <span className="font-semibold mx-1">Upload &amp; Proses</span> untuk melanjutkan.
              </div>
            )}

            {/* Tombol aksi */}
            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                disabled={isLoading || !selectedFile || (!!dupInfo && !forceUpload)}
                className="flex-1 bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold text-sm
                           hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                           flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload &amp; Proses
                  </>
                )}
              </button>

              {(selectedFile || result) && !isLoading && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-3 border border-gray-300 text-gray-600 rounded-xl
                             hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300
                             transition-colors text-sm font-medium"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Info cards bawah */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Format Didukung</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">.xls / .xlsx</p>
              <p className="text-xs text-gray-400">Excel 97 – 2019</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Maksimal File</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">10 MB</p>
              <p className="text-xs text-gray-400">Ukuran file maksimum</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Proses Otomatis</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">Validasi &amp; Simpan</p>
              <p className="text-xs text-gray-400">Tanpa proses manual</p>
            </div>
          </div>
        </div>

        {/* Hasil Import */}
        {result && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-2xl border p-6 ${
              result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            {result.success && result.import ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-green-800">Import Berhasil</h3>
                </div>
                <div className="space-y-2 text-sm text-green-800">
                  {[
                    ['File', result.import.fileName],
                    ['Total Baris', result.import.totalRows.toLocaleString('id-ID')],
                    ['Status', 'Berhasil'],
                    ['Waktu Import', formatDate(result.import.createdAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <span className="font-medium w-28 flex-shrink-0">{label}</span>
                      <span>: {value}</span>
                    </div>
                  ))}
                </div>
                {result.detectedHeaders && result.detectedHeaders.length > 0 && (
                  <details className="mt-4">
                    <summary className="text-xs text-green-700 cursor-pointer hover:text-green-900 font-medium">
                      Lihat detail header Excel
                    </summary>
                    <div className="mt-2 text-xs text-green-700 space-y-1">
                      <p><span className="font-medium">Header terdeteksi:</span> {result.detectedHeaders.join(', ')}</p>
                      {result.availableColumns && result.availableColumns.length > 0 && (
                        <p><span className="font-medium">Kolom diproses:</span> {result.availableColumns.join(', ')}</p>
                      )}
                      {result.missingColumns && result.missingColumns.length > 0 && (
                        <p><span className="font-medium">Kolom tidak ditemukan:</span> {result.missingColumns.join(', ')}</p>
                      )}
                      {result.sheetNames && (
                        <p><span className="font-medium">Sheet:</span> {result.sheetNames.join(', ')}</p>
                      )}
                    </div>
                  </details>
                )}
              </>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-red-800">Import Gagal</h3>
                  <p className="text-sm text-red-700 mt-0.5">{result.message}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Kolom kanan: Alur + Tips ── */}
      <div className="xl:col-span-2 flex flex-col gap-4">

        {/* Alur Import Data */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Alur Import Data</h3>
          </div>

          <ol className="space-y-3">
            {ALUR_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                {/* Number + connector */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-6 h-6 rounded-full ${step.num} flex items-center justify-center`}>
                    <span className="text-white text-[10px] font-bold">{i + 1}</span>
                  </div>
                  {i < ALUR_STEPS.length - 1 && (
                    <div className="w-px h-5 bg-gray-200 mt-1" />
                  )}
                </div>
                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg ${step.color} flex items-center justify-center shrink-0 -mt-0.5`}>
                  {step.icon}
                </div>
                {/* Text */}
                <div className="min-w-0 pb-1">
                  <p className="text-sm font-semibold text-gray-700 leading-none">{step.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Tips Import */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Tips Import</h3>
          </div>

          <ul className="space-y-2.5">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs text-gray-600 leading-snug">{tip}</span>
              </li>
            ))}
          </ul>

          {/* Excel illustration */}
          <div className="mt-5 flex justify-end">
            <div className="w-16 h-14 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-9 h-9 text-green-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="2" y="3" width="20" height="18" rx="2" fill="#16a34a" opacity=".15"/>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#16a34a" opacity=".4"/>
                <path d="M14 2l6 6h-6V2z" fill="#16a34a"/>
                <text x="12" y="17" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#15803d">XLS</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
