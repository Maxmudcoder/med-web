import { apiUrl } from '@/lib/api'

/** Ochiq yoki admin UI da `/uploads/` va stickers yo‘lini toʻgʻri asosga qoʻshadi */
export function stickerSrc(url: string) {
  const u = url.trim()
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  return apiUrl(u.startsWith('/') ? u : `/${u}`)
}
