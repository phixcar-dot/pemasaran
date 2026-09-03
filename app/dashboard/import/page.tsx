import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ImportForm from '@/components/ImportForm'
import DeleteAllButton from '@/components/DeleteAllButton'

export default async function ImportPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div>
      {/* Header + breadcrumb */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Import Data Tunggakan</h1>
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mt-1">
            <ol className="flex items-center gap-1 text-sm text-gray-400">
              <li>
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li aria-hidden="true">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li className="text-gray-600 font-medium" aria-current="page">Import Data</li>
            </ol>
          </nav>
        </div>
        <DeleteAllButton />
      </div>

      <ImportForm />
    </div>
  )
}
