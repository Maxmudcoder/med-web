import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPublicJson } from '@/lib/api'
import { achievementKindShortUz } from '@/lib/achievementLabels'

type Data = {
  fullName: string
  groupName: string | null
  totalPoints: number
  portfolioSlug: string | null
  items: {
    title: string
    orgName: string
    kind: string
    articleJournalTier?: string | null
    points: number
    issuedAt: string
    note: string | null
  }[]
}

export function PublicPortfolioPage() {
  const { slug } = useParams<{ slug: string }>()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    const s = slug?.trim()
    if (!s) {
      setErr('Yo‘l noto‘g‘ri')
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    ;(async () => {
      try {
        const d = await fetchPublicJson<Data>(`/api/public/portfolio/${encodeURIComponent(s)}`)
        if (!cancelled) {
          setData(d)
          setErr('')
        }
      } catch {
        if (!cancelled) {
          setErr('Portfolio topilmadi yoki koʻrinishga yopilgan.')
          setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return <div className="public-page p-16 text-[var(--color-text-muted)]">Yuklanmoqda…</div>
  }

  if (!data) {
    return (
      <div className="public-page px-4 py-16">
        <p className="text-red-400">{err || 'Yo‘q'}</p>
        <Link className="mt-4 inline-block text-teal-400 underline" to="/">
          Bosh sahifa
        </Link>
      </div>
    )
  }

  return (
    <div className="public-page px-4 pb-24 pt-10 sm:px-6 print:bg-white print:text-black">
      <div className="mx-auto max-w-3xl">
        <div className="print:hidden">
          <nav className="mb-6 text-sm text-[var(--color-text-muted)]">
            <Link to="/" className="text-teal-400 hover:text-teal-300">
              Bosh sahifa
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span>Ochiq portfolio</span>
          </nav>
        </div>
        <div id="portfolio-print-area" className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 p-8 print:border-0 print:shadow-none">
          <header className="border-b border-[var(--color-border-subtle)] pb-6">
            <p className="text-xs uppercase tracking-wide text-teal-400 print:text-gray-700">Med-Iqtidor ochiq portfolio</p>
            <h1 className="font-display text-3xl font-bold text-[var(--color-text)] print:text-black">{data.fullName}</h1>
            {data.groupName ? (
              <p className="mt-2 text-sm text-[var(--color-text-muted)] print:text-gray-600">Guruh: {data.groupName}</p>
            ) : null}
            <p className="mt-3 text-xl font-semibold tabular-nums text-teal-400 print:text-gray-900">
              Jami ball (tasdiqlangan): {data.totalPoints}
            </p>
          </header>
          <h2 className="mt-8 font-semibold text-[var(--color-text)] print:text-black">Yutuqlar va sertifikatlar</h2>
          {data.items.length === 0 ? (
            <p className="mt-4 text-[var(--color-text-muted)]">Hali qoʻshilgan materiallar yoʻq.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[var(--color-border-subtle)] print:divide-gray-200">
              {data.items.map((it, idx) => (
                <li key={`${idx}-${it.title}-${it.orgName}`} className="py-4 text-sm">
                  <span className="font-medium text-[var(--color-text)] print:text-black">{it.title}</span>
                  <span className="text-[var(--color-text-muted)]"> — {it.orgName}</span>
                  <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {achievementKindShortUz(it.kind, it.articleJournalTier ?? null)} · +{it.points} ball ·{' '}
                    {new Date(it.issuedAt).toLocaleDateString('uz-UZ')}
                  </div>
                  {it.note?.trim() ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)] print:text-gray-800">
                      {it.note.trim()}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          className="mt-8 rounded-xl border border-[var(--color-border-subtle)] px-5 py-2 text-sm font-medium print:hidden"
          onClick={() => window.print()}
        >
          PDF / Chop etish
        </button>
      </div>
    </div>
  )
}
