import { apiUrl } from '@/lib/api'

/**
 * Nisbiy fayl yo‘llari (`/uploads/...`) doim API host orqali beriladi (S3 proksi).
 * To‘g‘ridan-to‘g‘ri S3/CDN havolasi `Cross-Origin-Embedder-Policy` + `Cross-Origin-Resource-Policy`
 * sababli productionda bloklanmasin.
 */
export function publicFileUrl(url: string): string {
  const u = url.trim()
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  const p = u.startsWith('/') ? u : `/${u}`
  return apiUrl(p)
}

/** Ochiq yoki admin UI da `/uploads/` va stickers yo‘lini toʻgʻri asosga qoʻshadi */
export function stickerSrc(url: string) {
  return publicFileUrl(url)
}
