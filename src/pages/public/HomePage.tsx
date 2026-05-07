import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublicJson } from '@/lib/api'
import { DEFAULT_PUBLIC_BRANDING, type PublicBranding, type PublicHomeCopy } from '@/lib/publicBranding'
import { publicFileUrl } from '@/lib/stickerSrc'
import { RankBadge, PromoAccent, type AnnouncementItem, type RankingItem } from '@/pages/public/publicUi'
import { RankingDetailModal } from '@/pages/public/RankingDetailModal'

/** Bosh sahifa: eng yangi e'lonlar (to‘liq ro‘yxat — marshrut /elonlar). */
function newestAnnouncements(items: AnnouncementItem[], max = 6): AnnouncementItem[] {
  return [...items]
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
    )
    .slice(0, max)
}

export function HomePage() {
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [announcementsRaw, setAnnouncementsRaw] = useState<AnnouncementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [homeCopy, setHomeCopy] = useState<PublicHomeCopy>(DEFAULT_PUBLIC_BRANDING.home)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchPublicJson<PublicBranding>('/api/public/branding')
        if (!cancelled) setHomeCopy(data.home)
      } catch {
        /* default */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setErr('')
      try {
        const [r, a] = await Promise.all([
          fetchPublicJson<{ items: RankingItem[] }>('/api/public/ranking?limit=10'),
          fetchPublicJson<{ items: AnnouncementItem[] }>('/api/public/announcements?limit=80'),
        ])
        if (!cancelled) {
          setRanking(r.items)
          setAnnouncementsRaw(a.items)
        }
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

  const homeAnnouncements = useMemo(
    () => newestAnnouncements(announcementsRaw, 6),
    [announcementsRaw],
  )

  const [rankDetail, setRankDetail] = useState<RankingItem | null>(null)

  return (
    <div className="public-page relative">
      <section className="relative overflow-x-clip overflow-y-visible px-4 pb-16 pt-0 sm:px-6 sm:pb-20 sm:pt-2 lg:pt-4">
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-teal-500/15 blur-[100px]" />
        <div className="pointer-events-none absolute -right-24 top-48 h-96 w-96 rounded-full bg-emerald-600/12 blur-[120px]" />

        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="min-w-0 text-left">
            <div className="mb-8 max-w-3xl font-display">
              <div className="inline-block max-w-full rounded-2xl border border-teal-500/20 bg-white/45 px-4 py-3 backdrop-blur-md dark:border-teal-400/[0.18] dark:bg-[var(--color-bg-deep)]/45 sm:px-5 sm:py-4">
                <p className="break-words text-[clamp(1.0625rem,4.75vw,2.75rem)] font-extrabold leading-snug tracking-tight text-emerald-600/92 dark:text-teal-300/92 antialiased">
                  {homeCopy.institutionTitle}
                </p>
              </div>
            </div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/35 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              {homeCopy.badge}
            </div>
            <h1 className="font-display text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              <span className="text-gradient">{homeCopy.heroHighlight}</span>{' '}
              <span className="text-[var(--color-text)]">{homeCopy.heroMid}</span>
              <br />
              <span className="text-[var(--color-text)]">{homeCopy.heroSubtitle}</span>
            </h1>
            <p className="mt-6 max-w-xl whitespace-pre-line text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
              {homeCopy.introText}
            </p>
            <div className="mt-8 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:flex-wrap sm:mt-10 sm:gap-4">
              <Link
                to="/kirish"
                className="inline-flex w-full min-[400px]:w-auto items-center justify-center rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-teal-500/35 transition hover:brightness-110 active:scale-[0.98] sm:px-8 sm:py-4 sm:text-base"
              >
                {homeCopy.ctaPrimary}
              </Link>
              <Link
                to="/reyting"
                className="inline-flex w-full min-[400px]:w-auto items-center justify-center rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/80 px-6 py-3.5 text-sm font-semibold text-[var(--color-text)] backdrop-blur transition hover:border-teal-500/50 hover:text-teal-300 sm:px-8 sm:py-4 sm:text-base"
              >
                {homeCopy.ctaSecondary}
              </Link>
            </div>
            {err ? (
              <p className="mt-6 max-w-xl rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">
                {err}
              </p>
            ) : null}
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
            <div className="glass animate-float relative rounded-[2rem] p-6 shadow-2xl shadow-black/40 sm:p-8">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 opacity-55 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 opacity-35 blur-2xl" />

              <p className="font-display text-sm font-semibold uppercase tracking-widest text-teal-400">
                {homeCopy.rankingCardKicker}
              </p>
              <p className="mt-2 font-display text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
                {homeCopy.rankingCardTitle}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                To‘liq jadval:{' '}
                <Link to="/reyting" className="font-semibold text-teal-400 underline decoration-teal-500/40">
                  Reyting
                </Link>{' '}
                sahifasi
              </p>

              {loading ? (
                <p className="mt-8 text-sm text-[var(--color-text-muted)]">Yuklanmoqda…</p>
              ) : ranking.length === 0 ? (
                <p className="mt-8 text-sm text-[var(--color-text-muted)]">
                  Hozircha ma’lumot yo‘q — administrator talabalarni qo‘shadi.
                </p>
              ) : (
                <ul className="mt-6 max-h-[min(24rem,calc(100vh-12rem))] space-y-2 overflow-y-auto pr-1 sm:max-h-[28rem]">
                  {ranking.slice(0, 10).map((row) => (
                    <li key={row.studentId}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/85 px-3 py-2.5 text-left transition hover:border-teal-500/40 hover:bg-[var(--color-bg-deep)] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                        onClick={() => setRankDetail(row)}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <RankBadge rank={row.rank} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-[var(--color-text)]">{row.name}</p>
                            <p className="truncate text-[11px] text-[var(--color-text-muted)] sm:text-xs">
                              {row.group}
                            </p>
                            {row.badge ? (
                              <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-teal-400/90 sm:text-[11px]">
                                {row.badge}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <span className="shrink-0 rounded-xl bg-teal-500/15 px-3 py-1 text-sm font-bold tabular-nums text-teal-300">
                          {row.score}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6 flex items-center justify-between rounded-xl bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300 ring-1 ring-emerald-500/25">
                <span>{homeCopy.rankingCardHint}</span>
                <Link to="/reyting" className="font-semibold text-teal-300 hover:text-teal-200">
                  Barchasi →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!loading && homeAnnouncements.length > 0 ? (
        <section className="px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
                  So‘nggi <span className="text-teal-400">e&apos;lonlar</span>
                </h2>
                <p className="mt-2 max-w-xl text-[var(--color-text-muted)]">
                  Kunlik yangilanishlar va eng so‘nggi xabarlar — barchasi uchun{' '}
                  <Link to="/elonlar" className="font-semibold text-teal-400 hover:text-teal-300">
                    E&apos;lonlar
                  </Link>{' '}
                  bo‘limiga o‘ting.
                </p>
              </div>
              <Link
                to="/elonlar"
                className="inline-flex w-fit items-center justify-center rounded-full border border-teal-500/40 bg-teal-500/10 px-5 py-2 text-sm font-bold text-teal-300 transition hover:bg-teal-500/20"
              >
                Barcha e&apos;lonlar
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {homeAnnouncements.map((p) => (
                <article
                  key={p.id}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-[var(--color-border-subtle)] shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  {p.imagePath ? (
                    <img
                      src={publicFileUrl(p.imagePath)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                  <div
                    className={`absolute inset-0 ${p.imagePath ? 'bg-gradient-to-t from-black/88 via-black/45 to-black/10' : ''}`}
                    aria-hidden
                  />
                  {!p.imagePath ? <PromoAccent accent={p.accent} /> : null}
                  <div className="relative flex min-h-[180px] flex-col justify-between p-6">
                    <div>
                      <span className="inline-block rounded-full bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur">
                        {p.tag}
                      </span>
                      <h3 className="mt-4 font-display text-lg font-bold text-white drop-shadow-md">{p.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/88">{p.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <RankingDetailModal row={rankDetail} onClose={() => setRankDetail(null)} />
    </div>
  )
}
