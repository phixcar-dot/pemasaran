import { prisma } from '../../../lib/prisma'

// GET /api/health
// Test koneksi Next.js → Prisma → MySQL
export async function GET() {
  try {
    // Jalankan query sederhana untuk memverifikasi koneksi database
    await prisma.$queryRaw`SELECT 1`

    return Response.json({
      success: true,
      database: 'connected',
    })
  } catch {
    return Response.json(
      {
        success: false,
        database: 'disconnected',
      },
      { status: 503 }
    )
  }
}
