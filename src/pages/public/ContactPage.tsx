import { type FormEvent, useEffect, useState } from 'react'
import { fetchPublicJson, apiUrl } from '@/lib/api'
import { telegramChannelHref } from '@/lib/contactTelegram'
import { TelegramChannelAnchor } from '@/components/TelegramChannelAnchor'
import { telHref } from '@/lib/telHref'

type SiteInfo = {
  contact: { phone: string; telegram: string; address: string }
}

export function ContactPage() {
  const [contact, setContact] = useState<SiteInfo['contact'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [fullName, setFullName] = useState('')
  const [groupName, setGroupName] = useState('')
  const [phone, setPhone] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchPublicJson<SiteInfo>('/api/public/site-info')
        if (!cancelled) setContact(data.contact)
      } catch {
        if (!cancelled) setErr('Markaziy aloqa ma’lumoti yuklanmadi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormMsg(null)
    setSubmitting(true)
    try {
      const res = await fetch(apiUrl('/api/public/contact-message'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          groupName: groupName.trim() || undefined,
          phone,
          body,
        }),
      })
      const raw = await res.text()
      let data: { ok?: boolean; error?: string } = {}
      if (raw.trim()) {
        try {
          data = JSON.parse(raw) as { ok?: boolean; error?: string }
        } catch {
          throw new Error(
            `Server javobi notoʻgʻri (HTTP ${res.status}). API ishlayotganini tekshiring (${import.meta.env.DEV ? 'localhost:4000 va proxy' : 'VITE_API_URL'}).`,
          )
        }
      }
      if (!res.ok) {
        throw new Error(
          data.error || `Yuborish muvaffaqiyatsiz (HTTP ${res.status}).`,
        )
      }
      setFormMsg({ ok: true, text: 'Xabaringiz qabul qilindi. Administrator tez orada koʻradi.' })
      setFullName('')
      setGroupName('')
      setPhone('')
      setBody('')
    } catch (er) {
      setFormMsg({
        ok: false,
        text: er instanceof Error ? er.message : 'Xato',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="public-page relative px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-teal-500/[0.08] to-transparent" />
      <div className="relative mx-auto max-w-5xl">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Aloqa
          </h1>
          <p className="mt-4 text-[var(--color-text-muted)]">
            Savol va takliflar uchun quyidagi shaklni toʻldiring. Tezkor aloqa: markaziy telefon (+998&nbsp;99&nbsp;677&nbsp;00&nbsp;99).
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <section className="lg:col-span-7">
            <div className="rounded-[1.5rem] border border-teal-500/25 bg-[var(--color-bg-card)]/95 p-6 shadow-xl sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-widest text-teal-400">
                Administratorga xabar
              </p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-[var(--color-text-muted)]">
                    To‘liq ism *
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={120}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] outline-none ring-teal-500/0 transition focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/25"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-[var(--color-text-muted)]">
                    Guruh (ixtiyoriy)
                  </label>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    maxLength={80}
                    placeholder="Masalan · 4421"
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/70"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-[var(--color-text-muted)]">
                    Telefon raqami *
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    minLength={5}
                    maxLength={40}
                    placeholder="+998 …"
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/70"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-[var(--color-text-muted)]">
                    Fikr yoki savol *
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    minLength={5}
                    maxLength={4000}
                    rows={6}
                    placeholder="Qisqa va aniql yozing."
                    className="w-full resize-y rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/70"
                  />
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Kamida 5 belgi · {body.length}/4000
                  </p>
                </div>
                {formMsg ? (
                  <p
                    className={
                      formMsg.ok ? 'rounded-xl bg-teal-500/15 px-4 py-3 text-sm text-teal-200' : 'rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300'
                    }
                  >
                    {formMsg.text}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/35 transition hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Yuborilmoqda…' : 'Xabarni jo‘natish'}
                </button>
              </form>
            </div>
          </section>

          <aside className="lg:col-span-5">
            <div className="sticky top-24 space-y-4 rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl sm:p-7">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                Markaziy aloqa kanallari
              </p>
              {loading ? (
                <p className="py-8 text-sm text-[var(--color-text-muted)]">Yuklanmoqda…</p>
              ) : err ? (
                <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{err}</p>
              ) : !contact ? (
                <p className="text-sm text-[var(--color-text-muted)]">Ma’lumot yoʻq.</p>
              ) : (
                <>
                  <div className="rounded-xl border border-[var(--color-border-subtle)]/80 bg-[var(--color-bg-deep)]/50 p-4">
                    <p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                      Telegram (kanal / guruhi)
                    </p>
                    {telegramChannelHref(contact.telegram) ? (
                      <div className="mt-3">
                        <TelegramChannelAnchor telegramRaw={contact.telegram} />
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--color-text-muted)]">Havola kiritilmagan.</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-[var(--color-border-subtle)]/80 bg-[var(--color-bg-deep)]/50 p-4">
                    <p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                      Telefon
                    </p>
                    {(() => {
                      const tel = telHref(contact.phone)
                      return tel ? (
                        <a
                          href={tel}
                          className="mt-3 block font-display text-xl font-semibold text-[var(--color-text)] underline decoration-teal-500/40 hover:text-teal-300"
                        >
                          {contact.phone}
                        </a>
                      ) : (
                        <p className="mt-3 text-lg font-medium text-[var(--color-text)]">{contact.phone}</p>
                      )
                    })()}
                  </div>
                  <div className="rounded-xl border border-[var(--color-border-subtle)]/80 bg-[var(--color-bg-deep)]/40 p-4">
                    <p className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                      Manzil
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text)]">
                      {contact.address || '—'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
