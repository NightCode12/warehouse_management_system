'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { loginUser, getUserById } from '@/lib/supabase/queries'
import { getDefaultPage } from '@/lib/permissions'
import { AppUser } from '@/types'

const STORAGE_KEY = 'abest-wms-user'

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => false,
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // On mount: restore session from localStorage
  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) {
          setLoading(false)
          return
        }

        const parsed: AppUser = JSON.parse(stored)
        // Re-validate: is this user still active?
        const freshUser = await getUserById(parsed.id)
        if (freshUser) {
          setUser(freshUser)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser))
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  // Redirect logic
  useEffect(() => {
    if (loading) return

    const isLoginPage = pathname === '/login'

    if (!user && !isLoginPage) {
      router.replace('/login')
    } else if (user && isLoginPage) {
      router.replace(getDefaultPage(user.role))
    }
  }, [user, loading, pathname, router])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null)

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return false
    }

    const foundUser = await loginUser(email, password)
    if (!foundUser) {
      setError('Invalid email or password.')
      return false
    }

    setUser(foundUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser))
    router.replace(getDefaultPage(foundUser.role))
    return true
  }, [router])

  const logout = useCallback(() => {
    setUser(null)
    setError(null)
    localStorage.removeItem(STORAGE_KEY)
    router.replace('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
