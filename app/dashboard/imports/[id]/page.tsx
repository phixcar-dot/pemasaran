import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DataTable, { type TunggakanRow } from '@/components/DataTable'
import DeleteImportButton from '@/components/DeleteImportButton'
import ExportButton from '@/components/ExportButton'
import PageSizeSelect from '@/components/PageSizeSelect'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const DEFAULT_PAGE_SIZE = 10

interface ImportDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string; size?: string }>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; iconCls: string }> = {
    completed: {
      label:   'Selesai',
      cls:     'bg-green-100 text-green-700 border-green-200',
      iconCls: 'text-green-500',
    },
    processing: {
      label:   'Diproses',
      cls:     'bg-yellow-100 text-yellow-700 border-yellow-200',
      iconCls: 'text-yellow-500',
    },
    failed: {
      label:   'Gagal',
      cls:     'bg-red-100 text-red-700 border-red-200',
      iconCls: 'text-red-500',
    },
    pending: {
      label:   'Pending',
      cls:     'bg-gray-100 text-gray-600 border-gray-200',
      iconCls: 'text-gray-400',
    },
  }
  const { label, cls } = map[status] ?? map.pending
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {status === 'completed' && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {label}
    </span>
  )
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(date: Date): string {
  return (
    date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
    ' WIB'
  )
}

