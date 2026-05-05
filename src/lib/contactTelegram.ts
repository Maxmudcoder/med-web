/** @username, username yoki to‘liq t.me havola → ochish uchun URL */
export function telegramChannelHref(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s

  const cleaned = s.replace(/^@+/, '').replace(/^t\.me\//i, '').replace(/^\//, '').trim()
  if (!cleaned) return null

  return `https://t.me/${cleaned}`
}
