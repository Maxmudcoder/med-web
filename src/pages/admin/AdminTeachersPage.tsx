import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiUrl, fetchAuthJson } from '@/lib/api'
import { StaffStickerAvatar } from '@/components/AvatarCircleCover'
import { useAuth } from '@/context/AuthContext'
import { filePickTriggerLabelClass } from '@/lib/fileFieldStyles'

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const raw = await res.text()
  if (!raw.trim()) throw new Error(`HTTP ${res.status}`)
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error(`Server javobi notoʻgʻri (HTTP ${res.status})`)
  }
}

const MAX_STAFF = 60

type TeacherApi = {
  id: string
  sortOrder: number
  position: string
  fullName: string
  degree: string | null
  phone: string | null
  officeHours: string | null
  faculty: string | null
  studyDirection: string | null
  stickerUrl: string
}

type TeacherDraft = {
  draftKey: string
  position: string
  fullName: string
  degree: string | null
  phone: string | null
  officeHours: string | null
  faculty: string | null
  studyDirection: string | null
  stickerUrl: string
}

type SiteTeachersShape = {
  teachers: TeacherApi[]
}

function fromServer(t: TeacherApi): TeacherDraft {
  return {
    draftKey: t.id || `tmp-${crypto.randomUUID()}`,
    position: t.position,
    fullName: t.fullName,
    degree: t.degree,
    phone: t.phone,
    officeHours: t.officeHours,
    faculty: t.faculty,
    studyDirection: t.studyDirection,
    stickerUrl: t.stickerUrl,
  }
}

function blankRow(): TeacherDraft {
  return {
    draftKey: `new-${crypto.randomUUID()}`,
    position: '',
    fullName: '',
    degree: null,
    phone: null,
    officeHours: null,
    faculty: null,
    studyDirection: null,
    stickerUrl: '/stickers/teacher.svg',
  }
}

