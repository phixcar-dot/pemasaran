import { prisma } from '@/lib/prisma'
import { createSession, setSessionCookie } from '@/lib/auth'
import { compare } from 'bcryptjs'

// ── Brute force protection (in-memory, cukup untuk 1 user) ───────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS  = 5
const WINDOW_MS     = 15 * 60 * 1000  // 15 menit

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

function checkRateLimit(ip: string): { blocked: boolean; remaining: number } {
  const now  = Date.now()
  const entry = loginAttempts.get(ip)

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { blocked: false, remaining: MAX_ATTEMPTS - 1 }
  }

  entry.count++
  if (entry.count > MAX_ATTEMPTS) {
    const wait = Math.ceil((entry.resetAt - now) / 60000)
    return { blocked: true, remaining: 0 }
  }

  return { blocked: false, remaining: MAX_ATTEMPTS - entry.count }
}

function resetRateLimit(ip: string) {
  loginAttempts.delete(ip)
}
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)

    // Cek rate limit
    const { blocked } = checkRateLimit(ip)
    if (blocked) {
      return Response.json(
        { success: false, message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password, rememberMe } = body as {
      email:      string
      password:   string
      rememberMe: boolean
    }

    if (!email || !password) {
      return Response.json(
        { success: false, message: 'Email dan password wajib diisi.' },
        { status: 400 }
      )
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return Response.json(
        { success: false, message: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    // Bandingkan password dengan hash di database
    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      return Response.json(
        { success: false, message: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    // Login berhasil → reset rate limit
    resetRateLimit(ip)

    // Buat session JWT dengan durasi sesuai rememberMe
    const token = await createSession(
      { userId: user.id, email: user.email, name: user.name },
      !!rememberMe
    )

    // Set cookie session
    await setSessionCookie(token, !!rememberMe)

    return Response.json({
      success: true,
      message: 'Login berhasil.',
      user: { id: user.id, name: user.name, email: user.email },
    })
  } catch (error) {
    console.error('[POST /api/auth/login]', error)
    return Response.json(
      { success: false, message: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
