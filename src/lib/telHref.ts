/** Matndan `tel:` havolasi (+ prefiks bilan, raqamlar guruhlangan bo‘lsa ham ishlaydi). */
export function telHref(raw: string): string | null {
  const d = raw.replace(/\D/g, '')
  if (d.length < 5) return null
  return `tel:+${d}`
}
