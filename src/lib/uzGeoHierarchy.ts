import rawTsv from '@/data/uz-admin2-geonames.tsv?raw'

export type UzTuman = { id: string; nameUz: string }
export type UzViloyat = { id: string; nameUz: string; tumans: UzTuman[] }

/** GeoNames admin1 → rasmiy lotincha nom (interfeysda) */
const ADMIN1_NAME_UZ: Record<string, string> = {
  '01': 'Andijon viloyati',
  '02': 'Buxoro viloyati',
  '03': 'Fargʻona viloyati',
  '05': 'Xorazm viloyati',
  '06': 'Namangan viloyati',
  '07': 'Navoiy viloyati',
  '08': 'Qashqadaryo viloyati',
  '09': 'Qoraqalpogʻiston Respublikasi',
  '10': 'Samarqand viloyati',
  '12': 'Surxondaryo viloyati',
  '13': 'Toshkent shahri',
  '14': 'Toshkent viloyati',
  '15': 'Jizzax viloyati',
  '16': 'Sirdaryo viloyati',
}

function prettifyTumanName(nameFromGeo: string): string {
  const t = nameFromGeo.trim()
  if (t.endsWith(' Tumani')) return `${t.slice(0, -' Tumani'.length).trim()} tumani`
  return t
}

let cached: UzViloyat[] | null = null

export function getUzAddressHierarchy(): UzViloyat[] {
  if (cached) return cached
  const byVil = new Map<string, UzTuman[]>()
  for (const line of rawTsv.split(/\r?\n/)) {
    if (!line.startsWith('UZ.')) continue
    const cols = line.split('\t')
    if (cols.length < 3) continue
    const fullCode = cols[0]
    const parts = fullCode.split('.')
    if (parts.length < 3) continue
    const admin1 = parts[1]
    if (!ADMIN1_NAME_UZ[admin1]) continue
    const nameUz = prettifyTumanName(cols[1])
    const list = byVil.get(admin1) ?? []
    list.push({ id: fullCode, nameUz })
    byVil.set(admin1, list)
  }

  const out: UzViloyat[] = []
  for (const [admin1, tumans] of byVil) {
    const id = `UZ.${admin1}`
    tumans.sort((a, b) => a.nameUz.localeCompare(b.nameUz, 'uz'))
    out.push({
      id,
      nameUz: ADMIN1_NAME_UZ[admin1] ?? id,
      tumans,
    })
  }
  out.sort((a, b) => a.nameUz.localeCompare(b.nameUz, 'uz'))
  cached = out
  return out
}

export function tumanIdToMfyFileSlug(tumanId: string): string {
  return tumanId.replaceAll('.', '-')
}
