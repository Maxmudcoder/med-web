import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { apiUrl, fetchAuthJson } from '@/lib/api'

type GradingDefaults = {
  certificatePoints: number
  olympiadPoints: number
  conferencePoints: number
  startupPoints: number
  sportPoints: number
  eventPoints: number
  volunteeringPoints: number
  scholarshipPoints: number
  excellencePoints: number
  articleRepublicPoints: number
  articleIntlPoints: number
  maxPointsPerSubmission: number
}

type KindBand = {
  defaultPoints: number
  min: number
  max: number
  guidanceUz: string
}

/** Serverdagi gradingRubric `kinds` — 10 taʼsir yoʻnalishi (maqola: respublika + xalqaro tuzilmalari) */
const NIZOM_KIND_ORDER = [
  'CERTIFICATE',
  'OLYMPIAD',
  'CONFERENCE',
  'STARTUP',
  'SPORT',
  'VOLUNTEERING',
  'EVENT',
  'SCHOLARSHIP',
  'EXCELLENCE',
  'ARTICLE_REPUBLIC',
  'ARTICLE_INTL',
] as const

type ModerationGradingRubric = {
  version: number
  maxPointsPerSubmission: number
  summaryUz: string
  placementGuidanceUz: string
  kinds: Record<string, KindBand>
}

function normGradingDefaults(
  raw?: (Partial<GradingDefaults> & { achievementPoints?: number }) | null,
): GradingDefaults {
  return {
    certificatePoints: raw?.certificatePoints ?? 7,
    olympiadPoints: raw?.olympiadPoints ?? 7,
    conferencePoints: raw?.conferencePoints ?? 6,
    startupPoints: raw?.startupPoints ?? raw?.achievementPoints ?? 6,
    sportPoints: raw?.sportPoints ?? 6,
    eventPoints: raw?.eventPoints ?? 6,
    volunteeringPoints: raw?.volunteeringPoints ?? 6,
    scholarshipPoints: raw?.scholarshipPoints ?? 7,
    excellencePoints: raw?.excellencePoints ?? 8,
    articleRepublicPoints: raw?.articleRepublicPoints ?? 7,
    articleIntlPoints: raw?.articleIntlPoints ?? 10,
    maxPointsPerSubmission: raw?.maxPointsPerSubmission ?? 10,
  }
}

type Item = {
  id: string
  kind: string
  articleJournalTier: string | null
  title: string
  orgName: string
  issuedAt: string
  note: string | null
  submittedDraft: string | null
  scientificSupervisor: string | null
  filePath: string
  aiScore: number | null
  aiSuggestedPoints: number | null
  aiAssessment: string | null
  createdAt: string
  adminAiReviewConfirmedAt: string | null
  aiScoreUsedOpenAi: boolean
  student: { id: string; login: string; fullName: string | null }
}

function clampPct(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)))
}

function defaultPointsForKind(
  kind: string,
  g: GradingDefaults,
  articleJournalTier?: string | null,
): number {
  if (kind === 'CERTIFICATE') return g.certificatePoints
  if (kind === 'OLYMPIAD') return g.olympiadPoints
  if (kind === 'CONFERENCE') return g.conferencePoints
  if (kind === 'SPORT') return g.sportPoints
  if (kind === 'STARTUP' || kind === 'ACHIEVEMENT') return g.startupPoints
  if (kind === 'EVENT') return g.eventPoints
  if (kind === 'VOLUNTEERING') return g.volunteeringPoints
  if (kind === 'SCHOLARSHIP') return g.scholarshipPoints
  if (kind === 'EXCELLENCE') return g.excellencePoints
  if (kind === 'ARTICLE')
    return String(articleJournalTier ?? '').toUpperCase() === 'INTERNATIONAL'
      ? g.articleIntlPoints
      : g.articleRepublicPoints
  return g.startupPoints
}

function kindUz(kind: string) {
  if (kind === 'CERTIFICATE') return 'Til sertifikati'
  if (kind === 'OLYMPIAD') return 'Olimpiada oʻrni'
  if (kind === 'CONFERENCE') return 'Konferensiya ishtiroki'
  if (kind === 'STARTUP') return 'Startap gʻoyasi'
  if (kind === 'SPORT') return 'Sport yutuqi'
  if (kind === 'EVENT') return 'Maʼnaviy-maʼrifiy tadbirda ishtirok'
  if (kind === 'VOLUNTEERING') return 'Volontyorlik'
  if (kind === 'SCHOLARSHIP') return 'Nomli stipendiya'
  if (kind === 'EXCELLENCE') return `Aʼlochi talaba`
  if (kind === 'ARTICLE') return 'Ilmiy maqola'
  if (kind === 'ACHIEVEMENT') return 'Yutuq (eski)'
  return kind
}

function rubricBandLabelUz(key: string) {
  if (key === 'ARTICLE_REPUBLIC')
    return 'Ilmiy maqola — respublika jurnal (10-yoʻnalish, 1–10 ball)'
  if (key === 'ARTICLE_INTL') return 'Ilmiy maqola — xalqaro jurnal (10-yoʻnalish, 1–10 ball)'
  return kindUz(key)
}

