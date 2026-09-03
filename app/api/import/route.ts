import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import * as XLSX from 'xlsx'

// Batas ukuran file: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// ─────────────────────────────────────────────────────────────────────────────
// KONFIGURASI HEADER EXCEL
// Kolom wajib yang sudah diketahui dari struktur database
const KNOWN_COLUMNS = ['unitap', 'unitup', 'idpel', 'kogol', 'lembar'] as const

// RPPTL Header Aliases
// Berdasarkan audit file Excel asli (DELITUA, SELATAN, SUNGGAL, MEDAN KOTA, GV, dll):
// → nama kolom RPPTL di Excel adalah persis: "RPPTL" (uppercase)
// → setelah normalisasi lowercase menjadi "rpptl" — match dengan alias pertama
// Alias lain dipertahankan untuk kompatibilitas dengan file dari sumber berbeda.
const RPPTL_HEADER_ALIASES: readonly string[] = [
  'rpptl',
  'rp ptl',
  'rp_ptl',
  'rencana penagihan',
  'rencana penagihan ptl',
  'nominal',
  'tagihan',
  'nilai tagihan',
]
// ─────────────────────────────────────────────────────────────────────────────

// Normalisasi header: trim + lowercase
function normalizeHeader(header: string): string {
  return header.trim().toLowerCase()
}

// Cek apakah header yang dinormalisasi cocok dengan salah satu alias RPPTL
function isRpptlHeader(normalized: string): boolean {
  return RPPTL_HEADER_ALIASES.includes(normalized)
}

