import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchAuthJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  DEFAULT_PUBLIC_BRANDING,
  type PublicBranding,
  type PublicHomeCopy,
} from '@/lib/publicBranding'

type AdminSiteConfigShape = {
  contact: { phone: string; telegram: string; address: string }
  publicBranding: PublicBranding
}

function fieldClass() {
  return 'w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25'
}

function labelClass() {
  return 'mb-1 block text-xs font-semibold uppercase text-[var(--color-text-muted)]'
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
  const [brandingForm, setBrandingForm] = useState<PublicBranding>(DEFAULT_PUBLIC_BRANDING)
  const [saving, setSaving] = useState(false)

  function setHome(patch: Partial<PublicHomeCopy>) {
    setBrandingForm((prev) => ({ ...prev, home: { ...prev.home, ...patch } }))
  }

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
        const data = await fetchAuthJson<AdminSiteConfigShape>('/api/admin/site-config', token)
        if (cancelled) return
        setContactPhone(data.contact.phone)
        setContactTelegram(data.contact.telegram)
        setContactAddress(data.contact.address)
        setBrandingForm(data.publicBranding ?? DEFAULT_PUBLIC_BRANDING)
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
      await fetchAuthJson<AdminSiteConfigShape>('/api/admin/site-config', token, {
        method: 'PATCH',
        body: JSON.stringify({
          contactPhone,
          contactTelegram,
          contactAddress,
          publicBranding: brandingForm,
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
          Ochiq sahifadagi matnlar: sayt nomi, bosh sarlavha, tugmalar; aloqa telefoni va manzili. Rahbariyat va ustoz
          kartalari — menyudagi{' '}
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

        <section className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl sm:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--color-text)]">Sayt nomi va navbar</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Chap yuqoridagi logotip yonidagi qatorlar va pastki izoh (katta ekranda).
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass()}>Sayt nomi (qisqa)</label>
              <input
                value={brandingForm.siteName}
                onChange={(e) => setBrandingForm((p) => ({ ...p, siteName: e.target.value }))}
                className={fieldClass()}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>Tagline (navbar ostidagi qisqa matn)</label>
              <input
                value={brandingForm.siteTagline}
                onChange={(e) => setBrandingForm((p) => ({ ...p, siteTagline: e.target.value }))}
                className={fieldClass()}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>Footer (sahifa pastki qatori, © bilan)</label>
              <input
                value={brandingForm.footerLine}
                onChange={(e) => setBrandingForm((p) => ({ ...p, footerLine: e.target.value }))}
                className={fieldClass()}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl sm:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--color-text)]">Bosh sahifa — hero</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Yuqori yashil quti, kichik «badge», sarlavha va tushuntirish. Sarlavhada birinchi qism gradient rangda.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass()}>Muassasa / filial nomi (katta yashil quti)</label>
              <textarea
                rows={2}
                value={brandingForm.home.institutionTitle}
                onChange={(e) => setHome({ institutionTitle: e.target.value })}
                className={fieldClass()}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>Yuqori badge (pulsatsiya yonidagi qator)</label>
              <input
                value={brandingForm.home.badge}
                onChange={(e) => setHome({ badge: e.target.value })}
                className={fieldClass()}
              />
            </div>
            <div>
              <label className={labelClass()}>Sarlavha — gradient qism</label>
              <input
                value={brandingForm.home.heroHighlight}
                onChange={(e) => setHome({ heroHighlight: e.target.value })}
                className={fieldClass()}
              />
            </div>
            <div>
              <label className={labelClass()}>Sarlavha — birinchi qatorning qolgan qismi</label>
              <input
                value={brandingForm.home.heroMid}
                onChange={(e) => setHome({ heroMid: e.target.value })}
                className={fieldClass()}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>Sarlavha — ikkinchi qator</label>
              <input
                value={brandingForm.home.heroSubtitle}
                onChange={(e) => setHome({ heroSubtitle: e.target.value })}
                className={fieldClass()}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>Qisqa tushuntirish (hero ostidagi paragraf)</label>
              <textarea
                rows={4}
                value={brandingForm.home.introText}
                onChange={(e) => setHome({ introText: e.target.value })}
                className={fieldClass()}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl sm:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--color-text)]">Bosh sahifa — reyting kartochkasi</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass()}>Kichik sarlavha (UPPERCASE)</label>
              <input
                value={brandingForm.home.rankingCardKicker}
                onChange={(e) => setHome({ rankingCardKicker: e.target.value })}
                className={fieldClass()}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>Asosiy sarlavha</label>
              <input
                value={brandingForm.home.rankingCardTitle}
                onChange={(e) => setHome({ rankingCardTitle: e.target.value })}
                className={fieldClass()}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass()}>Pastki eslatma (reyting ro‘yxati ostida)</label>
              <input
                value={brandingForm.home.rankingCardHint}
                onChange={(e) => setHome({ rankingCardHint: e.target.value })}
                className={fieldClass()}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl sm:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--color-text)]">Bosh sahifa — tugmalar</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass()}>Birinchi tugma (masalan: tizimga kirish)</label>
              <input
                value={brandingForm.home.ctaPrimary}
                onChange={(e) => setHome({ ctaPrimary: e.target.value })}
                className={fieldClass()}
              />
            </div>
            <div>
              <label className={labelClass()}>Ikkinchi tugma (masalan: reyting)</label>
              <input
                value={brandingForm.home.ctaSecondary}
                onChange={(e) => setHome({ ctaSecondary: e.target.value })}
                className={fieldClass()}
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
          {saving ? 'Saqlanmoqda…' : 'Barcha sozlamalarni saqlash'}
        </button>
      </form>
    </div>
  )
}
