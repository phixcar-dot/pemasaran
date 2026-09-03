import { getSession, createSession, setSessionCookie } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile — ambil data user yang sedang login
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  const session = await getSession()
  if (!session) {
    return Response.json(
      { success: false, message: 'Belum login.' },
      { status: 401 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, createdAt: true },
  })

  if (!user) {
    return Response.json(
      { success: false, message: 'User tidak ditemukan.' },
      { status: 404 }
    )
  }

  return Response.json({ success: true, user })
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/profile — update nama dan/atau email
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json(
      { success: false, message: 'Belum login.' },
      { status: 401 }
    )
  }

  let body: { name?: string; email?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { success: false, message: 'Format request tidak valid.' },
      { status: 400 }
    )
  }

  const name = (body.name ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()

  // Validasi nama
  if (!name) {
    return Response.json(
      { success: false, message: 'Nama wajib diisi.' },
      { status: 422 }
    )
  }
  if (name.length < 2 || name.length > 100) {
    return Response.json(
      { success: false, message: 'Nama harus antara 2–100 karakter.' },
      { status: 422 }
    )
  }

  // Validasi email
  if (!email) {
    return Response.json(
      { success: false, message: 'Email wajib diisi.' },
      { status: 422 }
    )
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return Response.json(
      { success: false, message: 'Format email tidak valid.' },
      { status: 422 }
    )
  }

  // Cek duplikat email (abaikan user sendiri)
  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: session.userId } },
    select: { id: true },
  })
  if (existing) {
    return Response.json(
      { success: false, message: 'Email sudah digunakan oleh akun lain.' },
      { status: 409 }
    )
  }

  // Update database — hanya user yang sedang login
  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: { name, email },
    select: { id: true, name: true, email: true, createdAt: true },
  })

  // Perbarui session cookie agar nama di navbar langsung terupdate
  const newToken = await createSession({
    userId: updated.id,
    email: updated.email,
    name: updated.name,
  })
  await setSessionCookie(newToken)

  return Response.json({
    success: true,
    message: 'Profil berhasil diperbarui.',
    user: updated,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/profile — ganti password
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json(
      { success: false, message: 'Belum login.' },
      { status: 401 }
    )
  }

  let body: { currentPassword?: string; newPassword?: string; confirmPassword?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { success: false, message: 'Format request tidak valid.' },
      { status: 400 }
    )
  }

  const { currentPassword = '', newPassword = '', confirmPassword = '' } = body

  // Validasi field tidak kosong
  if (!currentPassword || !newPassword || !confirmPassword) {
    return Response.json(
      { success: false, message: 'Semua field password wajib diisi.' },
      { status: 422 }
    )
  }

  // Konfirmasi password baru harus sama
  if (newPassword !== confirmPassword) {
    return Response.json(
      { success: false, message: 'Konfirmasi password tidak cocok dengan password baru.' },
      { status: 422 }
    )
  }

  // Aturan kekuatan password
  if (newPassword.length < 8) {
    return Response.json(
      { success: false, message: 'Password baru minimal 8 karakter.' },
      { status: 422 }
    )
  }
  if (newPassword.length > 255) {
    return Response.json(
      { success: false, message: 'Password baru terlalu panjang.' },
      { status: 422 }
    )
  }

  // Ambil hash password dari database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { password: true },
  })
  if (!user) {
    return Response.json(
      { success: false, message: 'User tidak ditemukan.' },
      { status: 404 }
    )
  }

  // Verifikasi password lama
  const passwordMatch = await compare(currentPassword, user.password)
  if (!passwordMatch) {
    return Response.json(
      { success: false, message: 'Password lama tidak sesuai.' },
      { status: 401 }
    )
  }

  // Jangan simpan password yang sama
  const sameAsOld = await compare(newPassword, user.password)
  if (sameAsOld) {
    return Response.json(
      { success: false, message: 'Password baru tidak boleh sama dengan password lama.' },
      { status: 422 }
    )
  }

  // Hash password baru dengan bcryptjs (rounds=12, konsisten dengan pattern existing)
  const hashedPassword = await hash(newPassword, 12)

  // Update password — hanya user yang sedang login
  await prisma.user.update({
    where: { id: session.userId },
    data: { password: hashedPassword },
  })

  return Response.json({
    success: true,
    message: 'Password berhasil diubah.',
  })
}