// Parse nilai RPPTL dari Excel secara aman
// Berdasarkan audit: nilai RPPTL di file Excel sudah berupa number integer langsung.
// Fungsi ini tetap menangani string format Indonesia untuk backward compatibility.
function parseRpptl(value: unknown): string {
  if (value === null || value === undefined || value === '') return '0'

  // Jika sudah number dari Excel (SheetJS membaca angka langsung)
  if (typeof value === 'number') {
    if (!isFinite(value) || isNaN(value)) return '0'
    return String(Math.round(Math.abs(value)))
  }

  const str = String(value).trim()
  if (str === '' || str === '-' || str.toLowerCase() === 'n/a') return '0'

  // Hapus simbol mata uang dan spasi
  let cleaned = str
    .replace(/^Rp\.?\s*/i, '')
    .replace(/\s/g, '')

  const hasComma = cleaned.includes(',')
  const hasDot   = cleaned.includes('.')

  if (hasComma && hasDot) {
    const lastDot   = cleaned.lastIndexOf('.')
    const lastComma = cleaned.lastIndexOf(',')
    if (lastComma > lastDot) {
      // Format Indonesia: "1.250.000,50"
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      // Format standar: "1,250,000.50"
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (hasComma && !hasDot) {
    const parts = cleaned.split(',')
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = cleaned.replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (hasDot && !hasComma) {
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      cleaned = cleaned.replace(/\./g, '')
    } else if (parts.length === 2 && parts[1].length <= 2) {
      // pertahankan
    } else {
      cleaned = cleaned.replace(/\./g, '')
    }
  }

  cleaned = cleaned.replace(/[^0-9.]/g, '')

  const num = parseFloat(cleaned)
  if (isNaN(num) || !isFinite(num)) return '0'
  return String(Math.round(Math.abs(num)))
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipe untuk hasil parsing satu sheet
interface SheetParseResult {
  sheetName:  string
  rows:       RawRecord[]
  rpptlFound: boolean
  rpptlKey:   string | null
  headers:    string[]
}

// Record mentah dari satu baris Excel, siap dimasukkan ke database
interface RawRecord {
  unitap: string
  unitup: string
  idpel:  string
  kogol:  string
  lembar: number
  rpptl:  string
}

// Parse satu sheet Excel menjadi array RawRecord
// Mengembalikan null jika sheet tidak memiliki header yang dikenali
// CATATAN: Setiap sheet Excel tunggakan memiliki satu baris grand total di akhir
// (UNITAP/UNITUP/IDPEL kosong, hanya RPPTL terisi). Baris ini harus dibuang.
function parseSheet(
  sheet: XLSX.WorkSheet,
  sheetName: string
): SheetParseResult | null {
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  if (rawRows.length === 0) return null

  const firstRowKeys = Object.keys(rawRows[0])
  const detectedHeaders = firstRowKeys.map(normalizeHeader)

  // Cek minimal ada satu kolom wajib
  const hasAnyKnown = KNOWN_COLUMNS.some((col) => detectedHeaders.includes(col))
  if (!hasAnyKnown) return null

  // Bangun headerMap
  const headerMap: Record<string, string> = {}
  let rpptlKey: string | null = null

  for (const key of firstRowKeys) {
    const normalized = normalizeHeader(key)
    if ((KNOWN_COLUMNS as readonly string[]).includes(normalized)) {
      headerMap[normalized] = key
    }
    if (rpptlKey === null && isRpptlHeader(normalized)) {
      rpptlKey = key
    }
  }

  const rpptlFound = rpptlKey !== null

  const rows: RawRecord[] = rawRows
    .map((row) => {
      const getStr = (col: string): string => {
        const key = headerMap[col]
        if (!key) return ''
        const val = row[key]
        return val !== null && val !== undefined ? String(val).trim() : ''
      }

      const rpptlRaw = rpptlFound && rpptlKey ? row[rpptlKey] : 0

      return {
        unitap: getStr('unitap'),
        unitup: getStr('unitup'),
        idpel:  getStr('idpel'),
        kogol:  getStr('kogol'),
        lembar: (() => {
          const raw = getStr('lembar')
          const num = parseInt(raw, 10)
          return isNaN(num) ? 0 : num
        })(),
        rpptl: parseRpptl(rpptlRaw),
      }
    })
    // Filter baris tidak valid:
    // - IDPEL kosong → baris grand total / baris kosong / header tambahan
    // - UNITAP kosong → baris total yang tidak memiliki entitas pelanggan
    // - LEMBAR bukan 1, 2, atau 3 → bukan data tunggakan yang valid
    .filter((r) =>
      r.idpel !== '' &&
      r.unitap !== '' &&
      r.lembar >= 1 &&
      r.lembar <= 3
    )

  return {
    sheetName,
    rows,
    rpptlFound,
    rpptlKey,
    headers: detectedHeaders,
  }
}

// GET /api/import?fileName=xxx — cek apakah nama file sudah pernah diimport
export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
  }

  const url      = new URL(request.url)
  const fileName = url.searchParams.get('fileName')?.trim() ?? ''

  if (!fileName) {
    return Response.json({ exists: false })
  }

  const existing = await prisma.import.findFirst({
    where:  { fileName, status: 'completed' },
    select: { id: true, createdAt: true, totalRows: true },
  })

  return Response.json({
    exists:    !!existing,
    importId:  existing?.id        ?? null,
    createdAt: existing?.createdAt ?? null,
    totalRows: existing?.totalRows ?? null,
  })
}

// DELETE /api/import — hapus semua data import beserta customer_tunggakans (cascade)
export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json(
      { success: false, message: 'Tidak terautentikasi.' },
      { status: 401 }
    )
  }

  try {
    const deleted = await prisma.import.deleteMany({})
    return Response.json({
      success: true,
      message: `Semua data berhasil dihapus. (${deleted.count} file import dihapus)`,
      count: deleted.count,
    })
  } catch (error) {
    console.error('[DELETE /api/import]', error)
    return Response.json(
      { success: false, message: 'Gagal menghapus data.' },
      { status: 500 }
    )
  }
}

