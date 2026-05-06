import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAuthJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

type StudentRow = {
  id: string
  login: string
  blocked: boolean
  fullName: string | null
  groupName: string | null
}

export function AdminStudentMessagePage() {
  const { token } = useAuth()
  const [students, setStudents] = useState<StudentRow[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentErr, setStudentErr] = useState('')

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [broadcastAll, setBroadcastAll] = useState(false)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState<{
    inApp: number
    email: number
    skipped?: number
    mode: string
  } | null>(null)

  const loadStudents = useCallback(async () => {
    if (!token) return
    setStudentErr('')
    setStudentsLoading(true)
    try {
      const data = await fetchAuthJson<{
        items: {
          id: string
          login: string
          blocked: boolean
          fullName: string | null
          groupName: string | null
        }[]
      }>('/api/admin/students', token)
      const rows = (data.items ?? []).map((u) => ({
        id: u.id,
        login: u.login,
        blocked: u.blocked,
        fullName: u.fullName,
        groupName: u.groupName,
      }))
      setStudents(rows.filter((r) => !r.blocked))
    } catch (e) {
      setStudentErr(e instanceof Error ? e.message : 'Talabalar yuklanmadi')
      setStudents([])
    } finally {
      setStudentsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadStudents()
  }, [loadStudents])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) => {
      const name = (s.fullName ?? '').toLowerCase()
      const login = s.login.toLowerCase()
      const grp = (s.groupName ?? '').toLowerCase()
      return name.includes(q) || login.includes(q) || grp.includes(q)
    })
  }, [students, query])

  const activeSelectable = useMemo(() => filtered.filter((s) => !s.blocked), [filtered])

  function toggleId(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllFiltered() {
    setSelected(new Set(activeSelectable.map((s) => s.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setErr('')
    setResult(null)
    const t = title.trim()
    const b = body.trim()
    if (t.length < 1 || b.length < 1) {
      setErr('Sarlavha va matn majburiy.')
      return
    }
    if (!broadcastAll && selected.size === 0) {
      setErr('Kamida bitta talaba tanlang yoki «Barcha faol talabalarga» ni yoqing.')
      return
    }
    setSaving(true)
    try {
      const payload = broadcastAll
        ? { title: t, body: b, broadcastAll: true as const }
        : { title: t, body: b, studentIds: [...selected] }
      const data = await fetchAuthJson<{
        ok?: boolean
        inAppCount?: number
        emailAttemptCount?: number
        skippedInvalid?: number
        mode?: string
      }>('/api/admin/talaba-xabar', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setResult({
        inApp: data.inAppCount ?? 0,
        email: data.emailAttemptCount ?? 0,
        skipped: data.skippedInvalid,
        mode: data.mode ?? 'selected',
      })
      setTitle('')
      setBody('')
      setSelected(new Set())
      setBroadcastAll(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-student-msg min-w-0 max-w-4xl">
      <h1 className="mb-2 font-display text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
        Talabaga shaxsiy xabar
      </h1>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        Roʻyxatdan <strong className="text-[var(--color-text)]">bitta yoki bir nechta talabani</strong> tanlang —
        ularga kabinetdagi <strong className="text-[var(--color-text)]">qo‘ng‘iroqcha</strong> orqali xabar boradi.
        Email ular profilda yoqqan boʻlsa, nusxa ketadi. Kerak boʻlsa barcha faol talabalarga bir zumda ham yuborish
        mumkin.
      </p>

      {err ? (
        <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {err}
        </p>
      ) : null}
      {result ? (
        <p className="mb-4 rounded-xl border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-sm text-teal-100">
          <strong className="text-white">Yuborildi.</strong>{' '}
          {result.mode === 'all' ? 'Barcha faol talabalar: ' : 'Tanlanganlar: '}
          <span className="font-semibold">{result.inApp}</span> ta kabinetga
          {result.email > 0 ? (
            <>
              {' '}
              · email urinishlari: <span className="font-semibold">{result.email}</span>
            </>
          ) : null}
          {result.skipped != null && result.skipped > 0 ? (
            <>
              {' '}
              · tanlovdan chiqarilgan (topilmagan/bloklangan):{' '}
              <span className="font-semibold">{result.skipped}</span>
            </>
          ) : null}
          . Talabalarda xabar soni bir necha soniya ichida yangilanadi.
        </p>
      ) : null}

      <div className="mb-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-4 sm:p-5">
        <h2 className="text-sm font-bold text-[var(--color-text)]">Qabulxona</h2>
        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3">
          <input
            type="checkbox"
            checked={broadcastAll}
            onChange={(e) => {
              setBroadcastAll(e.target.checked)
              if (e.target.checked) setSelected(new Set())
            }}
            className="mt-1"
          />
          <span className="text-sm text-[var(--color-text)]">
            <span className="font-semibold text-amber-200/95">Barcha faol talabalarga</span> yuborish (bloklanmaganlar;
            tanlanganlar eʼtiborga olinmaydi)
          </span>
        </label>

        {!broadcastAll ? (
          <>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Qidirish: ism, login, guruh"
                className="min-w-0 flex-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => selectAllFiltered()}
                  className="rounded-lg border border-teal-500/40 px-3 py-2 text-xs font-semibold text-teal-200"
                >
                  Filtrdagilarni tanlash
                </button>
                <button
                  type="button"
                  onClick={() => clearSelection()}
                  className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-xs text-[var(--color-text-muted)]"
                >
                  Tanlovni tozalash
                </button>
                <button
                  type="button"
                  onClick={() => void loadStudents()}
                  className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-xs text-[var(--color-text-muted)]"
                >
                  Roʻyxatni yangilash
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Tanlangan: <strong className="text-[var(--color-text)]">{selected.size}</strong> ta
            </p>
            {studentErr ? (
              <p className="mt-2 text-sm text-red-300">{studentErr}</p>
            ) : studentsLoading ? (
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">Talabalar yuklanmoqda…</p>
            ) : activeSelectable.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">Faol talaba yoʻq yoki qidiruv boʻsh.</p>
            ) : (
              <ul className="mt-3 max-h-[min(22rem,45vh)] space-y-1 overflow-y-auto rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/50 p-2">
                {activeSelectable.map((s) => (
                  <li key={s.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.04]">
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleId(s.id)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 text-sm">
                        <span className="font-medium text-[var(--color-text)]">
                          {s.fullName?.trim() || s.login}
                        </span>
                        <span className="text-[var(--color-text-muted)]"> · {s.login}</span>
                        {s.groupName?.trim() ? (
                          <span className="block text-xs text-[var(--color-text-muted)]">{s.groupName.trim()}</span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            Hozir rejim: barcha faol talabalar. Pastdagi forma orqali yuboring.
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-5 sm:p-6">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Sarlavha
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className="mt-1.5 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2.5 text-[var(--color-text)] outline-none ring-teal-500/0 focus:ring-2 focus:ring-teal-500/30"
            placeholder="Masalan: Qiyosiy imtihon sanasi"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Matn
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
            maxLength={12000}
            className="mt-1.5 w-full resize-y rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2.5 text-sm leading-relaxed text-[var(--color-text)] outline-none ring-teal-500/0 focus:ring-2 focus:ring-teal-500/30"
            placeholder="Talaba koʻradigan xabar matni…"
          />
        </label>
        <button
          type="submit"
          disabled={
            saving ||
            !token ||
            (!broadcastAll && selected.size === 0) ||
            (broadcastAll && students.filter((s) => !s.blocked).length === 0 && !studentsLoading)
          }
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-900/25 transition hover:bg-teal-500 disabled:opacity-40"
        >
          {saving ? 'Yuborilmoqda…' : broadcastAll ? 'Barcha faol talabalarga yuborish' : 'Tanlanganlarga yuborish'}
        </button>
      </form>
    </div>
  )
}
