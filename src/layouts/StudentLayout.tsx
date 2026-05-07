import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { NotificationPanel } from '@/components/NotificationPanel'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl whitespace-nowrap px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30'
      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text)]'
  }`

const bottomNavBase =
  'flex min-h-[3.25rem] flex-1 min-w-[2.75rem] shrink-0 basis-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[clamp(9px,2.65vw,11px)] font-semibold leading-tight tracking-tight transition touch-manipulation'

/** Bildirishnoma ustuni tor ekranda `flex-1 min-w-0` bilan siqilib tugma bosilmasiz qolmasin */
const bottomNavNotifySlot =
  'flex min-h-[3.25rem] shrink-0 flex-none basis-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[clamp(9px,2.65vw,11px)] font-semibold leading-tight tracking-tight transition touch-manipulation overflow-visible'

function useLgBreakpoint() {
  const [lgUp, setLgUp] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setLgUp(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return lgUp
}

function bottomNavClass({ isActive }: { isActive: boolean }) {
  return [
    bottomNavBase,
    isActive
      ? 'bg-teal-500/14 text-[var(--color-accent-strong)] ring-1 ring-teal-500/25'
      : 'text-[var(--color-text-muted)] active:bg-[var(--color-bg-deep)]',
  ].join(' ')
}

export function StudentLayout() {
  const { user, logout } = useAuth()
  const lgUp = useLgBreakpoint()

  return (
    <div className="student-app min-h-svh bg-[var(--color-bg-deep)] pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-10">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl min-w-0 items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 text-[9px] font-bold text-white shadow-md sm:h-10 sm:w-10 sm:text-[10px]">
              MED
            </span>
            <div className="min-w-0 text-left">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-accent-strong)] sm:text-[10px]">
                Talaba
              </p>
              <p className="truncate font-display text-sm font-semibold text-[var(--color-text)] sm:text-base">
                {user?.fullName || user?.login}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggle compact />
            {lgUp ? <NotificationPanel /> : null}
            <button
              type="button"
              onClick={logout}
              aria-label="Chiqish"
              className="rounded-xl border border-[var(--color-border-subtle)] p-2 text-[var(--color-text-muted)] transition hover:border-red-500/40 hover:text-red-500 sm:px-3 sm:py-1.5 sm:text-xs lg:py-2"
            >
              <svg
                className="mx-auto h-5 w-5 sm:hidden"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden text-[10px] font-medium sm:inline sm:text-xs">Chiqish</span>
            </button>
          </div>
        </div>

        <nav className="mx-auto hidden max-w-5xl flex-wrap items-center gap-2 px-4 pb-4 lg:flex">
          <NavLink to="/talaba" end className={navClass}>
            Bosh sahifa
          </NavLink>
          <NavLink to="/talaba/yuklash" className={navClass}>
            Yuklash
          </NavLink>
          <NavLink to="/talaba/shikoyatlar" className={navClass}>
            Ball shikoyatlari
          </NavLink>
          <NavLink to="/talaba/profil" className={navClass}>
            Kabinet
          </NavLink>
          <NavLink to="/talaba/sozlamalar" className={navClass}>
            Sozlamalar
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl min-w-0 px-3 py-5 text-left sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label="Talaba navigatsiyasi"
      >
        <div className="mx-auto flex max-w-5xl min-w-0 items-stretch gap-0.5 overflow-x-auto overscroll-x-contain px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 sm:px-3 [&::-webkit-scrollbar]:hidden">
          <NavLink to="/talaba" end className={bottomNavClass}>
            <svg className="mx-auto h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Bosh
          </NavLink>
          <NavLink to="/talaba/yuklash" className={bottomNavClass}>
            <svg className="mx-auto h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Yuklash
          </NavLink>
          <NavLink to="/talaba/shikoyatlar" className={bottomNavClass}>
            <svg className="mx-auto h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Shikoyat
          </NavLink>
          <NavLink to="/talaba/profil" className={bottomNavClass}>
            <svg className="mx-auto h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Kabinet
          </NavLink>
          {!lgUp ? (
            <div className={bottomNavNotifySlot}>
              <NotificationPanel variant="dock" />
              <span className="line-clamp-1 text-center text-[clamp(9px,2.65vw,11px)] font-semibold text-[var(--color-text-muted)]">
                Xabar
              </span>
            </div>
          ) : null}
          <NavLink to="/talaba/sozlamalar" className={bottomNavClass}>
            <svg className="mx-auto h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Sozl.
          </NavLink>
        </div>
      </nav>

    </div>
  )
}
