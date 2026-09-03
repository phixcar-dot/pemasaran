import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password, confirmPassword } = body as {
      token: string
      password: string
      confirmPassword: string
    }

    // Validasi input
    if (!token || !password || !confirmPassword) {
      return Response.json(
        { success: false, message: 'Semua field wajib diisi.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return Response.json(
        { success: false, message: 'Password minimal 8 karakter.' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return Response.json(
        { success: false, message: 'Konfirmasi password tidak cocok.' },
        { status: 400 }
      )
    }

    // Cari token yang valid
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return Response.json(
        { success: false, message: 'Token tidak valid.' },
        { status: 400 }
      )
    }

    if (resetToken.used) {
      return Response.json(
        { success: false, message: 'Token sudah pernah digunakan.' },
        { status: 400 }
      )
    }

    if (new Date() > resetToken.expiresAt) {
      return Response.json(
        { success: false, message: 'Token sudah kadaluarsa. Minta link baru.' },
        { status: 400 }
      )
    }

    // Hash password baru
    const hashedPassword = await hash(password, 12)

    // Update password user dan tandai token sebagai sudah digunakan (atomic)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ])

    return Response.json({
      success: true,
      message: 'Password berhasil diubah. Silakan login.',
    })
  } catch (error) {
    console.error('[POST /api/auth/reset-password]', error)
    return Response.json(
      { success: false, message: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