function submissionToRubricKey(it: Pick<Item, 'kind' | 'articleJournalTier'>): string {
  if (it.kind === 'ACHIEVEMENT') return 'STARTUP'
  if (it.kind === 'ARTICLE')
    return String(it.articleJournalTier ?? '').toUpperCase() === 'INTERNATIONAL' ? 'ARTICLE_INTL' : 'ARTICLE_REPUBLIC'
  if ((NIZOM_KIND_ORDER as readonly string[]).includes(it.kind)) return it.kind
  return 'STARTUP'
}

function kindBandForRubric(
  it: Pick<Item, 'kind' | 'articleJournalTier'>,
  snap: ModerationGradingRubric,
) {
  const key = submissionToRubricKey(it)
  const b = snap.kinds[key]
  if (!b) return null
  return { ...b, cappedMax: Math.min(b.max, snap.maxPointsPerSubmission) }
}

function clampPtsForSubmission(
  raw: number,
  it: Pick<Item, 'kind' | 'articleJournalTier'>,
  snap: ModerationGradingRubric | null,
  defs: GradingDefaults,
): number {
  const rounded = Math.round(raw)
  if (!Number.isFinite(rounded)) {
    return defaultPointsForKind(it.kind, defs, it.articleJournalTier)
  }
  const band = snap ? kindBandForRubric(it, snap) : null
  const hi = band?.cappedMax ?? defs.maxPointsPerSubmission
  const lo = band ? Math.max(1, band.min) : 1
  return Math.min(hi, Math.max(lo, rounded))
}

