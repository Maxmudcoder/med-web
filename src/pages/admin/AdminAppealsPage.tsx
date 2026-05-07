import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAuthJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { MAX_APPEALS_PER_SUBMISSION } from '@/student/studentSubmissionUi'

type GradingDefaults = {
  certificatePoints: number
  olympiadPoints: number
  startupPoints: number
  sportPoints: number
  eventPoints: number
  volunteeringPoints: number
  maxPointsPerSubmission: number
  achievementPoints?: number
}

type AppealRow = {
  id: string
  status: string
  body: string
  adminReply: string | null
  createdAt: string
  reviewedAt: string | null
  standardPoints: number
  submission: {
    id: string
    kind: string
    articleJournalTier: string | null
    title: string
    orgName: string
    points: number | null
    status: string
  }
  student: {
    id: string
    login: string
    fullName: string | null
    groupName: string | null
  }
}

function normAppealGrading(raw: unknown): GradingDefaults | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Partial<GradingDefaults> & { achievementPoints?: number }
  const startup = r.startupPoints ?? r.achievementPoints ?? 34
  return {
    certificatePoints: r.certificatePoints ?? 26,
    olympiadPoints: r.olympiadPoints ?? 48,
    startupPoints: startup,
    sportPoints: r.sportPoints ?? 32,
    eventPoints: r.eventPoints ?? 28,
    volunteeringPoints: r.volunteeringPoints ?? 22,
    maxPointsPerSubmission: r.maxPointsPerSubmission ?? 100,
  }
}

function kindUz(kind: string, articleTier?: string | null) {
  if (kind === 'ARTICLE')
    return String(articleTier ?? '').toUpperCase() === 'INTERNATIONAL' ? 'Maqola (xalqaro)' : 'Maqola (respublika)'
  if (kind === 'CERTIFICATE') return 'Til sertifikati'
  if (kind === 'OLYMPIAD') return 'Olimpiada'
  if (kind === 'CONFERENCE') return 'Konferensiya'
  if (kind === 'SPORT') return 'Sport'
  if (kind === 'STARTUP') return 'Startap'
  if (kind === 'EVENT') return 'Maʼrifiy tadbir'
  if (kind === 'VOLUNTEERING') return 'Volontyorlik'
  if (kind === 'SCHOLARSHIP') return 'Stipendiya'
  if (kind === 'EXCELLENCE') return `A'lochi talaba`
  if (kind === 'ACHIEVEMENT') return 'Yutuq (eski)'
  return kind
}

