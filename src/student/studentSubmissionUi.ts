/** Talaba kabineti — yuklangan materiallar uchun umum UI */

/** Bir material uchun maksimal shikoyatlar (server bilan bir xil) */
export const MAX_APPEALS_PER_SUBMISSION = 20

export type SubmissionAppealItem = {
  id: string
  status: string
  body: string
  adminReply: string | null
  createdAt: string
  reviewedAt: string | null
}

export type SubmissionRow = {
  id: string
  kind: string
  articleJournalTier: string | null
  title: string
  orgName: string
  status: string
  points: number | null
  issuedAt: string
  createdAt: string
  note: string | null
  submittedDraft: string | null
  /** Talaba kiritgan ilmiy rahbar / masʻul oʻqituvchi (ixtiyoriy) */
  scientificSupervisor: string | null
  filePath: string
  aiAssessment: string | null
  aiSuggestedPoints: number | null
  aiScore: number | null
  aiScoreUsedOpenAi: boolean
  aiLegitimacyVerdict: string | null
  aiLegitimacySummaryUz: string | null
  adminNote: string | null
  standardPoints: number
  belowStandard: boolean
  canAppeal: boolean
  /** Oxirgi avval — API `createdAt desc` */
  appeals: SubmissionAppealItem[]
}

export function submissionKindUz(kind: string, articleJournalTier?: string | null) {
  if (kind === 'ARTICLE') {
    return String(articleJournalTier ?? '').toUpperCase() === 'INTERNATIONAL'
      ? 'Ilmiy maqola (xalqaro jurnal)'
      : 'Ilmiy maqola (respublika)'
  }
  if (kind === 'CERTIFICATE') return 'Til / sertifikat'
  if (kind === 'OLYMPIAD') return 'Olimpiada'
  if (kind === 'CONFERENCE') return 'Konferensiya'
  if (kind === 'SPORT') return 'Sport yutug‘i'
  if (kind === 'STARTUP') return 'Startap gʻoyasi'
  if (kind === 'EVENT') return 'Maʼnaviy-maʼrifiy tadbir'
  if (kind === 'VOLUNTEERING') return 'Volontörlik'
  if (kind === 'SCHOLARSHIP') return 'Nomli stipendiya'
  if (kind === 'EXCELLENCE') return `A'lochi talaba`
  if (kind === 'ACHIEVEMENT') return 'Yutuq (eski)'
  return kind
}

/** Baholash yuklashidagi 10 taʼsir yoʻnalishi tartibi (maqola uchun jurnal zonasi alohida tanlanadi). */
export const STUDENT_UPLOAD_KIND_ORDER = [
  'CERTIFICATE',
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

export type StudentUploadKind = (typeof STUDENT_UPLOAD_KIND_ORDER)[number]

/** Har bir yoʻnalish uchun qisqa nizom/mezon eslatmasi (tanlashda koʻrinadi). */
export const NIZOM_DIRECTION_HINTS: Record<StudentUploadKind, { label: string; hint: string }> = {
  CERTIFICATE: {
    label: 'Til / sertifikat',
    hint: 'Rasmiy til sertifikati yoki analog hujjat. Nizom: bu yoʻnalish boʻyicha bitta materialga 1–10 ballgacha; umumiy reytingda har biri alohida koʻrinadi.',
  },
  OLYMPIAD: {
    label: 'Olimpiadadagi oʻrin',
    hint: 'Respublika/xalqaro fan olimpiadalari, oʻrin va fan nomini bayon + tasdiqlovchi fayl. Tur tanlanganda ball diapazoni nizom jadvalidagi «olimpiada» qatoriga bogʻlangan.',
  },
  CONFERENCE: {
    label: 'Konferensiya ishtiroki',
    hint: 'Ilmiy-amaliy konferensiya: tezis, maʼruzachi yoki ishtirokchi sifatida. Tashkilot va tadbir nomini yozing.',
  },
  STARTUP: {
    label: 'Startap gʻoyasi',
    hint: 'Innovatsion loyiha/startap faoliyati (texnik topshiriq, diplomi yoki boshqa rasmiy tasdiq).',
  },
  SPORT: {
    label: 'Sport yutuqi',
    hint: 'Sport musobaqalari, jamoa tarkibida yakka tartibdagi yutuq; lavozim va turnir nomini koʻrsating.',
  },
  VOLUNTEERING: {
    label: 'Volontyorlik',
    hint: 'Ijtimoiy yoki tibbiy yoʻnalishdagi volontyorlik; tashkilot va davomiylik/loyiha nomi.',
  },
  EVENT: {
    label: 'Maʼnaviy-maʼrifiy tadbir',
    hint: 'Maʼnaviy-tarbiyaviy tadbirlarda faol ishtirok (tashkilot, mavzu, rol).',
  },
  SCHOLARSHIP: {
    label: 'Nomli stipendiya',
    hint: 'Davlat yoki institut nomli stipendiyasi; beruvchi va periodni koʻrsating.',
  },
  EXCELLENCE: {
    label: `A'lochi talaba`,
    hint: `Aʼlo baho yoki "a'lochi" maqomi boʻyicha rasmiy tasdiqlovchi hujjat.`,
  },
  ARTICLE: {
    label: 'Ilmiy maqola',
    hint: 'Nashr turini pastda tanlang (respublika yoki xalqaro jurnal). Har ikkala tur ham nizom boʻyicha 1–10 ball oralig‘ida baholanadi.',
  },
}

/** Badge — asosiy matn ikkala mavzuda ham `--color-text` (ochiq fonda o‘qiladi) */
export function submissionStatusUz(status: string) {
  if (status === 'APPROVED')
    return { label: 'Tasdiqlangan', cls: 'bg-emerald-500/20 text-[var(--color-text)] ring-emerald-500/40' }
  if (status === 'REJECTED')
    return { label: 'Rad etilgan', cls: 'bg-red-500/20 text-[var(--color-text)] ring-red-400/40' }
  return { label: 'Kutilmoqda', cls: 'bg-amber-500/15 text-[var(--color-text)] ring-amber-400/35' }
}

export function submissionLegitBadge(v: string | null | undefined) {
  const s = String(v ?? '')
    .trim()
    .toUpperCase()
  if (s === 'QONUNIY')
    return { label: 'Qonuniylik: qonuniy', cls: 'bg-emerald-500/25 text-[var(--color-text)] ring-emerald-400/35' }
  if (s === 'NOQONUNIY')
    return { label: 'Qonuniylik: noqonuniy', cls: 'bg-red-500/25 text-[var(--color-text)] ring-red-400/40' }
  if (s === 'SHUBHALI')
    return { label: 'Qonuniylik: shubhali', cls: 'bg-amber-500/20 text-[var(--color-text)] ring-amber-400/35' }
  return null
}
