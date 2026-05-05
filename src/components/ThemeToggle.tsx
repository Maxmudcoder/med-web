import { useTheme } from '@/context/ThemeContext'

type ThemeToggleProps = {
  /** Pastki blok / boshqa joy uchun kichraytirilgan tugma */
  compact?: boolean
}

/** Faqat ikonka — yozuvsiz (Tun/Kun matni yo‘q) */
export function ThemeToggle({ compact = false }: ThemeToggleProps = {}) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  const size = compact
    ? 'h-9 w-9 rounded-lg text-[var(--color-text-muted)] [&_svg]:h-[1.125rem] [&_svg]:w-[1.125rem]'
    : 'h-11 w-11 rounded-xl text-[var(--color-text-muted)] [&_svg]:h-5 [&_svg]:w-5'

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex shrink-0 items-center justify-center border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-inner transition hover:border-teal-500/45 hover:text-teal-400 ${size}`}
      aria-label={dark ? 'Kunduzgi rejimga o‘tish' : 'Tungi rejimga o‘tish'}
      title={dark ? 'Kunduzgi rejim' : 'Tungi rejim'}
    >
      {dark ? (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  )
}
