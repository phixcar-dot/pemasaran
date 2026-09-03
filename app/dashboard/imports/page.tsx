import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DeleteImportButton from '@/components/DeleteImportButton'

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed:  { label: 'Selesai',   cls: 'bg-green-100 text-green-700' },
    processing: { label: 'Diproses',  cls: 'bg-yellow-100 text-yellow-700' },
    failed:     { label: 'Gagal',     cls: 'bg-red-100 text-red-700' },
    pending:    { label: 'Pending',   cls: 'bg-gray-100 text-gray-500' },
  }
  const { label, cls } = map[status] ?? map.pending
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
}

function formatDate(date: Date): string {
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB'
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

const PAGE_SIZE = 10

export default async function ImportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10))

  // Counts
  const [totalCount, completedCount, failedCount] = await Promise.all([
    prisma.import.count(),
    prisma.import.count({ where: { status: 'completed' } }),
    prisma.import.count({ where: { status: 'failed' } }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  // Latest import for the "Import Terakhir" card
  const latestImport = await prisma.import.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })

  // Paginated list
  const imports = await prisma.import.findMany({
    orderBy: { createdAt: 'desc' },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id:          true,
      fileName:    true,
      totalRows:   true,
      status:      true,
      uploadedBy:  true,
      createdAt:   true,
    },
  })

  // Build page number array (max 5 visible)
  const pageNums: (number | '...')[] = []
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pageNums.push(i)
  } else {
    pageNums.push(1)
    if (safePage > 3) pageNums.push('...')
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
      pageNums.push(i)
    }
    if (safePage < totalPages - 2) pageNums.push('...')
    pageNums.push(totalPages)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Riwayat Import</h1>
          <p className="text-gray-500 text-sm mt-1">
            Daftar semua file Excel yang pernah diimport ke sistem.
          </p>
        </div>
        <Link
          href="/dashboard/import"
          className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2.5
                     rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import Data Baru
        </Link>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Import */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Import</p>
            <p className="text-3xl font-bold text-gray-800 leading-tight">{totalCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total file diimport</p>
          </div>
        </div>

        {/* Berhasil */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Berhasil</p>
            <p className="text-3xl font-bold text-gray-800 leading-tight">{completedCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Import berhasil</p>
          </div>
        </div>

        {/* Gagal */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Gagal</p>
            <p className="text-3xl font-bold text-gray-800 leading-tight">{failedCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">Import gagal</p>
          </div>
        </div>

        {/* Import Terakhir */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Import Terakhir</p>
            {latestImport ? (
              <>
                <p className="text-lg font-bold text-blue-600 leading-tight">
                  {formatDateShort(latestImport.createdAt)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatTime(latestImport.createdAt)}</p>
              </>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Belum ada</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Main area: Table + Sidebar ── */}
      <div className="flex gap-5 items-start">

        {/* ── Table panel ── */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table header bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Riwayat Import Terbaru</h2>
          </div>

          {/* Empty state */}
          {imports.length === 0 && (
            <div className="py-20 flex flex-col items-center gap-3 text-center px-6">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 font-medium">Belum ada riwayat import.</p>
              <p className="text-sm text-gray-400">Upload file Excel untuk mulai mengimpor data tunggakan.</p>
              <Link
                href="/dashboard/import"
                className="mt-2 inline-flex items-center gap-2 bg-blue-700 text-white px-5 py-2.5
                           rounded-lg font-medium hover:bg-blue-800 transition-colors text-sm"
              >
                Import Data Baru
              </Link>
            </div>
          )}

          {/* Desktop table */}
          {imports.length > 0 && (
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center w-10">No</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama File</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Jumlah Baris</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Waktu Import</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Diimport Oleh</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {imports.map((imp, idx) => (
                    <tr key={imp.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3 text-center text-gray-400 tabular-nums text-xs">
                        {(safePage - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700 font-medium break-all">{imp.fileName}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                        {imp.totalRows.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={imp.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {formatDate(imp.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {imp.uploadedBy || session.name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/dashboard/imports/${imp.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                                       text-gray-400 hover:text-blue-600 hover:bg-blue-50
                                       transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                            title="Lihat detail"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <DeleteImportButton
                            importId={imp.id}
                            fileName={imp.fileName}
                            variant="icon"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile cards */}
          {imports.length > 0 && (
            <div className="sm:hidden divide-y divide-gray-100">
              {imports.map((imp, idx) => (
                <div key={imp.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 mb-0.5">#{(safePage - 1) * PAGE_SIZE + idx + 1}</p>
                      <p className="text-sm font-medium text-gray-700 break-all">{imp.fileName}</p>
                    </div>
                    <StatusBadge status={imp.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span><span className="font-medium">Baris:</span> {imp.totalRows.toLocaleString('id-ID')}</span>
                    <span><span className="font-medium">Waktu:</span> {formatDate(imp.createdAt)}</span>
                    <span><span className="font-medium">Oleh:</span> {imp.uploadedBy || session.name}</span>
                  </div>
                  <div className="pt-1 flex items-center gap-2">
                    <Link
                      href={`/dashboard/imports/${imp.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                                 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Detail
                    </Link>
                    <DeleteImportButton
                      importId={imp.id}
                      fileName={imp.fileName}
                      variant="icon"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Pagination footer ── */}
          {imports.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between gap-4 bg-gray-50/50">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Tampilkan</span>
                <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-700 font-medium">
                  {PAGE_SIZE}
                </span>
                <span>data</span>
              </div>

              <nav className="flex items-center gap-1" aria-label="Pagination">
                {/* Prev */}
                {safePage > 1 ? (
                  <Link
                    href={`?page=${safePage - 1}`}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                               text-gray-500 hover:bg-white hover:border-gray-300 transition-colors"
                    aria-label="Halaman sebelumnya"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Link>
                ) : (
                  <span className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100
                                   text-gray-300 cursor-not-allowed">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </span>
                )}

                {pageNums.map((n, i) =>
                  n === '...' ? (
                    <span key={`dots-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">
                      …
                    </span>
                  ) : (
                    <Link
                      key={n}
                      href={`?page=${n}`}
                      className={[
                        'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
                        n === safePage
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300',
                      ].join(' ')}
                      aria-current={n === safePage ? 'page' : undefined}
                    >
                      {n}
                    </Link>
                  )
                )}

                {/* Next */}
                {safePage < totalPages ? (
                  <Link
                    href={`?page=${safePage + 1}`}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                               text-gray-500 hover:bg-white hover:border-gray-300 transition-colors"
                    aria-label="Halaman berikutnya"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <span className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100
                                   text-gray-300 cursor-not-allowed">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </nav>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="hidden lg:flex flex-col gap-4 w-64 shrink-0">

          {/* Info card */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-blue-700">Informasi</h3>
            </div>
            <p className="text-xs text-blue-600 leading-relaxed">
              Riwayat import menampilkan semua file Excel yang pernah diupload ke sistem beserta
              status dan waktu prosesnya.
            </p>
          </div>

          {/* Tips card */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-sm font-semibold text-yellow-700">Tips</h3>
            </div>
            <ul className="space-y-1.5">
              {[
                'Gunakan tombol "Import Data Baru" untuk mengupload file baru.',
                'Klik ikon mata pada kolom aksi untuk melihat detail hasil import.',
                'Jika import gagal, periksa format file dan coba upload ulang.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-yellow-700">
                  <svg className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Format File card */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-green-700">Format File</h3>
            </div>
            <ul className="text-xs text-green-700 space-y-1">
              <li>Format yang didukung: <span className="font-medium">.xls / .xlsx</span></li>
              <li>Maksimal ukuran file: <span className="font-medium">10 MB</span></li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  )
}