export function AdminTeachersPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [teachers, setTeachers] = useState<TeacherDraft[]>([])
  const [saving, setSaving] = useState(false)
  const [stickerUploadIndex, setStickerUploadIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchAuthJson<SiteTeachersShape>('/api/admin/site-config', token)
        if (cancelled) return
        const list = (data.teachers ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)
        setTeachers(list.length > 0 ? list.map(fromServer) : [])
      } catch {
        setErr('Ma’lumot yuklanmadi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  function updateTeacher(i: number, patch: Partial<TeacherDraft>) {
    setTeachers((prev) => prev.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }

  function addTeacher() {
    setTeachers((prev) => (prev.length >= MAX_STAFF ? prev : [...prev, blankRow()]))
  }

  function removeTeacher(i: number) {
    setTeachers((prev) => prev.filter((_, j) => j !== i))
  }

  function moveTeacher(i: number, dir: -1 | 1) {
    setTeachers((prev) => {
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const cp = [...prev]
      const t = cp[i]!
      cp[i] = cp[j]!
      cp[j] = t
      return cp
    })
  }

  async function onTeacherStickerFile(i: number, ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!token || !file) return
    setStickerUploadIndex(i)
    setErr('')
    setMsg('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch(apiUrl('/api/admin/teacher-sticker'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await parseJsonResponse<{ error?: string; stickerUrl?: string }>(res)
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      if (data.stickerUrl) updateTeacher(i, { stickerUrl: data.stickerUrl })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Rasm yuklanmadi')
    } finally {
      setStickerUploadIndex(null)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return

    const partialFill = teachers.some((t) => {
      const p = t.position.trim()
      const f = t.fullName.trim()
      return !!p !== !!f
    })
    if (partialFill) {
      setErr('Har bir qatorda lavozim nomi va F.I.Sh. birga toʻldiriladi yoki ikkalasi ham boʻsh boʻlishi kerak.')
      return
    }

    const payloadTeachers = teachers
      .filter((t) => t.position.trim() && t.fullName.trim())
      .map((t) => ({
        position: t.position.trim(),
        fullName: t.fullName.trim(),
        degree: t.degree?.trim() || undefined,
        phone: t.phone?.trim() || undefined,
        officeHours: t.officeHours?.trim() || undefined,
        faculty: t.faculty?.trim() || undefined,
        studyDirection: t.studyDirection?.trim() || undefined,
        stickerUrl: t.stickerUrl.trim() || '/stickers/teacher.svg',
      }))

    if (payloadTeachers.length > MAX_STAFF) {
      setErr(`Eng koʻpi bilan ${MAX_STAFF} ta xodim saqlanadi.`)
      return
    }

    if (stickerUploadIndex !== null) {
      setErr('Rasm yuklanayotguncha kuting.')
      return
    }
    setSaving(true)
    setErr('')
    setMsg('')
    try {
      const res = await fetchAuthJson<SiteTeachersShape>('/api/admin/site-config', token, {
        method: 'PATCH',
        body: JSON.stringify({ teachers: payloadTeachers }),
      })
      const next = (res.teachers ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)
      setTeachers(next.length > 0 ? next.map(fromServer) : [])
      setMsg('Saqlandi.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-[var(--color-text-muted)]">Yuklanmoqda…</p>
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--color-text)]">O‘qituvchilar</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Ochiq saytdagi /oqituvchilar sahifasida chiqadigan kartalar (lavozim, F.I.Sh., telefon, qabul va fotosurat).
          Telefon va manzil uchun{' '}
          <Link to="/admin/sozlamalar" className="font-semibold text-teal-400 underline">
            Sayt sozlamalari
          </Link>
          .
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        <section className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-[var(--color-text)]">Jamoa ro‘yxati</h2>
              <p className="mt-2 max-w-3xl text-sm text-[var(--color-text-muted)]">
                Kartalar ketma-ketligi tepadan pastga. Dekanlar uchun fakultet va yo‘nalish maydonlari ham ochiq
                sahifada chiqadi.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addTeacher()}
                disabled={teachers.length >= MAX_STAFF}
                className="rounded-xl border border-teal-500/50 bg-teal-500/15 px-4 py-2 text-sm font-semibold text-teal-200 disabled:opacity-45"
              >
                + Xodim qo‘shish
              </button>
            </div>
          </div>

          {teachers.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-[var(--color-border-subtle)] px-6 py-10 text-center text-sm text-[var(--color-text-muted)]">
              Hali kartochka yo‘q — «Xodim qo‘shish» va keyin «Saqlash» tugmasidan foydalaning.
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              {teachers.map((t, i) => (
                <div
                  key={t.draftKey}
                  className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/80 p-4"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase text-teal-400">Xodim №{i + 1}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moveTeacher(i, -1)}
                        disabled={i === 0}
                        className="rounded-lg border border-[var(--color-border-subtle)] px-2 py-1 text-[11px] font-semibold text-[var(--color-text-muted)] disabled:opacity-35"
                      >
                        Tepaga
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTeacher(i, 1)}
                        disabled={i === teachers.length - 1}
                        className="rounded-lg border border-[var(--color-border-subtle)] px-2 py-1 text-[11px] font-semibold text-[var(--color-text-muted)] disabled:opacity-35"
                      >
                        Pastga
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTeacher(i)}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1 text-[11px] font-semibold text-red-200"
                      >
                        O‘chirish
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                        Lavozim nomi
                      </label>
                      <input
                        value={t.position}
                        onChange={(e) => updateTeacher(i, { position: e.target.value })}
                        placeholder="Masalan: Rektor · Birinchi prorektor (yoshlar) · Dekan ..."
                        className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                        F.I.Sh.
                      </label>
                      <input
                        value={t.fullName}
                        onChange={(e) => updateTeacher(i, { fullName: e.target.value })}
                        className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                        Daraja / unvon (dotsent, t.f.d., shifokor va h.k.)
                      </label>
                      <input
                        value={t.degree ?? ''}
                        onChange={(e) => updateTeacher(i, { degree: e.target.value || null })}
                        placeholder="Ixtiyoriy"
                        className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                        Telefon (lavozim yoki ish raqami)
                      </label>
                      <input
                        value={t.phone ?? ''}
                        onChange={(e) => updateTeacher(i, { phone: e.target.value || null })}
                        placeholder="+998 … ichki ..."
                        className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                        Qabul vaqti / ish grafigi
                      </label>
                      <input
                        value={t.officeHours ?? ''}
                        onChange={(e) => updateTeacher(i, { officeHours: e.target.value || null })}
                        placeholder="Masalan: Dush–Juma 10:00–14:00, 317-xona"
                        className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                        Fakultet (dekan / zamdekkan uchun — ixtiyoriy)
                      </label>
                      <input
                        value={t.faculty ?? ''}
                        onChange={(e) => updateTeacher(i, { faculty: e.target.value || null })}
                        placeholder="Masalan: Pediatriya fakulteti"
                        className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                        Mas’ul yo‘nalish yoki talabalar guruhi (ixtiyoriy)
                      </label>
                      <input
                        value={t.studyDirection ?? ''}
                        onChange={(e) => updateTeacher(i, { studyDirection: e.target.value || null })}
                        placeholder="Masalan: 59104000 — Pediatriya ishchi malakasi"
                        className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
                        Fotosurat (talabalar va mehmonlar koʻradi)
                      </label>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        JPEG, PNG, WebP yoki GIF, 4&nbsp;MB gacha. URL ham kiriting mumkin.
                      </p>
                      <div className="mt-3 flex flex-wrap items-start gap-4">
                        <StaffStickerAvatar
                          stickerUrl={t.stickerUrl}
                          sizeClass="h-24 w-24"
                          ringClassName="border border-[var(--color-border-subtle)] ring-2 ring-teal-500/20"
                          className="bg-black/15"
                          overlay={
                            stickerUploadIndex === i ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] font-semibold text-white">
                                Yuklanmoqda…
                              </div>
                            ) : null
                          }
                        />
                        <div className="min-w-[12rem] flex-1 space-y-2">
                          <input
                            id={`staff-photo-${t.draftKey}`}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                            className="sr-only"
                            onChange={(e) => void onTeacherStickerFile(i, e)}
                          />
                          <label
                            htmlFor={`staff-photo-${t.draftKey}`}
                            className={`${filePickTriggerLabelClass} px-4 py-2 text-sm ${stickerUploadIndex === i ? 'pointer-events-none opacity-70' : ''}`}
                          >
                            {stickerUploadIndex === i ? 'Yuklanmoqda…' : 'Rasm yuklash'}
                          </label>
                          <div>
                            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">
                              URL (ixtiyoriy)
                            </label>
                            <input
                              value={t.stickerUrl}
                              onChange={(e) => updateTeacher(i, { stickerUrl: e.target.value })}
                              placeholder="/stickers/teacher.svg"
                              className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 font-mono text-xs text-[var(--color-text)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-[var(--color-text-muted)]">
            Jami yozuvlar limiti {MAX_STAFF} tagacha. Saqlaganda tartib qaydan boshlab yangilanadi.
          </p>
        </section>

        {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
        {err ? <p className="text-sm text-red-400">{err}</p> : null}

        <button
          type="submit"
          disabled={saving || stickerUploadIndex !== null}
          className="rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 px-10 py-4 font-semibold text-white shadow-lg shadow-teal-500/30 disabled:opacity-50"
        >
          {saving ? 'Saqlanmoqda…' : 'O‘qituvchilarni saqlash'}
        </button>
      </form>
    </div>
  )
}