// POST /api/import
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json(
      { success: false, message: 'Tidak terautentikasi.' },
      { status: 401 }
    )
  }
  let importId: number | null = null

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return Response.json(
        { success: false, message: 'File wajib dipilih.' },
        { status: 400 }
      )
    }

    const fileName = file.name
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext !== 'xls' && ext !== 'xlsx') {
      return Response.json(
        { success: false, message: 'Format file harus .xls atau .xlsx.' },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return Response.json(
        { success: false, message: 'File tidak boleh kosong.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          success: false,
          message: `Ukuran file melebihi batas maksimum (${MAX_FILE_SIZE / 1024 / 1024} MB).`,
        },
        { status: 400 }
      )
    }

    // Buat record import
    const importRecord = await prisma.import.create({
      data: { fileName, totalRows: 0, status: 'pending', uploadedBy: session.name },
    })
    importId = importRecord.id

    await prisma.import.update({
      where: { id: importId },
      data: { status: 'processing' },
    })

    // Parse workbook
    const buffer = await file.arrayBuffer()
    const uint8  = new Uint8Array(buffer)

    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(uint8, { type: 'array' })
    } catch {
      await prisma.import.update({ where: { id: importId }, data: { status: 'failed' } })
      return Response.json(
        { success: false, message: 'File Excel tidak dapat diproses.' },
        { status: 422 }
      )
    }

    const sheetNames = workbook.SheetNames
    if (sheetNames.length === 0) {
      await prisma.import.update({ where: { id: importId }, data: { status: 'failed' } })
      return Response.json(
        { success: false, message: 'Workbook tidak memiliki sheet.' },
        { status: 422 }
      )
    }

    // ── Baca SEMUA sheet dan gabungkan baris ─────────────────────────────────
    // File Excel tunggakan memiliki beberapa sheet (LBR 1, LBR 2, LBR 3 dst.)
    // Setiap sheet berisi data untuk lembar yang berbeda.
    const allRecords: RawRecord[] = []
    const parsedSheets: SheetParseResult[] = []
    let anyRpptlFound = false
    let rpptlHeaderUsed: string | null = null
    const allDetectedHeaders: string[] = []

    for (const sname of sheetNames) {
      const sheet  = workbook.Sheets[sname]
      const result = parseSheet(sheet, sname)
      if (!result) continue  // skip sheet kosong / tidak dikenali

      parsedSheets.push(result)
      allRecords.push(...result.rows)

      if (!anyRpptlFound && result.rpptlFound) {
        anyRpptlFound  = true
        rpptlHeaderUsed = result.rpptlKey
      }
      // Kumpulkan semua header yang ditemukan (untuk laporan)
      for (const h of result.headers) {
        if (!allDetectedHeaders.includes(h)) allDetectedHeaders.push(h)
      }
    }

    // Jika tidak ada sheet yang dikenali
    if (parsedSheets.length === 0) {
      await prisma.import.update({ where: { id: importId }, data: { status: 'failed' } })
      return Response.json(
        {
          success: false,
          message: 'Tidak ada sheet yang memiliki header yang dikenali. Kolom yang dibutuhkan: unitap, unitup, idpel, kogol, lembar.',
          sheetNames,
          detectedHeaders: allDetectedHeaders,
        },
        { status: 422 }
      )
    }

    if (allRecords.length === 0) {
      await prisma.import.update({ where: { id: importId }, data: { status: 'failed' } })
      return Response.json(
        { success: false, message: 'File Excel tidak memiliki data.' },
        { status: 422 }
      )
    }

    const totalRows = allRecords.length

    // ── Simpan ke database dalam satu transaction ────────────────────────────
    await prisma.$transaction(async (tx) => {
      const records = allRecords.map((r) => ({
        importId: importId!,
        unitap:   r.unitap,
        unitup:   r.unitup,
        idpel:    r.idpel,
        kogol:    r.kogol,
        lembar:   r.lembar,
        rpptl:    r.rpptl,
      }))

      await tx.customerTunggakan.createMany({ data: records })

      await tx.import.update({
        where: { id: importId! },
        data: { totalRows, status: 'completed' },
      })
    })

    const finalImport = await prisma.import.findUnique({ where: { id: importId } })

    return Response.json({
      success: true,
      message: 'Import berhasil.',
      import: {
        id:        finalImport!.id,
        fileName:  finalImport!.fileName,
        totalRows: finalImport!.totalRows,
        status:    finalImport!.status,
        createdAt: finalImport!.createdAt,
      },
      sheetNames,
      sheetsProcessed: parsedSheets.map((s) => ({
        name:      s.sheetName,
        rows:      s.rows.length,
        rpptlFound: s.rpptlFound,
        rpptlKey:  s.rpptlKey,
      })),
      detectedHeaders: allDetectedHeaders,
      rpptl: {
        found:  anyRpptlFound,
        header: rpptlHeaderUsed,
        note:   anyRpptlFound
          ? `Kolom RPPTL ditemukan dengan header: "${rpptlHeaderUsed}"`
          : 'Kolom RPPTL tidak ditemukan di file Excel. Data RPPTL diisi 0.',
      },
    })
  } catch (error) {
    console.error('[POST /api/import]', error)

    if (importId) {
      try {
        await prisma.import.update({
          where: { id: importId },
          data: { status: 'failed' },
        })
      } catch { /* abaikan */ }
    }

    return Response.json(
      { success: false, message: 'Data gagal disimpan ke database.' },
      { status: 500 }
    )
  }
}
