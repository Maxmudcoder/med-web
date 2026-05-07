import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAuthJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

type StudentRow = {
  id: string
  login: string
  blocked: boolean
  fullName: string | null
  groupName: string | null
  phone: string | null
  totalPoints: number
  notificationEmail: string | null
  notifyByEmail: boolean
  notifyOnNewAnnouncement: boolean
}

export function AdminStudentsPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [groupName, setGroupName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const [savingEdit, setSavingEdit] = useState(false)

  const [editFor, setEditFor] = useState<StudentRow | null>(null)
  const [editLogin, setEditLogin] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editFullName, setEditFullName] = useState('')
  const [editGroupName, setEditGroupName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editPoints, setEditPoints] = useState('0')
  const [editNotificationEmail, setEditNotificationEmail] = useState('')
  const [editNotifyByEmail, setEditNotifyByEmail] = useState(false)
  const [editNotifyOnAnnouncement, setEditNotifyOnAnnouncement] = useState(true)

  const [deleteFor, setDeleteFor] = useState<StudentRow | null>(null)
  const [deleteConfirmLogin, setDeleteConfirmLogin] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState('')

  function openEdit(u: StudentRow) {
    setEditFor(u)
    setEditLogin(u.login)
    setEditPassword('')
    setEditFullName(u.fullName ?? '')
    setEditGroupName(u.groupName ?? '')
    setEditPhone(u.phone ?? '')
    setEditPoints(String(u.totalPoints))
    setEditNotificationEmail(u.notificationEmail ?? '')
    setEditNotifyByEmail(u.notifyByEmail)
    setEditNotifyOnAnnouncement(u.notifyOnNewAnnouncement)
    setMsg('')
    setErr('')
  }

  function closeEdit() {
    setEditFor(null)
  }

  function openDelete(u: StudentRow) {
    setDeleteFor(u)
    setDeleteConfirmLogin('')
    setDeleteErr('')
  }

  function closeDelete() {
    setDeleteFor(null)
    setDeleteConfirmLogin('')
    setDeleteErr('')
  }

  async function confirmDelete() {
    if (!token || !deleteFor) return
    if (deleteConfirmLogin.trim().toLowerCase() !== deleteFor.login.toLowerCase()) {
      setDeleteErr('Tasdiqlash uchun logini aynan qatoricha yozing.')
      return
    }
    setDeleting(true)
    setDeleteErr('')
    try {
      await fetchAuthJson(`/api/admin/students/${deleteFor.id}`, token, { method: 'DELETE' })
      setMsg('Talaba o‘chirildi.')
      closeDelete()
      void load()
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setDeleting(false)
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (!token || !editFor) return
    const pts = Number(editPoints.replace(/\s/g, ''))
    if (!Number.isFinite(pts) || pts < 0 || pts > 999_999) {
      setErr('Ball raqami 0 dan 999 999 gacha boʻlishi kerak.')
      return
    }
    setSavingEdit(true)
    setErr('')
    try {
      const body: Record<string, unknown> = {
        login: editLogin.trim(),
        fullName: editFullName.trim(),
        groupName: editGroupName.trim(),
        phone: editPhone.trim(),
        totalPoints: Math.floor(pts),
        notificationEmail: editNotificationEmail.trim(),
        notifyByEmail: editNotifyByEmail,
        notifyOnNewAnnouncement: editNotifyOnAnnouncement,
      }
      if (editPassword.trim().length > 0) body.password = editPassword
      await fetchAuthJson(`/api/admin/students/${editFor.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      setMsg('Talaba yangilandi.')
      closeEdit()
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setSavingEdit(false)
    }
  }

  const load = useCallback(async () => {
    if (!token) return
    setErr('')
    try {
      const data = await fetchAuthJson<{
        items: Array<
          Omit<StudentRow, 'notificationEmail' | 'notifyByEmail' | 'notifyOnNewAnnouncement'> &
            Partial<Pick<StudentRow, 'notificationEmail' | 'notifyByEmail' | 'notifyOnNewAnnouncement'>>
        >
      }>('/api/admin/students', token)
      setItems(
        data.items.map((u) => ({
          ...u,
          notificationEmail: u.notificationEmail ?? null,
          notifyByEmail: u.notifyByEmail ?? false,
          notifyOnNewAnnouncement: u.notifyOnNewAnnouncement ?? true,
        })),
      )
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
    setMsg('')
    setErr('')
    if (!token) return
    setSaving(true)
    try {
      await fetchAuthJson('/api/admin/students', token, {
        method: 'POST',
        body: JSON.stringify({
          login: loginId.trim(),
          password,
          fullName: fullName.trim(),
          groupName: groupName.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      })
      setMsg('Talaba qo‘shildi.')
      setLoginId('')
      setPassword('')
      setFullName('')
      setGroupName('')
      setPhone('')
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setSaving(false)
    }
  }

  async function toggleBlock(id: string, blocked: boolean) {
    if (!token) return
    setErr('')
    try {
      await fetchAuthJson(`/api/admin/students/${id}/block`, token, {
        method: 'PATCH',
        body: JSON.stringify({ blocked: !blocked }),
      })
      void load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--color-text)]">Talabalar</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Har bir qatorda «Tahrirlash» orqali login, parol (boʻsh qoldirsangiz eski parol), ism, guruh, telefon, ball va
          bildirishnoma emailini saqlaysiz. Guruh yoki telefonni oʻchirish uchun maydonni boʻsh qilib saqlang. Pasport,
          manzil va ichki yutuqlar «Kabinet» sahifasida.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl backdrop-blur sm:p-8"
      >
        <h2 className="font-display text-lg font-bold text-[var(--color-text)]">Talaba qo‘shish</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              Login (yagona ID)
            </label>
            <input
              required
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="masalan: talaba_042"
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 font-mono text-[var(--color-text)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              Parol (≥4 belgi)
            </label>
            <input
              required
              type="password"
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              To‘liq ism
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              Guruh / kurs
            </label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="masalan: 3-kurs Pediatriya"
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
              Telefon
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
            />
          </div>
        </div>
        {msg ? (
          <p className="mt-4 text-sm text-emerald-400">{msg}</p>
        ) : null}
        {err ? <p className="mt-4 text-sm text-red-400">{err}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="mt-6 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 px-8 py-3 font-semibold text-white shadow-lg shadow-teal-500/30 disabled:opacity-50"
        >
          {saving ? 'Saqlanmoqda…' : 'Talabani ro‘yxatga qo‘shish'}
        </button>
      </form>

      <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 shadow-xl backdrop-blur">
        <div className="border-b border-[var(--color-border-subtle)] px-4 py-4 sm:px-6">
          <h2 className="font-display font-bold text-[var(--color-text)]">Ro‘yxat</h2>
        </div>
        <div className="hidden md:block md:overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
                <th className="px-4 py-3 font-semibold sm:px-6">Talaba</th>
                <th className="px-4 py-3 font-semibold sm:px-6">Login</th>
                <th className="px-4 py-3 font-semibold sm:px-6">Ball</th>
                <th className="px-4 py-3 text-right font-semibold sm:px-6">Harakat</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-[var(--color-text-muted)]">
                    Yuklanmoqda…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-[var(--color-text-muted)]">
                    Talaba yo‘q
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--color-border-subtle)]/60">
                    <td className="px-6 py-4">
                      <p className="font-medium text-[var(--color-text)]">{u.fullName ?? '—'}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{u.groupName ?? ''}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-muted)]">
                      {u.login}
                    </td>
                    <td className="px-6 py-4 tabular-nums font-semibold text-teal-400">
                      {u.totalPoints}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          to={`/admin/talabalar/${encodeURIComponent(u.id)}/profil`}
                          className="rounded-xl border border-emerald-500/45 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200"
                        >
                          Kabinet
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="rounded-xl border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-200"
                        >
                          Tahrirlash
                        </button>
                        <button
                          type="button"
                          onClick={() => openDelete(u)}
                          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"
                        >
                          O‘chirish
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleBlock(u.id, u.blocked)}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                            u.blocked
                              ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/35'
                              : 'bg-red-500/15 text-red-300 ring-1 ring-red-500/35'
                          }`}
                        >
                          {u.blocked ? 'Blokdan chiqarish' : 'Bloklash'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3 p-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Yuklanmoqda…</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Talaba yo‘q</p>
          ) : (
            items.map((u) => (
              <article
                key={`m-${u.id}`}
                className="rounded-2xl border border-[var(--color-border-subtle)]/80 bg-[var(--color-bg-deep)]/35 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug text-[var(--color-text)]">{u.fullName ?? '—'}</p>
                    {u.groupName ? (
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{u.groupName}</p>
                    ) : null}
                    <p className="mt-1 break-all font-mono text-xs text-[var(--color-text-muted)]">{u.login}</p>
                    {u.blocked ? (
                      <p className="mt-2 inline-flex rounded-lg bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-300 ring-1 ring-red-500/35">
                        Bloklangan
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular-nums text-xl font-bold text-teal-400">{u.totalPoints}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      ball
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    to={`/admin/talabalar/${encodeURIComponent(u.id)}/profil`}
                    className="flex min-h-[2.75rem] items-center justify-center rounded-xl border border-emerald-500/45 bg-emerald-500/10 px-2 py-2 text-center text-xs font-semibold text-emerald-200"
                  >
                    Kabinet
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    className="flex min-h-[2.75rem] items-center justify-center rounded-xl border border-teal-500/40 bg-teal-500/10 px-2 py-2 text-xs font-semibold text-teal-200"
                  >
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    onClick={() => openDelete(u)}
                    className="flex min-h-[2.75rem] items-center justify-center rounded-xl border border-rose-500/40 bg-rose-500/10 px-2 py-2 text-xs font-semibold text-rose-200"
                  >
                    O‘chirish
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleBlock(u.id, u.blocked)}
                    className={`flex min-h-[2.75rem] items-center justify-center rounded-xl px-2 py-2 text-xs font-semibold ${
                      u.blocked
                        ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/35'
                        : 'bg-red-500/15 text-red-300 ring-1 ring-red-500/35'
                    }`}
                  >
                    {u.blocked ? 'Blokdan chiqarish' : 'Bloklash'}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {editFor ? (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal
            className="max-h-[min(92vh,800px)] w-full max-w-lg overflow-y-auto rounded-[1.25rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6 shadow-2xl"
          >
            <h3 className="font-display text-lg font-bold text-[var(--color-text)]">Talabani tahrirlash</h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Parolni boʻsh qoldirsangiz, eski parol oʻzgarishsiz qoladi.
            </p>
            <form onSubmit={saveEdit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase text-[var(--color-text-muted)]">Login</label>
                <input
                  required
                  spellCheck={false}
                  autoComplete="off"
                  value={editLogin}
                  onChange={(e) => setEditLogin(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-2.5 font-mono text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase text-[var(--color-text-muted)]">Yangi parol</label>
                <input
                  type="password"
                  minLength={4}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="oʻzgartirishsiz qoʻyish uchun boʻsh"
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase text-[var(--color-text-muted)]">Toʻliq ism</label>
                <input
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-2.5 text-sm"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs uppercase text-[var(--color-text-muted)]">Guruh</label>
                  <input
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase text-[var(--color-text-muted)]">Telefon</label>
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase text-[var(--color-text-muted)]">Jami ball</label>
                <input
                  required
                  inputMode="numeric"
                  value={editPoints}
                  onChange={(e) => setEditPoints(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-2.5 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase text-[var(--color-text-muted)]">
                  Bildirishnoma emaili (boʻsh = saqlanmagan)
                </label>
                <input
                  type="email"
                  autoComplete="off"
                  value={editNotificationEmail}
                  onChange={(e) => setEditNotificationEmail(e.target.value)}
                  placeholder="masalan: talaba@mail.com"
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-2.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border-subtle)]/80 bg-[var(--color-bg-deep)]/50 px-4 py-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text)]">
                  <input
                    type="checkbox"
                    checked={editNotifyByEmail}
                    onChange={(e) => setEditNotifyByEmail(e.target.checked)}
                    className="rounded border-[var(--color-border-subtle)]"
                  />
                  Muhim xabarlar email orqali
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text)]">
                  <input
                    type="checkbox"
                    checked={editNotifyOnAnnouncement}
                    onChange={(e) => setEditNotifyOnAnnouncement(e.target.checked)}
                    className="rounded border-[var(--color-border-subtle)]"
                  />
                  Yangi eʼlonlar haqida bildirishnoma
                </label>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingEdit ? 'Saqlanmoqda…' : 'Saqlash'}
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={closeEdit}
                  className="rounded-xl border border-[var(--color-border-subtle)] px-6 py-2.5 text-sm text-[var(--color-text-muted)]"
                >
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteFor ? (
        <div className="fixed inset-0 z-[210] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal
            className="w-full max-w-md rounded-[1.25rem] border border-rose-500/30 bg-[var(--color-bg-card)] p-6 shadow-2xl"
          >
            <h3 className="font-display text-lg font-bold text-rose-200">Talabani o‘chirish</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              <span className="font-mono text-[var(--color-text)]">{deleteFor.login}</span> — barcha materiallar, kabinet
              va bildirishnomalar butunlay yo‘qoladi. Qayta tiklash mumkin emas.
            </p>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              Tasdiqlash uchun logini yozing:
            </p>
            <input
              spellCheck={false}
              autoComplete="off"
              value={deleteConfirmLogin}
              onChange={(e) => setDeleteConfirmLogin(e.target.value)}
              placeholder={deleteFor.login}
              className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-2.5 font-mono text-sm"
            />
            {deleteErr ? <p className="mt-3 text-sm text-red-400">{deleteErr}</p> : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleting ? 'O‘chirilmoqda…' : 'Butunlay o‘chirish'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={closeDelete}
                className="rounded-xl border border-[var(--color-border-subtle)] px-6 py-2.5 text-sm text-[var(--color-text-muted)]"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
