import { useCallback, useEffect, useState } from 'react'
import { fetchAuthJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

type Row = {
  id: string
  kind: string
  title: string
  orgName: string
  issuedAt: string
  status: string
  points: number | null
  adminNote: string | null
  filePath: string
  createdAt: string
  aiScore?: number | null
  aiSuggestedPoints?: number | null
  aiAssessment?: string | null
}

const statusUz: Record<string, string> = {
  PENDING: 'Tasdiq kutilmoqda',
  APPROVED: 'Tasdiqlangan',
  REJECTED: 'Rad etilgan',
}

export function StudentCertificatesPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const data = await fetchAuthJson<{ items: Row[] }>('/api/student/submissions', token)
      setItems(data.items)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="min-w-0">
      <h1 className="font-display text-xl font-bold text-[var(--color-text)] sm:text-2xl">
        Materiallar va sertifikatlar
      </h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)] sm:text-base">
        Yuklagan hujjatlaringiz ro‘yxati va har biri bo‘yicha moderatsiya holati.
      </p>

      {loading ? (
        <p className="mt-8 text-[var(--color-text-muted)]">Yuklanmoqda…</p>
      ) : items.length === 0 ? (
        <p className="mt-8 rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/80 px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
          Hali materiall yo‘q — «Yuklash» bo‘limidan yuboring.
        </p>
      ) : (
        <>
          <div className="mt-6 space-y-4 md:hidden">
            {items.map((r) => (
              <article
                key={r.id}
                className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 p-4 shadow-lg"
              >
                <p className="font-medium leading-snug text-[var(--color-text)]">{r.title}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{r.orgName}</p>
                {r.adminNote && r.status === 'REJECTED' ? (
                  <p className="mt-2 text-xs text-red-300/90">{r.adminNote}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-lg bg-[var(--color-bg-deep)] px-2 py-1 text-[var(--color-text-muted)]">
                    {statusUz[r.status] ?? r.status}
                  </span>
                  <span className="tabular-nums font-semibold text-teal-400">
                    {r.status === 'PENDING' ? (
                      <>
                        {r.aiSuggestedPoints != null ? `≈ ${r.aiSuggestedPoints}` : '—'}
                        <span className="ml-1 font-normal text-[var(--color-text-muted)]">
                          {r.points != null ? `· yakuniy ${r.points}` : '· yakuniy —'}
                        </span>
                      </>
                    ) : (
                      <>{r.points ?? '—'} ball</>
                    )}
                  </span>
                </div>
                {r.status === 'PENDING' && r.aiAssessment?.trim() ? (
                  <p className="mt-2 text-[11px] leading-snug text-[var(--color-text-muted)]">
                    {r.aiAssessment.length > 160 ? `${r.aiAssessment.slice(0, 160)}…` : r.aiAssessment}
                  </p>
                ) : null}
                <a
                  href={r.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-sm font-medium text-teal-400 hover:underline"
                >
                  Faylni ochish
                </a>
              </article>
            ))}
          </div>

          <div className="mt-8 hidden overflow-hidden rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 shadow-xl md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/90">
                    <th className="px-5 py-4 font-semibold text-[var(--color-text-muted)]">Sarlavha</th>
                    <th className="px-5 py-4 font-semibold text-[var(--color-text-muted)]">Holat</th>
                    <th className="px-5 py-4 font-semibold text-[var(--color-text-muted)]">
                      Tavsiya va yakuniy ball
                    </th>
                    <th className="px-5 py-4 font-semibold text-[var(--color-text-muted)]">Fayl</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--color-border-subtle)]/60">
                      <td className="px-5 py-4">
                        <p className="font-medium text-[var(--color-text)]">{r.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{r.orgName}</p>
                        {r.adminNote && r.status === 'REJECTED' ? (
                          <p className="mt-1 text-xs text-red-300/90">{r.adminNote}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-[var(--color-text-muted)]">
                        {statusUz[r.status] ?? r.status}
                      </td>
                      <td className="px-5 py-4">
                        <div className="tabular-nums font-semibold text-teal-400">
                          {r.status === 'PENDING' ? (
                            <span title="Tasdiqdan oldingi avtomatik tavsiya">
                              {r.aiSuggestedPoints != null ? `≈ ${r.aiSuggestedPoints}` : '—'}
                              <span className="mt-1 block text-xs font-normal normal-case text-[var(--color-text-muted)]">
                                {r.points != null
                                  ? `Yakuniy: ${r.points}`
                                  : 'Yakuniy ball — tasdiqdan keyin'}
                              </span>
                            </span>
                          ) : (
                            <span>{r.points ?? '—'}</span>
                          )}
                        </div>
                        {r.status === 'PENDING' && r.aiAssessment?.trim() ? (
                          <p className="mt-2 max-w-xs text-[11px] leading-snug text-[var(--color-text-muted)]">
                            {r.aiAssessment.length > 120
                              ? `${r.aiAssessment.slice(0, 120)}…`
                              : r.aiAssessment}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <a
                          href={r.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-teal-400 hover:underline"
                        >
                          Ochish
                        </a>
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
  )
}
