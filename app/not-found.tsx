import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        {/* Angka 404 */}
        <div className="relative mb-6">
          <p className="text-[120px] font-black text-blue-700/10 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-700 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor"
                   viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Teks */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          Kembali ke dashboard untuk melanjutkan.
        </p>

        {/* Tombol */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5
                       bg-blue-700 text-white rounded-xl text-sm font-semibold
                       hover:bg-blue-800 transition-colors focus:outline-none
                       focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Ke Dashboard
          </Link>
          <Link
            href="/dashboard/rekap"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5
                       border border-gray-300 text-gray-600 rounded-xl text-sm font-medium
                       hover:bg-gray-50 transition-colors focus:outline-none
                       focus:ring-2 focus:ring-gray-300"
          >
            Rekap Tunggakan
          </Link>
        </div>

        {/* Badge PLN */}
        <div className="mt-10 flex items-center justify-center gap-2 text-gray-400">
          <div className="w-6 h-6 bg-[#FFD700] rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-[#0D1B4B]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13 2L4.09 12.97H11L10 22L19.91 11.03H13L13 2Z" />
            </svg>
          </div>
          <span className="text-xs font-medium">Sistem Tunggakan · PLN UID Sumatera Utara</span>
        </div>

      </div>
    </div>
  )
}
