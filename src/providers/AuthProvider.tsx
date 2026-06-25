import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, getAuthToken, setAuthToken, clearAuthToken, type AuthUser } from '../api/client'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  error: string | null
  token: string | null
  signup: (email: string, password: string, displayName: string) => Promise<void>
  signin: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(getAuthToken())

  // Check if there's an existing token on mount
  useEffect(() => {
    const stored = getAuthToken()
    if (stored) {
      setToken(stored)
      setUser({ id: '', email: '', user_metadata: {} })
    }
    setLoading(false)
  }, [])

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      setError(null)
      const result = await api.signup(email, password, displayName)
      setAuthToken(result.access_token)
      setToken(result.access_token)
      setUser(result.user)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Signup failed'
      setError(message)
      throw e
    }
  }

  const signin = async (email: string, password: string) => {
    try {
      setError(null)
      const result = await api.signin(email, password)
      setAuthToken(result.access_token)
      setToken(result.access_token)
      setUser(result.user)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign in failed'
      setError(message)
      throw e
    }
  }

  const logout = () => {
    clearAuthToken()
    setToken(null)
    setUser(null)
  }

  const isAuthenticated = !!token

  const value: AuthContextType = {
    user,
    loading,
    error,
    token,
    signup,
    signin,
    logout,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
