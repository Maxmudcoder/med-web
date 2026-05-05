/** Eski “bo‘sh matn” manzillar bilan uyg‘unlik: JSON prefiksli saqlash */
export const UZ_ADDR_PREFIX = 'UZADR1:'

export type UzAddrPayload = {
  /** Masalan UZ.05 */
  vi: string
  /** Masalan UZ.05.1512818 */
  ti: string
  m: string
  k: string
}

export function encodeUzAddress(p: UzAddrPayload): string {
  return UZ_ADDR_PREFIX + JSON.stringify(p)
}

export function decodeUzAddress(raw: string | null | undefined): UzAddrPayload | null {
  const t = raw?.trim()
  if (!t || !t.startsWith(UZ_ADDR_PREFIX)) return null
  try {
    const j = JSON.parse(t.slice(UZ_ADDR_PREFIX.length)) as unknown
    if (!j || typeof j !== 'object') return null
    const o = j as Record<string, unknown>
    if (typeof o.vi !== 'string' || typeof o.ti !== 'string') return null
    return {
      vi: o.vi,
      ti: o.ti,
      m: typeof o.m === 'string' ? o.m : '',
      k: typeof o.k === 'string' ? o.k : '',
    }
  } catch {
    return null
  }
}
