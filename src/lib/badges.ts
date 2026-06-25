import type { Badge, MealType, PersistedUser, Restaurant } from '../data/types'
import { levelFromXp } from './xp'

// Badges are derived achievements: each rule is a small "metric>=N" predicate
// evaluated against live state, so they light up the moment the user earns them.
export function badgeUnlocked(
  badge: Badge,
  user: PersistedUser,
  restaurants: Restaurant[],
  biteCount = 0,
): boolean {
  const byId = (id: string) => restaurants.find((r) => r.id === id)
  const visited = user.visitedIds.map(byId).filter(Boolean) as Restaurant[]
  const [lhs, rhs] = badge.rule.split('>=')
  const need = Number(rhs)

  let have = 0
  if (lhs === 'bites') have = biteCount
  else if (lhs === 'stamps') have = user.visitedIds.length
  else if (lhs === 'redemptions') have = user.redeemedDealIds.length
  else if (lhs === 'reviews') have = user.reviews.filter((r) => r.verified).length
  else if (lhs === 'ranked') have = Object.keys(user.personalScores).length
  else if (lhs === 'slowHourVisits') have = user.slowHourVisitIds.length
  else if (lhs === 'hiddenGem') have = visited.filter((r) => r.reviewCount < 25).length
  else if (lhs === 'level') have = levelFromXp(user.xp).index
  else if (lhs.startsWith('cuisine:'))
    have = visited.filter((r) => r.cuisine === lhs.split(':')[1]).length
  else if (lhs.startsWith('meal:'))
    have = visited.filter((r) => r.meals.includes(lhs.split(':')[1] as MealType)).length

  return have >= need
}
