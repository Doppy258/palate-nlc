import type { Bite, Friend, LevelDef, PersistedUser, Quest, Restaurant, Badge } from '../src/data/types.ts'
import { BADGES, LEVELS, QUESTS } from './seed-data.ts'
import { getSupabase } from './supabase.ts'
import { getRestaurants, getRestaurantById } from './places.ts'

type AnalyticsRow = {
  restaurant_id: string
  views: number
  saves: number
  stamps: number
  redemptions: number
  verified_reviews: number
  h2h_wins: number
}

type AnalyticsMetric = keyof Omit<AnalyticsRow, 'restaurant_id'>

function throwDb(error: { message: string }) {
  throw new Error(error.message)
}

function withAnalytics(r: Restaurant, a?: AnalyticsRow | null): Restaurant {
  if (!a) return r
  return {
    ...r,
    baseViews: a.views,
    baseSaves: a.saves,
    baseStampsCollected: a.stamps,
    baseCouponsRedeemed: a.redemptions,
    baseVerifiedReviews: a.verified_reviews,
    baseH2hWins: a.h2h_wins,
  }
}

function rowToBite(row: {
  id: string
  restaurant_id: string
  author: string
  avatar_seed: string
  photo_seed: string
  dish: string
  caption: string
  rating: number
  tags: string[] | string
  created_at: number
}): Bite {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    author: row.author,
    avatarSeed: row.avatar_seed,
    photoSeed: row.photo_seed,
    dish: row.dish,
    caption: row.caption,
    rating: Number(row.rating),
    tags: Array.isArray(row.tags) ? row.tags : (JSON.parse(row.tags as string) as string[]),
    createdAt: Number(row.created_at),
  }
}

export async function createUserProfile(userId: string, name: string) {
  const sb = getSupabase()
  const user: PersistedUser = {
    name,
    avatarSeed: name.toLowerCase().replace(/\s+/g, ''),
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
  
  const { error } = await sb.from('users').insert({ id: userId, data: user })
  if (error) throwDb(error)
  
  return user
}

export async function listRestaurants(): Promise<Restaurant[]> {
  const sb = getSupabase()
  const [restaurants, { data: analytics, error: aErr }] = await Promise.all([
    getRestaurants(),
    sb.from('analytics').select('*'),
  ])
  if (aErr) throwDb(aErr)
  const aMap = new Map((analytics ?? []).map((a) => [a.restaurant_id, a as AnalyticsRow]))
  return restaurants.map((r) => withAnalytics(r, aMap.get(r.id)))
}

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  const sb = getSupabase()
  const [restaurant, { data: analytics, error: aErr }] = await Promise.all([
    getRestaurantById(id),
    sb.from('analytics').select('*').eq('restaurant_id', id).maybeSingle(),
  ])
  if (aErr) throwDb(aErr)
  if (!restaurant) return null
  return withAnalytics(restaurant, analytics as AnalyticsRow | null)
}

