import type { Badge, Bite, Friend, LevelDef, PersistedUser, Quest, Restaurant } from '../data/types'
import type { AppUser } from '../data/empty-user'

const BASE = '/api'

// Auth token management
let authToken: string | null = null

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('palate_auth_token')
  }
  return authToken
}

export function setAuthToken(token: string | null) {
  authToken = token
  if (token) {
    localStorage.setItem('palate_auth_token', token)
  } else {
    localStorage.removeItem('palate_auth_token')
  }
}

export function clearAuthToken() {
  setAuthToken(null)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init?.headers as Record<string, string> || {}) }
  
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? 'Request failed')
  }
  return res.json() as Promise<T>
}

export interface AppConfig {
  quests: Quest[]
  badges: Badge[]
  levels: LevelDef[]
}

export interface ActionResult {
  user: AppUser
  xpAwarded?: number
}

export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    display_name?: string
  }
}

export interface AuthSession {
  access_token: string
  token_type: string
  user: AuthUser
}

export const api = {
  // Auth endpoints
  signup: (email: string, password: string, displayName: string) =>
    request<AuthSession>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    }),

  signin: (email: string, password: string) =>
    request<AuthSession>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  health: () => request<{ ok: boolean }>('/health'),

  getConfig: () => request<AppConfig>('/config'),

  getRestaurants: () => request<Restaurant[]>('/restaurants'),

  getRestaurant: (id: string) => request<Restaurant>(`/restaurants/${id}`),

  getFriends: () => request<Friend[]>('/friends'),

  getBites: (restaurantId?: string) =>
    request<Bite[]>(restaurantId ? `/bites?restaurantId=${restaurantId}` : '/bites'),

  getUser: () => request<AppUser>('/user'),

  completeOnboarding: () => request<AppUser>('/user/onboarding', { method: 'POST' }),

  setOwnerMode: (enabled: boolean) =>
    request<AppUser>('/user/owner-mode', { method: 'POST', body: JSON.stringify({ enabled }) }),

  toggleSave: (restaurantId: string) =>
    request<ActionResult>(`/user/save/${restaurantId}`, { method: 'POST' }),

  checkIn: (restaurantId: string, code: string) =>
    request<ActionResult & { slowHour: boolean; firstStamp: boolean }>('/user/check-in', {
      method: 'POST',
      body: JSON.stringify({ restaurantId, code }),
    }),

  redeem: (dealId: string, restaurantId: string) =>
    request<ActionResult>('/user/redeem', {
      method: 'POST',
      body: JSON.stringify({ dealId, restaurantId }),
    }),

  addReview: (restaurantId: string, r: { rating: number; text: string; tags: string[] }) =>
    request<ActionResult>('/user/reviews', {
      method: 'POST',
      body: JSON.stringify({ restaurantId, ...r }),
    }),

  postBite: (b: {
    restaurantId: string
    dish: string
    caption: string
    rating: number
    tags: string[]
    photoSeed: string
  }) =>
    request<ActionResult & { bite: Bite }>('/user/bites', {
      method: 'POST',
      body: JSON.stringify(b),
    }),

  recordComparison: (winnerId: string, loserId: string) =>
    request<ActionResult & { newTier: string; changed: boolean }>('/user/compare', {
      method: 'POST',
      body: JSON.stringify({ winnerId, loserId }),
    }),

  addToTier: (restaurantId: string) =>
    request<ActionResult>(`/user/tier/${restaurantId}`, { method: 'POST' }),

  claimQuest: (questId: string) =>
    request<ActionResult>(`/user/quests/${questId}/claim`, { method: 'POST' }),

  createOwnerDeal: (
    restaurantId: string,
    deal: { label: string; kind: string; value: number; slowHour?: boolean },
  ) =>
    request<ActionResult & { deal: unknown }>('/user/owner-deals', {
      method: 'POST',
      body: JSON.stringify({ restaurantId, ...deal }),
    }),

  getAnalytics: (restaurantId: string) =>
    request<Record<string, number>>(`/analytics/${restaurantId}`),

  // Friend requests
  listUsers: () => request<{ id: string; name: string; avatarSeed: string }[]>('/users'),

  sendFriendRequest: (toUserId: string) =>
    request<{ success: boolean }>('/friend-requests', {
      method: 'POST',
      body: JSON.stringify({ toUserId }),
    }),

  getPendingFriendRequests: () =>
    request<{ id: string; fromUserId: string; toUserId: string; fromName: string | null; createdAt: string }[]>('/friend-requests/pending'),

  getSentFriendRequests: () =>
    request<{ id: string; fromUserId: string; toUserId: string; toName: string | null; status: string; createdAt: string }[]>('/friend-requests/sent'),

  acceptFriendRequest: (id: string) =>
    request<{ success: boolean }>(`/friend-requests/${id}/accept`, { method: 'POST' }),

  rejectFriendRequest: (id: string) =>
    request<{ success: boolean }>(`/friend-requests/${id}/reject`, { method: 'POST' }),
}