export default async function ImportDetailPage({
  params,
  searchParams,
}: ImportDetailPageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id: idStr } = await params
  const id = parseInt(idStr, 10)
  if (isNaN(id) || id <= 0) notFound()

  const { page: pageStr, size: sizeStr } = await searchParams
  const pageSize = PAGE_SIZE_OPTIONS.includes(parseInt(sizeStr ?? '', 10))
    ? parseInt(sizeStr!, 10)
    : DEFAULT_PAGE_SIZE
  const currentPage = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
  const skip = (currentPage - 1) * pageSize

  const [importRecord, totalRows, rows] = await Promise.all([
    prisma.import.findUnique({
      where: { id },
      select: {
        id:        true,
        fileName:  true,
        totalRows: true,
        status:    true,
        createdAt: true,
      },
    }),
    prisma.customerTunggakan.count({ where: { importId: id } }),
    prisma.customerTunggakan.findMany({
      where:   { importId: id },
      skip,
      take:    pageSize,
      orderBy: { id: 'asc' },
      include: { import: { select: { fileName: true, createdAt: true } } },
    }),
  ])

  if (!importRecord) notFound()

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const safePage   = Math.min(currentPage, totalPages)
  const typedRows: TunggakanRow[] = rows

  function buildUrl(page: number, size?: number): string {
    const s = size ?? pageSize
    return `/dashboard/imports/${id}?page=${page}&size=${s}`
  }

  // Pagination numbers: always show first, last, and window around current
  const pageNums: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNums.push(i)
  } else {
    pageNums.push(1)
    if (safePage > 3)              pageNums.push('...')
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
      pageNums.push(i)
    }
    if (safePage < totalPages - 2) pageNums.push('...')
    pageNums.push(totalPages)
  }

  const exportHref = `/api/export/data?importId=${id}`

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/dashboard/imports" className="hover:text-blue-600 transition-colors">
          Riwayat Import
        </Link>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-700 font-medium truncate max-w-xs" title={importRecord.fileName}>
          {importRecord.fileName}
        </span>
      </nav>

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Detail Import</h1>
          <p className="text-gray-400 text-sm mt-0.5">{importRecord.fileName}</p>
        </div>
        <DeleteImportButton importId={importRecord.id} fileName={importRecord.fileName} />
      </div>

      {/* ── Info cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Nama File */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">Nama File</p>
            <p className="font-semibold text-gray-800 text-sm truncate" title={importRecord.fileName}>
              {importRecord.fileName}
            </p>
          </div>
        </div>

        {/* Jumlah Data */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Jumlah Data</p>
            <p className="font-semibold text-gray-800 text-sm tabular-nums">
              {totalRows.toLocaleString('id-ID')} baris
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <StatusBadge status={importRecord.status} />
          </div>
        </div>

        {/* Waktu Import */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Waktu Import</p>
            <p className="font-semibold text-gray-800 text-sm leading-tight">
              {formatDateLong(importRecord.createdAt)}
            </p>
            <p className="text-xs text-gray-400">{formatTime(importRecord.createdAt)}</p>
          </div>
        </div>

      </div>

      {/* ── Info banner ── */}
      <div className="relative bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 overflow-hidden">
        <div className="flex items-start gap-3 relative z-10">
          <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor"
               viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-700">Informasi</p>
            <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
              Berikut adalah data yang berhasil diimport dari file Excel. Pastikan data yang diimport
              sudah sesuai sebelum digunakan untuk rekapitulasi.
            </p>
          </div>
        </div>
        {/* Decorative Excel illustration */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none"
             aria-hidden="true">
          <svg viewBox="0 0 80 80" className="w-16 h-16 text-green-600" fill="currentColor">
            <rect x="8"  y="4"  width="64" height="72" rx="6" fill="#16a34a" />
            <rect x="16" y="16" width="18" height="10" rx="1" fill="white" opacity=".9" />
            <rect x="38" y="16" width="22" height="10" rx="1" fill="white" opacity=".9" />
            <rect x="16" y="30" width="18" height="10" rx="1" fill="white" opacity=".9" />
            <rect x="38" y="30" width="22" height="10" rx="1" fill="white" opacity=".9" />
            <rect x="16" y="44" width="18" height="10" rx="1" fill="white" opacity=".9" />
            <rect x="38" y="44" width="22" height="10" rx="1" fill="white" opacity=".9" />
          </svg>
        </div>
      </div>

      {/* ── Data table panel ── */}
      {totalRows === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-20
                        flex flex-col items-center gap-3 text-center">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor"
               viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1
                 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 font-medium">Tidak ada data yang tersimpan untuk import ini.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Table toolbar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-800 text-sm">Data Tunggakan</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                               font-medium bg-blue-100 text-blue-700 tabular-nums">
                {totalRows.toLocaleString('id-ID')} baris
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton href={exportHref} label="Export Excel" />
            </div>
          </div>

          {/* Table */}
          <DataTable rows={typedRows} startNo={skip + 1} />

          {/* ── Pagination footer ── */}
          <div className="border-t border-gray-100 bg-gray-50/40 px-5 py-3
                          flex items-center justify-between flex-wrap gap-3">

            {/* Page size selector */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Tampilkan</span>
              <PageSizeSelect
                value={pageSize}
                options={PAGE_SIZE_OPTIONS}
                baseUrl={`/dashboard/imports/${id}`}
              />
              <span>data</span>
            </div>

            {/* Page numbers */}
            <nav className="flex items-center gap-1" aria-label="Pagination">
              {/* « first */}
              {safePage > 1 ? (
                <a href={buildUrl(1)}
                   className="w-7 h-7 flex items-center justify-center rounded border
                              border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300
                              transition-colors text-xs"
                   aria-label="Halaman pertama">«</a>
              ) : (
                <span className="w-7 h-7 flex items-center justify-center rounded border
                                 border-gray-100 text-gray-300 cursor-not-allowed text-xs">«</span>
              )}

              {/* ‹ prev */}
              {safePage > 1 ? (
                <a href={buildUrl(safePage - 1)}
                   className="w-7 h-7 flex items-center justify-center rounded border
                              border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300
                              transition-colors text-xs"
                   aria-label="Halaman sebelumnya">‹</a>
              ) : (
                <span className="w-7 h-7 flex items-center justify-center rounded border
                                 border-gray-100 text-gray-300 cursor-not-allowed text-xs">‹</span>
              )}

              {/* page numbers */}
              {pageNums.map((n, i) =>
                n === '...' ? (
                  <span key={`dots-${i}`}
                        className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">
                    …
                  </span>
                ) : (
                  <a key={n}
                     href={buildUrl(n)}
                     aria-current={n === safePage ? 'page' : undefined}
                     className={[
                       'w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors',
                       n === safePage
                         ? 'bg-blue-600 text-white shadow-sm border border-blue-600'
                         : 'border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300',
                     ].join(' ')}>
                    {n}
                  </a>
                )
              )}

              {/* › next */}
              {safePage < totalPages ? (
                <a href={buildUrl(safePage + 1)}
                   className="w-7 h-7 flex items-center justify-center rounded border
                              border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300
                              transition-colors text-xs"
                   aria-label="Halaman berikutnya">›</a>
              ) : (
                <span className="w-7 h-7 flex items-center justify-center rounded border
                                 border-gray-100 text-gray-300 cursor-not-allowed text-xs">›</span>
              )}

              {/* » last */}
              {safePage < totalPages ? (
                <a href={buildUrl(totalPages)}
                   className="w-7 h-7 flex items-center justify-center rounded border
                              border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300
                              transition-colors text-xs"
                   aria-label="Halaman terakhir">»</a>
              ) : (
                <span className="w-7 h-7 flex items-center justify-center rounded border
                                 border-gray-100 text-gray-300 cursor-not-allowed text-xs">»</span>
              )}
            </nav>
          </div>

        </div>
      )}
    </div>
  )
}
