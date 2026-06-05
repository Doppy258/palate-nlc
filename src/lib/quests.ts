import type { MealType, PersistedUser, Quest, Restaurant } from '../data/types'
import { FRIENDS } from '../data/seed'

/** Raw value of the real metric a quest tracks, computed from live user state. */
export function questValue(
  metric: string,
  user: PersistedUser,
  restaurants: Restaurant[],
): number {
  const byId = (id: string) => restaurants.find((r) => r.id === id)
  const visited = user.visitedIds.map(byId).filter(Boolean) as Restaurant[]
  switch (metric) {
    case 'saves':
      return user.savedIds.length
    case 'reviews':
      return user.reviews.filter((r) => r.verified).length
    case 'comparisons':
      return user.comparisons
    case 'stamps':
      return user.visitedIds.length
    case 'dessertVisits':
      return visited.filter((r) => r.meals.includes('dessert') || r.cuisine === 'Bakery').length
    case 'ranked':
      return Object.keys(user.personalScores).length
    case 'bites':
      return user.bites.length
    case 'friends':
      return FRIENDS.length
    case 'slowHourVisits':
      return user.slowHourVisitIds.length
    case 'underdogReviews':
      return user.reviews.filter((rv) => (byId(rv.restaurantId)?.reviewCount ?? 99) < 10).length
    case 'redemptions':
      return user.redeemedDealIds.length
    default:
      return 0
  }
}

export interface QuestProgress {
  value: number
  target: number
  done: boolean
  claimed: boolean
  claimable: boolean
}

export function questProgress(
  q: Quest,
  user: PersistedUser,
  restaurants: Restaurant[],
): QuestProgress {
  const raw = questValue(q.metric, user, restaurants)
  const done = raw >= q.target
  const claimed = user.claimedQuestIds.includes(q.id)
  return {
    value: Math.min(raw, q.target),
    target: q.target,
    done,
    claimed,
    claimable: done && !claimed,
  }
}

export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  brunch: 'Brunch',
  lunch: 'Lunch',
  dinner: 'Dinner',
  dessert: 'Dessert',
  drinks: 'Drinks',
  'late-night': 'Late night',
}
