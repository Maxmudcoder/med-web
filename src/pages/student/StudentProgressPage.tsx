import { useEffect, useMemo, useState } from 'react'
import { fetchAuthJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { achievementKindShortUz } from '@/lib/achievementLabels'

type Row = {
  id: string
  createdAt: string
  kind: string
  title: string
  orgName: string
  status: string
  pointsAwarded: number | null
  cumulativePoints: number
}

export function StudentProgressPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<Row[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchAuthJson<{ items: Row[] }>('/api/student/submissions/timeline', token)
        if (!cancelled) setItems(data.items)
      } catch {
        if (!cancelled) setErr('Yuklanmadi.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const maxCum = useMemo(() => Math.max(...items.map((r) => r.cumulativePoints), 1), [items])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
          Rivojlanish tarixi
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Har bir yuklangan material va moderatsiya natijasidan keyin jami ball qanday oʻzgani — chronologiya.
        </p>
      </div>

      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      {items.length > 0 ? (
        <section className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-400">Balllar bo‘yicha sodda grafik</h2>
          <div className="mt-4 flex h-40 items-end gap-0.5 sm:gap-1">
            {items.map((r) => (
              <div
                key={r.id}
                title={`${r.title}: ${r.cumulativePoints}`}
                className="min-w-0 flex-1 rounded-t bg-gradient-to-t from-teal-800 to-teal-500/70 transition hover:to-teal-400"
                style={{ height: `${Math.max((r.cumulativePoints / maxCum) * 100, 6)}%` }}
              />
            ))}
          </div>
          <p className="mt-3 text-[10px] text-[var(--color-text-muted)]">
            Oraliq bosqichlar — chiqarilgan yozuvlar soniga mos.
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-5 shadow-inner">
        <h2 className="font-semibold text-[var(--color-text)]">Voqealar lentasi</h2>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">Hozircha yuklamalar yoʻq.</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {[...items].reverse().map((r) => (
              <li
                key={r.id}
                className="border-l-2 border-teal-500/35 pl-4 text-sm"
              >
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {new Date(r.createdAt).toLocaleString('uz-UZ')}
                </p>
                <p className="mt-1 font-medium text-[var(--color-text)]">{r.title}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{r.orgName}</p>
                <p className="mt-2 text-xs">
                  <span
                    className={
                      r.status === 'APPROVED'
                        ? 'text-emerald-400'
                        : r.status === 'REJECTED'
                          ? 'text-red-400'
                          : 'text-amber-300'
                    }
                  >
                    {r.status === 'APPROVED'
                      ? `Tasdiq · +${r.pointsAwarded ?? 0} ball`
                      : r.status === 'REJECTED'
                        ? 'Rad etilgan'
                        : 'Kutilmoqda'}
                  </span>
                  <span className="ml-2 tabular-nums text-[var(--color-text-muted)]">
                    ({achievementKindShortUz(r.kind)})
                  </span>
                </p>
                <p className="mt-1 tabular-nums text-xs font-semibold text-teal-300">
                  Shu paytgacha jami: {r.cumulativePoints}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
