'use client'

import { useState } from 'react'
import Link from 'next/link'
import { fetchWithCsrf } from '@/lib/fetchWithCsrf'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  // Untuk keperluan development: tampilkan link reset
  const [devResetUrl, setDevResetUrl] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setMessage('')
    setDevResetUrl('')
    setLoading(true)

    try {
      const res = await fetchWithCsrf('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.message || 'Terjadi kesalahan.')
        return
      }

      setMessage(data.message)

      // Tampilkan link reset jika tersedia
      if (data.resetUrl) {
        setDevResetUrl(data.resetUrl)
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        <div className="bg-blue-700 rounded-t-xl px-8 py-6 text-center">
          <h1 className="text-white text-2xl font-bold tracking-wide">
            Sistem Tunggakan
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            PLN — Perhitungan Data Tunggakan
          </p>
        </div>

        <div className="bg-white rounded-b-xl shadow-lg px-8 py-8">
          <h2 className="text-gray-700 text-xl font-semibold mb-2 text-center">
            Lupa Password
          </h2>
          <p className="text-gray-500 text-sm text-center mb-6">
            Masukkan email Anda untuk mendapatkan link reset password.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {message}
            </div>
          )}

          {/* Link reset password */}
          {devResetUrl && (
            <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="text-gray-600 mb-2">Klik link berikut untuk reset password:</p>
              <Link
                href={devResetUrl}
                className="text-blue-600 hover:underline break-all font-medium"
              >
                {devResetUrl}
              </Link>
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {loading ? 'Memproses...' : 'Kirim Link Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition"
            >
              ← Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
