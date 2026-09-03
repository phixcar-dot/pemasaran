import { cookies } from 'next/headers'

const CSRF_COOKIE = 'csrf_token'
const CSRF_HEADER = 'x-csrf-token'

// Validasi CSRF token dari request (dipanggil di API Route Handler)
export async function validateCsrf(request: Request): Promise<boolean> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value
  const headerToken = request.headers.get(CSRF_HEADER)

  if (!cookieToken || !headerToken) return false
  return cookieToken === headerToken
}

export { CSRF_HEADER }
