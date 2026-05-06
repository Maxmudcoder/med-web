/** Ichki kabinet arxivi — reyting yoʻnalishlari bilan mos 10 ta tur (tartib nizomdagidek) */
export const CABINET_CATEGORY_ORDER = [
  'CERTIFICATE_LANG',
  'OLYMPIAD',
  'CONFERENCE',
  'STARTUP',
  'SPORT',
  'VOLUNTEERING',
  'EVENT',
  'SCHOLARSHIP',
  'EXCELLENCE',
  'ARTICLE',
] as const

export type CabinetCategory = (typeof CABINET_CATEGORY_ORDER)[number]

export function cabinetCategoryLabelUz(cat: string): string {
  switch (cat) {
    case 'CERTIFICATE_LANG':
      return 'Til sertifikati'
    case 'OLYMPIAD':
      return 'Olimpiada'
    case 'CONFERENCE':
      return 'Konferensiya ishtiroki'
    case 'STARTUP':
      return 'Startap gʻoyasi'
    case 'SPORT':
      return 'Sport yutuqlari'
    case 'VOLUNTEERING':
      return 'Volontyorlik'
    case 'EVENT':
      return 'Maʼnaviy-maʼrifiy tadbir'
    case 'SCHOLARSHIP':
      return 'Nomli stipendiya'
    case 'EXCELLENCE':
      return 'Aʼlochi talaba'
    case 'ARTICLE':
      return 'Ilmiy maqola'
    default:
      return cat
  }
}
