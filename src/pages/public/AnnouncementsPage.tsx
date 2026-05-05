import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiUrl, fetchPublicJson } from '@/lib/api'
import { PromoAccent, type AnnouncementItem } from '@/pages/public/publicUi'

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tag, setTag] = useState('')
  const [q, setQ] = useState('')
  const [qDraft, setQDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    p.set('limit', '120')
    if (tag.trim()) p.set('tag', tag.trim())
    if (q.trim()) p.set('q', q.trim())
    return `?${p.toString()}`
  }, [tag, q])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const t = await fetchPublicJson<{ tags: string[] }>('/api/public/announcement-tags')
        if (!cancelled) setTags(t.tags)
      } catch {
        if (!cancelled) setTags([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setErr('')
      setLoading(true)
      try {
        const a = await fetchPublicJson<{ items: AnnouncementItem[] }>(
          `/api/public/announcements${qs}`,
        )
        if (!cancelled) setAnnouncements(a.items)
      } catch {
        if (!cancelled) setErr("Server bilan aloqa yo'q yoki e'lonlar yuklanmadi.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [qs])

  function onSearch(e: FormEvent) {
    e.preventDefault()
    setQ(qDraft.trim())
  }

  return (
    <div className="public-page relative px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-teal-500/10 to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        <nav className="mb-6 text-sm text-[var(--color-text-muted)]">
          <Link to="/" className="text-teal-400 hover:text-teal-300">
            Bosh sahifa
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="text-[var(--color-text)]">E&apos;lonlar</span>
        </nav>

        <header className="mb-12">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/35 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-300">
            Barcha e&apos;lonlar
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              E&apos;lonlar
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--color-text-muted)]">
            Teglar boʻyicha filtrlash, matn bilan qidirish. Sahifa pastida boshqa bo‘limlarga yoʻllanma.
          </p>

          <form onSubmit={onSearch} className="mt-6 flex max-w-xl flex-wrap gap-2">
            <input
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              placeholder="Qidiruv (matn)"
              className="min-w-[12rem] flex-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-2.5 text-sm text-[var(--color-text)]"
            />
            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Qidirish
            </button>
            <button
              type="button"
              onClick={() => {
                setQDraft('')
                setQ('')
                setTag('')
              }}
              className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2.5 text-sm text-[var(--color-text-muted)]"
            >
              Tozalash
            </button>
          </form>

          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTag('')}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  tag === '' ? 'bg-teal-600 text-white' : 'border border-[var(--color-border-subtle)]'
                }`}
              >
                Barchasi
              </button>
              {tags.map((tg) => (
                <button
                  key={tg}
                  type="button"
                  onClick={() => setTag(tag === tg ? '' : tg)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    tag === tg ? 'bg-teal-600 text-white' : 'border border-[var(--color-border-subtle)]'
                  }`}
                >
                  {tg}
                </button>
              ))}
            </div>
          ) : null}

          {err ? (
            <p className="mt-6 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">
              {err}
            </p>
          ) : null}
        </header>

        {loading ? (
          <p className="text-[var(--color-text-muted)]">Yuklanmoqda…</p>
        ) : announcements.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/40 px-6 py-14 text-center text-[var(--color-text-muted)]">
            Natija yoʻq — filtrlarni o‘zgartiring yoki keyin qayta kiring.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {announcements.map((p) => (
              <article
                key={p.id}
                className="group relative overflow-hidden rounded-[1.75rem] border border-[var(--color-border-subtle)] shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
              >
                {p.imagePath ? (
                  <img
                    src={apiUrl(p.imagePath)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                <div
                  className={`absolute inset-0 ${p.imagePath ? 'bg-gradient-to-t from-black/88 via-black/40 to-black/10' : ''}`}
                  aria-hidden
                />
                {!p.imagePath ? <PromoAccent accent={p.accent} /> : null}
                <div className="relative flex min-h-[220px] flex-col justify-between p-7">
                  <div>
                    <span className="inline-block rounded-full bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur">
                      {p.tag}
                    </span>
                    <h2 className="mt-5 font-display text-xl font-bold text-white drop-shadow-md">{p.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/88">{p.body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
