import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAuthJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import {
  MAX_APPEALS_PER_SUBMISSION,
  type SubmissionAppealItem,
  type SubmissionRow,
  submissionKindUz,
  submissionLegitBadge,
  submissionStatusUz,
} from '@/student/studentSubmissionUi'

export function StudentAppealsPage() {
  const { token } = useAuth()
  const [subs, setSubs] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [appealTextById, setAppealTextById] = useState<Record<string, string>>({})
  const [appealBusyId, setAppealBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true)
    setErr('')
    ;(async () => {
      try {
        const data = await fetchAuthJson<{ items: SubmissionRow[] }>('/api/student/submissions', token)
        if (!cancelled) setSubs(data.items)
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : 'Yuklashda xato')
          setSubs([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  /** Faqat yakuniy ball qo‘yilgan (yoki tarixda shikoyat bo‘lgan) materiillar */
  const appealItems = subs.filter((r) => {
    const graded = r.status === 'APPROVED' && r.points != null
    return graded || r.appeals.length > 0
  })

  async function submitAppeal(submissionId: string) {
    if (!token) return
    const body = (appealTextById[submissionId] ?? '').trim()
    if (!body.length) {
      setErr('Matn kiriting.')
      return
    }
    setAppealBusyId(submissionId)
    setErr('')
    setSuccessMsg('')
    try {
      const created = await fetchAuthJson<{ ok?: boolean; appeal: SubmissionAppealItem }>(
        `/api/student/submissions/${encodeURIComponent(submissionId)}/appeal`,
        token,
        { method: 'POST', body: JSON.stringify({ body }) },
      )
      const newAppeal = created.appeal
      setAppealTextById((p) => {
        const n = { ...p }
        delete n[submissionId]
        return n
      })
      setSubs((rows) =>
        rows.map((r) => {
          if (r.id !== submissionId) return r
          const appeals = newAppeal ? [newAppeal, ...r.appeals.filter((x) => x.id !== newAppeal.id)] : r.appeals
          const canAppeal = appeals.length < MAX_APPEALS_PER_SUBMISSION
          return { ...r, appeals, canAppeal }
        }),
      )
      setSuccessMsg('Shikoyatingiz yuborildi — administrator javobini kutishingiz mumkin.')
      void fetchAuthJson<{ items: SubmissionRow[] }>('/api/student/submissions', token)
        .then((data) => setSubs(data.items))
        .catch(() => {})
    } catch (e) {
      setSuccessMsg('')
      setErr(e instanceof Error ? e.message : 'Yuborishda xato')
    } finally {
      setAppealBusyId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
          Ball shikoyatlari
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Tasdiqlangan har bir ish uchun yakuniy ball haqidagi fikringizni shu sahifadan yuborasiz. Har bir material uchun alohida{' '}
          <strong className="text-[var(--color-text)]">{MAX_APPEALS_PER_SUBMISSION} tagacha</strong> shikoyat yuborish mumkin;
          matn uzunligi koʻpi bilan 4000 belgi. Bosh sahifadagi toʻliq tarix —{' '}
          <Link to="/talaba" className="font-semibold text-[var(--color-accent-strong)] underline">
            Materiallar
          </Link>
          .
        </p>
      </div>

      {err ? (
        <p className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-[var(--color-text)]">{err}</p>
      ) : null}

      {!err && successMsg ? (
        <p className="rounded-xl border border-emerald-500/45 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-400/35 dark:bg-emerald-950/45 dark:text-emerald-50">
          {successMsg}
        </p>
      ) : null}

      {loading ? (
        <p className="text-[var(--color-text-muted)]">Yuklanmoqda…</p>
      ) : appealItems.length === 0 ? (
        <p className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/80 px-6 py-10 text-sm text-[var(--color-text-muted)]">
          Hozircha yakuniy ball qo‘yilgan material yo‘q. Ball berilgandan keyin shikoyat formasi paydo boʻladi yoki administrator
          bilan bog‘laning.
        </p>
      ) : (
        <ul className="space-y-5">
          {appealItems.map((r) => {
            const st = submissionStatusUz(r.status)
            const showAppealUi = r.status === 'APPROVED' && r.points != null
            return (
              <li
                key={r.id}
                className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-5 shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--color-text)]">{r.title}</p>
                    <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                      {submissionKindUz(r.kind, r.articleJournalTier)} · {r.orgName}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold ${st.cls}`}>
                    {st.label}
                  </span>
                </div>

                {showAppealUi ? (
                  <p className="mt-3 text-sm tabular-nums text-[var(--color-text)]">
                    Yakuniy ball:{' '}
                    <strong className="text-[var(--color-accent-strong)]">{r.points}</strong>
                    {' · '}
                    <span className="text-[var(--color-text-muted)]">
                      tur boʻyicha yoʻriqnoma ball: <strong>{r.standardPoints}</strong>
                    </span>
                    {r.appeals.length > 0 ? (
                      <span className="text-[var(--color-text-muted)]">
                        {' '}
                        · shikoyatlar: <strong className="text-[var(--color-text)]">{r.appeals.length}</strong> /{' '}
                        {MAX_APPEALS_PER_SUBMISSION}
                      </span>
                    ) : null}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                    Bu yozuv uchun shikoyat qoldirish faqat moderator tasdiqlab ball bergach mumkin boʻladi (yoki tarixda mavjud bo‘lsa
                    javob chiqadi).
                  </p>
                )}

                {showAppealUi && r.aiLegitimacyVerdict ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                      AI qonuniylik
                    </span>
                    {(() => {
                      const lb = submissionLegitBadge(r.aiLegitimacyVerdict)
                      return lb ? (
                        <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${lb.cls}`}>
                          {lb.label}
                        </span>
                      ) : null
                    })()}
                  </div>
                ) : null}

                {r.appeals.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {r.appeals.map((a, idx) => {
                      const num = r.appeals.length - idx
                      return (
                        <li
                          key={a.id}
                          className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/35 px-3 py-3"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                              Shikoyat #{num}
                              {a.status === 'PENDING'
                                ? ' — ko‘rib chiqilmoqda'
                                : a.status === 'REVIEWED' && a.adminReply?.trim()
                                  ? ' — javob'
                                  : ' — yozma'}
                            </p>
                            <time
                              dateTime={a.createdAt}
                              className="text-[11px] tabular-nums text-[var(--color-text-muted)]"
                            >
                              {new Date(a.createdAt).toLocaleString('uz-UZ', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </time>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-text)]">
                            {a.status === 'REVIEWED' && a.adminReply?.trim() ? a.adminReply.trim() : a.body}
                          </p>
                          {a.status === 'REVIEWED' && a.adminReply?.trim() ? (
                            <p className="mt-2 border-t border-[var(--color-border-subtle)] pt-2 text-xs text-[var(--color-text-muted)]">
                              Sizning matningiz: {a.body.slice(0, 200)}
                              {a.body.length > 200 ? '…' : ''}
                            </p>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                ) : null}

                {showAppealUi && !r.canAppeal && r.appeals.length >= MAX_APPEALS_PER_SUBMISSION ? (
                  <p className="mt-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-[var(--color-text)]">
                    Bu material uchun <strong>{MAX_APPEALS_PER_SUBMISSION}</strong> ta shikoyat limiti tugagan — yangisi yuborib
                    boʻlmasin.
                  </p>
                ) : null}

                {r.canAppeal ? (
                  <div className="mt-4 space-y-3 border-t border-[var(--color-border-subtle)] pt-4">
                    <label className="block text-xs font-medium text-[var(--color-text)]">
                      Yangi shikoyat matni
                      <textarea
                        rows={4}
                        maxLength={4000}
                        value={appealTextById[r.id] ?? ''}
                        onChange={(e) => setAppealTextById((p) => ({ ...p, [r.id]: e.target.value }))}
                        className="mt-1 w-full resize-y rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                        placeholder="Ballni nima uchun notoʻgʻri deb bilasiz?"
                        disabled={appealBusyId === r.id}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={appealBusyId === r.id}
                      onClick={() => void submitAppeal(r.id)}
                      className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-50"
                    >
                      {appealBusyId === r.id ? 'Yuborilmoqda…' : 'Shikoyatni yuborish'}
                    </button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
