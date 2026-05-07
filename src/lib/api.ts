/**
 * API uchun to‘liq URL: `import.meta.env.VITE_API_URL` (build vaqtida beriladi).
 *
 * - Dev: odatda bo‘sh — yo‘llar `/api/...` ko‘rinishida qoladi, `vite.config` proksi backendga yo‘naltiradi.
 * - Production: masalan Vercel da `VITE_API_URL=https://api.med-iqtidor.uz` — barcha so‘rovlar shu hostga ketadi.
 *
 * Namuna: `fetch(apiUrl('/api/health'))` yoki `fetchAuthJson('/api/auth/me', token)` — ikkalasi ham `apiUrl` orqali.
 */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') ?? ''
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${p}` : p
}

/** GET so‘rovlar token talab qilmaydi */
export async function fetchPublicJson<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path))
  if (!res.ok) throw new Error('Ma\'lumot yuklanmadi')
  return res.json() as Promise<T>
}

async function parseResponseBody<T>(
  res: Response,
): Promise<(T & { error?: string }) | null> {
  const raw = await res.text()
  if (!raw.trim()) return null
  try {
    return JSON.parse(raw) as T & { error?: string }
  } catch {
    throw new Error(
      res.status >= 500
        ? `Server ichki xatosi (HTTP ${res.status}); javob JSON emas. API server konsolini tekshiring.`
        : `Server javobi notoʻgʻri (HTTP ${res.status}). Administratorga API manzil va serverni tekshiring.`,
    )
  }
}

export async function fetchAuthJson<T>(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (
    init?.body &&
    typeof init.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(apiUrl(path), { ...init, headers })
  let data = (await parseResponseBody<T & { error?: string }>(res)) as
    | (T & { error?: string })
    | undefined
  if (!data && res.ok) data = {} as T & { error?: string }
  if (!data && !res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data as T
}

/** multipart/form-data — Content-Type qo‘lda qo‘ymang (boundary kerak) */
export async function fetchAuthForm<T>(
  path: string,
  token: string | null,
  formData: FormData,
  init?: Omit<RequestInit, 'body'> & { method?: string },
): Promise<T> {
  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(apiUrl(path), {
    ...init,
    method: init?.method ?? 'POST',
    body: formData,
    headers,
  })
  let data = (await parseResponseBody<T & { error?: string }>(res)) as
    | (T & { error?: string })
    | undefined
  if (!data && res.ok) data = {} as T & { error?: string }
  if (!data && !res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data as T
}

/** www va apex bir xil sayt deb hisoblanadi (frontend-only domenlarda /api Node ga bormaydi). */
function hostWithoutWww(host: string): string {
  return host.startsWith('www.') ? host.slice(4) : host
}

/** Productionda VITE_API_URL sayt bilan bir xil bazaviy host bo‘lsa — so‘rovlar statik hostingga ketadi (CORS / redirect). */
function warnIfApiHostEqualsPageHost() {
  if (!import.meta.env.PROD || typeof window === 'undefined') return
  const raw = import.meta.env.VITE_API_URL?.trim()
  if (!raw) return
  try {
    const apiHost = new URL(raw).hostname
    const pageHost = window.location.hostname
    if (hostWithoutWww(apiHost) === hostWithoutWww(pageHost)) {
      console.warn(
        '[api] VITE_API_URL hozirgi sayt domeni bilan bir xil (www/apex farqi hisobga olinmadi). ' +
          'API alohida hostda bo‘lishi kerak (odatda api. domen orqali, masalan https://api.example.com).',
      )
    }
  } catch {
    /* VITE_API_URL noto‘g‘ri URL */
  }
}

warnIfApiHostEqualsPageHost()
