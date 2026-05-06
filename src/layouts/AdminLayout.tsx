import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { MedAssistantChat } from '@/components/MedAssistantChat'
import { NotificationPanel } from '@/components/NotificationPanel'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    isActive
      ? 'bg-gradient-to-r from-teal-500/25 to-emerald-500/15 text-teal-300 ring-1 ring-teal-500/40'
      : 'text-[var(--color-text-muted)] hover:bg-white/[0.04] hover:text-[var(--color-text)]'
  }`

export function AdminLayout() {
  const { user, logout, token } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const NavBody = (
    <>
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-xs font-bold text-white shadow-lg shadow-teal-500/25">
            AD
          </span>
          <div className="min-w-0 text-left">
            <p className="truncate font-display text-sm font-bold text-[var(--color-text)]">
              Administrator
            </p>
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              {user?.fullName || user?.login}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        <NavLink to="/admin" end className={navClass} onClick={() => setSidebarOpen(false)}>
          Boshqaruv paneli
        </NavLink>
        <NavLink to="/admin/talabalar" className={navClass} onClick={() => setSidebarOpen(false)}>
          Talabalar
        </NavLink>
        <NavLink to="/admin/baholash" className={navClass} onClick={() => setSidebarOpen(false)}>
          Baholash
        </NavLink>
        <NavLink to="/admin/shikoyatlar" className={navClass} onClick={() => setSidebarOpen(false)}>
          Ball shikoyatlari
        </NavLink>
        <NavLink to="/admin/ai-yordamchi" className={navClass} onClick={() => setSidebarOpen(false)}>
          AI yordamchi
        </NavLink>
        <NavLink to="/admin/elonlar" className={navClass} onClick={() => setSidebarOpen(false)}>
          E&apos;lonlar
        </NavLink>
        <NavLink to="/admin/talaba-xabar" className={navClass} onClick={() => setSidebarOpen(false)}>
          Talabaga shaxsiy xabar
        </NavLink>
        <NavLink to="/admin/xabarlar" className={navClass} onClick={() => setSidebarOpen(false)}>
          Kelgan xabarlar
        </NavLink>
        <NavLink to="/admin/sozlamalar" className={navClass} onClick={() => setSidebarOpen(false)}>
          Sayt sozlamalari
        </NavLink>
        <NavLink to="/admin/oqituvchilar" className={navClass} onClick={() => setSidebarOpen(false)}>
          O‘qituvchilar
        </NavLink>
      </nav>
      <div className="p-4">
        <button
          type="button"
          onClick={() => {
            setSidebarOpen(false)
            logout()
          }}
          className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-black/10 px-4 py-3 text-left text-sm font-medium text-[var(--color-text-muted)] transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
        >
          Chiqish
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-svh min-w-0 bg-[var(--color-bg-deep)]">
      <aside className="relative hidden w-64 shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 backdrop-blur-xl lg:flex">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-teal-500/45 via-transparent to-emerald-600/35" />
        {NavBody}
      </aside>

      {sidebarOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[80] bg-black/60 lg:hidden"
            aria-hidden
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-[90] flex w-[min(100vw-3rem,17rem)] flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-2xl lg:hidden">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-teal-500/45 via-transparent to-emerald-600/35" />
            {NavBody}
          </aside>
        </>
      ) : null}

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="relative z-[70] flex items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)]/85 pt-[env(safe-area-inset-top)] px-4 py-3 backdrop-blur-md sm:px-6">
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text)] lg:hidden"
            aria-label="Menyu"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-[var(--color-text-muted)]">
            Admin · Med-Iqtidor
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle compact />
            <NotificationPanel />
          </div>
        </header>
        <main className="relative flex-1 overflow-x-hidden overflow-y-auto bg-[var(--color-bg-deep)] px-4 pb-24 text-left sm:p-6 lg:pb-6">
          <div className="pointer-events-none absolute left-1/4 top-0 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />
          <div className="relative mx-auto max-w-6xl min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      <button
        type="button"
        onClick={() => setAiOpen(true)}
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[85] flex h-12 w-12 items-center justify-center rounded-full border border-teal-500/40 bg-[var(--color-bg-card)] text-teal-300 shadow-lg transition hover:border-teal-400 hover:bg-teal-500/10 sm:bottom-8 sm:right-8"
        aria-label="Maslahatchi chat"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
      <MedAssistantChat
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        variant="admin"
        token={token}
      />
    </div>
  )
}
