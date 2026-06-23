import type { PersistedUser } from './types'

/** Blank user before the API hydrates from Supabase. */
export const EMPTY_USER: PersistedUser = {
  name: '',
  avatarSeed: '',
  xp: 0,
  savedIds: [],
  visitedIds: [],
  personalScores: {},
  slowHourVisitIds: [],
  comparisons: 0,
  reviews: [],
  redeemedDealIds: [],
  claimedQuestIds: [],
  onboarded: false,
  ownerMode: false,
}

/** User row from the API with live counts from the database. */
export interface AppUser extends PersistedUser {
  biteCount: number
  reviewCount: number
}
