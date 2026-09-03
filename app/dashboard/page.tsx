import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
function formatAngka(n: number): string {
  return n.toLocaleString('id-ID')
}

function formatRupiah(val: { toString(): string } | number | null | undefined): string {
  if (val === null || val === undefined) return 'Rp 0'
  const num = typeof val === 'number' ? val : Number(val.toString())
  if (isNaN(num)) return 'Rp 0'
  return 'Rp ' + num.toLocaleString('id-ID')
}

function statusLabel(status: string): { text: string; cls: string } {
  switch (status) {
    case 'completed':
      return { text: 'Selesai', cls: 'bg-green-100 text-green-700' }
    case 'processing':
      return { text: 'Diproses', cls: 'bg-yellow-100 text-yellow-700' }
    case 'failed':
      return { text: 'Gagal', cls: 'bg-red-100 text-red-700' }
    default:
      return { text: 'Pending', cls: 'bg-gray-100 text-gray-500' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card icon backgrounds per kolom
// Total Pelanggan → biru muda | UNITAP → ungu muda | UNITUP → teal muda | Status → hijau muda

function IconUsers() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857
           M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857
           m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconBuilding() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5
           M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}
function IconOffice() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  )
}
function IconShield() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04
           A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622
           0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

// Bar chart icon untuk lembar card
function IconBarChart({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0
           V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5
           a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

// Ikon clock untuk Import Terakhir header
function IconClock() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
// Ikon petir untuk Aksi Cepat header
function IconBolt() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2L4.09 12.97H11L10 22L19.91 11.03H13L13 2Z" />
    </svg>
  )
}
// Ikon eye untuk "lihat detail"
function IconEye() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
           -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
