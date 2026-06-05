import type { Deal, PersistedUser, Restaurant } from '../data/types'
import { isSlowHourActive } from './time'

/** Base deals plus any the owner has posted live in this session. */
export function restaurantDeals(r: Restaurant, user: PersistedUser): Deal[] {
  return [...r.deals, ...(user.ownerDeals[r.id] ?? [])]
}

export function dealUnlocked(deal: Deal, user: PersistedUser): boolean {
  return !deal.requiresStamps || user.visitedIds.length >= deal.requiresStamps
}

/** The single deal worth surfacing on a card: live slow-hour first, then best unlocked. */
export function primaryDeal(r: Restaurant, user: PersistedUser): Deal | undefined {
  const deals = restaurantDeals(r, user)
  if (!deals.length) return undefined
  if (isSlowHourActive(r.slowHour)) {
    const slow = deals.find((d) => d.slowHour)
    if (slow) return slow
  }
  const unlocked = deals.filter((d) => dealUnlocked(d, user))
  if (unlocked.length) return [...unlocked].sort((a, b) => b.value - a.value)[0]
  return deals[0]
}

/** Coupons unlock after a verified check-in, then can be redeemed once. */
export function dealRedeemable(deal: Deal, r: Restaurant, user: PersistedUser): boolean {
  return (
    user.visitedIds.includes(r.id) &&
    dealUnlocked(deal, user) &&
    !user.redeemedDealIds.includes(deal.id)
  )
}

export function hasActiveDeal(r: Restaurant, user: PersistedUser): boolean {
  return restaurantDeals(r, user).some((d) => dealUnlocked(d, user))
}
