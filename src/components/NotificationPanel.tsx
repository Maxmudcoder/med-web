import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { fetchAuthJson, apiUrl } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import {
  isNotifySoundEnabled,
  playMediqNotificationChime,
  showDesktopNotificationIfAllowed,
} from '@/lib/notificationAlerts'

type Item = {
  id: string
  title: string
  body: string
  kind: string
  linkPath?: string | null
  readAt: string | null
  createdAt: string
}

const KIND_LABEL: Record<string, string> = {
  ANNOUNCEMENT: `E'lon`,
  ADMIN_SUBMISSION: 'Materiall moderatsiyasi',
  SUBMISSION_APPEAL: 'Ball shikoyati',
  CONTACT_MESSAGE: 'Aloqa xabari',
  SUBMISSION_APPROVED: 'Materiall tasdiqlandi',
  SUBMISSION_REJECTED: 'Materiall rad etildi',
  APPEAL_REVIEWED: 'Shikoyatga javob',
  APPEAL_SUBMITTED: 'Shikoyat yuborildi',
  MOTIVATION_COACH: 'Murabbiy xabari',
}

function notificationKindUz(kind: string): string {
  return KIND_LABEL[kind] ?? kind
}

/** Xavfsiz ichki yoʻl-only (ochiq redirect yoʻq). */
function safeInternalPath(linkPath: string | null | undefined): string | undefined {
  if (!linkPath || typeof linkPath !== 'string') return undefined
  const t = linkPath.trim()
  if (!t.startsWith('/') || t.startsWith('//')) return undefined
  return t
}

function audienceLine(kind: string, role: string | undefined): string {
  if (role === 'ADMIN') {
    if (kind === 'ADMIN_SUBMISSION' || kind === 'SUBMISSION_APPEAL' || kind === 'CONTACT_MESSAGE') {
      return 'Administrator uchun (ko‘rib chiqish kerak)'
    }
    return 'Administrator uchun'
  }
  return 'Siz uchun'
}

const OPEN_EVENT = 'admin-notifications-open'

