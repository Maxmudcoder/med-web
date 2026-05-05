import { useEffect, useState } from 'react'
import { fetchPublicJson, fetchAuthJson } from '@/lib/api'
import { StaffStickerAvatar } from '@/components/AvatarCircleCover'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'

import { telegramChannelHref } from '@/lib/contactTelegram'
import { TelegramChannelAnchor } from '@/components/TelegramChannelAnchor'
import { telHref } from '@/lib/telHref'
import {
  isDesktopNotifyPreferenceOn,
  isNotifySoundEnabled,
  playMediqNotificationChime,
  setDesktopNotifyPreference,
  setNotifySoundEnabled,
} from '@/lib/notificationAlerts'

type SiteInfo = {
  contact: { phone: string; telegram: string; address: string }
  teachers: {
    sortOrder: number
    position: string
    fullName: string
    degree: string | null
    stickerUrl: string
    phone: string | null
    officeHours: string | null
    faculty: string | null
    studyDirection: string | null
  }[]
}

export function StudentSettingsPage() {
  const { token } = useAuth()
  const [info, setInfo] = useState<SiteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifyAnn, setNotifyAnn] = useState(true)
  const [notifyByEmail, setNotifyByEmail] = useState(false)
  const [notificationEmail, setNotificationEmail] = useState('')
  const [soundOn, setSoundOn] = useState(true)
  const [desktopOn, setDesktopOn] = useState(false)
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | 'unsupported'>('default')
  const [prefsLoading, setPrefsLoading] = useState(false)
  const [prefsErr, setPrefsErr] = useState('')

  useEffect(() => {
    setSoundOn(isNotifySoundEnabled())
    setDesktopOn(isDesktopNotifyPreferenceOn())
    if (typeof Notification !== 'undefined') setNotifPerm(Notification.permission)
    else setNotifPerm('unsupported')
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchPublicJson<SiteInfo>('/api/public/site-info')
        if (!cancelled) setInfo(data)
      } catch {
        if (!cancelled) setInfo(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const p = await fetchAuthJson<{
          notifyOnNewAnnouncement: boolean
          notifyByEmail: boolean
          notificationEmail: string | null
        }>('/api/student/preferences', token)
        if (!cancelled) {
          setNotifyAnn(p.notifyOnNewAnnouncement)
          setNotifyByEmail(p.notifyByEmail)
          setNotificationEmail(p.notificationEmail ?? '')
        }
      } catch {
        /* noop */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  async function saveNotify(on: boolean) {
    if (!token) return
    setPrefsErr('')
    setPrefsLoading(true)
    try {
      const p = await fetchAuthJson<{
        notifyOnNewAnnouncement: boolean
        notifyByEmail: boolean
        notificationEmail: string | null
      }>('/api/student/preferences', token, {
        method: 'PATCH',
        body: JSON.stringify({ notifyOnNewAnnouncement: on }),
      })
      setNotifyAnn(p.notifyOnNewAnnouncement)
      setNotifyByEmail(p.notifyByEmail)
      setNotificationEmail(p.notificationEmail ?? '')
    } catch (e) {
      setPrefsErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setPrefsLoading(false)
    }
  }

  async function saveEmailPrefs(patch: { notifyByEmail?: boolean; notificationEmail?: string }) {
    if (!token) return
    setPrefsErr('')
    setPrefsLoading(true)
    try {
      const p = await fetchAuthJson<{
        notifyByEmail: boolean
        notificationEmail: string | null
      }>('/api/student/preferences', token, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      setNotifyByEmail(p.notifyByEmail)
      setNotificationEmail(p.notificationEmail ?? '')
    } catch (e) {
      setPrefsErr(e instanceof Error ? e.message : 'Xato')
    } finally {
      setPrefsLoading(false)
    }
  }

  function toggleSound(on: boolean) {
    setNotifySoundEnabled(on)
    setSoundOn(on)
  }

  function toggleDesktopPref(on: boolean) {
    setDesktopNotifyPreference(on)
    setDesktopOn(on)
  }

  async function requestBrowserNotify() {
    if (typeof Notification === 'undefined') return
    const r = await Notification.requestPermission()
    setNotifPerm(r)
    if (r === 'granted') {
      setDesktopNotifyPreference(true)
      setDesktopOn(true)
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
          Sozlamalar va aloqa
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Kontaktlar va rahbariyat kartochkalari administrator tomonidan yangilanadi; bu yerda ularni ko‘rasiz.
        </p>
      </div>

      <section className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl">
        <p className="text-sm font-semibold text-[var(--color-text)]">Interfeys</p>
        <div className="mt-4">
          <ThemeToggle compact />
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl">
        <p className="text-sm font-semibold text-[var(--color-text)]">Bildirishnomalar</p>
        {prefsErr ? (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {prefsErr}
          </p>
        ) : null}
        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={notifyAnn}
            disabled={!token || prefsLoading}
            onChange={(e) => void saveNotify(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-teal-500"
          />
          <span className="text-sm text-[var(--color-text-muted)]">
            Yangi e&apos;lon chiqqanda ichki bildirishnoma (sayt ichida, qo‘ng‘iroq ikonkasi). Moderatsiya, shikoyat va
            boshqa xabarlar ham shu yerda chiqadi.
          </span>
        </label>

        <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Brauzer (Chrome) — eslatma
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Yangi o‘qilmagan xabar paydo bo‘lsa, qisqa ovoz eshitiladi va xohlasangiz Windows / brauzer bildirishnomasi
            ham chiqadi (sahifa ochiq yoki fon rejimida).
          </p>
          <label className="mt-3 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={soundOn}
              onChange={(e) => toggleSound(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-teal-500"
            />
            <span className="text-sm text-[var(--color-text-muted)]">Ovozli eslatma (qisqa “ting”)</span>
          </label>
          <button
            type="button"
            onClick={() => playMediqNotificationChime()}
            className="mt-2 rounded-lg border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs font-medium text-teal-400 hover:border-teal-500/40"
          >
            Ovozni sinash
          </button>

          <div className="mt-4 space-y-2">
            {notifPerm !== 'unsupported' ? (
              <>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Ruxsat holati: <span className="text-[var(--color-text)]">{notifPerm}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void requestBrowserNotify()}
                    className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow"
                  >
                    Brauzer ruxsatini so‘rash
                  </button>
                </div>
                <label className="mt-2 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={desktopOn}
                    disabled={notifPerm !== 'granted'}
                    onChange={(e) => toggleDesktopPref(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-teal-500 disabled:opacity-40"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Ruxsat berilgach, yangi xabar uchun kichik tizim bildirishnomasi (ovoz alohida yuqoridagi sozlamada).
                  </span>
                </label>
              </>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">
                Brauzeringiz tizim bildirishnomalarini qo‘llab-quvvatlamaydi.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Email orqali nusxa
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Login paroli bilan kirishdan mustaqil — shaxsiy pochtangizga (masalan, Gmail, Mail.ru) xabar nusxasi yuborish
            uchun. Serverda SMTP sozlangan bo‘lishi kerak; sozlash administrator vazifasi.
          </p>
          <label className="mt-3 block text-sm text-[var(--color-text-muted)]">
            Email manzil
            <input
              type="email"
              autoComplete="email"
              value={notificationEmail}
              disabled={!token || prefsLoading}
              onChange={(e) => setNotificationEmail(e.target.value)}
              onBlur={() => {
                if (!token) return
                void saveEmailPrefs({ notificationEmail })
              }}
              className="mt-1 w-full max-w-md rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)]"
              placeholder="ism@example.com"
            />
          </label>
          <label className="mt-3 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={notifyByEmail}
              disabled={!token || prefsLoading}
              onChange={(e) => void saveEmailPrefs({ notifyByEmail: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-teal-500"
            />
            <span className="text-sm text-[var(--color-text-muted)]">
              Shu manzilga e&apos;lon, moderatsiya va shikoyat javobi haqida email yuborilsin
            </span>
          </label>
        </div>
      </section>

      {loading ? (
        <p className="text-[var(--color-text-muted)]">Yuklanmoqda…</p>
      ) : info ? (
        <>
          <section className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl">
            <h2 className="font-display text-lg font-bold text-[var(--color-text)]">Aloqa</h2>
            <dl className="mt-5 space-y-5 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-teal-400">
                  Telegram (kanal yoki guruh)
                </dt>
                <dd className="mt-3">
                  {telegramChannelHref(info.contact.telegram) ? (
                    <TelegramChannelAnchor telegramRaw={info.contact.telegram} />
                  ) : (
                    <span className="text-[var(--color-text-muted)]">Administrator kiritishi kutilmoqda.</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-teal-400">Telefon</dt>
                <dd className="mt-3">
                  {(() => {
                    const tel = telHref(info.contact.phone)
                    return tel ? (
                      <a
                        href={tel}
                        className="font-medium text-[var(--color-text)] underline decoration-teal-500/35 underline-offset-2 hover:text-teal-400"
                      >
                        {info.contact.phone}
                      </a>
                    ) : (
                      <span className="font-medium text-[var(--color-text)]">{info.contact.phone}</span>
                    )
                  })()}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-teal-400">Manzil</dt>
                <dd className="mt-3 leading-relaxed text-[var(--color-text)]">{info.contact.address}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 p-6 shadow-xl">
            <h2 className="font-display text-lg font-bold text-[var(--color-text)]">
              Rahbariyat qisqacha
            </h2>
            <ul className="mt-4 space-y-4">
              {info.teachers.map((t) => (
                <li
                  key={t.sortOrder}
                  className="flex gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/80 p-4"
                >
                  <StaffStickerAvatar
                    stickerUrl={t.stickerUrl}
                    sizeClass="h-16 w-16"
                    ringClassName="border border-[var(--color-border-subtle)] ring-2 ring-teal-500/30"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-teal-400">{t.position}</p>
                    <p className="font-semibold text-[var(--color-text)]">{t.fullName}</p>
                    {t.degree ? (
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t.degree}</p>
                    ) : null}
                    {t.phone ? (
                      <p className="mt-2 text-sm font-medium text-[var(--color-text)]">
                        <span className="text-[var(--color-text-muted)]">Tel: </span>
                        {t.phone}
                      </p>
                    ) : null}
                    {t.officeHours ? (
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t.officeHours}</p>
                    ) : null}
                    {t.faculty?.trim() ? (
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        <span className="font-semibold text-teal-400/90">Fakultet: </span>
                        {t.faculty.trim()}
                      </p>
                    ) : null}
                    {t.studyDirection?.trim() ? (
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        <span className="font-semibold text-teal-400/90">Yo‘nalish: </span>
                        {t.studyDirection.trim()}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <p className="text-[var(--color-text-muted)]">Ma’lumot topilmadi.</p>
      )}
    </div>
  )
}
