import { type ChangeEvent, type FormEvent, useCallback, useEffect, useState } from 'react'
import { fetchAuthJson, apiUrl } from '@/lib/api'
import { AvatarCircleCover } from '@/components/AvatarCircleCover'
import { useAuth } from '@/context/AuthContext'
import { filePickTriggerLabelClass, nativeFileInputClass } from '@/lib/fileFieldStyles'

type Row = {
  id: string
  title: string
  body: string
  tag: string
  accent: string
  active: boolean
  sortOrder: number
  imagePath: string | null
}

const ACCENTS = [
  'teal',
  'blue',
  'violet',
  'emerald',
  'rose',
  'amber',
  'orange',
  'sky',
  'cyan',
  'pink',
  'slate',
  'fuchsia',
] as const

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const raw = await res.text()
  if (!raw.trim()) throw new Error(`HTTP ${res.status}`)
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error(`Server javobi notoʻgʻri (HTTP ${res.status})`)
  }
}

export function AdminAnnouncementsPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tag, setTag] = useState("E'lon")
  const [accent, setAccent] = useState<(typeof ACCENTS)[number]>('teal')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyImageId, setBusyImageId] = useState<string | null>(null)


  const load = useCallback(async () => {
    if (!token) return
    setErr('')
    try {
      const data = await fetchAuthJson<{ items: Row[] }>('/api/admin/announcements', token)
      setItems(data.items.map((r) => ({ ...r, imagePath: r.imagePath ?? null })))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setErr('')
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('body', body.trim())
      fd.append('tag', tag.trim() || "E'lon")
      fd.append('accent', accent)
      fd.append('active', 'true')
      if (imageFile) fd.append('image', imageFile)

      const res = await fetch(apiUrl('/api/admin/announcements'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await parseJsonResponse<{ error?: string; item?: Row }>(res)
      if (!res.ok) throw new Error('error' in data && data.error ? data.error : `HTTP ${res.status}`)
      setTitle('')
      setBody('')
      setTag("E'lon")
      setAccent('teal')
      setImageFile(null)
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!token || !confirm('O‘chirilsinmi?')) return
    setErr('')
    try {
      await fetchAuthJson(`/api/admin/announcements/${id}`, token, { method: 'DELETE' })
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    }
  }

  async function toggleActive(row: Row) {
    if (!token) return
    try {
      await fetchAuthJson(`/api/admin/announcements/${row.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ active: !row.active }),
      })
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    }
  }

  async function onPickImage(row: Row, ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!token || !file) return
    setBusyImageId(row.id)
    setErr('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch(apiUrl(`/api/admin/announcements/${row.id}/image`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await parseJsonResponse<{ error?: string }>(res)
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setBusyImageId(null)
    }
  }

  async function stripImage(row: Row) {
    if (!token || !row.imagePath) return
    setBusyImageId(row.id)
    setErr('')
    try {
      await fetchAuthJson(`/api/admin/announcements/${row.id}/image`, token, {
        method: 'DELETE',
      })
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setBusyImageId(null)
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--color-text)]">
          E&apos;lonlar va reklama
        </h1>
        <p className="mt-2 max-w-xl text-[var(--color-text-muted)]">
          Tadbir, musobaqa va tanlovlar uchun rang tanlang va ixtiyoriy banner-rasm qoʻshing —
          boshsahifa ham, e‘lonlar sahifasi ham rasm ustidan matn qoʻshilishini qoʻllab-quvvatlaydi.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl backdrop-blur sm:p-8"
      >
        <h2 className="font-display text-lg font-bold text-[var(--color-text)]">Yangi e&apos;lon</h2>
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                Sarlavha
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                Tur / teg
              </label>
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              Matn
            </label>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                Rang uslubi
              </label>
              <select
                value={accent}
                onChange={(e) => setAccent(e.target.value as (typeof ACCENTS)[number])}
                className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] outline-none"
              >
                {ACCENTS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                Banner rasm (ixtiyoriy, ≤4 Mb)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className={nativeFileInputClass}
              />
              {imageFile ? (
                <p className="mt-1 break-all text-xs font-medium text-[var(--color-text)]">{imageFile.name}</p>
              ) : null}
            </div>
          </div>
        </div>
        {err ? <p className="mt-4 text-sm text-red-400">{err}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="mt-6 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 px-8 py-3 font-semibold text-white shadow-lg shadow-teal-500/30 disabled:opacity-50"
        >
          {saving ? 'Joylanmoqda…' : 'Joylash'}
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold text-[var(--color-text)]">Mavjud e&apos;lonlar</h2>
        {loading ? (
          <p className="text-[var(--color-text-muted)]">Yuklanmoqda…</p>
        ) : items.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">Hozircha yo‘q</p>
        ) : (
          <ul className="space-y-3">
            {items.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 gap-4">
                  {row.imagePath ? (
                    <AvatarCircleCover
                      src={apiUrl(row.imagePath)}
                      sizeClass="h-20 w-20"
                      ringClassName="border border-[var(--color-border-subtle)] ring-1 ring-white/15"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] text-[10px] text-[var(--color-text-muted)]">
                      Rasm yoʻq
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--color-text)]">{row.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-muted)]">{row.body}</p>
                    <p className="mt-2 text-xs text-teal-400/90">
                      {row.tag} · {row.accent} · {row.active ? 'faol' : 'yashirin'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    id={`img-${row.id}`}
                    onChange={(ev) => void onPickImage(row, ev)}
                  />
                  <label
                    htmlFor={`img-${row.id}`}
                    className={`${filePickTriggerLabelClass} px-4 py-2 ${
                      busyImageId === row.id ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    {busyImageId === row.id ? 'Yuklanmoqda…' : 'Rasm'}
                  </label>
                  {row.imagePath ? (
                    <button
                      type="button"
                      disabled={busyImageId === row.id}
                      onClick={() => void stripImage(row)}
                      className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2 text-xs font-semibold text-[var(--color-text-muted)]"
                    >
                      Rasmni oʻchirish
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void toggleActive(row)}
                    className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2 text-xs font-semibold text-[var(--color-text)] hover:border-teal-500/50"
                  >
                    {row.active ? 'Yashirish' : 'Ko‘rsatish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(row.id)}
                    className="rounded-xl bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-300 ring-1 ring-red-500/30"
                  >
                    O‘chirish
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