export function notifyOpenAdminNotifications() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export function NotificationPanel() {
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [unread, setUnread] = useState(0)
  const [ring, setRing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadErr, setLoadErr] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 16 })
  const prevUnread = useRef<number | null>(null)
  const boot = useRef(false)

  const placeMenu = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setMenuPos({
      top: r.bottom + 8,
      right: Math.max(12, window.innerWidth - r.right),
    })
  }, [])

  const load = useCallback(async () => {
    if (!token) return
    setLoadErr('')
    setLoading(true)
    try {
      const data = await fetchAuthJson<{ items: Item[]; unreadCount: number }>(
        '/api/notifications?limit=40',
        token,
      )
      setItems(data.items)
      const next = data.unreadCount
      if (boot.current && prevUnread.current !== null && next > prevUnread.current) {
        setRing(true)
        window.setTimeout(() => setRing(false), 1400)
        if (isNotifySoundEnabled()) playMediqNotificationChime()
        const latest = data.items.find((it) => !it.readAt) ?? data.items[0]
        if (latest) {
          showDesktopNotificationIfAllowed(latest.title, latest.body, `mediq-${latest.id}`)
        }
      }
      boot.current = true
      prevUnread.current = next
      setUnread(next)
    } catch (e) {
      setItems([])
      setUnread(0)
      setLoadErr(e instanceof Error ? e.message : 'Yuklashda xato')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
    const intervalMs = user?.role === 'ADMIN' ? 8000 : 22000
    const t = window.setInterval(() => void load(), intervalMs)
    return () => window.clearInterval(t)
  }, [load, user?.role])

  /** Bosh sahifadan boshqaruv paneli kartasi orqali ochish */
  useEffect(() => {
    function onExternalOpen() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      placeMenu()
      setOpen(true)
      void load()
    }
    window.addEventListener(OPEN_EVENT, onExternalOpen)
    return () => window.removeEventListener(OPEN_EVENT, onExternalOpen)
  }, [load, placeMenu])

  useEffect(() => {
    if (!open) return
    placeMenu()
    const sync = () => placeMenu()
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)
    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync, true)
    }
  }, [open, placeMenu])

  useEffect(() => {
    if (!open) return
    function closeOutside(e: MouseEvent) {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    return () => document.removeEventListener('mousedown', closeOutside)
  }, [open])

  async function markRead(id: string) {
    if (!token) return
    try {
      await fetchAuthJson(`/api/notifications/${id}/read`, token, { method: 'PATCH' })
      void load()
    } catch {
      /* ignore */
    }
  }

  async function markAllRead() {
    if (!token) return
    try {
      await fetchAuthJson('/api/notifications/read-all', token, { method: 'POST' })
      void load()
    } catch {
      /* ignore */
    }
  }

  const menuPortal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="dialog"
            aria-label="Xabarlar ro‘yxati"
            className="fixed z-[10000] flex max-h-[min(85vh,24rem)] w-[min(calc(100vw-24px),22rem)] flex-col overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-2xl shadow-black/45"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <div className="flex shrink-0 flex-col gap-1 border-b border-[var(--color-border-subtle)] px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Xabarlar</p>
                {unread > 0 ? (
                  <p className="text-[11px] text-teal-400/95">{unread} ta oʻqilmagan</p>
                ) : (
                  <p className="text-[11px] text-[var(--color-text-muted)]">Barchasi oʻqilgan</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unread > 0 ? (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="text-xs font-medium text-teal-400 hover:underline"
                  >
                    Hammasini o‘qilgan
                  </button>
                ) : null}
              </div>
            </div>
            {loadErr ? (
              <p className="shrink-0 border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-300">
                {loadErr}
                {import.meta.env.DEV ? (
                  <span className="mt-1 block font-mono text-[10px] opacity-80">
                    API: {apiUrl('/api/notifications')}
                  </span>
                ) : null}
              </p>
            ) : null}
            <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
              {loading && items.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
                  Yuklanmoqda…
                </li>
              ) : items.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
                  {loadErr ? 'Tekshirish: tarmoq va kirish sessiyasi.' : 'Hozircha xabar yoʻq'}
                </li>
              ) : (
                items.map((it) => {
                  const path = safeInternalPath(it.linkPath)
                  const kindUz = notificationKindUz(it.kind)
                  const who = audienceLine(it.kind, user?.role)
                  return (
                    <li key={it.id}>
                      <button
                        type="button"
                        onClick={() => {
                          void markRead(it.id)
                          if (path) {
                            navigate(path)
                            setOpen(false)
                          }
                        }}
                        className={`w-full px-4 py-3 text-left transition hover:bg-white/[0.04] ${
                          !it.readAt ? 'bg-teal-500/5' : ''
                        }`}
                      >
                        <p className="text-sm font-semibold text-[var(--color-text)]">{it.title}</p>
                        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
                          {it.body}
                        </p>
                        <p className="mt-1 text-[10px] text-[var(--color-text-muted)]/85">
                          {kindUz} · {who}
                          {path ? (
                            <span className="text-teal-500/90"> · ochish</span>
                          ) : null}
                        </p>
                        <p className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[var(--color-text-muted)]/70">
                          <span>
                            {new Date(it.createdAt).toLocaleString('uz-UZ', { hour12: false })}
                          </span>
                          {it.kind ? (
                            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium tracking-tight">
                              {kindUz}
                            </span>
                          ) : null}
                        </p>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-admin-notification-trigger
        onClick={(e) => {
          e.stopPropagation()
          if (!open) placeMenu()
          setOpen((v) => !v)
          void load()
        }}
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-muted)] transition hover:border-teal-500/40 hover:text-teal-400 ${
          ring
            ? 'animate-pulse ring-2 ring-teal-400 ring-offset-2 ring-offset-[var(--color-bg-deep)]'
            : ''
        }`}
        aria-label="Xabarlar"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] max-w-[2.25rem] items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold tabular-nums text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </button>

      {menuPortal}
    </>
  )
}
