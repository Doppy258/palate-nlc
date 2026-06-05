import type { Friend, PersistedUser, Restaurant } from '../data/types'
import { bestDealValue } from './deals-value'
import { friendSignal } from './friends'

// Best Match is the headline "intelligent" sort. It blends five normalized
// signals, so recommendations reflect the user's behavior, not just stars:
//   0.30 rating + 0.25 friend activity + 0.20 tag match + 0.15 deal value + 0.10 distance
const W = { rating: 0.3, friend: 0.25, tag: 0.2, deal: 0.15, distance: 0.1 }

/** A weighted tag profile from everywhere the user has shown intent. */
export function tasteProfile(
  user: PersistedUser,
  restaurants: Restaurant[],
): Record<string, number> {
  const ids = new Set([
    ...user.visitedIds,
    ...user.savedIds,
    ...Object.keys(user.personalScores),
  ])
  const prof: Record<string, number> = {}
  for (const r of restaurants) {
    if (!ids.has(r.id)) continue
    const weight = user.personalScores[r.id] ? user.personalScores[r.id] / 100 : 0.6
    for (const t of r.tags) prof[t] = (prof[t] ?? 0) + weight
  }
  return prof
}

export function tagMatch(r: Restaurant, profile: Record<string, number>): number {
  if (!r.tags.length) return 0
  const peak = Math.max(1, ...Object.values(profile))
  let sum = 0
  for (const t of r.tags) sum += profile[t] ?? 0
  return Math.min(1, sum / (r.tags.length * peak))
}

/** Best Match score (0..100) for every restaurant, with cross-set normalization. */
export function matchScores(
  restaurants: Restaurant[],
  user: PersistedUser,
  friends: Friend[],
): Record<string, number> {
  const profile = tasteProfile(user, restaurants)
  const signals = restaurants.map((r) => friendSignal(r.id, friends))
  const maxFriend = Math.max(1, ...signals)
  const maxDist = Math.max(...restaurants.map((r) => r.distanceMi), 1)

  const out: Record<string, number> = {}
  restaurants.forEach((r, i) => {
    const ratingN = r.rating / 5
    const friendN = signals[i] / maxFriend
    const tagN = tagMatch(r, profile)
    const dealN = bestDealValue(r, user)
    const distN = 1 - r.distanceMi / maxDist
    const score =
      W.rating * ratingN +
      W.friend * friendN +
      W.tag * tagN +
      W.deal * dealN +
      W.distance * distN
    out[r.id] = Math.round(score * 100)
  })
  return out
}