function IconList() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )
}
function IconUpload() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}
function IconChartLg() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0
           V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5
           a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Semua query paralel untuk efisiensi — tidak diubah sama sekali
  const [
    totalPelanggan,
    unitapDistinct,
    unitupDistinct,
    lembar1Count,
    lembar2Count,
    lembar3Count,
    lembar1Rpptl,
    lembar2Rpptl,
    lembar3Rpptl,
    importTerakhir,
  ] = await Promise.all([
    prisma.customerTunggakan.count(),
    prisma.customerTunggakan.findMany({ distinct: ['unitap'], select: { unitap: true } }),
    prisma.customerTunggakan.findMany({ distinct: ['unitup'], select: { unitup: true } }),
    prisma.customerTunggakan.count({ where: { lembar: 1 } }),
    prisma.customerTunggakan.count({ where: { lembar: 2 } }),
    prisma.customerTunggakan.count({ where: { lembar: 3 } }),
    prisma.customerTunggakan.aggregate({ _sum: { rpptl: true }, where: { lembar: 1 } }),
    prisma.customerTunggakan.aggregate({ _sum: { rpptl: true }, where: { lembar: 2 } }),
    prisma.customerTunggakan.aggregate({ _sum: { rpptl: true }, where: { lembar: 3 } }),
    prisma.import.findFirst({ orderBy: { createdAt: 'desc' } }),
  ])

  const totalUnitap = unitapDistinct.length
  const totalUnitup = unitupDistinct.length

  const rpptl1 = lembar1Rpptl._sum.rpptl
  const rpptl2 = lembar2Rpptl._sum.rpptl
  const rpptl3 = lembar3Rpptl._sum.rpptl
  const adaRpptl =
    (rpptl1 !== null && Number(rpptl1.toString()) > 0) ||
    (rpptl2 !== null && Number(rpptl2.toString()) > 0) ||
    (rpptl3 !== null && Number(rpptl3.toString()) > 0)

  return (
    <div className="space-y-6 w-full">

      {/* ── WELCOME HEADER ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Selamat datang, {session.name} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Berikut ringkasan data sistem tunggakan pelanggan.
          </p>
        </div>
        {/* PLN Badge pojok kanan */}
        <div className="shrink-0 flex items-center gap-2 bg-white border border-gray-200
                        rounded-xl px-4 py-2.5 shadow-sm">
          <img src="/logo-pln.png" alt="Logo PLN" className="w-8 h-8 object-contain" />
          <div className="leading-tight">
            <p className="text-[#0D1B4B] font-bold text-sm leading-none">PLN</p>
            <p className="text-gray-500 text-[10px] tracking-wide uppercase mt-0.5">
              UP3 Medan
            </p>
          </div>
        </div>
      </div>



      {/* ── STAT CARDS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Total Pelanggan */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center
                          text-[#3B5BDB] shrink-0">
            <IconUsers />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest leading-none">
              Total Pelanggan
            </p>
            <p className="text-3xl font-bold text-[#1A1A2E] mt-1 tabular-nums leading-none">
              {formatAngka(totalPelanggan)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Data customer_tunggakans</p>
          </div>
        </div>

        {/* Total UNITAP */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F3EEFF] flex items-center justify-center
                          text-[#7C3AED] shrink-0">
            <IconBuilding />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest leading-none">
              Total UNITAP
            </p>
            <p className="text-3xl font-bold text-[#1A1A2E] mt-1 tabular-nums leading-none">
              {formatAngka(totalUnitap)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Unit Area Pelayanan unik</p>
          </div>
        </div>

        {/* Total UNITUP */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] flex items-center justify-center
                          text-[#059669] shrink-0">
            <IconOffice />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest leading-none">
              Total UNITUP
            </p>
            <p className="text-3xl font-bold text-[#1A1A2E] mt-1 tabular-nums leading-none">
              {formatAngka(totalUnitup)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Unit Pelayanan unik</p>
          </div>
        </div>

        {/* Status Sistem */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F0FFF4] flex items-center justify-center
                          text-[#16A34A] shrink-0">
            <IconShield />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest leading-none">
              Status Sistem
            </p>
            <p className="text-2xl font-bold text-[#16A34A] mt-1 leading-none">Aktif</p>
            <p className="text-[11px] text-gray-400 mt-1">Semua layanan berjalan</p>
          </div>
        </div>
      </div>

      {/* ── RINGKASAN PER LEMBAR ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <IconBarChart className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
            Ringkasan Per Lembar
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Lembar 1 — biru PLN */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-[#EEF2FF] to-[#E8EDFF] p-5 relative overflow-hidden">
            {/* Decorative chart icon */}
            <div className="absolute right-3 top-3 opacity-20">
              <IconBarChart className="w-12 h-12 text-[#3B5BDB]" />
            </div>
            <p className="text-[11px] font-bold text-[#3B5BDB] uppercase tracking-widest mb-2">
              Lembar 1
            </p>
            <p className="text-4xl font-bold text-[#3B5BDB] tabular-nums leading-none">
              {formatAngka(lembar1Count)}
            </p>
            <p className="text-xs text-[#3B5BDB]/60 mt-1">pelanggan</p>
            {adaRpptl && (
              <p className="text-xs font-semibold text-[#3B5BDB] mt-3">
                RPPTL: {formatRupiah(rpptl1)}
              </p>
            )}
          </div>

          {/* Lembar 2 — oranye/kuning */}
          <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] p-5 relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-20">
              <IconBarChart className="w-12 h-12 text-[#D97706]" />
            </div>
            <p className="text-[11px] font-bold text-[#D97706] uppercase tracking-widest mb-2">
              Lembar 2
            </p>
            <p className="text-4xl font-bold text-[#D97706] tabular-nums leading-none">
              {formatAngka(lembar2Count)}
            </p>
            <p className="text-xs text-[#D97706]/60 mt-1">pelanggan</p>
            {adaRpptl && (
              <p className="text-xs font-semibold text-[#D97706] mt-3">
                RPPTL: {formatRupiah(rpptl2)}
              </p>
            )}
          </div>

          {/* Lembar 3 — ungu */}
          <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] p-5 relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-20">
              <IconBarChart className="w-12 h-12 text-[#7C3AED]" />
            </div>
            <p className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-widest mb-2">
              Lembar 3
            </p>
            <p className="text-4xl font-bold text-[#7C3AED] tabular-nums leading-none">
              {formatAngka(lembar3Count)}
            </p>
            <p className="text-xs text-[#7C3AED]/60 mt-1">pelanggan</p>
            {adaRpptl && (
              <p className="text-xs font-semibold text-[#7C3AED] mt-3">
                RPPTL: {formatRupiah(rpptl3)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── IMPORT TERAKHIR + AKSI CEPAT ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Import Terakhir — 3/5 lebar */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gray-500">
              <IconClock />
            </span>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
              Import Terakhir
            </h2>
          </div>

          {importTerakhir === null ? (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center
                              mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                       a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Belum pernah ada import.</p>
              <Link href="/dashboard/import"
                className="inline-flex items-center gap-1 mt-2 text-[#0D1B4B] text-sm font-semibold hover:underline">
                Pergi ke Import Data →
              </Link>
            </div>
          ) : (
            <>
              {/* Tabel mini */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[380px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Nama File', 'Jumlah Baris', 'Status', 'Waktu Import', 'Aksi'].map(h => (
                        <th key={h}
                          className="pb-2.5 text-left text-[11px] font-semibold text-gray-400
                                     uppercase tracking-wider pr-4 last:pr-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-800 max-w-[140px]">
                        <span className="truncate block" title={importTerakhir.fileName}>
                          {importTerakhir.fileName}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 tabular-nums">
                        {formatAngka(importTerakhir.totalRows)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold
                                          ${statusLabel(importTerakhir.status).cls}`}>
                          {statusLabel(importTerakhir.status).text}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 text-xs whitespace-nowrap">
                        {importTerakhir.createdAt.toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3">
                        <Link href="/dashboard/imports"
                          className="text-[#3B5BDB] hover:text-[#2A4BC7] transition-colors"
                          title="Lihat riwayat import">
                          <IconEye />
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tombol lihat semua */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <Link href="/dashboard/imports"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600
                             border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
                  <IconList />
                  Lihat Semua Riwayat Import
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Aksi Cepat — 2/5 lebar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#FFD700]">
              <IconBolt />
            </span>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
              Aksi Cepat
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {/* Import Data Excel */}
            <Link href="/dashboard/import"
              className="flex items-center gap-4 px-4 py-3 rounded-xl
                         bg-[#EEF2FF] hover:bg-[#E0E8FF] transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-[#3B5BDB]/10 flex items-center justify-center
                              text-[#3B5BDB] shrink-0 group-hover:scale-105 transition-transform">
                <IconUpload />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#3B5BDB] leading-none">Import Data Excel</p>
                <p className="text-xs text-[#3B5BDB]/60 mt-0.5">Upload dan import file Excel</p>
              </div>
            </Link>

            {/* Rekap Tunggakan */}
            <Link href="/dashboard/rekap"
              className="flex items-center gap-4 px-4 py-3 rounded-xl
                         bg-[#F5F3FF] hover:bg-[#EDE9FE] transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center
                              text-[#7C3AED] shrink-0 group-hover:scale-105 transition-transform">
                <IconChartLg />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#7C3AED] leading-none">Rekap Tunggakan</p>
                <p className="text-xs text-[#7C3AED]/60 mt-0.5">Lihat rekap per lembar dan unit layanan</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* spacer bawah agar konten tidak terpotong */}
      <div className="h-2" aria-hidden="true" />
    </div>
  )
}
