import { create } from 'zustand'
import type { Deal, PersistedUser } from '../data/types'
import { EMPTY_USER, type AppUser } from '../data/empty-user'
import { levelFromXp, XP } from '../lib/xp'
import { api } from '../api/client'

const uid = () => Math.random().toString(36).slice(2, 9)

export interface Toast {
  id: string
  title: string
  detail?: string
  xp?: number
  tone?: 'default' | 'tier' | 'level'
}

interface Actions {
  hydrateUser(user: AppUser): void
  setRestaurantLookup(fn: (id: string) => string): void
  setDataRefresh(fn: () => Promise<void>): void
  completeOnboarding(): Promise<void>
  setOwnerMode(v: boolean): Promise<void>
  toggleSave(id: string): Promise<void>
  checkIn(id: string, code: string): Promise<{ slowHour: boolean }>
  redeem(dealId: string, restaurantId: string): Promise<void>
  addReview(restaurantId: string, r: { rating: number; text: string; tags: string[] }): Promise<void>
  postBite(b: {
    restaurantId: string
    dish: string
    caption: string
    rating: number
    tags: string[]
    photoSeed: string
  }): Promise<void>
  recordComparison(winnerId: string, loserId: string): Promise<{ newTier: string; changed: boolean }>
  addToTier(id: string): Promise<void>
  claimQuest(id: string, title?: string): Promise<void>
  createOwnerDeal(
    restaurantId: string,
    deal: { label: string; kind: Deal['kind']; value: number; slowHour?: boolean },
  ): Promise<void>
  pushToast(t: Omit<Toast, 'id'>): void
  dismissToast(id: string): void
}

type Store = PersistedUser & {
  biteCount: number
  reviewCount: number
  toasts: Toast[]
  _rname: (id: string) => string
  _refresh: () => Promise<void>
} & Actions

export const useStore = create<Store>()((set, get) => {
  const pushToast = (t: Omit<Toast, 'id'>) =>
    set((s) => ({ toasts: [...s.toasts, { id: uid(), ...t }] }))

  const rname = (id: string) => get()._rname(id)

  const applyUser = (user: AppUser, xpAwarded?: number) => {
    const before = get().xp
    set({ ...user })
    if (xpAwarded && xpAwarded > 0) {
      const lvlBefore = levelFromXp(before).index
      const lvlAfter = levelFromXp(user.xp)
      if (lvlAfter.index > lvlBefore) {
        pushToast({ title: 'Level up', detail: lvlAfter.def.name, tone: 'level' })
      }
    }
  }

  const refresh = () => get()._refresh()

  return {
    ...EMPTY_USER,
    biteCount: 0,
    reviewCount: 0,
    toasts: [],
    _rname: (id: string) => id,
    _refresh: async () => {},

    hydrateUser: (user) => set({ ...user }),
    setRestaurantLookup: (fn) => set({ _rname: fn }),
    setDataRefresh: (fn) => set({ _refresh: fn }),

    pushToast,
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    completeOnboarding: async () => {
      const user = await api.completeOnboarding()
      set({ onboarded: user.onboarded })
    },

    setOwnerMode: async (v) => {
      const user = await api.setOwnerMode(v)
      set({ ownerMode: user.ownerMode })
    },

    toggleSave: async (id) => {
      const wasSaved = get().savedIds.includes(id)
      const { user, xpAwarded } = await api.toggleSave(id)
      applyUser(user, xpAwarded)
      if (!wasSaved && xpAwarded) {
        pushToast({ title: 'Saved to Want to Try', detail: rname(id), xp: XP.save })
      }
    },

    checkIn: async (id, code) => {
      const { user, slowHour, xpAwarded, firstStamp } = await api.checkIn(id, code)
      applyUser(user, xpAwarded)
      await refresh()
      if (firstStamp) {
        pushToast({ title: 'Stamp collected', detail: rname(id), xp: XP.stamp })
      }
      if (slowHour && xpAwarded && xpAwarded > (firstStamp ? XP.stamp : 0)) {
        pushToast({ title: 'Slow-hour supporter', detail: 'Visited during a slow hour', xp: XP.slowHour })
      }
      return { slowHour }
    },

    redeem: async (dealId, restaurantId) => {
      const { user, xpAwarded } = await api.redeem(dealId, restaurantId)
      applyUser(user, xpAwarded)
      pushToast({ title: 'Deal redeemed', detail: 'Coupon applied', xp: XP.redeem })
    },

    addReview: async (restaurantId, r) => {
      const { user, xpAwarded } = await api.addReview(restaurantId, r)
      applyUser(user, xpAwarded)
      await refresh()
      pushToast({ title: 'Verified review posted', detail: rname(restaurantId), xp: XP.review })
    },

    postBite: async (b) => {
      const { user, xpAwarded } = await api.postBite(b)
      applyUser(user, xpAwarded)
      await refresh()
      pushToast({ title: 'Bite posted', detail: rname(b.restaurantId), xp: XP.bite })
    },

    recordComparison: async (winnerId, loserId) => {
      const { user, newTier, changed, xpAwarded } = await api.recordComparison(winnerId, loserId)
      applyUser(user, xpAwarded)
      if (changed) {
        pushToast({ title: `${rname(winnerId)} moved up to ${newTier}`, tone: 'tier' })
      }
      return { newTier, changed }
    },

    addToTier: async (id) => {
      const { user, xpAwarded } = await api.addToTier(id)
      applyUser(user, xpAwarded)
      pushToast({ title: 'Added to your tier list', detail: rname(id), xp: XP.tier })
    },

    claimQuest: async (id, title) => {
      const { user, xpAwarded } = await api.claimQuest(id)
      applyUser(user, xpAwarded)
      pushToast({ title: 'Quest complete', detail: title ?? id, xp: XP.quest })
    },

    createOwnerDeal: async (restaurantId, deal) => {
      await api.createOwnerDeal(restaurantId, deal)
      await refresh()
      pushToast({ title: 'Deal published', detail: deal.label })
    },
  }
})
