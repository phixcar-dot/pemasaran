'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchWithCsrf } from '@/lib/fetchWithCsrf'

export default function LoginPage() {
  const router = useRouter()
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPwd,    setShowPwd]    = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [splash,     setSplash]     = useState(false)
  const [fadeOut,    setFadeOut]    = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetchWithCsrf('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, rememberMe }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'Login gagal.')
        return
      }

      // 1) Fade out halaman login
      setFadeOut(true)

      // 2) Setelah fade selesai, tampilkan splash
      setTimeout(() => {
        setSplash(true)
      }, 400)

      // 3) Setelah splash ~2 detik, masuk dashboard
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2500)

    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Splash Screen ────────────────────────────────────────────────── */}
      {splash && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(160deg,#050d1f 0%,#0a1a3a 50%,#0d2151 100%)' }}
        >
          {/* Bintang/partikel latar */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {[...Array(18)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white animate-twinkle"
                style={{
                  width:  `${Math.random() * 2 + 1}px`,
                  height: `${Math.random() * 2 + 1}px`,
                  top:    `${Math.random() * 90}%`,
                  left:   `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.5 + 0.2,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {/* Lingkaran cahaya di belakang logo */}
          <div
            className="absolute rounded-full animate-glow-pulse"
            style={{
              width: 280, height: 280,
              background: 'radial-gradient(circle, rgba(59,91,219,0.25) 0%, transparent 70%)',
            }}
          />

          {/* Konten utama */}
          <div className="relative flex flex-col items-center gap-6 animate-splash-in">

            {/* Ring + Logo */}
            <div className="relative flex items-center justify-center">
              {/* Ring berputar */}
              <div
                className="absolute rounded-full border-2 border-yellow-400/30 animate-spin-slow"
                style={{ width: 130, height: 130 }}
              />
              <div
                className="absolute rounded-full border border-blue-400/20 animate-spin-reverse"
                style={{ width: 108, height: 108 }}
              />
              {/* Logo */}
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center shadow-2xl border border-white/20">
                <img src="/logo-pln.png" alt="Logo PLN" style={{ width: 52, height: 52, objectFit: 'contain' }} />
              </div>
            </div>

            {/* Teks */}
            <div className="text-center space-y-1">
              <p className="text-blue-200 text-sm font-semibold tracking-[0.25em] uppercase">
                PT PLN (Persero)
              </p>
              <p className="text-white font-extrabold text-3xl tracking-wide leading-tight">
                Selamat Datang
              </p>
              <p className="font-extrabold text-3xl tracking-wide" style={{ color: '#f5c518' }}>
                di Sistem Tunggakan
              </p>
              <p className="text-blue-300 text-xs tracking-widest mt-1 uppercase">
                UP3 Medan
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-64 space-y-2">
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full animate-progress-bar"
                  style={{ background: 'linear-gradient(90deg, #3b5bdb, #f5c518)' }}
                />
              </div>
              <p className="text-center text-blue-400 text-[11px] tracking-widest uppercase animate-pulse">
                Memuat dashboard...
              </p>
            </div>
          </div>

          {/* Grid lines dekoratif bawah */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" aria-hidden="true"
            style={{
              background: 'linear-gradient(to top, rgba(59,91,219,0.15), transparent)',
              maskImage: 'linear-gradient(to top, black, transparent)',
            }}
          />
        </div>
      )}

      {/* ── Login Page ───────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 flex flex-col overflow-auto transition-opacity duration-400"
        style={{
          backgroundImage: 'url(/bg-login.png)',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      >
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl">

            {/* Card header */}
            <div
              className="relative px-8 py-6 flex items-center gap-4 overflow-hidden"
              style={{ background: 'linear-gradient(100deg,#1055b6 0%,#1976d2 60%,#42a5f5 100%)' }}
            >
              <div className="absolute right-0 inset-y-0 w-36 opacity-25 pointer-events-none">
                <TowerSVG />
              </div>
              <div className="absolute bottom-0 right-0 w-20 h-1.5" style={{ background: '#f5c518' }} />
              <img src="/logo-pln.png" alt="Logo PLN" className="relative z-10 shrink-0" style={{ width: 56, height: 56, objectFit: 'contain' }} />
              <div className="relative z-10">
                <p className="text-white font-extrabold text-2xl leading-none tracking-wide">PLN</p>
                <p className="text-blue-100 text-sm font-semibold leading-snug mt-0.5">
                  UP3 MEDAN
                </p>
                <p className="text-blue-200 text-xs leading-snug mt-0.5">
                 Sistem Tunggakan Pelanggan
                </p>
              </div>
            </div>

            {/* Card body */}
            <div className="bg-white px-8 py-8">

              <div className="flex items-center justify-center gap-2 mb-1">
                <svg className="w-5 h-5 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
                <h1 className="text-gray-800 text-xl font-bold">Masuk ke Sistem</h1>
              </div>
              <p className="text-center text-gray-400 text-sm mb-6">
                Silakan login untuk mengakses sistem
              </p>

              {error && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      id="email" type="email" autoComplete="email" required
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@situnggakan.local"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-gray-800 text-sm
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      id="password" type={showPwd ? 'text' : 'password'} autoComplete="current-password" required
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-gray-800 text-sm
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <button
                      type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 focus:outline-none transition-colors"
                      aria-label={showPwd ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPwd ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me + Lupa password */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox" checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">
                      Ingat saya <span className="text-blue-500">(30 hari)</span>
                    </span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline hover:text-blue-800 transition font-medium">
                    Lupa Password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white
                             bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition shadow-md hover:shadow-lg
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-1"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Masuk
                    </>
                  )}
                </button>

              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Keyframe styles ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes splash-in {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes progress-bar {
          from { width: 0%;   }
          to   { width: 100%; }
        }
        @keyframes glow-pulse {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%       { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(0deg);    }
          to   { transform: rotate(-360deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 0.8; }
        }
        .animate-splash-in {
          animation: splash-in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .animate-progress-bar {
          animation: progress-bar 2s ease-in-out forwards;
        }
        .animate-glow-pulse {
          animation: glow-pulse 2.5s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 6s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 4s linear infinite;
        }
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}

/* ── Tower silhouette ────────────────────────────────────────────────────── */
function TowerSVG() {
  return (
    <svg viewBox="0 0 120 280" fill="white" className="w-full h-full" aria-hidden="true">
      <polygon points="50,10 70,10 108,270 12,270" opacity="0.5" />
      <rect x="22" y="70"  width="76" height="5" rx="2" />
      <rect x="18" y="130" width="84" height="5" rx="2" />
      <rect x="14" y="190" width="92" height="5" rx="2" />
      <rect x="10" y="245" width="100" height="5" rx="2" />
      <rect x="56" y="0"   width="8"  height="18" rx="2" />
      <line x1="60" y1="10" x2="0"   y2="70"  stroke="white" strokeWidth="2" />
      <line x1="60" y1="10" x2="120" y2="70"  stroke="white" strokeWidth="2" />
    </svg>
  )
}
