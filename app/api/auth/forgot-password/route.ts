import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/mailer'
import { randomBytes } from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body as { email: string }

    if (!email) {
      return Response.json(
        { success: false, message: 'Email wajib diisi.' },
        { status: 400 }
      )
    }

    // Selalu kembalikan pesan sukses agar tidak bocorkan info email terdaftar
    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      // Hapus token lama yang belum dipakai untuk user ini
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, used: false },
      })

      // Buat token reset baru — berlaku 1 jam
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      })

      const appUrl   = process.env.APP_URL ?? 'http://localhost:3000'
      const resetUrl = `${appUrl}/reset-password?token=${token}`

      return Response.json({
        success: true,
        message: 'Link reset password berhasil dibuat.',
        resetUrl,
      })
    }

    return Response.json({
      success: true,
      message: 'Jika email terdaftar, link reset password akan dikirim.',
    })
  } catch (error) {
    console.error('[POST /api/auth/forgot-password]', error)
    return Response.json(
      { success: false, message: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
