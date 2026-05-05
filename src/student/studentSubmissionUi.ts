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
