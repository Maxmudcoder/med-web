export type RankingItem = {
  rank: number
  studentId: string
  name: string
  group: string
  score: number
  badge: string | null
  achievements: string[]
  portfolioSlug: string | null
}

export type AnnouncementItem = {
  id: string
  title: string
  body: string
  tag: string
  accent: string
  imagePath?: string | null
  createdAt?: string
}

export const ACCENT_GRAD: Record<string, string> = {
  teal: 'from-teal-500/95 via-teal-700 to-emerald-950',
  blue: 'from-sky-500/95 via-cyan-800 to-slate-950',
  violet: 'from-violet-500/95 via-purple-700 to-slate-950',
  emerald: 'from-emerald-400/95 via-teal-700 to-emerald-950',
  rose: 'from-rose-500/95 via-red-900 to-slate-950',
  amber: 'from-amber-400/95 via-orange-800 to-slate-950',
  orange: 'from-orange-500/95 via-amber-950 to-slate-950',
  sky: 'from-sky-400/95 via-blue-900 to-slate-950',
  cyan: 'from-cyan-500/95 via-teal-900 to-slate-950',
  pink: 'from-pink-500/95 via-rose-900 to-slate-950',
  slate: 'from-slate-500/95 via-slate-800 to-zinc-950',
  fuchsia: 'from-fuchsia-500/95 via-purple-900 to-slate-950',
}

export function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/40">
        1
      </span>
    )
  if (rank === 2)
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-sm font-bold text-slate-900 shadow-md">
        2
      </span>
    )
  if (rank === 3)
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-800 to-amber-950 text-sm font-bold text-amber-100 shadow-md">
        3
      </span>
    )
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-deep)] text-sm font-semibold text-[var(--color-text-muted)] ring-1 ring-[var(--color-border-subtle)]">
      {rank}
    </span>
  )
}

export function PromoAccent({ accent }: { accent: string }) {
  const cls = ACCENT_GRAD[accent] ?? ACCENT_GRAD.teal
  return (
    <div
      className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-95 mix-blend-overlay ${cls}`}
      aria-hidden
    />
  )
}
