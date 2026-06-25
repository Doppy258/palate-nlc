import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Badge, Bite, Friend, LevelDef, Quest, Restaurant } from '../data/types'
import { api, type AppConfig, getAuthToken } from '../api/client'
import { useStore } from '../store/useStore'
import { useAuth } from './AuthProvider'

interface PalateData {
  restaurants: Restaurant[]
  friends: Friend[]
  bites: Bite[]
  config: AppConfig
  loading: boolean
  error: string | null
  refreshRestaurants: () => Promise<void>
  refreshBites: () => Promise<void>
}

const PalateContext = createContext<PalateData | null>(null)

export function PalateProvider({ children }: { children: ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [bites, setBites] = useState<Bite[]>([])
  const [config, setConfig] = useState<AppConfig>({ quests: [], badges: [], levels: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hydrateUser = useStore((s) => s.hydrateUser)
  const setRestaurantLookup = useStore((s) => s.setRestaurantLookup)
  const setDataRefresh = useStore((s) => s.setDataRefresh)
  const { token } = useAuth()

  const refreshRestaurants = async () => {
    const data = await api.getRestaurants()
    setRestaurants(data)
  }

  const refreshBites = async () => {
    const data = await api.getBites()
    setBites(data)
  }

  const refreshAll = async () => {
    await Promise.all([refreshRestaurants(), refreshBites()])
  }

  useEffect(() => {
    setDataRefresh(refreshAll)
    setRestaurantLookup((id) => restaurants.find((r) => r.id === id)?.name ?? 'Restaurant')
  }, [restaurants, setDataRefresh, setRestaurantLookup])

  useEffect(() => {
    let cancelled = false
    
    // Only fetch data if authenticated
    if (!token) {
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        const [r, f, b, c, user] = await Promise.all([
          api.getRestaurants(),
          api.getFriends(),
          api.getBites(),
          api.getConfig(),
          api.getUser(),
        ])
        if (cancelled) return
        setRestaurants(r)
        setFriends(f)
        setBites(b)
        setConfig(c)
        hydrateUser(user)
        setError(null)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, hydrateUser])

  const value = useMemo(
    () => ({
      restaurants,
      friends,
      bites,
      config,
      loading,
      error,
      refreshRestaurants,
      refreshBites,
    }),
    [restaurants, friends, bites, config, loading, error],
  )

  return <PalateContext.Provider value={value}>{children}</PalateContext.Provider>
}

export function usePalate() {
  const ctx = useContext(PalateContext)
  if (!ctx) throw new Error('usePalate must be used within PalateProvider')
  return ctx
}

export function useQuests(): Quest[] {
  return usePalate().config.quests
}

export function useBadges(): Badge[] {
  return usePalate().config.badges
}

export function useLevels(): LevelDef[] {
  return usePalate().config.levels
}
