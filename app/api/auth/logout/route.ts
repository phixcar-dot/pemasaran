import { clearSessionCookie } from '@/lib/auth'

export async function POST() {
  try {
    await clearSessionCookie()
    return Response.json({ success: true, message: 'Logout berhasil.' })
  } catch (error) {
    console.error('[POST /api/auth/logout]', error)
    return Response.json(
      { success: false, message: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
