/**
 * Mapping kode unitup → nama ULP PLN UP3 Medan
 */
export const ULP_NAMES: Record<string, string> = {
  '12001': 'MEDAN KOTA',
  '12002': 'MEDAN BARU',
  '12003': 'MEDAN SELATAN',
  '12012': 'SUNGGAL',
  '12014': 'MEDAN JOHOR',
  '12015': 'DELITUA',
}

/**
 * Kembalikan nama ULP jika ada mapping-nya,
 * jika tidak → kembalikan kode aslinya.
 */
export function getUlpName(kode: string): string {
  return ULP_NAMES[kode] ?? kode
}
