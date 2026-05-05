import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { MedAssistantChat } from '@/components/MedAssistantChat'
import { PublicNotificationsBell } from '@/components/PublicNotificationsBell'
import { ThemeToggle } from '@/components/ThemeToggle'

function navInactiveClass(drawer?: boolean) {
  return drawer
    ? 'rounded-xl px-4 py-3 text-base font-medium text-[var(--color-text-muted)] hover:bg-teal-500/15 hover:text-[var(--color-text)]'
    : 'text-sm font-medium text-[var(--color-text-muted)] transition hover:text-teal-400'
}

function desktopCls(isActive: boolean) {
  return [navInactiveClass(), isActive ? '!text-teal-400 font-semibold' : ''].join(' ')
}

function drawerCls(isActive: boolean) {
  return [
    navInactiveClass(true),
    'min-h-[3rem]',
    isActive ? 'bg-teal-500/15 text-teal-400 font-semibold' : '',
  ].join(' ')
}

function headerBottomPx(el: HTMLElement | null): number {
  if (!el) return 76
  return Math.ceil(el.getBoundingClientRect().bottom)
}

export function PublicLayout() {
  const headerRef = useRef<HTMLElement | null>(null)
  const [mobileSheetTop, setMobileSheetTop] = useState(76)
  const [menuOpen, setMenuOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  const syncSheetTop = () => setMobileSheetTop(headerBottomPx(headerRef.current))

  useLayoutEffect(() => {
    if (!menuOpen) return
    const id = window.requestAnimationFrame(() => syncSheetTop())
    return () => window.cancelAnimationFrame(id)
  }, [menuOpen])

  useEffect(() => {
    syncSheetTop()
    window.addEventListener('resize', syncSheetTop)
    window.addEventListener('orientationchange', syncSheetTop)
    return () => {
      window.removeEventListener('resize', syncSheetTop)
      window.removeEventListener('orientationchange', syncSheetTop)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="flex min-h-svh min-w-0 flex-col">
      <header
        ref={headerRef}
        className="sticky top-0 z-[280] border-b border-[var(--color-border-subtle)]/80 bg-[var(--color-bg-deep)]/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <Link
            to="/"
            className="group flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
            onClick={() => setMenuOpen(false)}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-700 text-sm font-bold text-white shadow-lg shadow-teal-500/30 sm:h-11 sm:w-11 sm:text-base">
              +
            </span>
            <div className="min-w-0 text-left leading-tight">
              <span className="font-display block truncate text-base font-bold tracking-tight text-[var(--color-text)] transition group-hover:text-teal-400 sm:text-lg">
                Med-Iqtidor
              </span>
              <span className="hidden truncate text-xs font-medium text-[var(--color-text-muted)] sm:block">
                Tibbiyot kadrlar uchun reyting va sertifikatlar tizimi
              </span>
            </div>
          </Link>

          <nav className="hidden flex-wrap items-center justify-end gap-x-2 gap-y-2 lg:flex lg:gap-x-4">
            <NavLink to="/" end className={({ isActive }) => desktopCls(isActive)}>
              Bosh sahifa
            </NavLink>
            <NavLink to="/reyting" className={({ isActive }) => desktopCls(isActive)}>
              Reyting
            </NavLink>
            <NavLink to="/elonlar" className={({ isActive }) => desktopCls(isActive)}>
              E&apos;lonlar
            </NavLink>
            <NavLink to="/oqituvchilar" className={({ isActive }) => desktopCls(isActive)}>
              O‘qituvchilar
            </NavLink>
            <NavLink to="/aloqa" className={({ isActive }) => desktopCls(isActive)}>
              Aloqa
            </NavLink>
            <ThemeToggle compact />
            <PublicNotificationsBell />
            <Link
              to="/kirish"
              className="rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-500/35 transition hover:brightness-110"
            >
              Kirish
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
            <ThemeToggle compact />
            <PublicNotificationsBell />
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text)] touch-manipulation active:bg-[var(--color-bg-deep)]"
              aria-expanded={menuOpen}
              aria-label="Menyu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <Link
              to="/kirish"
              className="shrink-0 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-3 py-2 text-[11px] font-semibold text-white shadow-md shadow-teal-500/30 transition hover:brightness-110 active:scale-[0.98] sm:px-4 sm:text-xs"
              onClick={() => setMenuOpen(false)}
            >
              Kirish
            </Link>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[260] bg-black/60 lg:hidden"
            aria-hidden
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="fixed left-0 right-0 bottom-0 z-[270] flex lg:hidden flex-col overflow-hidden border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-[0_-8px_36px_-8px_rgba(0,0,0,0.45)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-mob-nav-title"
            style={{ top: `${mobileSheetTop}px` }}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] px-4 py-3 sm:px-6">
              <p id="public-mob-nav-title" className="font-display text-[15px] font-bold text-[var(--color-text)]">
                Sayt sahifalari
              </p>
              <button
                type="button"
                className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] touch-manipulation"
                onClick={() => setMenuOpen(false)}
              >
                Yopish
              </button>
            </div>
            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <NavLink to="/" end className={({ isActive }) => drawerCls(isActive)} onClick={() => setMenuOpen(false)}>
                Bosh sahifa
              </NavLink>
              <NavLink to="/reyting" className={({ isActive }) => drawerCls(isActive)} onClick={() => setMenuOpen(false)}>
                Reyting
              </NavLink>
              <NavLink to="/elonlar" className={({ isActive }) => drawerCls(isActive)} onClick={() => setMenuOpen(false)}>
                E&apos;lonlar
              </NavLink>
              <NavLink to="/oqituvchilar" className={({ isActive }) => drawerCls(isActive)} onClick={() => setMenuOpen(false)}>
                O‘qituvchilar
              </NavLink>
              <NavLink to="/aloqa" className={({ isActive }) => drawerCls(isActive)} onClick={() => setMenuOpen(false)}>
                Aloqa
              </NavLink>
              <Link
                to="/kirish"
                className="mt-4 shrink-0 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 py-3.5 text-center text-sm font-semibold text-white shadow-md shadow-teal-500/35"
                onClick={() => setMenuOpen(false)}
              >
                Tizimga kirish
              </Link>
            </nav>
          </div>
        </>
      ) : null}

      <main className="relative z-0 flex-1">
        <Outlet />
      </main>

      <button
        type="button"
        onClick={() => setAiOpen(true)}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-[85] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-lg shadow-teal-500/40 transition hover:brightness-110 active:scale-[0.97] sm:bottom-8 sm:right-8"
        aria-label="Maslahatchi chat"
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
      <MedAssistantChat open={aiOpen} onClose={() => setAiOpen(false)} variant="public" />

      <footer className="public-page border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/40 py-6 backdrop-blur-md sm:py-7">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs leading-relaxed text-[var(--color-text-muted)] sm:px-6">
          © {new Date().getFullYear()} Med-Iqtidor · Tibbiyot kadrlar platformasi
        </div>
      </footer>
    </div>
  )
}
