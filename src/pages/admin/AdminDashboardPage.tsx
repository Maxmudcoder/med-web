import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fetchAuthJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { notifyOpenAdminNotifications } from '@/components/NotificationPanel'

type DashCard =
  | {
      key: string
      label: string
      value: string
      accent: string
      hint: ReactNode
      to: string
    }
  | {
      key: string
      label: string
      value: string
      accent: string
      hint: ReactNode
      openBell: true
    }

type Snapshot = {
  generatedAt: string
  stats: {
    activeStudents: number
    activeAnnouncements: number
    unreadContactMessages: number
    avgStudentPoints: number
  }
  unreadAdminNotifications: number
  recentApproved: Array<{
    id: string
    title: string
    points: number | null
    studentName: string
    createdAt: string
  }>
  recentRejected: Array<{
    id: string
    title: string
    studentName: string
    adminNoteSnippet: string
    createdAt: string
  }>
  sluggishStudents: Array<{
    userId: string
    login: string
    fullName: string
    totalPoints: number
  }>
}

type Briefing = {
  text: string
  openai?: boolean
}

export function AdminDashboardPage() {
  const { token } = useAuth()
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [briefingLoading, setBriefingLoading] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await fetchAuthJson<Snapshot>('/api/admin/dashboard/snapshot', token)
      setSnap(data)
    } catch {
      setSnap(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  const loadBriefing = useCallback(async () => {
    if (!token) return
    setBriefingLoading(true)
    try {
      const data = await fetchAuthJson<Briefing>('/api/admin/dashboard/briefing', token)
      setBriefing(data)
    } catch {
      setBriefing(null)
    } finally {
      setBriefingLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void loadBriefing()
  }, [loadBriefing])

  const stats = snap?.stats

  const cards: DashCard[] =
    stats && snap
      ? [
          {
            key: 'elonlar',
            label: "Faol e'lonlar",
            value: String(stats.activeAnnouncements),
            hint: 'Bosh sahifa va e‘lonlar sahifasi — kartani bosing.',
            accent: 'from-sky-500 to-blue-800',
            to: '/admin/elonlar',
          },
          {
            key: 'talabalar',
            label: 'Faol talabalar',
            value: String(stats.activeStudents),
            hint: 'Bloklanmagan akkauntlar — ro‘yxatga kirish uchun bosing.',
            accent: 'from-teal-500 to-emerald-700',
            to: '/admin/talabalar',
          },
          {
            key: 'xabarlar',
            label: 'Kelgan xabarlar',
            value: String(stats.unreadContactMessages),
            hint: 'O‘qilmagan yozishmalar — aloqa sahifasiga tashrif.',
            accent: 'from-fuchsia-500 to-pink-900',
            to: '/admin/xabarlar',
          },
          {
            key: 'ortacha-ball',
            label: 'Oʻrtacha ball',
            value: String(stats.avgStudentPoints ?? 0),
            hint: 'Talabalar ro‘yxatidan profil va ballni boshqarish.',
            accent: 'from-violet-500 to-purple-900',
            to: '/admin/talabalar',
          },
          {
            key: 'notifications',
            label: 'Tizim bildirishnomalari',
            value: String(snap.unreadAdminNotifications),
            hint: 'Bosiladi; tepada qo‘ng‘iroqcha ro‘yxati ochiladi.',
            accent: 'from-cyan-500 to-teal-900',
            openBell: true,
          },
        ]
      : []

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-text)]">
            Boshqaruv paneli
          </h1>
          <p className="mt-2 max-w-xl text-[var(--color-text-muted)]">
            Talabalar, reyting, e‘lonlar va aloqa — asosiy koʻrsatkichlar. AI xulosa: oxirgi yuklamalar, navbatdagilar,
            tasdiqlangan ballar va yangi talabalar roʻyxati; sayt tuzilishi haqidagi gaplar qoʻshilmagan (OpenAI
            boʻlmaganda ham shu faktlar roʻyxati chiqadi).
            Ochiq sahifada kartalar uchun{' '}
            <Link to="/admin/oqituvchilar" className="font-semibold text-teal-400 underline">
              O‘qituvchilar
            </Link>{' '}
            boʻlimi hamda boshqa aloqa sozlamalari —{' '}
            <Link to="/admin/sozlamalar" className="font-semibold text-teal-400 underline">
              Sayt sozlamalari
            </Link>
            . Batafsil savollar —{' '}
            <Link to="/admin/ai-yordamchi" className="font-semibold text-teal-400 underline">
              AI yordamchi
            </Link>
            .
          </p>
          {snap ? (
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Yangilangan:{' '}
              {new Date(snap.generatedAt).toLocaleString('uz-UZ', { hour12: false })}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={loading || !token || briefingLoading}
          onClick={() => {
            void load()
            void loadBriefing()
          }}
          className="self-start rounded-xl border border-[var(--color-border-subtle)] px-4 py-2 text-sm text-[var(--color-text)] transition hover:bg-white/5 disabled:opacity-40 sm:self-auto"
        >
          Yangilash
        </button>
      </div>

      <section
        className="relative overflow-hidden rounded-[1.5rem] border border-violet-500/35 bg-gradient-to-br from-violet-950/35 via-[var(--color-bg-card)] to-teal-950/20 p-6 shadow-xl"
        aria-labelledby="admin-ai-briefing"
      >
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative">
          <h2 id="admin-ai-briefing" className="font-display text-lg font-bold text-[var(--color-text)]">
            Materiāllar va baholar boʻyicha xulosa
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Yuklangan ishlar va berilgan baholar hamda yangi talabalar; qisqa tavsiyalar.{' '}
            {briefing?.openai === false
              ? '(OpenAI kaliti yoʻq — faqat roʻyxat matni.)'
              : briefing?.openai
                ? '(OpenAI yordamida matn.)'
                : null}
          </p>
          {briefingLoading ? (
            <p className="mt-4 animate-pulse text-sm text-[var(--color-text-muted)]">Hisobot yozilmoqda…</p>
          ) : briefing?.text ? (
            <div className="mt-4 max-h-[min(38rem,70vh)] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
              {briefing.text}
            </div>
          ) : (
            <p className="mt-4 text-sm text-rose-300/90">Hisobotni yuklab boʻlmadi — «Yangilash» tugmasidan foydalaning.</p>
          )}
        </div>
      </section>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((k) => (
            <div
              key={k}
              className="animate-pulse rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6"
            >
              <div className="h-4 w-24 rounded bg-[var(--color-border-subtle)]" />
              <div className="mt-4 h-8 w-16 rounded bg-[var(--color-border-subtle)]" />
            </div>
          ))}
        </div>
      ) : snap ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const visual = (
                <>
                  <div
                    className={`pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br opacity-35 blur-2xl ${card.accent}`}
                  />
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">{card.label}</p>
                  <p className="font-display mt-2 text-3xl font-bold tabular-nums text-[var(--color-text)]">
                    {card.value}
                  </p>
                  <div className="mt-3 text-xs text-[var(--color-text-muted)]">{card.hint}</div>
                </>
              )

              const baseCls =
                'group relative block overflow-hidden rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6 shadow-lg transition hover:border-teal-500/50 focus-visible:border-teal-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/35'

              if ('openBell' in card) {
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => notifyOpenAdminNotifications()}
                    className={`${baseCls} w-full text-left`}
                  >
                    {visual}
                  </button>
                )
              }

              return (
                <Link key={card.key} to={card.to} className={baseCls}>
                  {visual}
                </Link>
              )
            })}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
              <h3 className="font-semibold text-[var(--color-text)]">Reytingda past oʻrin (12)</h3>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Ballni{' '}
                <Link to="/admin/talabalar" className="text-teal-400 underline">
                  Talabalar
                </Link>{' '}
                sahifasidan tahrirlashingiz mumkin.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {snap.sluggishStudents.length === 0 ? (
                  <li className="text-[var(--color-text-muted)]">Maʼlumot yoʻq.</li>
                ) : (
                  snap.sluggishStudents.map((s) => (
                    <li
                      key={s.userId}
                      className="flex justify-between gap-2 rounded-lg border border-[var(--color-border-subtle)]/60 px-3 py-2"
                    >
                      <span className="text-[var(--color-text)]">
                        {s.fullName}{' '}
                        <span className="text-xs text-[var(--color-text-muted)]">({s.login})</span>
                      </span>
                      <span className="tabular-nums text-amber-200/90">{s.totalPoints} bp</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/50 p-5">
              <h3 className="font-semibold text-[var(--color-text)]">Tez yoʻnalish</h3>
              <ul className="mt-3 space-y-3 text-sm">
                <li>
                  <Link className="font-medium text-teal-400 hover:underline" to="/admin/baholash">
                    Baholash
                  </Link>
                  <span className="text-[var(--color-text-muted)]"> — materiallarni ko‘rib chiqish va ball berish</span>
                </li>
                <li>
                  <Link className="font-medium text-teal-400 hover:underline" to="/admin/ai-yordamchi">
                    AI yordamchi
                  </Link>
                  <span className="text-[var(--color-text-muted)]"> — tizim va jarayonlar bo‘yicha yordam</span>
                </li>
                <li>
                  <Link className="font-medium text-teal-400 hover:underline" to="/admin/elonlar">
                    E‘lonlar
                  </Link>
                  <span className="text-[var(--color-text-muted)]"> — rasm va ranglar</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-[var(--color-text)]">So‘nggi tasdiqlar</h3>
                <Link
                  to="/admin/baholash"
                  className="text-xs font-medium text-teal-400 hover:underline"
                >
                  Baholash
                </Link>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {snap.recentApproved.length === 0 ? (
                  <li className="text-[var(--color-text-muted)]">Hozircha yoʻq.</li>
                ) : (
                  snap.recentApproved.slice(0, 10).map((r) => (
                    <li
                      key={r.id}
                      className="flex justify-between gap-2 border-b border-[var(--color-border-subtle)]/60 py-2 last:border-0"
                    >
                      <span className="min-w-0 truncate text-[var(--color-text)]">{r.title}</span>
                      <span className="shrink-0 text-xs text-teal-300">
                        +{r.points ?? '?'} · {r.studentName}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-[var(--color-text)]">So‘nggi radlar</h3>
                <Link
                  to="/admin/baholash"
                  className="text-xs font-medium text-teal-400 hover:underline"
                >
                  Baholash
                </Link>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {snap.recentRejected.length === 0 ? (
                  <li className="text-[var(--color-text-muted)]">Hozircha yoʻq.</li>
                ) : (
                  snap.recentRejected.slice(0, 8).map((r) => (
                    <li key={r.id} className="text-[var(--color-text-muted)]">
                      <p className="text-[var(--color-text)]">{r.title}</p>
                      <p className="text-xs">{r.studentName}</p>
                      {r.adminNoteSnippet ? (
                        <p className="mt-1 text-xs italic text-rose-200/90">{r.adminNoteSnippet}</p>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <p className="text-[var(--color-danger)]">Maʼlumot yuklanmadi.</p>
      )}
    </div>
  )
}
