import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// Nama cookie session
const SESSION_COOKIE = 'session'
// Durasi session: 8 jam (default) atau 30 hari (remember me)
const SESSION_MAX_AGE_DEFAULT  = 60 * 60 * 8          // 8 jam
const SESSION_MAX_AGE_REMEMBER = 60 * 60 * 24 * 30    // 30 hari

// Secret key untuk JWT — dibaca dari env, wajib ada di production
function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is not set')
  }
  return new TextEncoder().encode(secret)
}

export interface SessionPayload {
  userId: number
  email: string
  name: string
}

// Buat JWT session token
export async function createSession(
  payload: SessionPayload,
  rememberMe = false
): Promise<string> {
  const secret  = getSecret()
  const maxAge  = rememberMe ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secret)
}

// Verifikasi dan decode JWT session token
export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secret = getSecret()
    const { payload } = await jwtVerify(token, secret)
    return {
      userId: payload.userId as number,
      email: payload.email as string,
      name: payload.name as string,
    }
  } catch {
    return null
  }
}

// Ambil session dari cookie (Server Component / Route Handler)
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}

// Set cookie session di response (Route Handler)
export async function setSessionCookie(token: string, rememberMe = false): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // Tanpa rememberMe: tidak ada maxAge → session cookie (hilang saat browser ditutup)
    // Dengan rememberMe: maxAge eksplisit → persistent cookie
    ...(rememberMe ? { maxAge: SESSION_MAX_AGE_REMEMBER } : {}),
    path: '/',
  })
}

// Hapus cookie session (logout)
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
}

export { SESSION_COOKIE }
