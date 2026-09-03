// Komponen tabel data tunggakan — digunakan oleh tabel utama maupun tiap seksi rekap lembar
import { getUlpName } from '@/lib/ulpNames'

export interface TunggakanRow {
  id:     number
  unitap: string
  unitup: string
  idpel:  string
  kogol:  string
  lembar: number
  // rpptl disimpan sebagai Decimal di DB; Prisma mengembalikannya sebagai objek Decimal.
  // Di sini kita gunakan unknown agar kompatibel dengan Prisma.Decimal maupun number/string.
  rpptl:  unknown
  import: {
    fileName:  string
    createdAt: Date
  }
}

interface DataTableProps {
  rows:    TunggakanRow[]
  startNo: number
}

function formatDate(date: Date): string {
  return date.toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Format nilai RPPTL dari Decimal/number/string → string ribuan Indonesia
function formatRpptl(value: unknown): string {
  if (value === null || value === undefined) return '0'
  const num = typeof value === 'object' && value !== null && 'toNumber' in value
    ? (value as { toNumber: () => number }).toNumber()
    : Number(value)
  if (isNaN(num)) return '0'
  return num.toLocaleString('id-ID')
}

export default function DataTable({ rows, startNo }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">No</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">UNITAP</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">UNITUP</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">IDPEL</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">KOGOL</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">LEMBAR</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">RPPTL</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Sumber File</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Waktu Import</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, idx) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-400 tabular-nums">
                {(startNo + idx).toLocaleString('id-ID')}
              </td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                {row.unitap || <span className="text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                {row.unitup ? getUlpName(row.unitup) : <span className="text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3 text-gray-700 font-mono whitespace-nowrap">
                {row.idpel || <span className="text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                {row.kogol || <span className="text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3 text-gray-700 text-right tabular-nums">
                {row.lembar.toLocaleString('id-ID')}
              </td>
              <td className="px-4 py-3 text-gray-700 text-right tabular-nums whitespace-nowrap">
                {formatRpptl(row.rpptl)}
              </td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                {row.import.fileName}
              </td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                {formatDate(row.import.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
