import React from 'react'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/prisma/generated/client'
import ExportButton from '@/components/ExportButton'
import RekapFilterControls from '@/components/RekapFilterControls'
import { getUlpName } from '@/lib/ulpNames'

interface RekapPageProps {
  searchParams: Promise<{
    kogol?:    string
    importId?: string
  }>
}

function fmtNum(n: number): string {
  return n.toLocaleString('id-ID')
}

function fmtRpptl(d: Prisma.Decimal): string {
  const num = Number(d)
  if (isNaN(num)) return '0'
  return num.toLocaleString('id-ID')
}

export default async function RekapPage({ searchParams }: RekapPageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const params       = await searchParams
  const filterKogol  = params.kogol?.trim() ?? ''
  const filterImport = params.importId ? parseInt(params.importId, 10) : null
  const selectedImportId = filterImport && !isNaN(filterImport) ? filterImport : null

  // Mode: per-kogol ketika ?kogol=1 ada di URL
  const isKogolMode = filterKogol !== ''

  const ZERO = new Prisma.Decimal(0)

  // ── Daftar import untuk dropdown filter ──────────────────────
  const importList = await prisma.import.findMany({
    where:   { status: 'completed' },
    orderBy: { createdAt: 'desc' },
    select:  { id: true, fileName: true, createdAt: true, totalRows: true },
  })

  // ── Base where: filter per import jika dipilih ───────────────
  const baseWhere = selectedImportId ? { importId: selectedImportId } : {}

  // Export URLs
  const exportParams = new URLSearchParams()
  if (filterKogol)      exportParams.set('kogol',    filterKogol)
  if (selectedImportId) exportParams.set('importId', String(selectedImportId))
  const qs         = exportParams.toString() ? '?' + exportParams.toString() : ''
  const exportHref = `/api/export/rekap${qs}`
  const pdfHref    = `/api/export/rekap-pdf${qs}`

  const hasFilter = isKogolMode || selectedImportId !== null

  // ════════════════════════════════════════════════════════════
  // MODE LEMBAR (default): groupBy unitup + lembar
  // ════════════════════════════════════════════════════════════
  type LembarRow = {
    unitup:      string
    l1_plg:      number; l1_rpptl: Prisma.Decimal
    l2_plg:      number; l2_rpptl: Prisma.Decimal
    l3_plg:      number; l3_rpptl: Prisma.Decimal
    total_plg:   number; total_rpptl: Prisma.Decimal
  }

  let lembarRows: LembarRow[]   = []
  let totL1Plg = 0, totL2Plg = 0, totL3Plg = 0, totAllPlgL = 0
  let totL1Rp = ZERO, totL2Rp = ZERO, totL3Rp = ZERO, totAllRpL = ZERO

  const showL1 = true
  const showL2 = true
  const showL3 = true

  // ════════════════════════════════════════════════════════════
  // MODE KOGOL (filter kogol aktif): groupBy unitup + kogol
  // ════════════════════════════════════════════════════════════
  type KogolData = { plg: number; rpptl: Prisma.Decimal }
  type KogolRow  = {
    unitup:       string
    kogolMap:     Map<string, KogolData>
    total_plg:    number
    total_rpptl:  Prisma.Decimal
  }

  let kogolRows: KogolRow[]  = []
  let kogolList: string[]    = []
  let totByKogol             = new Map<string, { plg: number; rpptl: Prisma.Decimal }>()
  let totAllPlgK = 0, totAllRpK = ZERO

  if (!isKogolMode) {
    // ── Query per lembar — hanya kogol '0' ────────────────────
    const whereL = { ...baseWhere, lembar: { in: [1, 2, 3] }, kogol: '0' }
    const grouped = await prisma.customerTunggakan.groupBy({
      by:      ['unitup', 'lembar'],
      where:   whereL,
      _count:  { _all: true },
      _sum:    { rpptl: true },
      orderBy: [{ unitup: 'asc' }, { lembar: 'asc' }],
    })

    const rekapMap = new Map<string, {
      l1_plg: number; l1_rpptl: Prisma.Decimal
      l2_plg: number; l2_rpptl: Prisma.Decimal
      l3_plg: number; l3_rpptl: Prisma.Decimal
    }>()

    for (const row of grouped) {
      if (!rekapMap.has(row.unitup)) {
        rekapMap.set(row.unitup, {
          l1_plg: 0, l1_rpptl: ZERO,
          l2_plg: 0, l2_rpptl: ZERO,
          l3_plg: 0, l3_rpptl: ZERO,
        })
      }
      const e  = rekapMap.get(row.unitup)!
      const rp = row._sum.rpptl ?? ZERO
      if (row.lembar === 1) { e.l1_plg = row._count._all; e.l1_rpptl = rp }
      if (row.lembar === 2) { e.l2_plg = row._count._all; e.l2_rpptl = rp }
      if (row.lembar === 3) { e.l3_plg = row._count._all; e.l3_rpptl = rp }
    }

    lembarRows = Array.from(rekapMap.entries())
      .map(([unitup, v]) => ({
        unitup,
        l1_plg: v.l1_plg, l1_rpptl: v.l1_rpptl,
        l2_plg: v.l2_plg, l2_rpptl: v.l2_rpptl,
        l3_plg: v.l3_plg, l3_rpptl: v.l3_rpptl,
        total_plg:   v.l1_plg + v.l2_plg + v.l3_plg,
        total_rpptl: v.l1_rpptl.add(v.l2_rpptl).add(v.l3_rpptl),
      }))
      .sort((a, b) => a.unitup.localeCompare(b.unitup))

    totL1Plg   = lembarRows.reduce((s, r) => s + r.l1_plg, 0)
    totL2Plg   = lembarRows.reduce((s, r) => s + r.l2_plg, 0)
    totL3Plg   = lembarRows.reduce((s, r) => s + r.l3_plg, 0)
    totAllPlgL = totL1Plg + totL2Plg + totL3Plg
    totL1Rp    = lembarRows.reduce((s, r) => s.add(r.l1_rpptl), ZERO)
    totL2Rp    = lembarRows.reduce((s, r) => s.add(r.l2_rpptl), ZERO)
    totL3Rp    = lembarRows.reduce((s, r) => s.add(r.l3_rpptl), ZERO)
    totAllRpL  = totL1Rp.add(totL2Rp).add(totL3Rp)
  } else {
    // ── Query per kogol ────────────────────────────────────────
    // Ambil semua kogol unik yang ada (untuk membangun kolom)
    const allKogolRaw = await prisma.customerTunggakan.findMany({
      distinct: ['kogol'],
      select:   { kogol: true },
      orderBy:  { kogol: 'asc' },
    })
    kogolList = allKogolRaw.map((r) => r.kogol).filter(Boolean)

    // groupBy semua unitup + kogol tanpa filter lembar, tapi pakai baseWhere
    const grouped = await prisma.customerTunggakan.groupBy({
      by:      ['unitup', 'kogol'],
      where:   baseWhere,
      _count:  { _all: true },
      _sum:    { rpptl: true },
      orderBy: [{ unitup: 'asc' }, { kogol: 'asc' }],
    })

    // Semua unitup tampil dengan semua kolom kogol
    const rekapMap = new Map<string, Map<string, KogolData>>()
    for (const row of grouped) {
      if (!rekapMap.has(row.unitup)) rekapMap.set(row.unitup, new Map())
      rekapMap.get(row.unitup)!.set(row.kogol, {
        plg:   row._count._all,
        rpptl: row._sum.rpptl ?? ZERO,
      })
    }

    kogolRows = Array.from(rekapMap.entries())
      .map(([unitup, kogolMap]) => {
        let total_plg   = 0
        let total_rpptl = ZERO
        for (const { plg, rpptl } of kogolMap.values()) {
          total_plg   += plg
          total_rpptl  = total_rpptl.add(rpptl)
        }
        return { unitup, kogolMap, total_plg, total_rpptl }
      })
      .sort((a, b) => a.unitup.localeCompare(b.unitup))

    // Total per kogol
    for (const kogol of kogolList) {
      let plg = 0, rpptl = ZERO
      for (const row of kogolRows) {
        const k = row.kogolMap.get(kogol)
        if (k) { plg += k.plg; rpptl = rpptl.add(k.rpptl) }
      }
      totByKogol.set(kogol, { plg, rpptl })
    }
    totAllPlgK = kogolRows.reduce((s, r) => s + r.total_plg, 0)
    totAllRpK  = kogolRows.reduce((s, r) => s.add(r.total_rpptl), ZERO)
  }

  const hasData    = isKogolMode ? kogolRows.length > 0 : lembarRows.length > 0
  const totAllPlg  = isKogolMode ? totAllPlgK  : totAllPlgL
  const totAllRpptl = isKogolMode ? totAllRpK  : totAllRpL

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Rekap Tunggakan</h1>
        <p className="text-gray-500 text-sm mt-1">
          Rekapitulasi jumlah pelanggan dan nilai tagihan per unit layanan.
        </p>
      </div>

      {/* Filter */}
      <RekapFilterControls
        isKogolMode={isKogolMode}
        importOptions={importList.map((imp) => ({
          id:        imp.id,
          fileName:  imp.fileName,
          createdAt: imp.createdAt.toISOString(),
          totalRows: imp.totalRows,
        }))}
        selectedImport={selectedImportId}
      />

      {/* ── Summary Cards + Export ── */}
      {hasData && (
        <div className="flex flex-wrap items-stretch gap-4 mb-5">
          {/* Card Unit Layanan */}
          <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 min-w-[160px]">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5
                     M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Unit Layanan</p>
              <p className="text-2xl font-bold text-gray-800 tabular-nums leading-tight">
                {(isKogolMode ? kogolRows : lembarRows).length}
              </p>
              <p className="text-[11px] text-gray-400">Total unit layanan</p>
            </div>
          </div>

          {/* Card Total Pelanggan */}
          <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 min-w-[160px]">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857
                     M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857
                     m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Total Pelanggan</p>
              <p className="text-2xl font-bold text-gray-800 tabular-nums leading-tight">
                {fmtNum(totAllPlg)}
              </p>
              <p className="text-[11px] text-gray-400">Total pelanggan</p>
            </div>
          </div>

          {/* Card Total Nilai Tunggakan */}
          <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 min-w-[200px]">
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                     a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Total Nilai Tunggakan</p>
              <p className="text-2xl font-bold text-gray-800 tabular-nums leading-tight">
                {fmtRpptl(totAllRpptl)}
              </p>
              <p className="text-[11px] text-gray-400">Total nilai (RPPTL)</p>
            </div>
          </div>

          {/* Spacer + Export buttons */}
          <div className="flex-1" />
          <div className="flex flex-col gap-2 justify-center">
            <ExportButton href={exportHref} label="Export Excel" />
            <ExportButton href={pdfHref}    label="Export PDF" downloadExt="pdf" />
          </div>
        </div>
      )}

      {/* Kosong */}
      {!hasData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-16
                        flex flex-col items-center gap-3 text-center">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor"
               viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                 a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {hasFilter ? (
            <>
              <p className="text-gray-500 font-medium">Tidak ada data yang sesuai dengan filter.</p>
              <p className="text-sm text-gray-400">Coba ubah atau reset filter.</p>
            </>
          ) : (
            <>
              <p className="text-gray-500 font-medium">Belum ada data hasil import.</p>
              <p className="text-sm text-gray-400">Upload file Excel terlebih dahulu.</p>
            </>
          )}
        </div>
      )}

      {/* ── TABEL REKAP ── */}
      {hasData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: '#1a3a6b' }} className="text-white">
                  <th rowSpan={2}
                      className="border border-blue-900 px-3 py-3 text-center font-semibold
                                 whitespace-nowrap align-middle w-12">
                    NO
                  </th>
                  <th rowSpan={2}
                      className="border border-blue-900 px-4 py-3 text-left font-semibold
                                 whitespace-nowrap min-w-[160px] align-middle">
                    UNIT LAYANAN
                  </th>

                  {/* ── Header mode LEMBAR ── */}
                  {!isKogolMode && showL1 && (
                    <th colSpan={2} className="border border-blue-900 px-3 py-3 text-center font-semibold">
                      1 LEMBAR
                    </th>
                  )}
                  {!isKogolMode && showL2 && (
                    <th colSpan={2} className="border border-blue-900 px-3 py-3 text-center font-semibold">
                      2 LEMBAR
                    </th>
                  )}
                  {!isKogolMode && showL3 && (
                    <th colSpan={2} className="border border-blue-900 px-3 py-3 text-center font-semibold">
                      3 LEMBAR
                    </th>
                  )}

                  {/* ── Header mode KOGOL ── */}
                  {isKogolMode && kogolList.map((kogol) => (
                    <th key={kogol} colSpan={2}
                        className="border border-blue-900 px-3 py-3 text-center font-semibold">
                      KOGOL {kogol}
                    </th>
                  ))}

                  <th colSpan={2} className="border border-blue-900 px-3 py-3 text-center font-semibold">
                    TOTAL
                  </th>
                </tr>

                <tr style={{ background: '#1e4080' }} className="text-white text-xs">
                  {/* Sub-header mode LEMBAR */}
                  {!isKogolMode && showL1 && <>
                    <th className="border border-blue-900 px-3 py-2 text-right font-medium whitespace-nowrap">PLG</th>
                    <th className="border border-blue-900 px-3 py-2 text-right font-medium whitespace-nowrap">RPPTL</th>
                  </>}
                  {!isKogolMode && showL2 && <>
                    <th className="border border-blue-900 px-3 py-2 text-right font-medium whitespace-nowrap">PLG</th>
                    <th className="border border-blue-900 px-3 py-2 text-right font-medium whitespace-nowrap">RPPTL</th>
                  </>}
                  {!isKogolMode && showL3 && <>
                    <th className="border border-blue-900 px-3 py-2 text-right font-medium whitespace-nowrap">PLG</th>
                    <th className="border border-blue-900 px-3 py-2 text-right font-medium whitespace-nowrap">RPPTL</th>
                  </>}
                  {/* Sub-header mode KOGOL */}
                  {isKogolMode && kogolList.map((kogol) => (
                    <React.Fragment key={kogol}>
                      <th className="border border-blue-900 px-3 py-2 text-right font-medium whitespace-nowrap">PLG</th>
                      <th className="border border-blue-900 px-3 py-2 text-right font-medium whitespace-nowrap">RPPTL</th>
                    </React.Fragment>
                  ))}
                  <th className="border border-blue-900 px-3 py-2 text-right font-medium whitespace-nowrap">PLG</th>
                  <th className="border border-blue-900 px-3 py-2 text-right font-medium whitespace-nowrap">RPPTL</th>
                </tr>
              </thead>

              <tbody>
                {/* ── Baris mode LEMBAR ── */}
                {!isKogolMode && lembarRows.map((row, idx) => (
                  <tr key={row.unitup}
                      className={`border-b border-gray-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                    <td className="border-r border-gray-100 px-3 py-2.5 text-center text-gray-400 tabular-nums">{idx + 1}</td>
                    <td className="border-r border-gray-100 px-4 py-2.5 text-gray-800 font-medium whitespace-nowrap">
                      {row.unitup ? getUlpName(row.unitup) : <span className="text-gray-300 font-normal">—</span>}
                    </td>
                    {showL1 && <>
                      <td className="border-r border-gray-100 px-3 py-2.5 text-right tabular-nums text-gray-700 whitespace-nowrap">{fmtNum(row.l1_plg)}</td>
                      <td className="border-r border-gray-100 px-3 py-2.5 text-right tabular-nums text-gray-700 whitespace-nowrap">{fmtRpptl(row.l1_rpptl)}</td>
                    </>}
                    {showL2 && <>
                      <td className="border-r border-gray-100 px-3 py-2.5 text-right tabular-nums text-gray-700 whitespace-nowrap">{fmtNum(row.l2_plg)}</td>
                      <td className="border-r border-gray-100 px-3 py-2.5 text-right tabular-nums text-gray-700 whitespace-nowrap">{fmtRpptl(row.l2_rpptl)}</td>
                    </>}
                    {showL3 && <>
                      <td className="border-r border-gray-100 px-3 py-2.5 text-right tabular-nums text-gray-700 whitespace-nowrap">{fmtNum(row.l3_plg)}</td>
                      <td className="border-r border-gray-100 px-3 py-2.5 text-right tabular-nums text-gray-700 whitespace-nowrap">{fmtRpptl(row.l3_rpptl)}</td>
                    </>}
                    <td className="border-r border-gray-100 px-3 py-2.5 text-right tabular-nums font-semibold text-gray-800 whitespace-nowrap">{fmtNum(row.total_plg)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-gray-800 whitespace-nowrap">{fmtRpptl(row.total_rpptl)}</td>
                  </tr>
                ))}

                {/* ── Baris mode KOGOL ── */}
                {isKogolMode && kogolRows.map((row, idx) => (
                  <tr key={row.unitup}
                      className={`border-b border-gray-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                    <td className="border-r border-gray-100 px-3 py-2.5 text-center text-gray-400 tabular-nums">{idx + 1}</td>
                    <td className="border-r border-gray-100 px-4 py-2.5 text-gray-800 font-medium whitespace-nowrap">
                      {row.unitup ? getUlpName(row.unitup) : <span className="text-gray-300 font-normal">—</span>}
                    </td>
                    {kogolList.map((kogol) => {
                      const k = row.kogolMap.get(kogol)
                      return (
                        <React.Fragment key={kogol}>
                          <td className="border-r border-gray-100 px-3 py-2.5 text-right tabular-nums text-gray-700 whitespace-nowrap">
                            {k ? fmtNum(k.plg) : '0'}
                          </td>
                          <td className="border-r border-gray-100 px-3 py-2.5 text-right tabular-nums text-gray-700 whitespace-nowrap">
                            {k ? fmtRpptl(k.rpptl) : '0'}
                          </td>
                        </React.Fragment>
                      )
                    })}
                    <td className="border-r border-gray-100 px-3 py-2.5 text-right tabular-nums font-semibold text-gray-800 whitespace-nowrap">{fmtNum(row.total_plg)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-gray-800 whitespace-nowrap">{fmtRpptl(row.total_rpptl)}</td>
                  </tr>
                ))}

                {/* ── Baris Total UP3 ── */}
                <tr style={{ background: '#eef2ff' }} className="border-t-2 border-blue-300 font-semibold">
                  <td className="border-r border-blue-200 px-3 py-3 text-center text-blue-400 text-xs">—</td>
                  <td className="border-r border-blue-200 px-4 py-3 text-blue-800 whitespace-nowrap">Total UP3</td>

                  {/* Total mode LEMBAR */}
                  {!isKogolMode && showL1 && <>
                    <td className="border-r border-blue-200 px-3 py-3 text-right tabular-nums text-blue-700 font-bold">{fmtNum(totL1Plg)}</td>
                    <td className="border-r border-blue-200 px-3 py-3 text-right tabular-nums text-blue-700 font-bold">{fmtRpptl(totL1Rp)}</td>
                  </>}
                  {!isKogolMode && showL2 && <>
                    <td className="border-r border-blue-200 px-3 py-3 text-right tabular-nums text-blue-700 font-bold">{fmtNum(totL2Plg)}</td>
                    <td className="border-r border-blue-200 px-3 py-3 text-right tabular-nums text-blue-700 font-bold">{fmtRpptl(totL2Rp)}</td>
                  </>}
                  {!isKogolMode && showL3 && <>
                    <td className="border-r border-blue-200 px-3 py-3 text-right tabular-nums text-blue-700 font-bold">{fmtNum(totL3Plg)}</td>
                    <td className="border-r border-blue-200 px-3 py-3 text-right tabular-nums text-blue-700 font-bold">{fmtRpptl(totL3Rp)}</td>
                  </>}

                  {/* Total mode KOGOL */}
                  {isKogolMode && kogolList.map((kogol) => {
                    const t = totByKogol.get(kogol)!
                    return (
                      <React.Fragment key={kogol}>
                        <td className="border-r border-blue-200 px-3 py-3 text-right tabular-nums text-blue-700 font-bold">{fmtNum(t.plg)}</td>
                        <td className="border-r border-blue-200 px-3 py-3 text-right tabular-nums text-blue-700 font-bold">{fmtRpptl(t.rpptl)}</td>
                      </React.Fragment>
                    )
                  })}

                  <td className="border-r border-blue-200 px-3 py-3 text-right tabular-nums text-blue-900 font-bold">{fmtNum(totAllPlg)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-blue-900 font-bold">{fmtRpptl(totAllRpptl)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
