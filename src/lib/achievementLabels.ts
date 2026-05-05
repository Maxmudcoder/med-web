/** Jamoat sahifalari uchun qisqa yorliq */
export function achievementKindShortUz(kind: string, articleJournalTier?: string | null): string {
  switch (kind) {
    case 'CERTIFICATE':
      return 'Til sert.'
    case 'OLYMPIAD':
      return 'Olimpiada'
    case 'CONFERENCE':
      return 'Konferensiya'
    case 'SPORT':
      return 'Sport'
    case 'STARTUP':
      return 'Startap'
    case 'EVENT':
      return 'Maʼrifiy tad.'
    case 'VOLUNTEERING':
      return 'Volontör'
    case 'SCHOLARSHIP':
      return 'Stipendiya'
    case 'EXCELLENCE':
      return `A'lochi`
    case 'ARTICLE':
      return String(articleJournalTier ?? '').toUpperCase() === 'INTERNATIONAL' ? 'Maqola · XJ' : 'Maqola · RJ'
    case 'ACHIEVEMENT':
      return 'Yutuq'
    default:
      return kind
  }
}
