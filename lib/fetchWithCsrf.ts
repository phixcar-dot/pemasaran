/**
 * Wrapper fetch yang otomatis menyertakan CSRF token dari cookie
 * ke header x-csrf-token untuk semua request mutasi (POST, PUT, PATCH, DELETE).
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase()

  // Hanya tambahkan CSRF header untuk mutasi
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      options.headers = {
        ...options.headers,
        'x-csrf-token': csrfToken,
      }
    }
  }

  return fetch(url, options)
}

// Ambil CSRF token dari cookie (client-side)
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='))
  return match ? match.split('=')[1] : null
}
