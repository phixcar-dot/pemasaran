import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/prisma/generated/client'
import XLSXStyle from 'xlsx-js-style'

// ── Tipe sel xlsx-js-style ────────────────────────────────────
type CellStyle = {
  font?:      { bold?: boolean; color?: { rgb: string }; sz?: number; name?: string }
  fill?:      { fgColor: { rgb: string } }
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean }
  border?:    {
    top?:    { style: string; color: { rgb: string } }
    bottom?: { style: string; color: { rgb: string } }
    left?:   { style: string; color: { rgb: string } }
    right?:  { style: string; color: { rgb: string } }
  }
  numFmt?: string
}

type StyledCell = { v: string | number; t: string; f?: string; s?: CellStyle; z?: string }

// ── Warna tema (sesuai web) ───────────────────────────────────
const BLUE_H1    = '1D4ED8'   // bg header baris 1  (blue-700)
const BLUE_H2    = '2563EB'   // bg header baris 2  (blue-600)
const BLUE_TOT   = 'EFF6FF'   // bg baris Total UP3 (blue-50)
const WHITE      = 'FFFFFF'
const GRAY_TEXT  = '374151'   // gray-700
const BLUE_DARK  = '1E3A8A'   // blue-900 untuk total
const BLUE_MED   = '1E40AF'   // blue-800

// Warna border
const BORDER_H   = '93C5FD'   // blue-300
const BORDER_TOT = 'BFDBFE'   // blue-200
const BORDER_DATA= 'E5E7EB'   // gray-200

const FONT_NAME  = 'Calibri'

function allBorder(color: string, style = 'thin') {
  const side = { style, color: { rgb: color } }
  return { top: side, bottom: side, left: side, right: side }
}

