import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiUrl } from '@/lib/api'

export type Role = 'ADMIN' | 'STUDENT'

export type User = {
  id: string
  login: string
  role: Role
  fullName?: string | null
  blocked?: boolean
}

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  ready: boolean
  login: (login: string, password: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'iqtidor-token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  )
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      if (!token) {
        setUser(null)
        if (!cancelled) setReady(true)
        return
      }
      if (!cancelled) setReady(false)
      try {
        const res = await fetch(apiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = (await res.json()) as { user?: User; error?: string }
        if (!cancelled && res.ok && data.user) setUser(data.user)
        if (!cancelled && !res.ok) logout()
      } catch {
        if (!cancelled) logout()
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    void hydrate()
    return () => {
      cancelled = true
    }
  }, [token, logout])

  const login = useCallback(async (loginValue: string, password: string) => {
    setLoading(true)
    try {
      let res: Response
      try {
        res = await fetch(apiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: loginValue.trim(), password }),
        })
      } catch {
        throw new Error(
          'API ga ulanib bo‘lmadi. `server` da `npm run dev` (port 4000) ishlayotganini tekshiring.',
        )
      }
      const raw = await res.text()
      let data: { token?: string; user?: User; error?: string } = {}
      if (raw.trim()) {
        try {
          data = JSON.parse(raw) as typeof data
        } catch {
          throw new Error(
            'Server javobi noto‘g‘ri (HTML yoki bo‘sh). Avvalo API :4000 va Vite proxy ni tekshiring.',
          )
        }
      }
      if (!res.ok) throw new Error(data.error || `Kirish amalga oshmadi (HTTP ${res.status})`)
      if (!data.token || !data.user) throw new Error('Noto‘g‘ri javob')
      if (data.user.blocked) throw new Error('Hisobingiz bloklangan')
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem(TOKEN_KEY, data.token)
      return data.user
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, ready, login, logout }),
    [user, token, loading, ready, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
