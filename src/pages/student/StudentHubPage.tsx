import { Link } from 'react-router-dom'

const hubCard =
  'flex flex-col rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5 opacity-95 shadow-lg transition hover:border-teal-500/35'

/** Iqtidor dasturi: rivojlanish va ochiq portfolio */
export function StudentHubPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
          Iqtidor dasturi
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Reyting va portfoliongizni shu bo‘lim orqali boshqarasiz.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/talaba/rivojlanish" className={hubCard}>
          <span className="text-xs font-bold uppercase text-teal-400">Tarix va grafik</span>
          <span className="mt-3 font-semibold text-[var(--color-text)]">Rivojlanish tarixi</span>
          <span className="mt-2 text-sm text-[var(--color-text-muted)]">
            Ball yig‘ishi va materiallaringiz holati vaqt bo‘yicha.
          </span>
        </Link>
        <Link to="/talaba/portfolio" className={hubCard}>
          <span className="text-xs font-bold uppercase text-teal-400">Portfolio</span>
          <span className="mt-3 font-semibold text-[var(--color-text)]">Yutuqlar portfoliom</span>
          <span className="mt-2 text-sm text-[var(--color-text-muted)]">
            Ochiq havola, chop etish va ulashish.
          </span>
        </Link>
      </div>
    </div>
  )
}
