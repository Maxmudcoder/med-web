/**
 * <input type="file"> — brauzer “tanlash” tugmasi va fayl nomi kontrastli.
 * (Ba’zi mavzularda standart input matni deyarli yo‘qolib qolardi.)
 */
export const nativeFileInputClass =
  'block w-full min-w-0 cursor-pointer text-sm leading-normal text-[var(--color-text)] file:mr-3 file:inline-flex file:shrink-0 file:cursor-pointer file:rounded-lg file:border file:border-[var(--color-border-subtle)] file:bg-[var(--color-bg-card)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--color-text)] file:shadow-sm hover:file:border-teal-500/45 hover:file:bg-teal-500/10'

/** Yashirin file + ko‘rinadigan <label> tugmasi (pasport, almashtirish va hokazo) */
export const filePickTriggerLabelClass =
  'inline-flex cursor-pointer items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-3 py-2 text-center text-xs font-semibold text-[var(--color-text)] shadow-sm transition hover:border-teal-500/45 hover:bg-teal-500/10'
