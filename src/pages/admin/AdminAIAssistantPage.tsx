import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAuthJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

type Snapshot = {
  pendingSubmissions: Array<{
    id: string
    title: string
    createdAt: string
    aiSuggestedPoints: number | null
    aiScore: number | null
    studentLogin: string
    studentName: string | null
  }>
}

export function AdminAIAssistantPage() {
  const { token } = useAuth()
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [briefText, setBriefText] = useState('')
  const [briefLoading, setBriefLoading] = useState(false)
  const [nudgeMsg, setNudgeMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [nudgeLoading, setNudgeLoading] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await fetchAuthJson<Snapshot>(
        '/api/admin/dashboard/snapshot',
        token,
      )
      setSnap(data)
    } catch {
      setSnap(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  async function loadBrief() {
    if (!token) return
    setBriefLoading(true)
    setBriefText('')
    try {
      const { text } = await fetchAuthJson<{ text: string }>(
        '/api/admin/dashboard/brief',
        token,
        { method: 'POST', body: '{}' },
      )
      setBriefText(text)
    } catch (e) {
      setBriefText(e instanceof Error ? e.message : 'Xato')
    } finally {
      setBriefLoading(false)
    }
  }

  async function sendMotivation() {
    if (!token || !window.confirm('Past balli talabalarga motivatsiya xabari yuborilsinmi? (~10 nafar)'))
      return
    setNudgeLoading(true)
    setNudgeMsg(null)
    try {
      const r = await fetchAuthJson<{ ok?: boolean; notifiedStudents?: number }>(
        '/api/admin/motivation/nudge',
        token,
        { method: 'POST', body: '{}' },
      )
      setNudgeMsg({
        ok: true,
        text: `Yuborildi: ${r.notifiedStudents ?? 0} ta talaba.`,
      })
    } catch (e) {
      setNudgeMsg({
        ok: false,
        text: e instanceof Error ? e.message : 'Xato',
      })
    } finally {
      setNudgeLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-text)]">AI yordamchi</h1>
          <p className="mt-2 max-w-xl text-[var(--color-text-muted)]">
            «Kunlik qisqa xulosa»: talabalar materiāl yuklashlari va berilgan tasdiq ballari, yangi akkauntlar — ro‘yxat
            — roʻyxat va qisqa tavsiya. Yakuniy ball har doim{' '}
            <Link className="font-semibold text-teal-400 underline" to="/admin/baholash">
              Baholash
            </Link>{' '}
            sahifasida. Pastgi o‘ngdagi chat tugmasi orqali ham kirishingiz mumkin.
          </p>
        </div>
        <button
          type="button"
          disabled={loading || !token}
          onClick={() => void load()}
          className="self-start rounded-xl border border-[var(--color-border-subtle)] px-4 py-2 text-sm text-[var(--color-text)] hover:bg-white/5 disabled:opacity-40"
        >
          Yangilash
        </button>
      </div>

      <section
        className="relative overflow-hidden rounded-[1.75rem] border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-[var(--color-bg-card)] to-teal-950/25 p-6 shadow-xl sm:p-8"
        aria-labelledby="ai-assist-heading"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col gap-2 border-b border-violet-500/20 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-300/90">
                AI vositalari
              </p>
              <h2 id="ai-assist-heading" className="font-display text-xl font-bold text-[var(--color-text)]">
                Materiāl xulosalari va navbat
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Yuklangan va baholangan materiallar ro‘yxati (xulosa), pastda navbat tasmasi. Har bir yuklash uchun
                tuzatish —{' '}
                <Link to="/admin/baholash" className="text-teal-300 underline">
                  Baholash
                </Link>
                .
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                disabled={briefLoading || !token}
                onClick={() => void loadBrief()}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:opacity-40"
              >
                {briefLoading ? 'Tayyorlanmoqda…' : 'Kunlik qisqa xulosa'}
              </button>
              <button
                type="button"
                disabled={nudgeLoading || !token}
                onClick={() => void sendMotivation()}
                className="rounded-xl border border-violet-400/35 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-500/20 disabled:opacity-40"
              >
                {nudgeLoading ? 'Yubormoqda…' : 'Past ball → motivatsiya xabari'}
              </button>
            </div>
          </div>

          {nudgeMsg ? (
            <p
              className={`mt-4 text-sm ${nudgeMsg.ok ? 'text-teal-300' : 'text-[var(--color-danger)]'}`}
            >
              {nudgeMsg.text}
            </p>
          ) : null}

          {briefText ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-5 backdrop-blur-sm">
              <h3 className="text-xs font-bold uppercase tracking-wide text-violet-200/90">
                Kunlik xulosa matni
              </h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
                {briefText}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              «Kunlik qisqa xulosa» tugmasini bosing — yuklamalar, tasdiqlar va yangi talabalar ro‘yxati chiqadi.
            </p>
          )}

          {!loading && snap ? (
            <div className="mt-8">
              <h3 className="font-semibold text-[var(--color-text)]">
                Navbat — avtomatik tavsiyalar (faqat ko‘rish)
              </h3>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Tasdiqlash va ball berish uchun{' '}
                <Link className="text-teal-300 underline" to="/admin/baholash">
                  Baholash
                </Link>{' '}
                bo‘limiga oʻting.
              </p>
              <ul className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto text-sm">
                {snap.pendingSubmissions.length === 0 ? (
                  <li className="text-[var(--color-text-muted)]">Navbat boʻsh.</li>
                ) : (
                  snap.pendingSubmissions.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-2xl border border-[var(--color-border-subtle)]/70 bg-[var(--color-bg-deep)]/90"
                    >
                      <div className="border-b border-[var(--color-border-subtle)]/50 px-3 py-2.5">
                        <p className="font-medium text-[var(--color-text)]">{p.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {p.studentName ?? p.studentLogin}
                        </p>
                      </div>
                      <div className="rounded-b-2xl bg-violet-500/15 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-violet-200/90">
                          AI bahosi
                        </p>
                        <p className="mt-1 text-sm text-teal-100">
                          Tavsiya ball:{' '}
                          <span className="tabular-nums font-semibold">
                            {p.aiSuggestedPoints ?? '—'}
                          </span>{' '}
                          · Ishonch:{' '}
                          {p.aiScore != null ? `${Math.round(p.aiScore * 100)}%` : '—'}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : loading ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[1, 2].map((k) => (
                <div
                  key={k}
                  className="h-24 animate-pulse rounded-2xl border border-violet-500/20 bg-violet-950/30"
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