export function AdminAppealsPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<AppealRow[]>([])
  const [gradingDefaults, setGradingDefaults] = useState<GradingDefaults | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    if (!token) return
    setErr('')
    try {
      const data = await fetchAuthJson<{ items: AppealRow[]; gradingDefaults: GradingDefaults }>(
        '/api/admin/moderation/appeals',
        token,
      )
      setItems(data.items)
      setGradingDefaults(normAppealGrading(data.gradingDefaults))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  async function submitReply(id: string) {
    if (!token) return
    const text = (replyDraft[id] ?? '').trim()
    if (!text) {
      setErr('Javob matnini kiriting.')
      return
    }
    setBusyId(id)
    setErr('')
    try {
      await fetchAuthJson(`/api/admin/moderation/appeals/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ adminReply: text }),
      })
      setReplyDraft((p) => {
        const next = { ...p }
        delete next[id]
        return next
      })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setBusyId(null)
    }
  }

  const pending = items.filter((a) => a.status === 'PENDING')
  const done = items.filter((a) => a.status !== 'PENDING')

  if (loading) {
    return <p className="text-[var(--color-text-muted)]">Yuklanmoqda…</p>
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-[var(--color-text)]">
        Ball shikoyatlari
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-[var(--color-text-muted)]">
        Talabalar tasdiqlangan material uchun yuborgan yakuniy ball haqidagi shikoyatlar (bir material uchun alohida{' '}
        <span className="tabular-nums text-[var(--color-text)]">{MAX_APPEALS_PER_SUBMISSION}</span> tagacha yozuv boʻlishi
        mumkin). Har bir qator uchun alohida javob yoziladi; javob chiqgach talabaga bildirishnoma boradi.
        {gradingDefaults ? (
          <>
            {' '}
            Tayanch (6 yoʻnalish): sertifikat —{' '}
            <span className="tabular-nums text-[var(--color-text)]">{gradingDefaults.certificatePoints}</span>, olimpiada —{' '}
            <span className="tabular-nums text-[var(--color-text)]">{gradingDefaults.olympiadPoints}</span>, startap —{' '}
            <span className="tabular-nums text-[var(--color-text)]">{gradingDefaults.startupPoints}</span>, sport —{' '}
            <span className="tabular-nums text-[var(--color-text)]">{gradingDefaults.sportPoints}</span>, tadbir —{' '}
            <span className="tabular-nums text-[var(--color-text)]">{gradingDefaults.eventPoints}</span>, volontyorlik —{' '}
            <span className="tabular-nums text-[var(--color-text)]">{gradingDefaults.volunteeringPoints}</span>. Bitta
            material uchun yakuniy yuqori cheklov —{' '}
            <span className="tabular-nums text-[var(--color-text)]">{gradingDefaults.maxPointsPerSubmission}</span>.
          </>
        ) : null}
      </p>

      {err ? (
        <div className="mb-4 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Navbatda ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/60 px-4 py-6 text-sm text-[var(--color-text-muted)]">
            Hozircha ochiq shikoyat yo‘q.
          </p>
        ) : null}
        {pending.map((a) => (
          <div
            key={a.id}
            className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-5 shadow-lg"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-[var(--color-text)]">
                {a.student.fullName || a.student.login}
                {a.student.groupName ? (
                  <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
                    ({a.student.groupName})
                  </span>
                ) : null}
              </p>
              <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-[var(--color-text)]">
                Kutilmoqda
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              <span className="text-[var(--color-text)]">
                {kindUz(a.submission.kind, a.submission.articleJournalTier)}
              </span>{' '}
              ·{' '}
              {a.submission.title} · {a.submission.orgName}
            </p>
            <p className="mt-2 text-sm tabular-nums text-teal-300">
              Berilgan ball:{' '}
              <strong className="text-[var(--color-text)]">{a.submission.points ?? '—'}</strong>
              {' · '}
              Standart:{' '}
              <strong className="text-[var(--color-text)]">{a.standardPoints}</strong>
            </p>
            <div className="mt-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                Talaba shikoyati
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
                {a.body}
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <label className="block text-xs font-medium text-[var(--color-text-muted)]">
                Administrator javobi (talabaga boradi)
                <textarea
                  rows={4}
                  value={replyDraft[a.id] ?? ''}
                  onChange={(e) =>
                    setReplyDraft((p) => ({
                      ...p,
                      [a.id]: e.target.value,
                    }))
                  }
                  className="mt-1 w-full resize-y rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
                  placeholder="Qisqa va aniq yozing…"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => void submitReply(a.id)}
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
                >
                  {busyId === a.id ? 'Yuborilmoqda…' : 'Javob yuborish'}
                </button>
                <Link
                  to={`/admin/baholash`}
                  className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition hover:border-teal-500/40 hover:text-teal-300"
                >
                  Baholashga
                </Link>
              </div>
            </div>
          </div>
        ))}
      </section>

      {done.length > 0 ? (
        <section className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Yopilgan ({done.length})
          </h2>
          <ul className="space-y-3">
            {done.map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border border-[var(--color-border-subtle)]/80 bg-[var(--color-bg-card)]/50 px-4 py-3 text-sm"
              >
                <p className="font-medium text-[var(--color-text)]">
                  {a.student.fullName || a.student.login} — {a.submission.title}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {new Date(a.reviewedAt ?? a.createdAt).toLocaleString('uz-UZ')}
                </p>
                {a.adminReply ? (
                  <p className="mt-2 whitespace-pre-wrap text-[var(--color-text-muted)]">
                    {a.adminReply}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
