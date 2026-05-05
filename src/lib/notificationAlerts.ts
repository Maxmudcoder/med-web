const SOUND_KEY = 'mediq_notify_sound'
const DESKTOP_KEY = 'mediq_desktop_notify'

/** true = ovoz yoqilgan (standart) */
export function isNotifySoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(SOUND_KEY) !== '0'
}

export function setNotifySoundEnabled(on: boolean) {
  localStorage.setItem(SOUND_KEY, on ? '1' : '0')
}

/** Foydalanuvchi qo‘lda yoqqan (ruxsat + flag) */
export function isDesktopNotifyPreferenceOn(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(DESKTOP_KEY) === '1'
}

export function setDesktopNotifyPreference(on: boolean) {
  localStorage.setItem(DESKTOP_KEY, on ? '1' : '0')
}

/** Qisqa ikki tonli “ting” — Web Audio (tashqi faylsiz). */
export function playMediqNotificationChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.connect(g)
    g.connect(ctx.destination)
    const t0 = ctx.currentTime
    o.frequency.setValueAtTime(880, t0)
    o.frequency.setValueAtTime(660, t0 + 0.11)
    g.gain.setValueAtTime(0.001, t0)
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.38)
    o.start(t0)
    o.stop(t0 + 0.4)
    void ctx.resume()
    window.setTimeout(() => void ctx.close(), 600)
  } catch {
    /* autoplay yoki kontekst cheklovi */
  }
}

export function showDesktopNotificationIfAllowed(title: string, body: string, tag?: string) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return
  if (!isDesktopNotifyPreferenceOn()) return
  if (Notification.permission !== 'granted') return
  try {
    const n = new Notification(title, {
      body: body.slice(0, 240),
      tag: tag || 'mediq',
      silent: true,
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    /* */
  }
}
