// Domain model for Palate. All scores are honest, computed values; nothing
// here is fake-precise. Restaurant + review ratings are out of 5; Bite
// "story" scores are out of 10 (Beli-style quick takes).

export type PriceTier = 1 | 2 | 3 // $, $$, $$$

export type Tier = 'SSS+' | 'S' | 'A' | 'B' | 'C' | 'want-to-try'

export type MealType =
  | 'breakfast'
  | 'brunch'
  | 'lunch'
  | 'dinner'
  | 'dessert'
  | 'drinks'
  | 'late-night'

export type GroupFit = 'solo' | 'date' | 'small' | 'large' | 'family'

export type DealKind =
  | 'percent'
  | 'amount'
  | 'free'
  | 'student'
  | 'first-time'
  | 'stamp'
  | 'slow-hour'
  | 'group'

export interface Deal {
  id: string
  label: string
  kind: DealKind
  /** Normalized 0..1 strength, used by the Best Match score and deal sorting. */
  value: number
  /** Stamp count required to unlock, if any. */
  requiresStamps?: number
  slowHour?: boolean
  /** Epoch ms, drives the "Newest deals" sort. */
  createdAt: number
}

export interface Review {
  id: string
  author: string
  avatarSeed: string
  rating: number // out of 5
  text: string
  date: string
  verified: boolean
  tags: string[]
}

export interface Dish {
  name: string
  /** Orders-share signal used by the owner dashboard. */
  popularity: number
  photoSeed: string
}

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  priceTier: PriceTier
  neighborhood: string
  distanceMi: number
  /** 24h decimal open/close, e.g. 11 -> 11:00, 22.5 -> 22:30. */
  hours: { open: number; close: number }
  rating: number // out of 5
  reviewCount: number
  tags: string[]
  photoSeeds: string[]
  dishes: Dish[]
  deals: Deal[]
  slowHour?: { start: number; end: number; label: string }
  checkInCode: string
  meals: MealType[]
  groupFit: GroupFit[]
  // Seeded baseline community signals (the user's live actions add on top).
  baseSaves: number
  baseH2hWins: number
  baseViews: number
  baseStampsCollected: number
  baseCouponsRedeemed: number
  baseVerifiedReviews: number
  reviews: Review[]
  recentlyOpened?: boolean
}

export interface Friend {
  id: string
  name: string
  avatarSeed: string
  savedIds: string[]
  sTierIds: string[]
  biteRestaurantIds: string[]
}

export interface Bite {
  id: string
  restaurantId: string
  author: string
  avatarSeed: string
  photoSeed: string
  dish: string
  caption: string
  rating: number // out of 10
  tags: string[]
  createdAt: number
}

export type QuestGroup = 'starter' | 'food' | 'social' | 'business'

export interface Quest {
  id: string
  title: string
  group: QuestGroup
  target: number
  xp: number
  /** Key naming the metric this quest tracks; resolved in lib/quests.ts. */
  metric: string
}

export interface Badge {
  id: string
  name: string
  condition: string
  /** Key naming the unlock predicate; resolved in lib/badges.ts. */
  rule: string
}

export interface LevelDef {
  name: string
  minXp: number
}

export type UserReview = Review & { restaurantId: string }

/** The slice of state persisted to localStorage. Drives all live gamification. */
export interface PersistedUser {
  name: string
  avatarSeed: string
  xp: number
  /** Want to Try / saved restaurant ids. */
  savedIds: string[]
  /** Stamps collected via verified check-in. */
  visitedIds: string[]
  /** Preference scores (0..100) that drive the personal tier list. */
  personalScores: Record<string, number>
  /** Restaurants visited during their slow hour (for quest + badge). */
  slowHourVisitIds: string[]
  comparisons: number
  reviews: UserReview[]
  bites: Bite[]
  redeemedDealIds: string[]
  claimedQuestIds: string[]
  /** Owner-created deals, keyed by restaurant id, shown live on the consumer side. */
  ownerDeals: Record<string, Deal[]>
  onboarded: boolean
  ownerMode: boolean
}
