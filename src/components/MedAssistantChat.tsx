import { useCallback, useEffect, useRef, useState } from 'react'
import { apiUrl } from '@/lib/api'

export type ChatMsg = { role: 'user' | 'assistant'; content: string }

type Props = {
  open: boolean
  onClose: () => void
  variant: 'public' | 'admin' | 'student'
  token?: string | null
}

function introText(variant: 'public' | 'admin' | 'student') {
  if (variant === 'public') {
    return 'Tibbiyot taʼlimi va universitet yoʻnalishlari haqida umumiy savollar bering. Kasallik yoki dori boʻyicha shaxsiy maslahat bermayman — buning uchun shifokor yoki kafedraga yoʻnaltiramiz.'
  }
  if (variant === 'student') {
    return 'Platforma, taʼlim yoʻli, yutuqlar va akademik rivojlanish bo‘yicha savollar — qisqa va xavfsiz javob.'
  }
  return 'Moderatsiya, reyting, eʼlonlar va tizim bo‘yicha yordam. Javoblar qisqa, oʻzbek (lotin) tilida.'
}

export function MedAssistantChat({ open, onClose, variant, token }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [errBanner, setErrBanner] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setMessages([])
      setDraft('')
      setErrBanner('')
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [open, messages, loading])

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])

  const send = useCallback(async () => {
    const text = draft.trim()
    if (!text || loading) return
    if (variant === 'admin' && !token) {
      setErrBanner('Tizimga kirmagansiz.')
      return
    }
    if (variant === 'student' && !token) {
      setErrBanner('Talaba kabinetidan kiring.')
      return
    }
    const history: ChatMsg[] = [...messages, { role: 'user', content: text }]
    setMessages(history)
    setDraft('')
    setErrBanner('')
    setLoading(true)
    const path =
      variant === 'public'
        ? '/api/public/assistant/chat'
        : variant === 'student'
          ? '/api/student/assistant/chat'
          : '/api/admin/assistant/chat'
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if ((variant === 'admin' || variant === 'student') && token) {
      headers.Authorization = `Bearer ${token}`
    }
    try {
      const res = await fetch(apiUrl(path), {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: history }),
      })
      const raw = await res.text()
      let data: { reply?: string; error?: string } = {}
      try {
        data = JSON.parse(raw) as { reply?: string; error?: string }
      } catch {
        setErrBanner(
          res.ok
            ? 'Server javobi tushunarli emas.'
            : `HTTP ${res.status} — backend ishlamayaptimi?`,
        )
        setLoading(false)
        return
      }
      const reply = typeof data.reply === 'string' ? data.reply.trim() : ''
      if (reply && res.ok) {
        setMessages((m) => [...m, { role: 'assistant', content: reply }])
        return
      }
      if (reply && !res.ok) {
        setErrBanner(reply)
        return
      }
      if (typeof data.error === 'string' && data.error.trim()) {
        setErrBanner(data.error.trim())
        return
      }
      setErrBanner(res.ok ? 'Javob olinmadi.' : `So‘rov xato (${res.status}).`)
    } catch {
      setErrBanner('Tarmoq xatosi.')
    } finally {
      setLoading(false)
    }
  }, [draft, loading, messages, token, variant])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[200] bg-black/55 backdrop-blur-[2px]"
        aria-label="Chatni yopish"
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-[210] flex max-h-[min(88vh,640px)] max-w-[100vw] flex-col overflow-hidden rounded-t-3xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-2xl sm:bottom-6 sm:left-auto sm:right-6 sm:max-h-[min(80vh,560px)] sm:w-[min(100vw-2rem,400px)] sm:rounded-3xl"
        role="dialog"
        aria-modal
        aria-labelledby="med-assistant-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3">
          <div>
            <h2
              id="med-assistant-title"
              className="font-display text-sm font-bold text-[var(--color-text)]"
            >
              {variant === 'public'
                ? 'Taʼlim maslahatchisi'
                : variant === 'student'
                  ? 'Talaba maslahatchisi'
                  : 'Administrator maslahatchisi'}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">Qisqa javoblar, tavsiya xarakterida</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
            aria-label="Yopish"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
        >
          <p className="rounded-2xl bg-teal-500/10 px-3 py-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {introText(variant)}
          </p>
          {messages.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={`max-w-[95%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'ml-auto bg-gradient-to-br from-teal-600 to-emerald-800 text-white'
                  : 'mr-auto border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] text-[var(--color-text)]'
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading ? (
            <p className="text-xs text-[var(--color-text-muted)]">Javob yozilmoqda…</p>
          ) : null}
        </div>

        {errBanner ? (
          <p className="border-t border-[var(--color-border-subtle)] bg-red-500/10 px-4 py-2 text-xs text-red-300">
            {errBanner}
          </p>
        ) : null}

        <div className="border-t border-[var(--color-border-subtle)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3">
          <div className="flex gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send()
                }
              }}
              rows={2}
              placeholder="Savolingiz…"
              className="min-h-[3rem] flex-1 resize-none rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
            />
            <button
              type="button"
              disabled={loading || !draft.trim()}
              onClick={() => void send()}
              className="shrink-0 self-end rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition enabled:hover:brightness-110 disabled:opacity-40"
            >
              Yuborish
            </button>
          </div>
          <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
            Tibbiyotga oid boʻlmasa yoki diagnoz soʻralsa javob bermasligi mumkin.
          </p>
        </div>
      </div>
    </>
  )
}