export async function listFriends(currentUserId?: string): Promise<Friend[]> {
  const sb = getSupabase()
  
  // Get accepted friend request user IDs for the current user
  let friendIds: string[] = []
  if (currentUserId) {
    const { data: requests, error: reqErr } = await sb
      .from('friend_requests')
      .select('from_user_id, to_user_id')
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${currentUserId},to_user_id.eq.${currentUserId}`)
    if (reqErr) throwDb(reqErr)
    
    friendIds = (requests ?? []).map((r) =>
      r.from_user_id === currentUserId ? r.to_user_id : r.from_user_id,
    )
  }
  
  if (friendIds.length === 0) return []
  
  // Get friend user data
  let q = sb.from('users').select('id, data').in('id', friendIds)
  const { data: users, error } = await q
  if (error) throwDb(error)
  
  // Get all bites grouped by user_id
  const { data: bites, error: bErr } = await sb.from('bites').select('user_id, restaurant_id')
  if (bErr) throwDb(bErr)
  
  // Build bite restaurant lookup per user
  const userBites = new Map<string, Set<string>>()
  for (const b of bites ?? []) {
    if (!b.user_id) continue
    if (!userBites.has(b.user_id)) userBites.set(b.user_id, new Set())
    userBites.get(b.user_id)!.add(b.restaurant_id)
  }
  
  return (users ?? []).map((row) => {
    const user = row.data as PersistedUser
    const sTierIds = Object.entries(user.personalScores || {})
      .filter(([, score]) => score >= 90)
      .map(([id]) => id)
    const userId = row.id
    
    return {
      id: userId,
      name: user.name || 'Anonymous',
      avatarSeed: user.avatarSeed || 'default',
      savedIds: user.savedIds || [],
      sTierIds,
      biteRestaurantIds: Array.from(userBites.get(userId) ?? []),
    }
  })
}

export async function listBites(restaurantId?: string): Promise<Bite[]> {
  const sb = getSupabase()
  let q = sb
    .from('bites')
    .select('*')
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false })
  if (restaurantId) q = q.eq('restaurant_id', restaurantId)
  const { data, error } = await q
  if (error) throwDb(error)
  return (data ?? []).map(rowToBite)
}

export async function insertBite(bite: Bite, userId: string) {
  const sb = getSupabase()
  const { error } = await sb.from('bites').insert({
    id: bite.id,
    restaurant_id: bite.restaurantId,
    author: bite.author,
    avatar_seed: bite.avatarSeed,
    photo_seed: bite.photoSeed,
    dish: bite.dish,
    caption: bite.caption,
    rating: bite.rating,
    tags: bite.tags,
    created_at: bite.createdAt,
    user_id: userId,
  })
  if (error) throwDb(error)
}

export async function countUserBites(userId: string): Promise<number> {
  const sb = getSupabase()
  const { count, error } = await sb
    .from('bites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) throwDb(error)
  return count ?? 0
}

/** Strip legacy fields that now live in other tables. */
export function normalizeUser(raw: PersistedUser): PersistedUser {
  const legacy = raw as PersistedUser & { bites?: unknown; ownerDeals?: unknown }
  const { bites: _b, ownerDeals: _o, ...user } = legacy
  return user
}

async function readUser(id: string): Promise<PersistedUser | null> {
  const sb = getSupabase()
  const { data, error } = await sb.from('users').select('data').eq('id', id).maybeSingle()
  if (error) throwDb(error)
  return data ? normalizeUser(data.data as PersistedUser) : null
}

export async function getAppUser(id: string) {
  const user = await readUser(id)
  if (!user) return null
  const biteCount = await countUserBites(id)
  const reviewCount = user.reviews.filter((r) => r.verified).length
  return { ...user, biteCount, reviewCount }
}

export async function getUser(id: string): Promise<PersistedUser | null> {
  return readUser(id)
}

export async function saveUser(id: string, user: PersistedUser) {
  const sb = getSupabase()
  const { error } = await sb.from('users').upsert({ id, data: normalizeUser(user) })
  if (error) throwDb(error)
}

export async function bumpAnalytics(restaurantId: string, metric: AnalyticsMetric, amount = 1) {
  const sb = getSupabase()
  const { data: existing, error: readErr } = await sb
    .from('analytics')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .maybeSingle()
  if (readErr) throwDb(readErr)

  if (!existing) {
    const base: AnalyticsRow = {
      restaurant_id: restaurantId,
      views: 0,
      saves: 0,
      stamps: 0,
      redemptions: 0,
      verified_reviews: 0,
      h2h_wins: 0,
    }
    base[metric] = amount
    const { error } = await sb.from('analytics').insert(base)
    if (error) throwDb(error)
    return
  }

  const { error } = await sb
    .from('analytics')
    .update({ [metric]: (existing as AnalyticsRow)[metric] + amount })
    .eq('restaurant_id', restaurantId)
  if (error) throwDb(error)
}

export async function getAnalytics(restaurantId: string): Promise<Record<string, number>> {
  const sb = getSupabase()
  const { data, error } = await sb.from('analytics').select('*').eq('restaurant_id', restaurantId).maybeSingle()
  if (error) throwDb(error)
  if (!data) return {}
  const row = data as AnalyticsRow
  return {
    views: row.views,
    saves: row.saves,
    stamps: row.stamps,
    redemptions: row.redemptions,
    verified_reviews: row.verified_reviews,
    h2h_wins: row.h2h_wins,
  }
}

export async function getConfig(): Promise<{ quests: Quest[]; badges: Badge[]; levels: LevelDef[] }> {
  const sb = getSupabase()
  const [questsRes, badgesRes, levelsRes] = await Promise.all([
    sb.from('quests').select('data'),
    sb.from('badges').select('data'),
    sb.from('levels').select('data').order('id'),
  ])
  if (questsRes.error) throwDb(questsRes.error)
  if (badgesRes.error) throwDb(badgesRes.error)
  if (levelsRes.error) throwDb(levelsRes.error)

  const quests = (questsRes.data ?? []).map((r) => r.data as Quest)
  const badges = (badgesRes.data ?? []).map((r) => r.data as Badge)
  const levels = (levelsRes.data ?? []).map((r) => r.data as LevelDef)

  if (!quests.length || !badges.length || !levels.length) {
    throw new Error('Config tables are empty. Run npm run db:seed after applying supabase/schema.sql.')
  }

  return { quests, badges, levels }
}

export async function addOwnerDeal(restaurantId: string, deal: Restaurant['deals'][number]) {
  const r = await getRestaurant(restaurantId)
  if (!r) return null
  r.deals = [deal, ...r.deals]
  const sb = getSupabase()
  const { error } = await sb.from('restaurants').upsert({ id: restaurantId, data: r })
  if (error) throwDb(error)
  return deal
}

export async function addRestaurantReview(restaurantId: string, review: Restaurant['reviews'][number]) {
  const r = await getRestaurant(restaurantId)
  if (!r) return
  r.reviews = [review, ...r.reviews]
  r.reviewCount += 1
  const sum = r.reviews.reduce((a, rv) => a + rv.rating, 0)
  r.rating = Math.round((sum / r.reviews.length) * 10) / 10
  const sb = getSupabase()
  const { error } = await sb.from('restaurants').upsert({ id: restaurantId, data: r })
  if (error) throwDb(error)
}

export async function seedDatabase(opts: { reset?: boolean } = {}) {
  const sb = getSupabase()

  if (opts.reset) {
    await Promise.all([
      sb.from('bites').delete().neq('id', ''),
      sb.from('quests').delete().neq('id', ''),
      sb.from('badges').delete().neq('id', ''),
      sb.from('levels').delete().neq('id', ''),
      sb.from('friend_requests').delete().neq('id', ''),
    ])
  } else {
    // Skip if already seeded
    const { count } = await sb.from('quests').select('*', { count: 'exact', head: true })
    if ((count ?? 0) > 0) return { seeded: false }
  }

  const { error: qErr } = await sb.from('quests').upsert(QUESTS.map((q) => ({ id: q.id, data: q })))
  if (qErr) throwDb(qErr)
  const { error: badgeErr } = await sb.from('badges').upsert(BADGES.map((b) => ({ id: b.id, data: b })))
  if (badgeErr) throwDb(badgeErr)
  const { error: lErr } = await sb.from('levels').insert(LEVELS.map((l) => ({ data: l })))
  if (lErr) throwDb(lErr)

  return { seeded: true }
}

// -- Friend requests --

export async function sendFriendRequest(fromUserId: string, toUserId: string) {
  const sb = getSupabase()
  
  // Check if request already exists
  const { data: existing } = await sb
    .from('friend_requests')
    .select('id, status')
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId)
    .maybeSingle()
  
  if (existing) {
    if (existing.status === 'accepted') throw new Error('Already friends')
    if (existing.status === 'pending') throw new Error('Friend request already sent')
    // Rejected: re-send
    const { error } = await sb
      .from('friend_requests')
      .update({ status: 'pending' })
      .eq('id', existing.id)
    if (error) throwDb(error)
    return
  }
  
  const { error } = await sb.from('friend_requests').insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    status: 'pending',
  })
  if (error) throwDb(error)
}

export async function listPendingRequests(userId: string) {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('friend_requests')
    .select('id, from_user_id, to_user_id, created_at')
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throwDb(error)
  return data ?? []
}

export async function listSentRequests(userId: string) {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('friend_requests')
    .select('id, from_user_id, to_user_id, status, created_at')
    .eq('from_user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throwDb(error)
  return data ?? []
}

export async function acceptFriendRequest(requestId: string, userId: string) {
  const sb = getSupabase()
  const { data: request, error: getErr } = await sb
    .from('friend_requests')
    .select('*')
    .eq('id', requestId)
    .single()
  if (getErr) throwDb(getErr)
  if (!request) throw new Error('Friend request not found')
  if (request.to_user_id !== userId) throw new Error('Not authorized')
  if (request.status !== 'pending') throw new Error('Request is not pending')
  
  const { error } = await sb
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)
  if (error) throwDb(error)
}

export async function rejectFriendRequest(requestId: string, userId: string) {
  const sb = getSupabase()
  const { data: request, error: getErr } = await sb
    .from('friend_requests')
    .select('*')
    .eq('id', requestId)
    .single()
  if (getErr) throwDb(getErr)
  if (!request) throw new Error('Friend request not found')
  if (request.to_user_id !== userId) throw new Error('Not authorized')
  if (request.status !== 'pending') throw new Error('Request is not pending')
  
  const { error } = await sb
    .from('friend_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
  if (error) throwDb(error)
}

export async function getUserName(userId: string): Promise<string | null> {
  const sb = getSupabase()
  const { data, error } = await sb.from('users').select('data->>name').eq('id', userId).maybeSingle()
  if (error) throwDb(error)
  if (!data) return null
  return (data as Record<string, unknown>).name as string ?? null
}

export async function listAllUsers(currentUserId?: string) {
  const sb = getSupabase()
  let q = sb.from('users').select('id, data->>name, data->>avatarSeed')
  if (currentUserId) {
    q = q.neq('id', currentUserId)
  }
  const { data, error } = await q.order('data->>name')
  if (error) throwDb(error)
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: (row.name as string) ?? 'Anonymous',
    avatarSeed: (row.avatarSeed as string) ?? 'default',
  }))
}

export async function ensureSeeded() {
  try {
    await seedDatabase()
  } catch {
    /* tables may not exist yet; run supabase/schema.sql first */
  }
}
