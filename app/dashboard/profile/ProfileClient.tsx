'use client'

import { useState, useTransition } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────────────────────────────────────
function IconMail() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}
function IconShield() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
function IconCalendar() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
function IconEdit() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}
function IconLockAlt() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
function IconSave() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}
function IconX() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function IconEyeOn() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
function IconEyeOff() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}
function IconSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────
interface ToastItem { id: number; type: 'success' | 'error'; message: string }

function Toast({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const ok = toast.type === 'success'
  return (
    <div className={[
      'flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border',
      ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800',
    ].join(' ')} role="alert">
      {ok ? <IconCheck /> : <IconX />}
      <span className="flex-1">{toast.message}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity ml-1" aria-label="Tutup">×</button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Password field
// ─────────────────────────────────────────────────────────────────────────────
function PasswordField({
  id, label, value, onChange, autoComplete, disabled,
}: {
  id: string; label: string; value: string
  onChange: (v: string) => void; autoComplete?: string; disabled?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id} type={show ? 'text' : 'password'} value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete} disabled={disabled}
          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm
                     text-gray-800 bg-white placeholder-gray-300
                     focus:outline-none focus:ring-2 focus:ring-[#0D1B4B]/20 focus:border-[#0D1B4B]
                     disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={show ? 'Sembunyikan' : 'Tampilkan'}>
          {show ? <IconEyeOff /> : <IconEyeOn />}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  const w = name.trim().split(/\s+/)
  return (w.length === 1 ? w[0].slice(0, 2) : w[0][0] + w[1][0]).toUpperCase()
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
interface UserData { id: number; name: string; email: string; createdAt: Date }

export default function ProfileClient({ user: initial }: { user: UserData }) {
  const [user, setUser] = useState(initial)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  let counter = 0

  function addToast(type: 'success' | 'error', message: string) {
    const id = Date.now() + ++counter
    setToasts(p => [...p, { id, type, message }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000)
  }

  // ── Profil form ────────────────────────────────────────────────────────────
  const [pName, setPName] = useState(user.name)
  const [pEmail, setPEmail] = useState(user.email)
  const [pErr, setPErr] = useState('')
  const [pPending, startP] = useTransition()

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPErr('')
    const name = pName.trim()
    const email = pEmail.trim()
    if (!name) { setPErr('Nama wajib diisi.'); return }
    if (name.length < 2) { setPErr('Nama minimal 2 karakter.'); return }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setPErr('Format email tidak valid.'); return }
    startP(async () => {
      try {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email }),
        })
        const data = await res.json()
        if (data.success) {
          setUser(data.user); setPName(data.user.name); setPEmail(data.user.email)
          addToast('success', data.message ?? 'Profil berhasil diperbarui.')
        } else { setPErr(data.message ?? 'Terjadi kesalahan.') }
      } catch { setPErr('Gagal terhubung ke server.') }
    })
  }

  // ── Password form ──────────────────────────────────────────────────────────
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [conPw, setConPw] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwPending, startPw] = useTransition()

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPwErr('')
    if (!curPw) { setPwErr('Password lama wajib diisi.'); return }
    if (!newPw || newPw.length < 8) { setPwErr('Password baru minimal 8 karakter.'); return }
    if (newPw !== conPw) { setPwErr('Konfirmasi password tidak cocok.'); return }
    startPw(async () => {
      try {
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: curPw, newPassword: newPw, confirmPassword: conPw }),
        })
        const data = await res.json()
        if (data.success) {
          setCurPw(''); setNewPw(''); setConPw('')
          addToast('success', data.message ?? 'Password berhasil diubah.')
        } else { setPwErr(data.message ?? 'Terjadi kesalahan.') }
      } catch { setPwErr('Gagal terhubung ke server.') }
    })
  }

  const initials = getInitials(user.name)
  const createdAt = new Date(user.createdAt).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-5 max-w-[1000px]">

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />
          </div>
        ))}
      </div>

      {/* Subtitle — di bawah TopBar */}
      <p className="text-sm text-gray-500 -mt-1">Kelola informasi akun dan keamanan akun Anda.</p>

      {/* ── Profile card ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Banner navy — solid, no pattern */}
        <div className="h-16 bg-gradient-to-r from-[#0D1B4B] via-[#112060] to-[#0D1B4B]" />

        {/* Avatar + nama */}
        <div className="px-7 pb-5">
          <div className="flex items-end gap-5 -mt-6 mb-5">
            {/* Avatar kuning besar */}
            <div className="w-20 h-20 rounded-2xl bg-[#FFD700] border-4 border-white shadow-lg
                            flex items-center justify-center shrink-0">
              <span className="text-[#0D1B4B] font-black text-2xl select-none">{initials}</span>
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{user.name}</h2>
              <p className="text-sm text-gray-400 mt-0.5">Administrator</p>
            </div>
          </div>

          {/* Info row — 3 kolom */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Email */}
            <div className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3.5 bg-gray-50/50">
              <span className="text-gray-400"><IconMail /></span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest leading-none">Email</p>
                <p className="text-sm text-gray-700 mt-1 truncate">{user.email}</p>
              </div>
            </div>
            {/* Role */}
            <div className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3.5 bg-gray-50/50">
              <span className="text-gray-400"><IconShield /></span>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest leading-none">Role</p>
                <p className="text-sm font-semibold text-[#0D1B4B] mt-1">Administrator</p>
              </div>
            </div>
            {/* Akun dibuat */}
            <div className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3.5 bg-gray-50/50">
              <span className="text-gray-400"><IconCalendar /></span>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest leading-none">Akun Dibuat</p>
                <p className="text-sm text-gray-700 mt-1">{createdAt}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Informasi Profil */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Header kartu */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#3B5BDB] shrink-0 mt-0.5">
              <IconEdit />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Informasi Profil</p>
              <p className="text-xs text-gray-400 mt-0.5">Perbarui nama dan email akun Anda.</p>
            </div>
          </div>

          <form onSubmit={saveProfile} noValidate className="space-y-4">
            <div>
              <label htmlFor="p-name" className="block text-sm text-gray-600 mb-1.5">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                id="p-name" type="text" value={pName}
                onChange={e => setPName(e.target.value)}
                placeholder="Nama lengkap" maxLength={100}
                autoComplete="name" disabled={pPending}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm
                           text-gray-800 placeholder-gray-300 bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#0D1B4B]/20 focus:border-[#0D1B4B]
                           disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="p-email" className="block text-sm text-gray-600 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="p-email" type="email" value={pEmail}
                onChange={e => setPEmail(e.target.value)}
                placeholder="email@domain.com" maxLength={150}
                autoComplete="email" disabled={pPending}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm
                           text-gray-800 placeholder-gray-300 bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#0D1B4B]/20 focus:border-[#0D1B4B]
                           disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
              />
            </div>

            {pErr && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50
                              border border-red-100 rounded-lg px-3.5 py-2.5" role="alert">
                <IconX /><span>{pErr}</span>
              </div>
            )}

            <button type="submit" disabled={pPending}
              className="inline-flex items-center gap-2 bg-[#0D1B4B] hover:bg-[#162260]
                         text-white text-sm font-semibold px-5 py-2.5 rounded-lg
                         transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {pPending ? <><IconSpinner />Menyimpan...</> : <><IconSave />Simpan Perubahan</>}
            </button>
          </form>
        </div>

        {/* Keamanan Akun */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Header kartu */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[#FFF4F2] flex items-center justify-center text-[#C2410C] shrink-0 mt-0.5">
              <IconLockAlt />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Keamanan Akun</p>
              <p className="text-xs text-gray-400 mt-0.5">Ubah password untuk menjaga keamanan akun.</p>
            </div>
          </div>

          <form onSubmit={changePassword} noValidate className="space-y-4">
            <PasswordField id="cur-pw" label="Password Lama"
              value={curPw} onChange={setCurPw}
              autoComplete="current-password" disabled={pwPending} />
            <PasswordField id="new-pw" label="Password Baru"
              value={newPw} onChange={setNewPw}
              autoComplete="new-password" disabled={pwPending} />
            <PasswordField id="con-pw" label="Konfirmasi Password Baru"
              value={conPw} onChange={setConPw}
              autoComplete="new-password" disabled={pwPending} />

            {pwErr && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50
                              border border-red-100 rounded-lg px-3.5 py-2.5" role="alert">
                <IconX /><span>{pwErr}</span>
              </div>
            )}

            <button type="submit" disabled={pwPending}
              className="inline-flex items-center gap-2 bg-[#C2410C] hover:bg-[#9A3209]
                         text-white text-sm font-semibold px-5 py-2.5 rounded-lg
                         transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {pwPending
                ? <><IconSpinner />Menyimpan...</>
                : <><IconLockAlt />Ganti Password</>}
            </button>
          </form>
        </div>
      </div>

      <div className="h-2" aria-hidden="true" />
    </div>
  )
}
