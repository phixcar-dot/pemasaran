'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
        Token tidak ditemukan. Minta link reset password baru.
        <div className="mt-3">
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Minta Link Baru
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.message || 'Gagal mereset password.')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Password berhasil diubah. Anda akan diarahkan ke halaman login...
        </div>
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          Login sekarang
        </Link>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Password Baru
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Konfirmasi Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi password baru"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? 'Memproses...' : 'Ubah Password'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition"
        >
          ← Kembali ke Login
        </Link>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
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
          <h2 className="text-gray-700 text-xl font-semibold mb-6 text-center">
            Reset Password
          </h2>

          <Suspense fallback={<p className="text-center text-gray-500 text-sm">Memuat...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
