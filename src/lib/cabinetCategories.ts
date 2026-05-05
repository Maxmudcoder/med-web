export const CABINET_CATEGORY_ORDER = [
  'CERTIFICATE_LANG',
  'OLYMPIAD',
  'STARTUP',
  'SPORT',
  'EVENT',
  'VOLUNTEERING',
] as const

export type CabinetCategory = (typeof CABINET_CATEGORY_ORDER)[number]

export function cabinetCategoryLabelUz(cat: string): string {
  switch (cat) {
    case 'CERTIFICATE_LANG':
      return 'Sertifikatlar'
    case 'OLYMPIAD':
      return 'Olimpiadalar'
    case 'STARTUP':
      return 'Startap loyihalar'
    case 'SPORT':
      return 'Sport yutuqlari'
    case 'EVENT':
      return 'Tadbirlar (ishtirok yoki tashkil)'
    case 'VOLUNTEERING':
      return 'Volontyorlik'
    default:
      return cat
  }
}