export function AdminModerationPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [finalPtsById, setFinalPtsById] = useState<Record<string, number>>({})
  const [gptSuggestById, setGptSuggestById] = useState<Record<string, number>>({})
  const [assessmentById, setAssessmentById] = useState<Record<string, string>>({})
  const [confPctById, setConfPctById] = useState<Record<string, number>>({})
  const [dirtyById, setDirtyById] = useState<Record<string, boolean>>({})
  const [metaById, setMetaById] = useState<
    Record<string, { title: string; orgName: string; note: string }>
  >({})
  const [err, setErr] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<{ id: string; mode: 'save' | 'rescore' | 'confirm' } | null>(
    null,
  )
  const [gradingDefaults, setGradingDefaults] = useState<GradingDefaults>(() =>
    normGradingDefaults(null),
  )
  const [rubricSnap, setRubricSnap] = useState<ModerationGradingRubric | null>(null)
  const [nizomSummary, setNizomSummary] = useState('')
  const [nizomPlacement, setNizomPlacement] = useState('')
  const [gradingSaveMsg, setGradingSaveMsg] = useState('')
  const [gradingSaving, setGradingSaving] = useState(false)
  /** Serverda OPENAI_API_KEY bor — GPT ishlagan bo‘lmasa «AI tasdiq» bloklanadi */
  const [openaiConfigured, setOpenaiConfigured] = useState(true)

  const load = useCallback(async () => {
    if (!token) return
    setErr('')
    setSavedMsg('')
    const res = await fetch(apiUrl('/api/admin/moderation/pending'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = (await res.json()) as {
      items?: Item[]
      gradingDefaults?: Partial<GradingDefaults>
      gradingRubric?: ModerationGradingRubric
      openaiConfigured?: boolean
      error?: string
    }
    if (!res.ok) {
      setErr(data.error || 'Xato')
      setItems([])
      setMetaById({})
      setLoading(false)
      return
    }
    const list = data.items ?? []
    setOpenaiConfigured(data.openaiConfigured !== false)
    const defs = normGradingDefaults(data.gradingDefaults)
    setGradingDefaults(defs)
    const snap = data.gradingRubric ?? null
    setRubricSnap(snap)
    setNizomSummary(snap?.summaryUz ?? '')
    setNizomPlacement(snap?.placementGuidanceUz ?? '')
    setItems(list)
    setMetaById(
      Object.fromEntries(
        list.map((it) => [
          it.id,
          {
            title: it.title,
            orgName: it.orgName,
            note: it.note ?? '',
          },
        ]),
      ),
    )

    const gpt: Record<string, number> = {}
    const final: Record<string, number> = {}
    const asm: Record<string, string> = {}
    const conf: Record<string, number> = {}
    for (const it of list) {
      const kindDefault = defaultPointsForKind(it.kind, defs, it.articleJournalTier)
      const sug =
        typeof it.aiSuggestedPoints === 'number' && Number.isFinite(it.aiSuggestedPoints)
          ? clampPtsForSubmission(it.aiSuggestedPoints, it, snap, defs)
          : kindDefault
      gpt[it.id] = sug
      final[it.id] = sug
      asm[it.id] = it.aiAssessment ?? ''
      conf[it.id] =
        typeof it.aiScore === 'number' && Number.isFinite(it.aiScore)
          ? clampPct(it.aiScore * 100)
          : clampPct(62)
    }
    setGptSuggestById(gpt)
    setFinalPtsById(final)
    setAssessmentById(asm)
    setConfPctById(conf)
    setDirtyById(Object.fromEntries(list.map((i) => [i.id, false])))
    setLoading(false)
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  function markDirty(id: string) {
    setDirtyById((prev) => ({ ...prev, [id]: true }))
    setSavedMsg('')
  }

  async function saveAiDraft(id: string) {
    if (!token) return
    const it = items.find((x) => x.id === id)
    if (!it) return
    setBusyId({ id, mode: 'save' })
    setErr('')
    try {
      const meta = metaById[id] ?? {
        title: it.title,
        orgName: it.orgName,
        note: it.note ?? '',
      }
      const res = await fetch(apiUrl(`/api/admin/moderation/${id}`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiSuggestedPoints: (() => {
            const row = items.find((x) => x.id === id)
            if (!row) return 0
            const sug =
              gptSuggestById[id] ??
              defaultPointsForKind(row.kind, gradingDefaults, row.articleJournalTier)
            return clampPtsForSubmission(sug, row, rubricSnap, gradingDefaults)
          })(),
          aiAssessment: assessmentById[id] ?? '',
          aiScore: Math.min(1, Math.max(0, (confPctById[id] ?? 0) / 100)),
          title: meta.title.trim().slice(0, 240),
          orgName: meta.orgName.trim().slice(0, 240),
          note: meta.note.trim() ? meta.note.trim().slice(0, 7900) : null,
        }),
      })
      const d = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(d.error || 'Saqlash muvaffaqiyatsiz')
      setSavedMsg('O‘zgarishlar saqlandi.')
      setDirtyById((prev) => ({ ...prev, [id]: false }))
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setBusyId(null)
    }
  }

  async function confirmAiReview(id: string) {
    if (!token) return
    const row = items.find((x) => x.id === id)
    if (openaiConfigured && row && !row.aiScoreUsedOpenAi) {
      setErr(
        'Avval «AI qayta hisoblash» bosing — serverda GPT kaliti bor, taxminiy tavsiyani tasdiqlab boʻlmaydi.',
      )
      return
    }
    if (dirtyById[id]) {
      setErr('Avval «Saqlash» — keyin AI tasdiqlanadi.')
      return
    }
    setBusyId({ id, mode: 'confirm' })
    setErr('')
    try {
      const res = await fetch(apiUrl(`/api/admin/moderation/${id}/confirm-ai-review`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(d.error || 'Tasdiqlash muvaffaqiyatsiz')
      setSavedMsg('AI tavsiyasi moderator tomonidan tasdiqlandi — endi yakuniy ball qo‘yishingiz mumkin.')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setBusyId(null)
    }
  }

  async function aiRescore(id: string) {
    if (!token) return
    if (!window.confirm('AI yana bir bor hisoblash? Mavjud tavsiya matni almashtiriladi (saqlamasdan).'))
      return
    setBusyId({ id, mode: 'rescore' })
    setErr('')
    try {
      const res = await fetch(apiUrl(`/api/admin/moderation/${id}/ai-rescore`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(d.error || 'Hisoblash xato')
      setSavedMsg('AI qayta hisoblandi — joylashtirish yangilandi.')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setBusyId(null)
    }
  }

  async function approve(id: string) {
    if (!token) return
    if (dirtyById[id]) {
      setErr('Avval AI tavsiyasi blokini «Saqlash» qiling.')
      return
    }
    const row = items.find((x) => x.id === id)
    if (!row) return
    const rawPts =
      finalPtsById[id] ??
      gptSuggestById[id] ??
      defaultPointsForKind(row.kind, gradingDefaults, row.articleJournalTier)
    const pts = clampPtsForSubmission(rawPts, row, rubricSnap, gradingDefaults)
    const res = await fetch(apiUrl(`/api/admin/moderation/${id}/approve`), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ points: pts }),
    })
    if (!res.ok) {
      const d = (await res.json()) as { error?: string }
      setErr(d.error || 'Xato')
      return
    }
    void load()
  }

  async function reject(id: string) {
    const note = window.prompt('Rad etish sababi (majburiy)')
    if (!note?.trim() || !token) return
    const res = await fetch(apiUrl(`/api/admin/moderation/${id}/reject`), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adminNote: note.trim() }),
    })
    if (!res.ok) {
      const d = (await res.json()) as { error?: string }
      setErr(d.error || 'Xato')
      return
    }
    void load()
  }

  async function saveGradingDefaults() {
    if (!token) return
    setGradingSaving(true)
    setGradingSaveMsg('')
    setErr('')
    try {
      await fetchAuthJson<unknown>('/api/admin/site-config', token, {
        method: 'PATCH',
        body: JSON.stringify({
          gradingCertificatePoints: gradingDefaults.certificatePoints,
          gradingOlympiadPoints: gradingDefaults.olympiadPoints,
          gradingConferencePoints: gradingDefaults.conferencePoints,
          gradingStartupPoints: gradingDefaults.startupPoints,
          gradingSportPoints: gradingDefaults.sportPoints,
          gradingEventPoints: gradingDefaults.eventPoints,
          gradingVolunteeringPoints: gradingDefaults.volunteeringPoints,
          gradingScholarshipPoints: gradingDefaults.scholarshipPoints,
          gradingExcellencePoints: gradingDefaults.excellencePoints,
          gradingArticleRepublicPoints: gradingDefaults.articleRepublicPoints,
          gradingArticleIntlPoints: gradingDefaults.articleIntlPoints,
          gradingMaxPointsPerSubmission: gradingDefaults.maxPointsPerSubmission,
          gradingRubricSummaryUz: nizomSummary,
          gradingRubricPlacementUz: nizomPlacement,
        }),
      })
      setGradingSaveMsg('Boshlang‘ich ball saqlandi.')
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setGradingSaving(false)
    }
  }

  if (loading) {
    return <p className="text-[var(--color-text-muted)]">Yuklanmoqda…</p>
  }

  return (
    <div className="admin-moderation-page min-w-0 max-w-full">
      <h1 className="mb-2 font-display text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
        Baholash
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
        <strong className="text-[var(--color-text)]">1)</strong> Talaba materiallari va AI tahlili — tahrir,
        <strong className="text-[var(--color-text)]"> «Saqlash»</strong>.{' '}
        <strong className="text-[var(--color-text)]">2)</strong> «AI tavsiyasini tasdiqlash» (moderator roziligi).{' '}
        <strong className="text-[var(--color-text)]">3)</strong> Yakuniy ball va «Tasdiqlash» — reytingga qo‘shiladi.
        Tasdiqdan keyin tizim talabaga material bo‘yicha qisqa qonuniylik xulosasini shakllantiradi (GPT yoqilgan
        bo‘lsa).
        <span className="mt-2 block text-sm">
          <strong className="text-[var(--color-text)]">Rasmiy mezon:</strong>{' '}
          har bir taʼsir yoʻnalishidagi bitta tasdiqlangan material uchun maksimal <strong>10 ball</strong>; talaba umumiy
          reytingi oʻn yoʻnalish yig‘indisi sifatida <strong>100 ballgacha</strong>. Bitta yuklangan material faqat bitta tur
          bilan baholanadi. Shaxsiy kabinet (pasport, obyektivka) toʻldirilishi taʼlim muassasasi talablariga
          qoldiriladi — tizim yuklamani avvalo majburiy toʻxtatmaydi; kerak boʻlsa moderator talaba kabinetini qoʻlda
          tekshirish mumkin.
        </span>
      </p>
      {err ? <p className="mb-4 text-[var(--color-danger)]">{err}</p> : null}
      {savedMsg ? <p className="mb-4 text-sm text-teal-300">{savedMsg}</p> : null}
      <section
        className="mb-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/85 p-4 sm:p-5"
        aria-labelledby="moderation-default-pts-heading"
      >
        <h2 id="moderation-default-pts-heading" className="font-display text-sm font-bold text-[var(--color-text)]">
          Nizom: boshlang‘ich ballar va yuqori cheklov
        </h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Bitta tasdiqlangan materiāl uchun yakuniy ball 1–{gradingDefaults.maxPointsPerSubmission} oralig‘ida. Tur
          bo‘yicha AI tavsiyasi qoʻllanmagan boʻlsa, shu yerda turga mos tayanch ishlatiladi.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Til sertifikati (CERTIFICATE)
            </label>
            <input
              type="number"
              min={1}
              max={gradingDefaults.maxPointsPerSubmission}
              value={gradingDefaults.certificatePoints}
              onChange={(e) =>
                setGradingDefaults((g) => ({
                  ...g,
                  certificatePoints: Math.min(
                    g.maxPointsPerSubmission,
                    Math.max(1, Math.round(Number(e.target.value) || 1)),
                  ),
                }))
              }
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 tabular-nums text-sm text-[var(--color-text)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Olimpiadalar (OLYMPIAD)
            </label>
            <input
              type="number"
              min={1}
              max={gradingDefaults.maxPointsPerSubmission}
              value={gradingDefaults.olympiadPoints}
              onChange={(e) =>
                setGradingDefaults((g) => ({
                  ...g,
                  olympiadPoints: Math.min(
                    g.maxPointsPerSubmission,
                    Math.max(1, Math.round(Number(e.target.value) || 1)),
                  ),
                }))
              }
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 tabular-nums text-sm text-[var(--color-text)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Konferensiya (CONFERENCE)
            </label>
            <input
              type="number"
              min={1}
              max={gradingDefaults.maxPointsPerSubmission}
              value={gradingDefaults.conferencePoints}
              onChange={(e) =>
                setGradingDefaults((g) => ({
                  ...g,
                  conferencePoints: Math.min(
                    g.maxPointsPerSubmission,
                    Math.max(1, Math.round(Number(e.target.value) || 1)),
                  ),
                }))
              }
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 tabular-nums text-sm text-[var(--color-text)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Startap loyihalar (STARTUP)
            </label>
            <input
              type="number"
              min={1}
              max={gradingDefaults.maxPointsPerSubmission}
              value={gradingDefaults.startupPoints}
              onChange={(e) =>
                setGradingDefaults((g) => ({
                  ...g,
                  startupPoints: Math.min(
                    g.maxPointsPerSubmission,
                    Math.max(1, Math.round(Number(e.target.value) || 1)),
                  ),
                }))
              }
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 tabular-nums text-sm text-[var(--color-text)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Sport yutuqlari (SPORT)
            </label>
            <input
              type="number"
              min={1}
              max={gradingDefaults.maxPointsPerSubmission}
              value={gradingDefaults.sportPoints}
              onChange={(e) =>
                setGradingDefaults((g) => ({
                  ...g,
                  sportPoints: Math.min(
                    g.maxPointsPerSubmission,
                    Math.max(1, Math.round(Number(e.target.value) || 1)),
                  ),
                }))
              }
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 tabular-nums text-sm text-[var(--color-text)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Maʼnaviy-maʼrifiy tadbir (EVENT)
            </label>
            <input
              type="number"
              min={1}
              max={gradingDefaults.maxPointsPerSubmission}
              value={gradingDefaults.eventPoints}
              onChange={(e) =>
                setGradingDefaults((g) => ({
                  ...g,
                  eventPoints: Math.min(
                    g.maxPointsPerSubmission,
                    Math.max(1, Math.round(Number(e.target.value) || 1)),
                  ),
                }))
              }
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 tabular-nums text-sm text-[var(--color-text)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Volontyorlik (VOLUNTEERING)
            </label>
            <input
              type="number"
              min={1}
              max={gradingDefaults.maxPointsPerSubmission}
              value={gradingDefaults.volunteeringPoints}
              onChange={(e) =>
                setGradingDefaults((g) => ({
                  ...g,
                  volunteeringPoints: Math.min(
                    g.maxPointsPerSubmission,
                    Math.max(1, Math.round(Number(e.target.value) || 1)),
                  ),
                }))
              }
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 tabular-nums text-sm text-[var(--color-text)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Nomli stipendiya (SCHOLARSHIP)
            </label>
            <input
              type="number"
              min={1}
              max={gradingDefaults.maxPointsPerSubmission}
              value={gradingDefaults.scholarshipPoints}
              onChange={(e) =>
                setGradingDefaults((g) => ({
                  ...g,
                  scholarshipPoints: Math.min(
                    g.maxPointsPerSubmission,
                    Math.max(1, Math.round(Number(e.target.value) || 1)),
                  ),
                }))
              }
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 tabular-nums text-sm text-[var(--color-text)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Aʼlochi talaba (EXCELLENCE)
            </label>
            <input
              type="number"
              min={1}
              max={gradingDefaults.maxPointsPerSubmission}
              value={gradingDefaults.excellencePoints}
              onChange={(e) =>
                setGradingDefaults((g) => ({
                  ...g,
                  excellencePoints: Math.min(
                    g.maxPointsPerSubmission,
                    Math.max(1, Math.round(Number(e.target.value) || 1)),
                  ),
                }))
              }
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 tabular-nums text-sm text-[var(--color-text)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              10-chi yoʻnalish — ilmiy maqola, xalqaro jurnal tayanchi (ARTICLE_INTL; respublika ham 1–10 ball)
            </label>
            <input
              type="number"
              min={1}
              max={gradingDefaults.maxPointsPerSubmission}
              value={gradingDefaults.articleIntlPoints}
              onChange={(e) =>
                setGradingDefaults((g) => ({
                  ...g,
                  articleIntlPoints: Math.min(
                    g.maxPointsPerSubmission,
                    Math.max(1, Math.round(Number(e.target.value) || 1)),
                  ),
                }))
              }
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 tabular-nums text-sm text-[var(--color-text)]"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Bitta material uchun yuqori cheklov (nizom: har bir yoʻnalish 10 ballgacha)
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={gradingDefaults.maxPointsPerSubmission}
            onChange={(e) =>
              setGradingDefaults((g) => ({
                ...g,
                maxPointsPerSubmission: Math.min(10, Math.max(1, Math.round(Number(e.target.value) || 10))),
              }))
            }
            className="w-full max-w-xs rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 tabular-nums text-sm text-[var(--color-text)]"
          />
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            Yangi nizom: har bir 10 taʼsir yoʻnalishi boʻyicha bitta tasdiqlangan material maksimal 10 ball. Jami reyting
            teorik maksimumi 100 ball.
          </p>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Nizom · qisqa xulosasi (talabalar va GPT uchun asos)
            <textarea
              rows={4}
              value={nizomSummary}
              onChange={(e) => setNizomSummary(e.target.value)}
              className="mt-1 w-full resize-y rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
            />
          </label>
          <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Ichki tadbirda o‘rin / bosqich (GPT ga ko‘rsatma)
            <textarea
              rows={4}
              value={nizomPlacement}
              onChange={(e) => setNizomPlacement(e.target.value)}
              className="mt-1 w-full resize-y rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
            />
          </label>
        </div>
        {rubricSnap ? (
          <details className="mt-4 rounded-xl border border-teal-500/25 bg-teal-500/5 px-3 py-2 text-xs text-[var(--color-text-muted)]">
            <summary className="cursor-pointer font-semibold text-teal-200">
              Tur bo‘yicha min/max diapazonlar (tizim nusxasi)
            </summary>
            <ul className="mt-2 space-y-1.5 pl-3 leading-relaxed">
              {NIZOM_KIND_ORDER.filter((k) => k !== 'ARTICLE_INTL').map((key) => {
                if (key === 'ARTICLE_REPUBLIC') {
                  const rep = rubricSnap.kinds.ARTICLE_REPUBLIC
                  const intl = rubricSnap.kinds.ARTICLE_INTL
                  if (!rep || !intl) return null
                  const hiR = Math.min(rep.max, rubricSnap.maxPointsPerSubmission)
                  const hiI = Math.min(intl.max, rubricSnap.maxPointsPerSubmission)
                  return (
                    <li key="ARTICLE">
                      <span className="font-medium text-[var(--color-text)]">
                        10. Ilmiy maqola (respublika / xalqaro)
                      </span>{' '}
                      — respublika: tayanch <span className="tabular-nums">{rep.defaultPoints}</span>, diapazon{' '}
                      {rep.min}…{hiR} bp; xalqaro: tayanch <span className="tabular-nums">{intl.defaultPoints}</span>,
                      diapazon {intl.min}…{hiI} bp.
                    </li>
                  )
                }
                const kk = rubricSnap.kinds[key]
                if (!kk) return null
                const hi = Math.min(kk.max, rubricSnap.maxPointsPerSubmission)
                return (
                  <li key={key}>
                    <span className="font-medium text-[var(--color-text)]">{rubricBandLabelUz(key)}</span>{' '}
                    <span className="font-mono opacity-85">({key})</span> — tayanch{' '}
                    <span className="tabular-nums">{kk.defaultPoints}</span>, diapazon {kk.min}…{hi} bp (AI va moderator).
                  </li>
                )
              })}
            </ul>
          </details>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={gradingSaving || !token}
            onClick={() => void saveGradingDefaults()}
            className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-45"
          >
            {gradingSaving ? 'Saqlanmoqda…' : 'Nizomni saqlash'}
          </button>
          {gradingSaveMsg ? <span className="text-xs text-teal-300">{gradingSaveMsg}</span> : null}
        </div>
      </section>
      {items.length > 0 ? (
        <ul className="space-y-6">
          {items.map((it) => {
            const basePts = defaultPointsForKind(it.kind, gradingDefaults, it.articleJournalTier)
            const band =
              rubricSnap != null ? kindBandForRubric(it, rubricSnap) : null
            const ptsCap = band?.cappedMax ?? gradingDefaults.maxPointsPerSubmission
            return (
            <li
              key={it.id}
              className="max-w-full overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-[0_8px_30px_-8px_rgba(0,0,0,0.35)] ring-1 ring-white/5"
            >
              <div className="grid min-w-0 gap-0 lg:grid-cols-3 lg:divide-x lg:divide-[var(--color-border-subtle)]">
                <div className="min-w-0 p-4 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Material va talaba · tizim
                  </p>
                  <p className="mt-2 font-semibold break-words text-[var(--color-text)]">
                    {it.student.fullName || it.student.login}
                  </p>
                  <div className="mt-2 space-y-1.5 text-xs text-[var(--color-text-muted)]">
                    <p className="break-words">
                      <span className="font-medium text-[var(--color-text)]">{kindUz(it.kind)}</span>
                      <span className="font-medium text-[var(--color-accent-strong)]">
                        {' '}
                        · tayanch {basePts} bp
                        {band
                          ? ` (nizom: ${band.min}…${band.cappedMax} bp; bitta material ≤${gradingDefaults.maxPointsPerSubmission})`
                          : ''}
                      </span>
                    </p>
                    <p>
                      Berilgan:{' '}
                      {new Date(it.issuedAt).toLocaleDateString('uz-UZ', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="break-all sm:break-words">
                      Yuklangan:{' '}
                      {new Date(it.createdAt).toLocaleString('uz-UZ', {
                        hour12: false,
                      })}
                    </p>
                  </div>
                  {it.submittedDraft?.trim() ? (
                    <details className="mt-3 rounded-xl border border-amber-600/35 bg-[var(--color-bg-deep)]/75 px-3 py-2 dark:border-amber-400/30 dark:bg-amber-950/25">
                      <summary className="cursor-pointer text-xs font-semibold text-[var(--color-text)]">
                        Talaba yuborgan asl bayon
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
                        {it.submittedDraft.trim()}
                      </p>
                    </details>
                  ) : null}
                  {it.scientificSupervisor?.trim() ? (
                    <p className="mt-3 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-sm text-[var(--color-text)]">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        Ilmiy rahbar (talaba)
                      </span>
                      <span className="mt-1 block break-words">{it.scientificSupervisor.trim()}</span>
                    </p>
                  ) : null}
                  <div className="mt-4 space-y-2">
                    <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                      Moderator tuzatilgan sarlavha
                      <input
                        type="text"
                        value={metaById[it.id]?.title ?? it.title}
                        onChange={(e) => {
                          setMetaById((prev) => ({
                            ...prev,
                            [it.id]: {
                              title: e.target.value,
                              orgName: prev[it.id]?.orgName ?? it.orgName,
                              note: prev[it.id]?.note ?? (it.note ?? ''),
                            },
                          }))
                          markDirty(it.id)
                        }}
                        className="mt-1 w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
                      />
                    </label>
                    <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                      Tashkilot nomi
                      <input
                        type="text"
                        value={metaById[it.id]?.orgName ?? it.orgName}
                        onChange={(e) => {
                          setMetaById((prev) => ({
                            ...prev,
                            [it.id]: {
                              title: prev[it.id]?.title ?? it.title,
                              orgName: e.target.value,
                              note: prev[it.id]?.note ?? (it.note ?? ''),
                            },
                          }))
                          markDirty(it.id)
                        }}
                        className="mt-1 w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
                      />
                    </label>
                    <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                      Rasmiy izoh (reyting kartalariga chiqishi mumkin)
                      <textarea
                        rows={4}
                        value={metaById[it.id]?.note ?? it.note ?? ''}
                        onChange={(e) => {
                          setMetaById((prev) => ({
                            ...prev,
                            [it.id]: {
                              title: prev[it.id]?.title ?? it.title,
                              orgName: prev[it.id]?.orgName ?? it.orgName,
                              note: e.target.value,
                            },
                          }))
                          markDirty(it.id)
                        }}
                        className="mt-1 w-full resize-y rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
                      />
                    </label>
                  </div>
                  <a
                    href={it.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline"
                  >
                    Faylni ochish
                  </a>
                </div>

                <div className="admin-mod-ai-col min-w-0 border-y p-4 sm:p-5 lg:border-y-0 lg:border-l lg:border-[var(--color-border-subtle)]">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text)]">
                    AI tavsiyasi (tahrirlanadi va saqlanadi)
                  </p>
                  {!it.aiScoreUsedOpenAi ? (
                    <p className="mt-2 rounded-lg border border-amber-600/40 bg-[var(--color-bg-deep)]/80 px-3 py-2 text-xs text-[var(--color-text)] dark:border-amber-400/40 dark:bg-amber-950/30">
                      <strong className="text-[var(--color-text)]">GPT ball tahlili hali haqiqiy emas</strong> (kalit yoʻq, xato
                      yoki eski yuklama). OPENAI_API_KEY ni tekshirib, «AI qayta hisoblash» ni bosing — keyin moderator
                      AI qadamini tasdiqlashi mumkin.
                    </p>
                  ) : null}
                  <div className="mt-4 space-y-3">
                    <label className="block text-xs text-[var(--color-text-muted)]">
                      AI tavsiya balli (nizom: 1…{ptsCap})
                      <input
                        type="number"
                        min={1}
                        max={ptsCap}
                        value={gptSuggestById[it.id] ?? basePts}
                        onChange={(e) => {
                          const n = Number(e.target.value)
                          if (!Number.isFinite(n)) return
                          setGptSuggestById((prev) => ({
                            ...prev,
                            [it.id]: clampPtsForSubmission(n, it, rubricSnap, gradingDefaults),
                          }))
                          markDirty(it.id)
                        }}
                        className="mt-1 w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-2 py-1.5 text-sm text-[var(--color-text)]"
                      />
                    </label>
                    <label className="block text-xs text-[var(--color-text-muted)]">
                      Ishonch, % (model)
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={confPctById[it.id] ?? ''}
                        onChange={(e) => {
                          const n = Number(e.target.value)
                          if (!Number.isFinite(n)) return
                          setConfPctById((prev) => ({
                            ...prev,
                            [it.id]: clampPct(n),
                          }))
                          markDirty(it.id)
                        }}
                        className="mt-1 w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-2 py-1.5 text-sm text-[var(--color-text)]"
                      />
                    </label>
                    <label className="block text-xs text-[var(--color-text-muted)]">
                      Baholash matni / tahlil
                      <textarea
                        value={assessmentById[it.id] ?? ''}
                        onChange={(e) => {
                          setAssessmentById((prev) => ({ ...prev, [it.id]: e.target.value }))
                          markDirty(it.id)
                        }}
                        rows={6}
                        className="mt-1 max-h-[min(18rem,50vh)] w-full resize-y overflow-y-auto rounded-lg border border-violet-500/40 bg-[var(--color-bg-deep)] pr-10 pl-3 py-2 text-sm leading-relaxed text-[var(--color-text)] [scrollbar-color:rgba(139,92,246,0.35)_transparent] [scrollbar-width:thin] placeholder:text-[var(--color-text-muted)]"
                      />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={Boolean(busyId)}
                      onClick={() => void saveAiDraft(it.id)}
                      className="min-h-[44px] flex-1 rounded-xl bg-teal-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40 sm:flex-none sm:px-4"
                    >
                      {busyId?.id === it.id && busyId.mode === 'save'
                        ? 'Saqlanmoqda…'
                        : dirtyById[it.id]
                          ? 'Saqlash · o‘zgardi'
                          : 'Saqlash'}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(busyId)}
                      onClick={() => void aiRescore(it.id)}
                      className="mod-ai-outline-btn min-h-[44px] flex-1 rounded-xl border-2 border-violet-500/50 bg-violet-900/20 px-3 py-2.5 text-sm font-semibold text-violet-200 transition hover:border-violet-400 hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:border-[var(--color-border-subtle)] disabled:bg-transparent disabled:opacity-45 disabled:text-[var(--color-text-muted)] sm:flex-none sm:px-4"
                    >
                      {busyId?.id === it.id && busyId.mode === 'rescore'
                        ? 'Hisoblanmoqda…'
                        : 'AI qayta hisoblash'}
                    </button>
                  </div>
                  <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text)]">
                      2 · AI tavsiyasini tasdiqlash
                    </p>
                    {it.adminAiReviewConfirmedAt ? (
                      <p className="mt-2 text-xs font-medium text-teal-300">
                        Moderator tasdiqi:{' '}
                        {new Date(it.adminAiReviewConfirmedAt).toLocaleString('uz-UZ', { hour12: false })}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                        Avval yuqoridagi o‘zgarishlarni «Saqlash», so‘ng bu tugmani bosing. AI qayta hisoblangan bo‘lsa,
                        qayta tasdiqlash kerak.
                        {openaiConfigured && !it.aiScoreUsedOpenAi ? (
                          <span className="mt-1 block font-medium text-amber-200/90">
                            Serverda GPT kaliti yoqilgan — tasdiqlash uchun avval «AI qayta hisoblash» orqali haqiqiy
                            GPT tahlilini oling.
                          </span>
                        ) : null}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={
                        Boolean(busyId) ||
                        Boolean(dirtyById[it.id]) ||
                        Boolean(it.adminAiReviewConfirmedAt) ||
                        (openaiConfigured && !it.aiScoreUsedOpenAi)
                      }
                      onClick={() => void confirmAiReview(it.id)}
                      className="mt-3 w-full min-h-[44px] rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-950/40 transition hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:bg-slate-600/80 disabled:text-white/90 disabled:shadow-none"
                    >
                      {busyId?.id === it.id && busyId.mode === 'confirm'
                        ? 'Tasdiqlanmoqda…'
                        : it.adminAiReviewConfirmedAt
                          ? 'Tasdiqlangan ✓'
                          : it.aiScoreUsedOpenAi === false
                            ? 'AI tavsiyasini tasdiqlash (avval GPT hisoblash)'
                            : 'AI tavsiyasini tasdiqlayman'}
                    </button>
                  </div>
                </div>

                <div className="admin-mod-final-col flex min-w-0 flex-col justify-between gap-4 border-t border-[var(--color-border-subtle)] p-4 sm:border-t-0 sm:p-5 lg:border-l lg:border-t-0">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Admin yakuniy balli
                    </p>
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                      Reytingga qoʻshiladi. Bosqichlar: saqlangan AI → moderator tasdiqi (orta ustun) → yakuniy ball.
                      {!(dirtyById[it.id] ?? false) && it.adminAiReviewConfirmedAt
                        ? ' Tayyor — tasdiqlash mumkin.'
                        : !(dirtyById[it.id] ?? false) && !it.adminAiReviewConfirmedAt
                          ? ' Avval AI tavsiyasini tasdiqlang.'
                          : ' Avval «Saqlash».'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-[var(--color-text-muted)] sm:min-w-[6rem]">
                      <span>Yakuniy ball</span>
                      <input
                        type="number"
                        min={1}
                        max={ptsCap}
                        value={finalPtsById[it.id] ?? gptSuggestById[it.id] ?? basePts}
                        onChange={(e) => {
                          const n = Number(e.target.value)
                          if (!Number.isFinite(n)) return
                          setFinalPtsById((prev) => ({
                            ...prev,
                            [it.id]: clampPtsForSubmission(n, it, rubricSnap, gradingDefaults),
                          }))
                        }}
                        className="w-full min-w-[5.5rem] rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-2 py-1.5 text-sm text-[var(--color-text)]"
                      />
                    </label>
                    <button
                      type="button"
                      className="min-h-[44px] shrink-0 self-start text-left text-xs font-medium text-teal-400 underline-offset-2 hover:underline sm:min-h-0 sm:self-end sm:pb-2"
                      onClick={() => {
                        setFinalPtsById((prev) => ({
                          ...prev,
                          [it.id]: gptSuggestById[it.id] ?? basePts,
                        }))
                      }}
                    >
                      AI tavsiyasiga moslash
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      disabled={Boolean(dirtyById[it.id]) || !it.adminAiReviewConfirmedAt}
                      onClick={() => void approve(it.id)}
                      className="min-h-[44px] w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-950/30 transition hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:shadow-none sm:w-auto"
                    >
                      Tasdiqlash (ball qo‘shish)
                    </button>
                    <button
                      type="button"
                      onClick={() => void reject(it.id)}
                      className="min-h-[44px] w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-950/25 transition hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 sm:w-auto"
                    >
                      Rad etish
                    </button>
                  </div>
                </div>
              </div>
            </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
