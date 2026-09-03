import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

// GET /api/export/data?unitap=...&kogol=...&lembar=...
// Mengekspor data customer_tunggakans sesuai filter aktif ke file .xlsx
export async function GET(request: Request) {
  // ── Cek autentikasi ──────────────────────────────────────────
  const session = await getSession()
  if (!session) {
    return Response.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
  }

  // ── Baca query parameter ──────────────────────────────────────
  const url            = new URL(request.url)
  const filterKogol    = url.searchParams.get('kogol')?.trim()    ?? ''
  const filterLembar   = url.searchParams.get('lembar')?.trim()   ?? ''
  const filterImportId = url.searchParams.get('importId')?.trim() ?? ''

  // ── Validasi nilai lembar jika diisi ─────────────────────────
  let lembarNum: number | undefined
  if (filterLembar !== '') {
    lembarNum = parseInt(filterLembar, 10)
    if (isNaN(lembarNum)) {
      return Response.json({ success: false, message: 'Nilai LEMBAR tidak valid.' }, { status: 400 })
    }
  }

  // ── Validasi importId jika diisi ─────────────────────────────
  let importIdNum: number | undefined
  if (filterImportId !== '') {
    importIdNum = parseInt(filterImportId, 10)
    if (isNaN(importIdNum) || importIdNum <= 0) {
      return Response.json({ success: false, message: 'Import ID tidak valid.' }, { status: 400 })
    }
  }

  // ── Bangun Prisma where clause ────────────────────────────────
  const where = {
    ...(filterKogol             ? { kogol:    filterKogol  }  : {}),
    ...(lembarNum !== undefined  ? { lembar:   lembarNum   }  : {}),
    ...(importIdNum !== undefined ? { importId: importIdNum } : {}),
  }

  // ── Ambil data dari database ──────────────────────────────────
  const rows = await prisma.customerTunggakan.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      import: { select: { fileName: true, createdAt: true } },
    },
  })

  // ── Jika tidak ada data ───────────────────────────────────────
  if (rows.length === 0) {
    return Response.json(
      { success: false, message: 'Tidak ada data untuk diekspor.' },
      { status: 404 }
    )
  }

  // ── Bangun data sheet ─────────────────────────────────────────
  const sheetData = rows.map((row, idx) => ({
    NO:             idx + 1,
    UNITAP:         row.unitap,
    UNITUP:         row.unitup,
    IDPEL:          row.idpel,
    KOGOL:          row.kogol,
    LEMBAR:         row.lembar,
    RPPTL:          Number(row.rpptl),
    'SUMBER FILE':  row.import.fileName,
    'WAKTU IMPORT': row.import.createdAt.toLocaleString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
  }))

  // ── Generate workbook ─────────────────────────────────────────
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(sheetData)

  // Lebar kolom otomatis berdasarkan konten
  ws['!cols'] = [
    { wch: 6  },  // NO
    { wch: 20 },  // UNITAP
    { wch: 20 },  // UNITUP
    { wch: 18 },  // IDPEL
    { wch: 10 },  // KOGOL
    { wch: 8  },  // LEMBAR
    { wch: 18 },  // RPPTL
    { wch: 30 },  // SUMBER FILE
    { wch: 25 },  // WAKTU IMPORT
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Data Tunggakan')

  // ── Tulis ke buffer ───────────────────────────────────────────
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  // ── Bangun nama file berdasarkan filter ───────────────────────
  const parts = ['data-tunggakan']
  if (filterKogol)  parts.push(`kogol-${filterKogol}`)
  if (filterLembar) parts.push(`lembar-${filterLembar}`)
  const fileName = `${parts.join('-')}.xlsx`

  // ── Return file sebagai download ──────────────────────────────
  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  })
}
