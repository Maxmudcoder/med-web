import { type RankingItem } from '@/pages/public/publicUi'

export function RankingDetailModal({
  row,
  onClose,
}: {
  row: RankingItem | null
  onClose: () => void
}) {
  if (!row) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div
        role="dialog"
        aria-labelledby="ranking-detail-title"
        className="relative z-10 max-h-[min(90vh,44rem)] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg px-2 py-1 text-sm text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
          aria-label="Yopish"
        >
          ✕
        </button>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-400">
          Reytingdagi talaba
        </p>
        <h2 id="ranking-detail-title" className="font-display mt-2 text-2xl font-bold text-[var(--color-text)]">
          {row.name}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{row.group}</p>
        <p className="mt-4 font-display text-3xl font-extrabold tabular-nums text-teal-400">{row.score}</p>
        <p className="text-xs text-[var(--color-text-muted)]">Jami tasdiqlangan ball</p>

        <h3 className="mt-6 text-sm font-semibold text-[var(--color-text)]">
          Tasdiqlangan yutuqlar va sertifikatlar
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
          Faqat matn: har bir qatorda yutuq turi, nomi, tashkilot, ball va berilgan sana ko‘rsatiladi. Hujjatlar va
          rasmlar bu yerda ochilmaydi.
        </p>
        {row.achievements?.length ? (
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {row.achievements.map((line, i) => (
              <li
                key={i}
                className="rounded-xl border border-[var(--color-border-subtle)]/70 bg-[var(--color-bg-deep)]/85 px-3 py-2.5"
              >
                <span className="whitespace-pre-wrap text-[var(--color-text)]">{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Tasdiqlangan yutuqlar hozircha ro‘yxatga kiritilmagan.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--color-border-subtle)]/60 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border-subtle)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] hover:bg-white/5"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  )
}
