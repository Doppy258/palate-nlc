import type { PersistedUser, Restaurant, Tier } from '../data/types'
import { scoreToTier, TIER_ORDER } from '../theme/tokens'

// Head-to-head outcome: the winner climbs, the loser eases down, both clamped.
// Forcing a real preference is stronger than two 5-star ratings sitting equal.
export function applyHeadToHead(
  scores: Record<string, number>,
  winnerId: string,
  loserId: string,
): Record<string, number> {
  const next = { ...scores }
  const wPrev = next[winnerId] ?? 65
  const lPrev = next[loserId] ?? 60
  next[winnerId] = Math.min(100, Math.round(wPrev + 8))
  next[loserId] = Math.max(32, Math.round(lPrev - 4))
  return next
}

/** Community Restaurant Score (0..100), min-max normalized across the set:
 *  0.40 head-to-head wins + 0.25 rating + 0.20 verified reviews + 0.15 saves. */
export function communityScores(
  restaurants: Restaurant[],
  user: PersistedUser,
): Record<string, number> {
  const wins = restaurants.map((r) => r.baseH2hWins)
  const saves = restaurants.map((r) => r.baseSaves + (user.savedIds.includes(r.id) ? 1 : 0))
  const verified = restaurants.map(
    (r) =>
      r.baseVerifiedReviews +
      user.reviews.filter((rv) => rv.restaurantId === r.id && rv.verified).length,
  )

  const norm = (arr: number[]) => {
    const mn = Math.min(...arr)
    const mx = Math.max(...arr)
    return (v: number) => (mx === mn ? 0.5 : (v - mn) / (mx - mn))
  }
  const nWins = norm(wins)
  const nSaves = norm(saves)
  const nVer = norm(verified)

  const out: Record<string, number> = {}
  restaurants.forEach((r, i) => {
    const score =
      0.4 * nWins(wins[i]) +
      0.25 * (r.rating / 5) +
      0.2 * nVer(verified[i]) +
      0.15 * nSaves(saves[i])
    out[r.id] = Math.round(score * 100)
  })
  return out
}

export function communityTiers(
  restaurants: Restaurant[],
  user: PersistedUser,
): Record<Tier, Restaurant[]> {
  const scores = communityScores(restaurants, user)
  return bucketByScore(restaurants, (r) => scores[r.id])
}

/** The user's personal tier list. Ranked spots bucket by score; saved-but-unranked
 *  go to the Want to Try holding bucket. */
export function personalTiers(
  restaurants: Restaurant[],
  user: PersistedUser,
): Record<Tier, Restaurant[]> {
  const ranked = restaurants.filter((r) => user.personalScores[r.id] != null)
  const buckets = bucketByScore(ranked, (r) => user.personalScores[r.id])
  buckets['want-to-try'] = restaurants.filter(
    (r) => user.savedIds.includes(r.id) && user.personalScores[r.id] == null,
  )
  return buckets
}

function bucketByScore(
  restaurants: Restaurant[],
  getScore: (r: Restaurant) => number,
): Record<Tier, Restaurant[]> {
  const buckets: Record<Tier, Restaurant[]> = {
    'SSS+': [],
    S: [],
    A: [],
    B: [],
    C: [],
    'want-to-try': [],
  }
  for (const r of restaurants) buckets[scoreToTier(getScore(r))].push(r)
  for (const t of TIER_ORDER) buckets[t].sort((a, b) => getScore(b) - getScore(a))
  return buckets
}
