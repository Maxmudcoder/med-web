import { useCallback, useEffect, useState } from 'react'
import { apiUrl, fetchAuthJson } from '@/lib/api'
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
  scientificSupervisor?: string | null
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

  async function downloadSubmissionPdf(submissionId: string, fallbackTitle: string) {
    if (!token) return
    try {
      const r = await fetch(apiUrl(`/api/student/submissions/${encodeURIComponent(submissionId)}/pdf`), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) {
        let msg = `HTTP ${r.status}`
        try {
          const j = (await r.clone().json()) as { error?: string }
          if (j?.error) msg = j.error
        } catch {
          /* noop */
        }
        throw new Error(msg)
      }
      const blob = await r.blob()
      const cd = r.headers.get('Content-Disposition')
      let fileName = `${fallbackTitle.replace(/\s+/g, '_').slice(0, 80)}_pdf.pdf`
      const m = /filename="([^";]+)"/.exec(cd ?? '')
      if (m?.[1]) fileName = m[1]
      const objectUrl = URL.createObjectURL(blob)
      try {
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = fileName
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'PDF yuklab boʻlmadi')
    }
  }

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
        Yuklagan hujjatlaringiz ro‘yxati va har biri bo‘yicha moderatsiya holati. Rasm yoki boshqa formatdagi ilovani bitta
        PDF da olish uchun «PDF qilib yuklab olish»dan foydalaning.
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
                      <span className="font-normal text-[var(--color-text-muted)]">Ball moderator tasdig‘idan keyin</span>
                    ) : (
                      <>{r.points ?? '—'} ball</>
                    )}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <a
                    href={apiUrl(r.filePath)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm font-medium text-teal-400 hover:underline"
                  >
                    Faylni ochish
                  </a>
                  <button
                    type="button"
                    onClick={() => void downloadSubmissionPdf(r.id, r.title)}
                    className="inline-flex text-sm font-medium text-teal-400 underline-offset-2 hover:underline"
                  >
                    PDF qilib yuklab olish
                  </button>
                </div>
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
                    <th className="px-5 py-4 font-semibold text-[var(--color-text-muted)]">Ball</th>
                    <th className="px-5 py-4 font-semibold text-[var(--color-text-muted)]">Fayl</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--color-border-subtle)]/60">
                      <td className="px-5 py-4">
                        <p className="font-medium text-[var(--color-text)]">{r.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{r.orgName}</p>
                        {r.scientificSupervisor?.trim() ? (
                          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                            Ilmiy rahbar: {r.scientificSupervisor.trim()}
                          </p>
                        ) : null}
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
                            <span className="block text-xs font-normal text-[var(--color-text-muted)]">
                              Yakuniy ball moderator tasdig‘idan keyin
                            </span>
                          ) : (
                            <span>{r.points ?? '—'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          <a
                            href={apiUrl(r.filePath)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-teal-400 hover:underline"
                          >
                            Ochish
                          </a>
                          <button
                            type="button"
                            onClick={() => void downloadSubmissionPdf(r.id, r.title)}
                            className="text-left text-sm text-teal-400 underline-offset-2 hover:underline"
                          >
                            PDF qilib yuklab olish
                          </button>
                        </div>
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
