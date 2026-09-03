import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateCsrf } from '@/lib/csrf'

interface RouteContext {
  params: Promise<{ id: string }>
}

// DELETE /api/imports/[id]
export async function DELETE(request: Request, context: RouteContext) {
  const session = await getSession()
  if (!session) {
    return Response.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
  }

  if (!await validateCsrf(request)) {
    return Response.json({ success: false, message: 'Request tidak valid.' }, { status: 403 })
  }

  // 2. Validasi ID
  const { id: idStr } = await context.params
  const id = parseInt(idStr, 10)
  if (isNaN(id) || id <= 0) {
    return Response.json(
      { success: false, message: 'ID import tidak valid.' },
      { status: 400 }
    )
  }

  try {
    // 3. Cek apakah import ada
    const importRecord = await prisma.import.findUnique({ where: { id } })
    if (!importRecord) {
      return Response.json(
        { success: false, message: 'Import tidak ditemukan.' },
        { status: 404 }
      )
    }

    // 4. Hapus secara atomik: customer_tunggakans (berdasarkan importId) lalu import
    // Meskipun onDelete: Cascade sudah ada di schema, kita lakukan eksplisit
    // di dalam transaction agar prosesnya transparan dan aman.
    const [deletedRows] = await prisma.$transaction([
      prisma.customerTunggakan.deleteMany({ where: { importId: id } }),
      prisma.import.delete({ where: { id } }),
    ])

    return Response.json({
      success: true,
      message: `Import "${importRecord.fileName}" berhasil dihapus beserta ${deletedRows.count} data tunggakan.`,
      deletedRows: deletedRows.count,
    })
  } catch (error) {
    console.error(`[DELETE /api/imports/${id}]`, error)
    return Response.json(
      { success: false, message: 'Gagal menghapus import.' },
      { status: 500 }
    )
  }
}
