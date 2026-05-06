import { useEffect, useState } from 'react'
import { fetchPublicJson } from '@/lib/api'
import { StaffStickerAvatar } from '@/components/AvatarCircleCover'

type SiteInfo = {
  teachers: {
    sortOrder: number
    position: string
    fullName: string
    degree: string | null
    phone: string | null
    officeHours: string | null
    stickerUrl: string
  }[]
}

export function TeachersPage() {
  const [info, setInfo] = useState<SiteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setErr('')
      try {
        const data = await fetchPublicJson<SiteInfo>('/api/public/site-info')
        if (!cancelled) setInfo(data)
      } catch {
        if (!cancelled) setErr('Ma’lumot yuklanmadi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="public-page relative px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-teal-500/10 to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        <header className="mb-12">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/35 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-300">
            Alohida bo‘lim
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            O‘qituvchilar va rahbariyat
          </h1>
        </header>

        {loading ? (
          <p className="text-[var(--color-text-muted)]">Yuklanmoqda…</p>
        ) : err ? (
          <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">{err}</p>
        ) : info ? (
          <section aria-labelledby="oqituvlar-list" className="scroll-mt-28">
            <h2 id="oqituvlar-list" className="font-display text-2xl font-bold text-[var(--color-text)]">
              Lavozimlar bo‘yicha
            </h2>
            {info.teachers.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-dashed border-[var(--color-border-subtle)] px-6 py-12 text-center text-[var(--color-text-muted)]">
                Hozircha ma’lumot yo‘q — administrator qo‘shadi.
              </p>
            ) : (
              <ul className="mt-8 grid list-none gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {info.teachers.map((t) => (
                  <li
                    key={t.sortOrder}
                    className="flex flex-col rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 p-6 shadow-lg transition hover:border-teal-500/35"
                  >
                    <div className="flex gap-4">
                      <StaffStickerAvatar stickerUrl={t.stickerUrl} sizeClass="h-20 w-20" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-teal-400">{t.position}</p>
                        <p className="font-display text-lg font-bold leading-snug text-[var(--color-text)]">
                          {t.fullName}
                        </p>
                        {t.degree ? (
                          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t.degree}</p>
                        ) : null}
                      </div>
                    </div>
                    <dl className="mt-5 space-y-3 border-t border-[var(--color-border-subtle)] pt-5 text-sm">
                      <div>
                        <dt className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                          Telefon (lavozim)
                        </dt>
                        <dd className="mt-1">
                          {t.phone ? (
                            <a
                              href={`tel:${t.phone.replace(/\s/g, '')}`}
                              className="font-medium text-teal-300 underline decoration-teal-500/40 underline-offset-2 hover:text-teal-200"
                            >
                              {t.phone}
                            </a>
                          ) : (
                            <span className="text-[var(--color-text-muted)]">—</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                          Qabul / ish grafigi
                        </dt>
                        <dd className="mt-1 leading-relaxed text-[var(--color-text)]">{t.officeHours ?? '—'}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </div>
  )
}
