import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchAuthJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'

type SiteContactShape = {
  contact: { phone: string; telegram: string; address: string }
}

export function AdminSettingsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactTelegram, setContactTelegram] = useState('')
  const [contactAddress, setContactAddress] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (searchParams.get('bolim') === 'oqituvchilar') {
      navigate('/admin/oqituvchilar', { replace: true })
    }
  }, [navigate, searchParams])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchAuthJson<SiteContactShape>('/api/admin/site-config', token)
        if (cancelled) return
        setContactPhone(data.contact.phone)
        setContactTelegram(data.contact.telegram)
        setContactAddress(data.contact.address)
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setErr('')
    setMsg('')
    try {
      await fetchAuthJson<SiteContactShape>('/api/admin/site-config', token, {
        method: 'PATCH',
        body: JSON.stringify({
          contactPhone,
          contactTelegram,
          contactAddress,
        }),
      })
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
        <h1 className="font-display text-3xl font-bold text-[var(--color-text)]">
          Sayt sozlamalari
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Faqat ochiq sahifadagi «Aloqa» bloki uchun Telegram havolasi, markaziy telefon va manzil. Rahbariyat va
          ustoz kartalari — menyudagi{' '}
          <Link to="/admin/oqituvchilar" className="font-semibold text-teal-400 underline">
            O‘qituvchilar
          </Link>{' '}
          bo‘limida.
        </p>
      </div>

      <section className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl sm:p-8">
        <h2 className="font-display text-lg font-bold text-[var(--color-text)]">Mavzu (tun va kun)</h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
          Yorqin yoki toʻq rejim tanlovi navbar va menyuda emas — bu yerda. Sozlangan mavzu brauzer xotirasida qoladi.
        </p>
        <div className="mt-4">
          <ThemeToggle compact />
        </div>
      </section>

      <form onSubmit={onSubmit} className="space-y-8">
        <section className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl sm:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--color-text)]">Aloqa</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Markaziy qabul: telefon +998 99 677 00 99 va Telegram kanal/guruh havolasi — yangi quramada;
            kerak boʻlsa shu yerda oʻzgartirasiz.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                Telegram kanal yoki guruh
              </label>
              <input
                value={contactTelegram}
                onChange={(e) => setContactTelegram(e.target.value)}
                placeholder="@username yoki https://t.me/… (invite havola ham boʻladi)"
                className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 font-mono text-sm text-[var(--color-text)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                Telefon qabuli
              </label>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+998 …"
                className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                Manzil
              </label>
              <textarea
                rows={2}
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
              />
            </div>
          </div>
        </section>

        {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
        {err ? <p className="text-sm text-red-400">{err}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 px-10 py-4 font-semibold text-white shadow-lg shadow-teal-500/30 disabled:opacity-50"
        >
          {saving ? 'Saqlanmoqda…' : 'Aloqani saqlash'}
        </button>
      </form>
    </div>
  )
}
