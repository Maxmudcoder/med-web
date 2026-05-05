import { Navigate } from 'react-router-dom'
import type { Role } from '@/context/AuthContext'
import { useAuth } from '@/context/AuthContext'
import type { ReactNode } from 'react'

export function RequireRole({
  role,
  children,
}: {
  role: Role
  children: ReactNode
}) {
  const { user, token, ready } = useAuth()

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--color-text-muted)]">
        Yuklanmoqda…
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/kirish" replace />
  }

  if (user.blocked) {
    return (
      <div className="rounded-2xl border border-[var(--color-danger)]/40 bg-[var(--color-bg-card)] p-8 text-center">
        <p className="font-semibold text-[var(--color-danger)]">
          Hisobingiz bloklangan. Administrator bilan bog‘laning.
        </p>
      </div>
    )
  }

  if (user.role !== role) {
    return <Navigate to="/" replace />
  }

  return children
}
