import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAuthJson, apiUrl } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import {
  MAX_APPEALS_PER_SUBMISSION,
  type SubmissionRow,
  submissionKindUz,
  submissionLegitBadge,
  submissionStatusUz,
} from '@/student/studentSubmissionUi'

function initialsFromName(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const p = name.trim().split(/\s+/).filter(Boolean)
  const a = p[0]?.[0]
  const b = p[1]?.[0]
  const s = `${(a ?? '').toUpperCase()}${(b ?? a ?? '').toUpperCase()}`
  return s.slice(0, 2) || '?'
}

export function StudentDashboardPage() {
  const { user, token } = useAuth()
  const [totalPoints, setTotalPoints] = useState<number | null>(null)
  const [unread, setUnread] = useState(0)
  const [subs, setSubs] = useState<SubmissionRow[]>([])
  const [subsLoading, setSubsLoading] = useState(true)
  const [subsErr, setSubsErr] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const s = await fetchAuthJson<{
          totalPoints: number
          unreadNotifications: number
        }>('/api/student/summary', token)
        if (!cancelled) {
          setTotalPoints(s.totalPoints)
          setUnread(s.unreadNotifications)
        }
      } catch {
        if (!cancelled) {
          setTotalPoints(null)
          setUnread(0)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setSubsLoading(true)
    setSubsErr('')
    ;(async () => {
      try {
        const data = await fetchAuthJson<{ items: SubmissionRow[] }>('/api/student/submissions', token)
        if (!cancelled) setSubs(data.items)
      } catch (e) {
        if (!cancelled) {
          setSubsErr(e instanceof Error ? e.message : 'Yuklashda xato')
          setSubs([])
        }
      } finally {
        if (!cancelled) setSubsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border-subtle)] bg-gradient-to-br from-[var(--color-bg-card)] via-[var(--color-bg-deep)] to-[var(--color-bg-card)] p-8 shadow-2xl sm:p-10">
        <div className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-teal-500/12 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-lg font-bold text-white shadow-lg">
              {initialsFromName(user?.fullName)}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-muted)]">Salom,</p>
              <h1 className="font-display text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
                {user?.fullName || user?.login}
              </h1>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Tasdiqlangan yutuqlar asosida umumiy ballaringiz va har bir material bo‘yicha ballar shu yerda.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-teal-500/25 bg-teal-500/10 px-5 py-4 text-center ring-1 ring-teal-500/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-strong)]">
              Jami ball
            </p>
            <p className="font-display mt-1 text-3xl font-bold tabular-nums text-[var(--color-accent-strong)]">
              {totalPoints === null ? '—' : totalPoints}
            </p>
            {unread > 0 ? (
              <p className="mt-2 text-xs font-medium text-[var(--color-text)]">{unread} yangi xabar</p>
            ) : null}
          </div>
        </div>
      </div>

      <section className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-lg backdrop-blur sm:p-8">
        <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">
          Mening materiallarim va baholar
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Quyida siz yuborgan har bir materialning barcha matn maʼlumotlari: sarlavha, tashkilot, sanalar,
          izoh va (bo‘lsa) asl bayoningiz. Yuklangan fayl ochiladi — rasm sifatida sahifaga qistirilmaydi.
          Yakuniy ball haqidagi shikoyatlar — alohida{' '}
          <Link to="/talaba/shikoyatlar" className="font-semibold text-[var(--color-accent-strong)] underline">
            Ball shikoyatlari
          </Link>{' '}
          bo‘limida.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/talaba/yuklash"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:brightness-110"
          >
            Yangi material yuklash
          </Link>
          <Link
            to="/talaba/shikoyatlar"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/50 px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-teal-500/40"
          >
            Ball shikoyatlari
          </Link>
        </div>
        {subsErr ? (
          <p className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-[var(--color-text)]">
            {subsErr}
          </p>
        ) : null}
        {subsLoading ? (
          <p className="mt-6 text-sm text-[var(--color-text-muted)]">Ro‘yxat yuklanmoqda…</p>
        ) : subs.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--color-text-muted)]">
            Hozircha yuklangan material yo‘q. Agar bu noto‘g‘ri bo‘lsa, administrator bilan bog‘laning.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {subs.map((r) => {
              const st = submissionStatusUz(r.status)
              const showScore = r.status === 'APPROVED' && r.points != null
              return (
                <li
                  key={r.id}
                  className="rounded-2xl border border-[var(--color-border-subtle)]/90 bg-[var(--color-bg-deep)]/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--color-text)]">{r.title}</p>
                      <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                        {submissionKindUz(r.kind, r.articleJournalTier)} · {r.orgName}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 border-t border-[var(--color-border-subtle)]/60 pt-3 text-sm">
                    <dl className="grid gap-2 text-xs sm:grid-cols-2">
                      <div>
                        <dt className="font-medium text-[var(--color-text-muted)]">Berilgan sana</dt>
                        <dd className="mt-0.5 text-[var(--color-text)]">
                          {new Date(r.issuedAt).toLocaleDateString('uz-UZ', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-[var(--color-text-muted)]">Yuklangan</dt>
                        <dd className="mt-0.5 text-[var(--color-text)]">
                          {new Date(r.createdAt).toLocaleString('uz-UZ', { hour12: false })}
                        </dd>
                      </div>
                    </dl>
                    {r.status === 'PENDING' ? (
                      <p className="rounded-lg border border-slate-500/30 bg-slate-500/10 px-3 py-2 text-xs text-[var(--color-text-muted)]">
                        Ochiq sayt va umumiy reytingda bu material moderator tasdiqlaguncha chiqmaydi. Administrator
                        bildirishnomasi va AI tahlilidan keyin yakuniy ball beriladi.
                      </p>
                    ) : null}
                    {r.note?.trim() ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                          Rasmiy izoh (tizim / moderator)
                        </p>
                        <p className="mt-1 whitespace-pre-wrap leading-relaxed text-[var(--color-text)]">
                          {r.note.trim()}
                        </p>
                      </div>
                    ) : null}
                    {r.submittedDraft?.trim() ? (
                      <details className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/60 px-3 py-2">
                        <summary className="cursor-pointer text-xs font-semibold text-[var(--color-text)]">
                          Men yuborgan asl bayon
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
                          {r.submittedDraft.trim()}
                        </p>
                      </details>
                    ) : null}
                    <div>
                      <a
                        href={apiUrl(r.filePath)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-sm font-medium text-[var(--color-accent-strong)] underline-offset-2 hover:underline"
                      >
                        Yuklangan faylni ochish (PDF yoki rasm)
                      </a>
                    </div>
                    {r.aiAssessment?.trim() ? (
                      <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/55 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                          AI tahlil (tavsiya)
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-text-muted)]">
                          {r.aiAssessment.trim()}
                        </p>
                        {r.aiSuggestedPoints != null ? (
                          <p className="mt-2 text-[11px] text-[var(--color-text)]">
                            AI tavsiya balli: {r.aiSuggestedPoints}
                            {r.aiScore != null
                              ? ` · ishonch (model): ${Math.round(Math.min(1, Math.max(0, r.aiScore)) * 100)}%`
                              : ''}
                            {!r.aiScoreUsedOpenAi ? ' · (taxminiy — serverda GPT toʻliq ishlamagan boʻlishi mumkin)' : ''}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {r.status === 'REJECTED' && r.adminNote?.trim() ? (
                      <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm">
                        <p className="text-[11px] font-semibold uppercase text-[var(--color-text)]">
                          Rad etish sababi
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-[var(--color-text)]">{r.adminNote.trim()}</p>
                      </div>
                    ) : null}
                  </div>
                  {showScore ? (
                    <div className="mt-3 text-sm tabular-nums">
                      <span className="text-[var(--color-text)]">
                        Sizning ballingiz:{' '}
                        <strong className="text-[var(--color-accent-strong)]">{r.points}</strong>
                      </span>
                      <span className="text-[var(--color-text-muted)]">
                        {' '}
                        · Standart (tur bo‘yicha): <strong>{r.standardPoints}</strong>
                      </span>
                      {!r.appeals.length ? (
                        r.belowStandard ? (
                          <span className="ml-1 text-[var(--color-text)]">· standartdan past</span>
                        ) : null
                      ) : null}
                    </div>
                  ) : null}
                  {showScore ? (
                    <div className="mt-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/50 px-3 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        AI qonuniylik xulosasi (metadata asosida)
                      </p>
                      {(() => {
                        const lb = submissionLegitBadge(r.aiLegitimacyVerdict)
                        return lb ? (
                          <span
                            className={`mt-2 inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${lb.cls}`}
                          >
                            {lb.label}
                          </span>
                        ) : null
                      })()}
                      {r.aiLegitimacySummaryUz?.trim() ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
                          {r.aiLegitimacySummaryUz.trim()}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                          Xulosa tayyorlanmoqda — bir ozdan keyin sahifani yangilang. Bu avtomatik qadam; hujjat mazmuni
                          ochilmaydi.
                        </p>
                      )}
                    </div>
                  ) : null}
                  {r.status === 'REJECTED' && !r.adminNote?.trim() ? (
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                      Rad sababi administrator tomonidan yozilmagan — tafsilotlar uchun administrator bilan bog‘laning.
                    </p>
                  ) : null}

                  {(() => {
                    const latestAppeal = r.appeals[0]
                    if (!latestAppeal) return null
                    return (
                    <div className="mt-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/60 px-3 py-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                          {latestAppeal.status === 'PENDING'
                            ? 'So‘nggi shikoyat ko‘rib chiqilmoqda'
                            : 'So‘nggi shikoyat javobi'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {r.appeals.length > 1 ? (
                            <span className="rounded-lg bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-200">
                              {r.appeals.length} ta
                            </span>
                          ) : null}
                          <Link
                            to="/talaba/shikoyatlar"
                            className="text-xs font-medium text-[var(--color-accent-strong)] underline"
                          >
                            Barchasi
                          </Link>
                        </div>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[var(--color-text-muted)]">
                        {latestAppeal.status === 'REVIEWED' && latestAppeal.adminReply?.trim()
                          ? latestAppeal.adminReply.trim()
                          : latestAppeal.body}
                      </p>
                      {latestAppeal.status === 'REVIEWED' && latestAppeal.adminReply?.trim() ? (
                        <p className="mt-2 border-t border-[var(--color-border-subtle)] pt-2 text-xs text-[var(--color-text-muted)]">
                          Sizning matningiz: {latestAppeal.body.slice(0, 200)}
                          {latestAppeal.body.length > 200 ? '…' : ''}
                        </p>
                      ) : null}
                    </div>
                    )
                  })()}

                  {r.canAppeal ? (
                    <div className="mt-4 rounded-xl border border-teal-500/25 bg-teal-500/[0.08] px-3 py-3">
                      <p className="text-sm text-[var(--color-text)]">
                        Shu material yakuniy balli haqida shik yozish uchun{' '}
                        <Link
                          to="/talaba/shikoyatlar"
                          className="font-semibold text-[var(--color-accent-strong)] underline underline-offset-2"
                        >
                          Ball shikoyatlari
                        </Link>{' '}
                        sahifasiga oʻting — shu yerda yuborasiz (bir material uchun {MAX_APPEALS_PER_SUBMISSION} tagacha alohida
                        habar).
                      </p>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-lg backdrop-blur transition hover:border-teal-500/35">
          <h2 className="font-display font-semibold text-[var(--color-text)]">Reyting</h2>
          <p className="mt-4 font-display text-4xl font-bold tabular-nums text-[var(--color-accent-strong)]">
            {totalPoints === null ? '—' : totalPoints}
          </p>
          <Link
            to="/reyting"
            className="mt-3 inline-block text-xs font-medium text-[var(--color-accent-strong)] underline"
          >
            Umumiy reyting sahifasi
          </Link>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Tasdiqlangan materiallar bo‘yicha jami ball
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-lg backdrop-blur transition hover:border-teal-500/35">
          <h2 className="font-display font-semibold text-[var(--color-text)]">Xabarlar</h2>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            Tasdiq, rad va shikoyat javoblari haqida bildirishnomalar tepada qo‘ng‘iroq belgisida.
          </p>
        </div>
      </div>
    </div>
  )
}
