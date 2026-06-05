import type { Friend } from '../data/types'

/** Weighted friend-interest signal for a restaurant: a save counts, an S-tier
 *  placement counts more, a posted Bite adds a little. */
export function friendSignal(rid: string, friends: Friend[]): number {
  let s = 0
  for (const f of friends) {
    if (f.savedIds.includes(rid)) s += 1
    if (f.sTierIds.includes(rid)) s += 1.5
    if (f.biteRestaurantIds.includes(rid)) s += 0.5
  }
  return s
}

export function friendsWhoSaved(rid: string, friends: Friend[]): Friend[] {
  return friends.filter((f) => f.savedIds.includes(rid))
}

export function friendsWhoSTiered(rid: string, friends: Friend[]): Friend[] {
  return friends.filter((f) => f.sTierIds.includes(rid))
}
