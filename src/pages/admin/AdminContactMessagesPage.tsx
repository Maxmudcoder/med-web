import { useMemo, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAuthJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { telHref } from '@/lib/telHref'

type Row = {
  id: string
  fullName: string
  groupName: string | null
  phone: string
  body: string
  readAt: string | null
  createdAt: string
}

type FilterTab = 'all' | 'unread'

export function AdminContactMessagesPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<Row[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [tab, setTab] = useState<FilterTab>('unread')

  const load = useCallback(async () => {
    if (!token) return
    setErr('')
    try {
      const data = await fetchAuthJson<{ items: Row[]; unreadCount: number }>(
        '/api/admin/contact-messages',
        token,
      )
      setItems(data.items)
      setUnreadCount(data.unreadCount)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(() => {
    if (tab === 'unread') return items.filter((r) => !r.readAt)
    return items
  }, [items, tab])

  async function setRead(id: string, read: boolean) {
    if (!token) return
    setBusyId(id)
    try {
      await fetchAuthJson<{ ok?: boolean }>(`/api/admin/contact-messages/${id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ read }),
      })
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setBusyId(null)
    }
  }

  async function copyPhones() {
    const text = visible.map((r) => `${r.fullName}\t${r.phone}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return <p className="text-[var(--color-text-muted)]">Yuklanmoqda…</p>
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-[var(--color-text)]">
        Kelgan xabarlar
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-[var(--color-text-muted)]">
        «Aloqa» sahifasidan yuborilgan xabarlar. Telefonni bir bosishda{' '}
        <span className="text-[var(--color-text)]">aloqa</span> qilish va roʻyxatni filtrlash mumkin.
        Boshqaruv panelidagi statistikada ham oʻqilmaganlar soni chiqadi.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/80 p-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setTab('unread')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            tab === 'unread'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-500/25'
              : 'text-[var(--color-text-muted)] hover:bg-white/5'
          }`}
        >
          O‘qilmagan ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            tab === 'all'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-500/25'
              : 'text-[var(--color-text-muted)] hover:bg-white/5'
          }`}
        >
          Barchasi ({items.length})
        </button>
        <span className="hidden h-6 w-px bg-[var(--color-border-subtle)] sm:block" />
        <Link
          to="/admin"
          className="rounded-xl px-3 py-2 text-xs font-medium text-teal-400 ring-1 ring-teal-500/30 hover:bg-teal-500/10"
        >
          Bosh sahifaga qaytish
        </Link>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2 text-sm text-[var(--color-text)]"
        >
          Yangilash
        </button>
        {visible.length > 0 ? (
          <button
            type="button"
            onClick={() => void copyPhones()}
            className="rounded-xl border border-teal-500/40 px-4 py-2 text-sm text-teal-200"
          >
            Ko‘rinadiganlarni clipboard
          </button>
        ) : null}
      </div>
      {err ? <p className="mb-4 text-[var(--color-danger)]">{err}</p> : null}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/60 px-6 py-14 text-center text-[var(--color-text-muted)]">
          {tab === 'unread'
            ? 'O‘qilmagan xabar yoʻq — yaxshi! Barchasini koʻrish uchun yuqoridagi «Barchasi» ni bosing.'
            : 'Hali hech qanday xabar yoʻq. Tashrifchilar `/aloqa` dan yozishadi.'}
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((r) => {
            const tel = telHref(r.phone)
            return (
              <li
                key={r.id}
                className={`rounded-2xl border p-5 transition ${
                  r.readAt
                    ? 'border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/70'
                    : 'border-teal-500/45 bg-gradient-to-br from-teal-500/[0.07] to-[var(--color-bg-card)]/90 ring-1 ring-teal-500/20'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-semibold text-[var(--color-text)]">
                        {r.fullName}
                      </p>
                      {r.groupName ? (
                        <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs text-[var(--color-text-muted)]">
                          {r.groupName}
                        </span>
                      ) : null}
                      {!r.readAt ? (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                          Yangi
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2">
                      {tel ? (
                        <a
                          href={tel}
                          className="text-base font-semibold text-teal-300 underline decoration-teal-500/35 hover:text-teal-200"
                        >
                          {r.phone}
                        </a>
                      ) : (
                        <span className="text-teal-200/90">{r.phone}</span>
                      )}
                    </p>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
                      {r.body}
                    </p>
                    <p className="mt-4 text-[11px] text-[var(--color-text-muted)]">
                      Qabul:{' '}
                      {new Date(r.createdAt).toLocaleString('uz-UZ', { hour12: false })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {tel ? (
                      <a
                        href={tel}
                        className="rounded-xl bg-teal-600/90 px-3 py-2 text-xs font-bold text-white shadow-md shadow-teal-500/20"
                      >
                        Qo‘ng‘iroq
                      </a>
                    ) : null}
                    {r.readAt ? (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => void setRead(r.id, false)}
                        className="rounded-xl border border-[var(--color-border-subtle)] px-3 py-2 text-xs text-[var(--color-text-muted)]"
                      >
                        O‘qilmagan qilib
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => void setRead(r.id, true)}
                        className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white"
                      >
                        O‘qilgan
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
