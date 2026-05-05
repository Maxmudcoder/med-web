import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
  const { user, login, loading, ready } = useAuth()
  const navigate = useNavigate()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center text-[var(--color-text-muted)]">
        Yuklanmoqda…
      </div>
    )
  }

  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
    return <Navigate to="/talaba" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const u = await login(loginValue.trim(), password)
      navigate(u.role === 'ADMIN' ? '/admin' : '/talaba', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xato')
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4 py-16 pt-[calc(4rem+env(safe-area-inset-top))] sm:pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(20,184,166,0.2),transparent)]" />
      <div className="absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] sm:right-8 sm:top-8">
        <ThemeToggle compact />
      </div>

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)] transition hover:text-teal-400"
        >
          ← Bosh sahifaga
        </Link>

        <div className="overflow-hidden rounded-[2rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="mb-8 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-lg font-bold text-white shadow-lg">
              +
            </span>
            <h1 className="font-display mt-6 text-3xl font-extrabold text-[var(--color-text)]">
              Kirish
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Login va parolni fakultet <strong className="text-[var(--color-text)]">administratori</strong> beradi.
              Parolni bu yerda o‘zgartirib bo‘lmaydi — zarurat bo‘lsa, administratorga murojaat qiling.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="login" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Login
              </label>
              <input
                id="login"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3.5 font-mono text-[var(--color-text)] outline-none ring-0 transition placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
                placeholder="Loginni kiriting"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Parol
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-deep)] px-4 py-3.5 text-[var(--color-text)] outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
                required
              />
            </div>
            {error ? (
              <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 py-4 font-display text-base font-bold text-white shadow-xl shadow-teal-500/35 transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Kutilmoqda…' : 'Davom etish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
