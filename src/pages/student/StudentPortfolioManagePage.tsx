import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAuthJson, fetchPublicJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

type Sub = {
  title: string
  orgName: string
  kind: string
  points: number
  issuedAt: string
}

type Data = {
  fullName: string
  totalPoints: number
  items: Sub[]
}

export function StudentPortfolioManagePage() {
  const { token } = useAuth()
  const [publicOn, setPublicOn] = useState(false)
  const [slug, setSlug] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [portfolio, setPortfolio] = useState<Data | null>(null)
  const [err, setErr] = useState('')

  const loadPublicPreview = useCallback(async (s: string | null | undefined) => {
    if (!s) {
      setPortfolio(null)
      return
    }
    try {
      const d = await fetchPublicJson<Data>(`/api/public/portfolio/${encodeURIComponent(s)}`)
      setPortfolio(d)
    } catch {
      setPortfolio(null)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const p = await fetchAuthJson<{
          notifyOnNewAnnouncement?: boolean
          portfolioPublic?: boolean
          portfolioSlug?: string | null
        }>('/api/student/preferences', token)
        if (!cancelled) {
          setPublicOn(!!p.portfolioPublic)
          setSlug(p.portfolioSlug ?? null)
          await loadPublicPreview(p.portfolioSlug ?? undefined)
        }
      } catch {
        setErr('Sozlamalar yuklanmadi')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, loadPublicPreview])

  async function toggle(checked: boolean) {
    if (!token) return
    setSaving(true)
    setErr('')
    try {
      const next = await fetchAuthJson<{
        portfolioPublic?: boolean
        portfolioSlug?: string | null
      }>('/api/student/preferences', token, {
        method: 'PATCH',
        body: JSON.stringify({ portfolioPublic: checked }),
      })
      setPublicOn(!!next.portfolioPublic)
      const newSlug = next.portfolioSlug ?? null
      setSlug(newSlug)
      await loadPublicPreview(newSlug ?? undefined)
    } catch {
      setErr('Saqlanmadi.')
    } finally {
      setSaving(false)
    }
  }

  const absoluteUrl = useMemo(() => {
    if (!slug) return ''
    const path = `/portfolio/${encodeURIComponent(slug)}`
    if (typeof window !== 'undefined') return `${window.location.origin}${path}`
    return path
  }, [slug])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
          Yutuqlar portfoliom
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Tasdiqlangan materiallaringiz ro‘yxati. Ommaga ochish ixtiyoriy — havolani ulashish yoki chop etish mumkin.
        </p>
      </div>

      <section className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={publicOn}
            disabled={saving || !token}
            onChange={(e) => void toggle(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-teal-500"
          />
          <span>
            <span className="font-semibold text-[var(--color-text)]">
              Portfolio hamma uchun koʻrinishi
            </span>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Ochiq sahifa faqat tasdiqlangan yutuqlar va jami ballni ko‘rsatadi; fayllarni yuklab bo‘lmaydi.
            </p>
          </span>
        </label>
        {slug ? (
          <div className="mt-4 rounded-xl bg-[var(--color-bg-deep)] p-4">
            <p className="text-xs uppercase text-teal-400">Havola</p>
            <a
              href={absoluteUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 break-all text-sm font-mono text-[var(--color-text)] underline"
            >
              {absoluteUrl}
            </a>
            <Link
              target="_blank"
              to={`/portfolio/${slug}`}
              className="mt-4 inline-block rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Ochiq sahifani yangi tabda
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-xs text-[var(--color-text-muted)]">
            Ochiq tugmasini yoqtiring — slug avtomatik yaratiladi.
          </p>
        )}
      </section>

      {portfolio && publicOn ? (
        <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border-subtle)] p-6 opacity-95">
          <p className="text-xs uppercase text-teal-400">Oldindan ko‘rinish (ochiq)</p>
          <h2 className="font-display mt-2 text-xl font-bold text-[var(--color-text)]">{portfolio.fullName}</h2>
          <p className="mt-1 tabular-nums text-teal-300">Ball: {portfolio.totalPoints}</p>
          <ul className="mt-4 divide-y divide-[var(--color-border-subtle)] text-sm">
            {portfolio.items.map((it) => (
              <li key={`${it.title}-${it.orgName}`} className="py-2">
                <span className="font-medium">{it.title}</span>
                <span className="text-[var(--color-text-muted)]"> — +{it.points}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {err ? <p className="text-sm text-red-400">{err}</p> : null}
    </div>
  )
}
