'use client'

interface PageSizeSelectProps {
  value:   number
  options: number[]
  /** URL dasar tanpa page & size, misal "/dashboard/imports/5" */
  baseUrl: string
  /** Nama param page, default "page" */
  pageParam?: string
}

export default function PageSizeSelect({
  value,
  options,
  baseUrl,
  pageParam = 'page',
}: PageSizeSelectProps) {
  function buildUrl(size: number): string {
    const url = new URL(baseUrl, 'http://x')
    url.searchParams.set(pageParam, '1')
    url.searchParams.set('size', String(size))
    return url.pathname + (url.search ? url.search : '')
  }

  return (
    <div className="relative">
      <select
        aria-label="Jumlah baris per halaman"
        defaultValue={value}
        onChange={(e) => {
          window.location.href = buildUrl(Number(e.target.value))
        }}
        className="appearance-none pl-2 pr-6 py-0.5 text-xs font-medium
                   border border-gray-200 rounded-md bg-white text-gray-700
                   focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
      >
        {options.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2
                   w-3 h-3 text-gray-400"
        fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}