// Buat sel header baris 1 (background biru gelap)
function hdr1Cell(v: string): StyledCell {
  return {
    v, t: 's',
    s: {
      font:      { bold: true, color: { rgb: WHITE }, sz: 11, name: FONT_NAME },
      fill:      { fgColor: { rgb: BLUE_H1 } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border:    allBorder(BORDER_H),
    },
  }
}

// Buat sel header baris 2 (background biru sedang)
function hdr2Cell(v: string, align: 'center' | 'right' = 'center'): StyledCell {
  return {
    v, t: 's',
    s: {
      font:      { bold: true, color: { rgb: WHITE }, sz: 10, name: FONT_NAME },
      fill:      { fgColor: { rgb: BLUE_H2 } },
      alignment: { horizontal: align, vertical: 'center' },
      border:    allBorder(BORDER_H),
    },
  }
}

// Buat sel data biasa
function dataCell(
  v: string | number,
  t: 's' | 'n',
  align: 'left' | 'center' | 'right' = 'left',
  bold = false,
  textColor = GRAY_TEXT,
): StyledCell {
  return {
    v, t,
    s: {
      font:      { bold, color: { rgb: textColor }, sz: 10, name: FONT_NAME },
      alignment: { horizontal: align, vertical: 'center' },
      border:    allBorder(BORDER_DATA),
      ...(t === 'n' ? { numFmt: '#,##0' } : {}),
    },
  }
}

// Buat sel formula (Total UP3)
function totCell(
  formula: string,
  align: 'left' | 'center' | 'right' = 'right',
  bold = true,
  textColor = BLUE_DARK,
): StyledCell {
  return {
    v: 0, t: 'n', f: formula,
    s: {
      font:      { bold, color: { rgb: textColor }, sz: 10, name: FONT_NAME },
      fill:      { fgColor: { rgb: BLUE_TOT } },
      alignment: { horizontal: align, vertical: 'center' },
      border:    allBorder(BORDER_TOT, 'medium'),
      numFmt:    '#,##0',
    },
  }
}

function totLabelCell(v: string): StyledCell {
  return {
    v, t: 's',
    s: {
      font:      { bold: true, color: { rgb: BLUE_MED }, sz: 10, name: FONT_NAME },
      fill:      { fgColor: { rgb: BLUE_TOT } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border:    allBorder(BORDER_TOT, 'medium'),
    },
  }
}

// Sel kosong dengan background Total (untuk kolom NO di baris total)
function totEmptyCell(): StyledCell {
  return {
    v: '', t: 's',
    s: {
      fill:   { fgColor: { rgb: BLUE_TOT } },
      border: allBorder(BORDER_TOT, 'medium'),
    },
  }
}

// Sel formula untuk kolom TOTAL (rumus penjumlahan kolom PLG/RPPTL yang tampil)
// misal: =C5+E5+G5 untuk PLG Total dari 3 lembar
function sumRowCell(formula: string): StyledCell {
  return {
    v: 0, t: 'n', f: formula,
    s: {
      font:      { bold: true, color: { rgb: BLUE_MED }, sz: 10, name: FONT_NAME },
      alignment: { horizontal: 'right', vertical: 'center' },
      border:    allBorder(BORDER_DATA),
      numFmt:    '#,##0',
    },
  }
}

// GET /api/export/rekap?kogol=...&importId=...
export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
  }

  const url            = new URL(request.url)
  const filterKogol    = url.searchParams.get('kogol')?.trim()    ?? ''
  const filterLembar   = url.searchParams.get('lembar')?.trim()   ?? ''
  const filterImportId = url.searchParams.get('importId')?.trim() ?? ''

  let lembarNum:    number | null = null
  let importIdNum:  number | null = null

  if (filterLembar !== '') {
    lembarNum = parseInt(filterLembar, 10)
    if (isNaN(lembarNum)) {
      return Response.json({ success: false, message: 'Nilai LEMBAR tidak valid.' }, { status: 400 })
    }
  }

  if (filterImportId !== '') {
    importIdNum = parseInt(filterImportId, 10)
    if (isNaN(importIdNum)) {
      return Response.json({ success: false, message: 'Nilai importId tidak valid.' }, { status: 400 })
    }
  }

  const isKogolMode = filterKogol !== ''
  const ZERO        = new Prisma.Decimal(0)
  const baseWhere: Record<string, unknown> = {
    ...(lembarNum  !== null ? { lembar:   lembarNum  } : {}),
    ...(importIdNum !== null ? { importId: importIdNum } : {}),
  }

  // ── Helper: nomor kolom → huruf Excel ────────────────────────
  function colLetter(c: number): string {
    let s = '', n = c + 1
    while (n > 0) {
      s = String.fromCharCode(65 + ((n - 1) % 26)) + s
      n = Math.floor((n - 1) / 26)
    }
    return s
  }
  const CL = colLetter
  const ws: Record<string, StyledCell | object> = {}
  const EC = (r: number, c: number) => XLSXStyle.utils.encode_cell({ r, c })

  let totalCols = 0

  if (!isKogolMode) {
    // ════════════════════════════════════════════════════════
    // MODE LEMBAR
    // ════════════════════════════════════════════════════════
    const whereL = {
      ...baseWhere,
      ...(lembarNum !== null ? {} : { lembar: { in: [1, 2, 3] } }),
    }
    const grouped = await prisma.customerTunggakan.groupBy({
      by: ['unitup', 'lembar'], where: whereL,
      _count: { _all: true }, _sum: { rpptl: true },
      orderBy: [{ unitup: 'asc' }, { lembar: 'asc' }],
    })
    if (grouped.length === 0) {
      return Response.json({ success: false, message: 'Tidak ada data untuk diekspor.' }, { status: 404 })
    }

    const rekapMap = new Map<string, { l1_plg: number; l1_rp: Prisma.Decimal; l2_plg: number; l2_rp: Prisma.Decimal; l3_plg: number; l3_rp: Prisma.Decimal }>()
    for (const row of grouped) {
      if (!rekapMap.has(row.unitup)) rekapMap.set(row.unitup, { l1_plg: 0, l1_rp: ZERO, l2_plg: 0, l2_rp: ZERO, l3_plg: 0, l3_rp: ZERO })
      const e = rekapMap.get(row.unitup)!, rp = row._sum.rpptl ?? ZERO
      if (row.lembar === 1) { e.l1_plg = row._count._all; e.l1_rp = rp }
      if (row.lembar === 2) { e.l2_plg = row._count._all; e.l2_rp = rp }
      if (row.lembar === 3) { e.l3_plg = row._count._all; e.l3_rp = rp }
    }
    const rekapRows = Array.from(rekapMap.entries())
      .map(([unitup, v]) => ({ unitup, ...v }))
      .sort((a, b) => a.unitup.localeCompare(b.unitup))

    const showL1 = lembarNum === null || lembarNum === 1
    const showL2 = lembarNum === null || lembarNum === 2
    const showL3 = lembarNum === null || lembarNum === 3

    let colIdx = 2
    const colL1Plg  = showL1 ? colIdx++ : -1; const colL1Rp  = showL1 ? colIdx++ : -1
    const colL2Plg  = showL2 ? colIdx++ : -1; const colL2Rp  = showL2 ? colIdx++ : -1
    const colL3Plg  = showL3 ? colIdx++ : -1; const colL3Rp  = showL3 ? colIdx++ : -1
    const colTotPlg = colIdx++; const colTotRp = colIdx++
    totalCols = colIdx

    // Header baris 0
    ws[EC(0,0)] = hdr1Cell('NO'); ws[EC(0,1)] = hdr1Cell('UNIT LAYANAN')
    const startCols: number[] = []
    if (showL1) { ws[EC(0, colL1Plg)] = hdr1Cell('1 LEMBAR'); startCols.push(colL1Plg) }
    if (showL2) { ws[EC(0, colL2Plg)] = hdr1Cell('2 LEMBAR'); startCols.push(colL2Plg) }
    if (showL3) { ws[EC(0, colL3Plg)] = hdr1Cell('3 LEMBAR'); startCols.push(colL3Plg) }
    ws[EC(0, colTotPlg)] = hdr1Cell('TOTAL')
    // Header baris 1
    ws[EC(1,0)] = hdr1Cell('NO'); ws[EC(1,1)] = hdr1Cell('UNIT LAYANAN')
    if (showL1) { ws[EC(1, colL1Plg)] = hdr2Cell('PLG','right'); ws[EC(1, colL1Rp)] = hdr2Cell('RPPTL','right') }
    if (showL2) { ws[EC(1, colL2Plg)] = hdr2Cell('PLG','right'); ws[EC(1, colL2Rp)] = hdr2Cell('RPPTL','right') }
    if (showL3) { ws[EC(1, colL3Plg)] = hdr2Cell('PLG','right'); ws[EC(1, colL3Rp)] = hdr2Cell('RPPTL','right') }
    ws[EC(1, colTotPlg)] = hdr2Cell('PLG','right'); ws[EC(1, colTotRp)] = hdr2Cell('RPPTL','right')

    const dataRowStart = 3, dataRowEnd = dataRowStart + rekapRows.length - 1
    rekapRows.forEach((row, idx) => {
      const r = idx + 2, exR = r + 1
      const plgParts: string[] = [], rpParts: string[] = []
      if (showL1) { plgParts.push(`${CL(colL1Plg)}${exR}`); rpParts.push(`${CL(colL1Rp)}${exR}`) }
      if (showL2) { plgParts.push(`${CL(colL2Plg)}${exR}`); rpParts.push(`${CL(colL2Rp)}${exR}`) }
      if (showL3) { plgParts.push(`${CL(colL3Plg)}${exR}`); rpParts.push(`${CL(colL3Rp)}${exR}`) }
      ws[EC(r,0)] = dataCell(idx+1,'n','center'); ws[EC(r,1)] = dataCell(row.unitup,'s','left')
      if (showL1) { ws[EC(r,colL1Plg)] = dataCell(row.l1_plg,'n','right'); ws[EC(r,colL1Rp)] = dataCell(Number(row.l1_rp),'n','right') }
      if (showL2) { ws[EC(r,colL2Plg)] = dataCell(row.l2_plg,'n','right'); ws[EC(r,colL2Rp)] = dataCell(Number(row.l2_rp),'n','right') }
      if (showL3) { ws[EC(r,colL3Plg)] = dataCell(row.l3_plg,'n','right'); ws[EC(r,colL3Rp)] = dataCell(Number(row.l3_rp),'n','right') }
      ws[EC(r,colTotPlg)] = sumRowCell(plgParts.join('+')); ws[EC(r,colTotRp)] = sumRowCell(rpParts.join('+'))
    })

    const totalRowIdx = dataRowEnd
    ws[EC(totalRowIdx,0)] = totEmptyCell(); ws[EC(totalRowIdx,1)] = totLabelCell('Total UP3')
    if (showL1) { ws[EC(totalRowIdx,colL1Plg)] = totCell(`SUM(${CL(colL1Plg)}${dataRowStart}:${CL(colL1Plg)}${dataRowEnd})`); ws[EC(totalRowIdx,colL1Rp)] = totCell(`SUM(${CL(colL1Rp)}${dataRowStart}:${CL(colL1Rp)}${dataRowEnd})`) }
    if (showL2) { ws[EC(totalRowIdx,colL2Plg)] = totCell(`SUM(${CL(colL2Plg)}${dataRowStart}:${CL(colL2Plg)}${dataRowEnd})`); ws[EC(totalRowIdx,colL2Rp)] = totCell(`SUM(${CL(colL2Rp)}${dataRowStart}:${CL(colL2Rp)}${dataRowEnd})`) }
    if (showL3) { ws[EC(totalRowIdx,colL3Plg)] = totCell(`SUM(${CL(colL3Plg)}${dataRowStart}:${CL(colL3Plg)}${dataRowEnd})`); ws[EC(totalRowIdx,colL3Rp)] = totCell(`SUM(${CL(colL3Rp)}${dataRowStart}:${CL(colL3Rp)}${dataRowEnd})`) }
    ws[EC(totalRowIdx,colTotPlg)] = totCell(`SUM(${CL(colTotPlg)}${dataRowStart}:${CL(colTotPlg)}${dataRowEnd})`)
    ws[EC(totalRowIdx,colTotRp)]  = totCell(`SUM(${CL(colTotRp)}${dataRowStart}:${CL(colTotRp)}${dataRowEnd})`)

    ws['!ref'] = XLSXStyle.utils.encode_range({ r:0,c:0 }, { r:totalRowIdx, c:totalCols-1 })
    const merges: XLSXStyle.Range[] = [
      { s:{r:0,c:0}, e:{r:1,c:0} }, { s:{r:0,c:1}, e:{r:1,c:1} },
    ]
    startCols.forEach((sc) => merges.push({ s:{r:0,c:sc}, e:{r:0,c:sc+1} }))
    merges.push({ s:{r:0,c:colTotPlg}, e:{r:0,c:colTotRp} })
    ws['!merges'] = merges

    const rows: XLSXStyle.RowInfo[] = []
    rows[0] = { hpt:22 }; rows[1] = { hpt:18 }
    for (let i=2; i<=totalRowIdx; i++) rows[i] = { hpt:17 }
    rows[totalRowIdx] = { hpt:20 }
    ws['!rows'] = rows

    const colWidths: XLSXStyle.ColInfo[] = [{ wch:5 }, { wch:26 }]
    if (showL1) colWidths.push({ wch:10 }, { wch:18 })
    if (showL2) colWidths.push({ wch:10 }, { wch:18 })
    if (showL3) colWidths.push({ wch:10 }, { wch:18 })
    colWidths.push({ wch:10 }, { wch:18 })
    ws['!cols'] = colWidths

  } else {
    // ════════════════════════════════════════════════════════
    // MODE KOGOL
    // ════════════════════════════════════════════════════════
    const allKogolRaw = await prisma.customerTunggakan.findMany({
      distinct: ['kogol'], select: { kogol:true }, orderBy: { kogol:'asc' },
      where: importIdNum !== null ? { importId: importIdNum } : {},
    })
    const kogolList = allKogolRaw.map((r) => r.kogol).filter(Boolean)

    const grouped = await prisma.customerTunggakan.groupBy({
      by: ['unitup','kogol'],
      where: baseWhere,
      _count: { _all:true }, _sum: { rpptl:true },
      orderBy: [{ unitup:'asc' }, { kogol:'asc' }],
    })
    if (grouped.length === 0) {
      return Response.json({ success:false, message:'Tidak ada data untuk diekspor.' }, { status:404 })
    }

    const rekapMap = new Map<string, Map<string, { plg:number; rp:Prisma.Decimal }>>()
    for (const row of grouped) {
      if (!rekapMap.has(row.unitup)) rekapMap.set(row.unitup, new Map())
      rekapMap.get(row.unitup)!.set(row.kogol, { plg:row._count._all, rp:row._sum.rpptl??ZERO })
    }
    const rekapRows = Array.from(rekapMap.entries())
      .map(([unitup, kogolMap]) => {
        let tot_plg=0, tot_rp=ZERO
        for (const {plg,rp} of kogolMap.values()) { tot_plg+=plg; tot_rp=tot_rp.add(rp) }
        return { unitup, kogolMap, tot_plg, tot_rp }
      })
      .sort((a,b) => a.unitup.localeCompare(b.unitup))

    let colIdx = 2
    const kogolColStart: Record<string,{plg:number;rp:number}> = {}
    for (const kogol of kogolList) kogolColStart[kogol] = { plg:colIdx++, rp:colIdx++ }
    const colTotPlg = colIdx++, colTotRp = colIdx++
    totalCols = colIdx

    ws[EC(0,0)] = hdr1Cell('NO'); ws[EC(0,1)] = hdr1Cell('UNIT LAYANAN')
    ws[EC(1,0)] = hdr1Cell('NO'); ws[EC(1,1)] = hdr1Cell('UNIT LAYANAN')
    const startCols: number[] = []
    for (const kogol of kogolList) {
      const sc = kogolColStart[kogol].plg
      ws[EC(0,sc)] = hdr1Cell(`KOGOL ${kogol}`); startCols.push(sc)
      ws[EC(1,sc)]              = hdr2Cell('PLG','right')
      ws[EC(1,kogolColStart[kogol].rp)] = hdr2Cell('RPPTL','right')
    }
    ws[EC(0,colTotPlg)] = hdr1Cell('TOTAL')
    ws[EC(1,colTotPlg)] = hdr2Cell('PLG','right'); ws[EC(1,colTotRp)] = hdr2Cell('RPPTL','right')

    const dataRowStart = 3, dataRowEnd = dataRowStart + rekapRows.length - 1
    rekapRows.forEach((row, idx) => {
      const r=idx+2, exR=r+1
      const plgParts: string[]=[], rpParts: string[]=[]
      for (const kogol of kogolList) {
        plgParts.push(`${CL(kogolColStart[kogol].plg)}${exR}`)
        rpParts.push(`${CL(kogolColStart[kogol].rp)}${exR}`)
      }
      ws[EC(r,0)] = dataCell(idx+1,'n','center'); ws[EC(r,1)] = dataCell(row.unitup,'s','left')
      for (const kogol of kogolList) {
        const k = row.kogolMap.get(kogol)
        ws[EC(r,kogolColStart[kogol].plg)] = dataCell(k?k.plg:0,'n','right')
        ws[EC(r,kogolColStart[kogol].rp)]  = dataCell(k?Number(k.rp):0,'n','right')
      }
      ws[EC(r,colTotPlg)] = sumRowCell(plgParts.join('+'))
      ws[EC(r,colTotRp)]  = sumRowCell(rpParts.join('+'))
    })

    const totalRowIdx = dataRowEnd
    ws[EC(totalRowIdx,0)] = totEmptyCell(); ws[EC(totalRowIdx,1)] = totLabelCell('Total UP3')
    for (const kogol of kogolList) {
      const {plg,rp} = kogolColStart[kogol]
      ws[EC(totalRowIdx,plg)] = totCell(`SUM(${CL(plg)}${dataRowStart}:${CL(plg)}${dataRowEnd})`)
      ws[EC(totalRowIdx,rp)]  = totCell(`SUM(${CL(rp)}${dataRowStart}:${CL(rp)}${dataRowEnd})`)
    }
    ws[EC(totalRowIdx,colTotPlg)] = totCell(`SUM(${CL(colTotPlg)}${dataRowStart}:${CL(colTotPlg)}${dataRowEnd})`)
    ws[EC(totalRowIdx,colTotRp)]  = totCell(`SUM(${CL(colTotRp)}${dataRowStart}:${CL(colTotRp)}${dataRowEnd})`)

    ws['!ref'] = XLSXStyle.utils.encode_range({ r:0,c:0 }, { r:totalRowIdx, c:totalCols-1 })
    const merges: XLSXStyle.Range[] = [
      { s:{r:0,c:0}, e:{r:1,c:0} }, { s:{r:0,c:1}, e:{r:1,c:1} },
    ]
    startCols.forEach((sc) => merges.push({ s:{r:0,c:sc}, e:{r:0,c:sc+1} }))
    merges.push({ s:{r:0,c:colTotPlg}, e:{r:0,c:colTotRp} })
    ws['!merges'] = merges

    const rows: XLSXStyle.RowInfo[] = []
    rows[0] = { hpt:22 }; rows[1] = { hpt:18 }
    for (let i=2; i<=totalRowIdx; i++) rows[i] = { hpt:17 }
    rows[totalRowIdx] = { hpt:20 }
    ws['!rows'] = rows

    const colWidths: XLSXStyle.ColInfo[] = [{ wch:5 }, { wch:26 }]
    for (let i=0; i<kogolList.length; i++) colWidths.push({ wch:10 }, { wch:18 })
    colWidths.push({ wch:10 }, { wch:18 })
    ws['!cols'] = colWidths
  }

  ws['!freeze'] = { xSplit:2, ySplit:2, topLeftCell:`${colLetter(2)}3` }

  const wb = XLSXStyle.utils.book_new()
  XLSXStyle.utils.book_append_sheet(wb, ws as XLSXStyle.WorkSheet, 'Rekap Tunggakan')
  const buf = XLSXStyle.write(wb, { type:'buffer', bookType:'xlsx' })

  const parts = ['rekap-tunggakan']
  if (filterKogol)    parts.push(`kogol-${filterKogol}`)
  if (filterLembar)   parts.push(`lembar-${filterLembar}`)
  if (filterImportId) parts.push(`import-${filterImportId}`)

  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${parts.join('-')}.xlsx"`,
      'Cache-Control':       'no-store',
    },
  })

  function colLetter(c: number): string {
    let s='', n=c+1
    while (n>0) { s=String.fromCharCode(65+((n-1)%26))+s; n=Math.floor((n-1)/26) }
    return s
  }
}
