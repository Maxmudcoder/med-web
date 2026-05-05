import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublicJson } from '@/lib/api'

const STORAGE_KEY = 'iqtidor-public-seen-announcements'
const POLL_MS = 22_000

type AnnouncementItem = {
  id: string
  title: string
  body: string
  tag: string
  accent: string
}

function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function saveSeenIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function PublicNotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AnnouncementItem[]>([])
  const [seenIds, setSeenIds] = useState<Set<string>>(loadSeenIds)
  const [loadErr, setLoadErr] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef(items)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const refresh = useCallback(async () => {
    try {
      const data = await fetchPublicJson<{ items: AnnouncementItem[] }>(
        '/api/public/announcements',
      )
      setItems(data.items ?? [])
      setLoadErr(false)
    } catch {
      setLoadErr(true)
    }
  }, [])

  useEffect(() => {
    const init = window.setTimeout(() => void refresh(), 0)
    const poll = window.setInterval(() => void refresh(), POLL_MS)
    return () => {
      window.clearTimeout(init)
      window.clearInterval(poll)
    }
  }, [refresh])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  function togglePanel() {
    setOpen((wasOpen) => {
      const next = !wasOpen
      if (next && itemsRef.current.length > 0) {
        queueMicrotask(() => {
          setSeenIds((prev) => {
            const merged = new Set(prev)
            itemsRef.current.forEach((i) => merged.add(i.id))
            saveSeenIds(merged)
            return merged
          })
        })
      }
      return next
    })
  }

  const unseenCount = items.filter((x) => !seenIds.has(x.id)).length

  return (
    <div className="relative z-[110] flex items-center" ref={panelRef}>
      <button
        type="button"
        onClick={togglePanel}
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-[var(--color-bg-card)] text-[var(--color-text)] transition hover:border-teal-500/50 hover:text-teal-400 sm:w-12 ${
          unseenCount > 0
            ? 'border-teal-500 ring-2 ring-teal-400/50 shadow-lg shadow-teal-500/25'
            : 'border-[var(--color-border-subtle)]'
        }`}
        aria-expanded={open}
        aria-label="Yangiliklar va bildirishnomalar"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unseenCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold leading-none text-white shadow-md ring-2 ring-[var(--color-bg-deep)]">
            {unseenCount > 9 ? '9+' : unseenCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[120] w-[min(calc(100vw-2rem),22rem)] rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] py-3 shadow-2xl shadow-black/40 backdrop-blur-xl md:w-[22rem]">
          <div className="border-b border-[var(--color-border-subtle)] px-4 pb-3">
            <p className="font-display text-sm font-bold text-[var(--color-text)]">
              Yangiliklar va e&apos;lonlar
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              Administrator yangilagan ma’lumotlar — avtomatik tekshiriladi.
            </p>
          </div>
          <div className="max-h-[min(60vh,320px)] overflow-y-auto px-2 py-2">
            {loadErr ? (
              <p className="px-3 py-4 text-sm text-red-400">Yuklashda xatolik.</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
                Hozircha e&apos;lon yo‘q.
              </p>
            ) : (
              <ul className="space-y-1">
                {items.map((a) => (
                  <li key={a.id}>
                    <div className="rounded-xl px-3 py-2.5 hover:bg-teal-500/10">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-teal-400">
                        {a.tag}
                      </span>
                      <p className="mt-1 font-semibold text-[var(--color-text)]">{a.title}</p>
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
                        {a.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-[var(--color-border-subtle)] px-3 pt-3">
            <Link
              to="/elonlar"
              className="block rounded-xl bg-teal-600/15 py-2.5 text-center text-sm font-semibold text-teal-400 hover:bg-teal-500/20"
              onClick={() => setOpen(false)}
            >
              Barcha e&apos;lonlarni ko‘rish
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
