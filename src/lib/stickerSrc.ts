import { apiUrl } from '@/lib/api'

const uploadsPublicBase =
  import.meta.env.VITE_UPLOADS_PUBLIC_BASE?.trim().replace(/\/$/, '') ?? ''

/** `/uploads/*` uchun: `VITE_UPLOADS_PUBLIC_BASE` serverdagi `S3_PUBLIC_BASE` bilan bir xil (302 dan sirqib o‘tadi). */
function absoluteUploadsUrl(path: string): string | null {
  if (!uploadsPublicBase) return null
  const p = path.startsWith('/') ? path : `/${path}`
  if (!p.startsWith('/uploads/')) return null
  return `${uploadsPublicBase}${p}`
}

/** Rasm va fayllar uchun: avval to‘g‘ridan-to‘g‘ri S3/CDN, aks holda API orqali. */
export function publicFileUrl(url: string): string {
  const u = url.trim()
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  const p = u.startsWith('/') ? u : `/${u}`
  return absoluteUploadsUrl(p) ?? apiUrl(p)
}

/** Ochiq yoki admin UI da `/uploads/` va stickers yo‘lini toʻgʻri asosga qoʻshadi */
export function stickerSrc(url: string) {
  return publicFileUrl(url)
}
