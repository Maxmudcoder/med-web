import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublicJson } from '@/lib/api'
import { RankBadge, type RankingItem } from '@/pages/public/publicUi'
import { RankingDetailModal } from '@/pages/public/RankingDetailModal'

export function RankingPage() {
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    async function run() {
      setErr('')
      try {
        const r = await fetchPublicJson<{ items: RankingItem[] }>('/api/public/ranking?limit=50')
        if (!cancelled) setRanking(r.items)
      } catch {
        if (!cancelled) setErr('Server bilan aloqa yo‘q yoki API ishlamayapti.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const [detail, setDetail] = useState<RankingItem | null>(null)

  return (
    <div className="public-page relative px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-teal-500/10 to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        <nav className="mb-6 text-sm text-[var(--color-text-muted)]">
          <Link to="/" className="text-teal-400 hover:text-teal-300">
            Bosh sahifa
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="text-[var(--color-text)]">Reyting</span>
        </nav>

        <header className="mb-12">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/35 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-300">
            Alohida bo‘lim
          </p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Umumiy <span className="text-teal-400">reyting</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
            Tasdiqlangan yutuqlar (sertifikat, olimpiada, sport va boshqalar) jadvalda qisqacha ko‘rinadi. Qatorni
            bosganda batafsil ochiladi. Matnlar avtomatik tekshiruvdan keyin moderator tomonidan yakuniy shakllantiriladi
            va tasdiqlanadi.
          </p>
          {err ? (
            <p className="mt-6 max-w-xl rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">
              {err}
            </p>
          ) : null}
        </header>

        <div className="pb-8 sm:pb-12">
          {loading ? (
            <p className="rounded-[1.75rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 py-12 text-center text-[var(--color-text-muted)]">
              Yuklanmoqda…
            </p>
          ) : ranking.length === 0 ? (
            <p className="rounded-[1.75rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 px-5 py-12 text-center text-[var(--color-text-muted)]">
              Ro‘yxat bo‘sh — administrator talabalarni qo‘shgandan keyin ko‘rinadi.
            </p>
          ) : (
            <>
              <ul className="space-y-3 md:hidden">
                {ranking.map((row) => (
                  <li key={row.studentId}>
                    <button
                      type="button"
                      className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 p-4 text-left shadow-lg transition active:scale-[0.99] hover:border-teal-500/30"
                      onClick={() => setDetail(row)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <RankBadge rank={row.rank} />
                        <span className="shrink-0 rounded-xl bg-gradient-to-r from-teal-500/20 to-emerald-500/15 px-3 py-1 text-sm font-bold tabular-nums text-teal-300 ring-1 ring-teal-500/25">
                          {row.score}
                        </span>
                      </div>
                      <p className="mt-3 font-semibold text-[var(--color-text)]">{row.name}</p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{row.group}</p>
                      {row.badge ? (
                        <p className="mt-2 line-clamp-2 text-xs text-teal-400/90">{row.badge}</p>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-hidden rounded-[1.75rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 shadow-2xl shadow-black/30 backdrop-blur md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/95">
                        <th className="px-5 py-4 font-semibold text-[var(--color-text-muted)]">#</th>
                        <th className="px-5 py-4 font-semibold text-[var(--color-text-muted)]">Talaba</th>
                        <th className="hidden px-5 py-4 font-semibold text-[var(--color-text-muted)] sm:table-cell">
                          Guruh / yo‘nalish
                        </th>
                        <th className="hidden px-5 py-4 font-semibold text-[var(--color-text-muted)] md:table-cell">
                          Izoh
                        </th>
                        <th className="px-5 py-4 text-right font-semibold text-[var(--color-text-muted)]">
                          Jami ball
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((row) => (
                        <tr
                          key={row.studentId}
                          className="cursor-pointer border-b border-[var(--color-border-subtle)]/60 transition hover:bg-white/[0.06]"
                          onClick={() => setDetail(row)}
                        >
                          <td className="px-5 py-4 align-middle">
                            <div className="flex justify-start">
                              <RankBadge rank={row.rank} />
                            </div>
                          </td>
                          <td className="px-5 py-4 font-medium text-[var(--color-text)]">{row.name}</td>
                          <td className="hidden px-5 py-4 text-[var(--color-text-muted)] sm:table-cell">
                            {row.group}
                          </td>
                          <td className="hidden max-w-[220px] truncate px-5 py-4 text-[var(--color-text-muted)] md:table-cell">
                            {row.badge ?? '—'}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="inline-block rounded-xl bg-gradient-to-r from-teal-500/20 to-emerald-500/15 px-4 py-1.5 font-bold tabular-nums text-teal-300 ring-1 ring-teal-500/25">
                              {row.score}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <RankingDetailModal row={detail} onClose={() => setDetail(null)} />
      </div>
    </div>
  )
}
