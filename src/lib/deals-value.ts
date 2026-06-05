import type { PersistedUser, Restaurant } from '../data/types'
import { dealUnlocked, restaurantDeals } from './deals'

/** Strength (0..1) of the best currently-unlocked deal, for Best Match scoring. */
export function bestDealValue(r: Restaurant, user: PersistedUser): number {
  const deals = restaurantDeals(r, user).filter((d) => dealUnlocked(d, user))
  return deals.length ? Math.max(...deals.map((d) => d.value)) : 0
}
