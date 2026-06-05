import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Bite, Deal, PersistedUser } from '../data/types'
import { INITIAL_USER, QUESTS, RESTAURANTS } from '../data/seed'
import { levelFromXp, XP } from '../lib/xp'
import { applyHeadToHead } from '../lib/ranking'
import { dealRedeemable } from '../lib/deals'
import { questProgress } from '../lib/quests'
import { isSlowHourActive } from '../lib/time'
import { scoreToTier } from '../theme/tokens'

const uid = () => Math.random().toString(36).slice(2, 9)

export interface Toast {
  id: string
  title: string
  detail?: string
  xp?: number
  tone?: 'default' | 'tier' | 'level'
}

interface Actions {
  completeOnboarding(): void
  setOwnerMode(v: boolean): void
  toggleSave(id: string): void
  checkIn(id: string): { slowHour: boolean }
  redeem(dealId: string, restaurantId: string): void
  addReview(restaurantId: string, r: { rating: number; text: string; tags: string[] }): void
  postBite(b: { restaurantId: string; dish: string; caption: string; rating: number; tags: string[]; photoSeed: string }): void
  recordComparison(winnerId: string, loserId: string): { newTier: string; changed: boolean }
  addToTier(id: string): void
  claimQuest(id: string): void
  createOwnerDeal(restaurantId: string, deal: { label: string; kind: Deal['kind']; value: number; slowHour?: boolean }): void
  resetDemo(): void
  pushToast(t: Omit<Toast, 'id'>): void
  dismissToast(id: string): void
}

type Store = PersistedUser & { toasts: Toast[] } & Actions

const rname = (id: string) => RESTAURANTS.find((r) => r.id === id)?.name ?? 'Restaurant'

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const pushToast = (t: Omit<Toast, 'id'>) =>
        set((s) => ({ toasts: [...s.toasts, { id: uid(), ...t }] }))

      // Increment XP and fire a level-up toast when a threshold is crossed.
      const award = (amount: number) => {
        const before = get().xp
        const after = before + amount
        set({ xp: after })
        const lvlBefore = levelFromXp(before).index
        const lvlAfter = levelFromXp(after)
        if (lvlAfter.index > lvlBefore) {
          pushToast({ title: 'Level up', detail: lvlAfter.def.name, tone: 'level' })
        }
      }

      return {
        ...INITIAL_USER,
        toasts: [],

        pushToast,
        dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

        completeOnboarding: () => set({ onboarded: true }),
        setOwnerMode: (v) => set({ ownerMode: v }),

        toggleSave: (id) => {
          const saved = get().savedIds
          if (saved.includes(id)) {
            set({ savedIds: saved.filter((x) => x !== id) })
            return
          }
          set({ savedIds: [...saved, id] })
          award(XP.save)
          pushToast({ title: 'Saved to Want to Try', detail: rname(id), xp: XP.save })
        },

        checkIn: (id) => {
          const r = RESTAURANTS.find((x) => x.id === id)
          const already = get().visitedIds.includes(id)
          if (!already) {
            set({ visitedIds: [...get().visitedIds, id] })
            award(XP.stamp)
            pushToast({ title: 'Stamp collected', detail: rname(id), xp: XP.stamp })
          }
          const slow = isSlowHourActive(r?.slowHour)
          if (slow && !get().slowHourVisitIds.includes(id)) {
            set({ slowHourVisitIds: [...get().slowHourVisitIds, id] })
            award(XP.slowHour)
            pushToast({ title: 'Slow-hour supporter', detail: 'Visited during a slow hour', xp: XP.slowHour })
          }
          return { slowHour: slow }
        },

        redeem: (dealId, restaurantId) => {
          const r = RESTAURANTS.find((x) => x.id === restaurantId)
          if (!r) return
          const deal = [...r.deals, ...(get().ownerDeals[restaurantId] ?? [])].find((d) => d.id === dealId)
          if (!deal || !dealRedeemable(deal, r, get())) return
          set({ redeemedDealIds: [...get().redeemedDealIds, dealId] })
          award(XP.redeem)
          pushToast({ title: 'Deal redeemed', detail: deal.label, xp: XP.redeem })
        },

        addReview: (restaurantId, r) => {
          if (!get().visitedIds.includes(restaurantId)) return
          const review = {
            id: 'u-' + uid(),
            restaurantId,
            author: get().name,
            avatarSeed: get().avatarSeed,
            rating: r.rating,
            text: r.text,
            date: 'Just now',
            verified: true,
            tags: r.tags,
          }
          set({ reviews: [review, ...get().reviews] })
          award(XP.review)
          pushToast({ title: 'Verified review posted', detail: rname(restaurantId), xp: XP.review })
        },

        postBite: (b) => {
          const bite: Bite = {
            id: 'u-' + uid(),
            author: get().name,
            avatarSeed: get().avatarSeed,
            createdAt: Date.now(),
            ...b,
          }
          set({ bites: [bite, ...get().bites] })
          award(XP.bite)
          pushToast({ title: 'Bite posted', detail: rname(b.restaurantId), xp: XP.bite })
        },

        recordComparison: (winnerId, loserId) => {
          const prev = get().personalScores
          const prevTier = scoreToTier(prev[winnerId] ?? 65)
          const next = applyHeadToHead(prev, winnerId, loserId)
          const newTier = scoreToTier(next[winnerId])
          set({ personalScores: next, comparisons: get().comparisons + 1 })
          award(XP.comparison)
          const changed = newTier !== prevTier
          if (changed) {
            pushToast({ title: `${rname(winnerId)} moved up to ${newTier}`, tone: 'tier' })
          }
          return { newTier, changed }
        },

        addToTier: (id) => {
          if (get().personalScores[id] != null) return
          set({ personalScores: { ...get().personalScores, [id]: 65 } })
          award(XP.tier)
          pushToast({ title: 'Added to your tier list', detail: rname(id), xp: XP.tier })
        },

        claimQuest: (id) => {
          const q = QUESTS.find((x) => x.id === id)
          if (!q) return
          const p = questProgress(q, get(), RESTAURANTS)
          if (!p.claimable) return
          set({ claimedQuestIds: [...get().claimedQuestIds, id] })
          award(XP.quest)
          pushToast({ title: 'Quest complete', detail: q.title, xp: XP.quest })
        },

        createOwnerDeal: (restaurantId, deal) => {
          const d: Deal = { id: 'own-' + uid(), createdAt: Date.now(), ...deal }
          set({
            ownerDeals: {
              ...get().ownerDeals,
              [restaurantId]: [...(get().ownerDeals[restaurantId] ?? []), d],
            },
          })
          pushToast({ title: 'Deal published', detail: deal.label })
        },

        resetDemo: () => set({ ...INITIAL_USER, onboarded: true, toasts: [] }),
      }
    },
    {
      name: 'palate-v1',
      version: 1,
      partialize: (s): PersistedUser => ({
        name: s.name,
        avatarSeed: s.avatarSeed,
        xp: s.xp,
        savedIds: s.savedIds,
        visitedIds: s.visitedIds,
        personalScores: s.personalScores,
        slowHourVisitIds: s.slowHourVisitIds,
        comparisons: s.comparisons,
        reviews: s.reviews,
        bites: s.bites,
        redeemedDealIds: s.redeemedDealIds,
        claimedQuestIds: s.claimedQuestIds,
        ownerDeals: s.ownerDeals,
        onboarded: s.onboarded,
        ownerMode: s.ownerMode,
      }),
    },
  ),
)
