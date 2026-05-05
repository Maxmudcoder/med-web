/** Tuman uchun mahalla (MFY) ro‘yxati: `public/data/mfy/UZ-05-1512818.json` */
export async function loadMahallaOptionsForTuman(tumanSlug: string): Promise<string[]> {
  if (!tumanSlug) return []
  const base = import.meta.env.BASE_URL
  try {
    const r = await fetch(`${base}data/mfy/${tumanSlug}.json`)
    if (!r.ok) return []
    const j: unknown = await r.json()
    if (Array.isArray(j))
      return j.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)
    if (j && typeof j === 'object' && Array.isArray((j as { m?: unknown }).m))
      return ((j as { m: unknown[] }).m)
        .map((x) => (typeof x === 'string' ? x.trim() : ''))
        .filter(Boolean)
  } catch {
    return []
  }
  return []
}
