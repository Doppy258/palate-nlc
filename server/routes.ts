import { Router, type Request, type Response, type NextFunction } from 'express'
import type { Bite, Deal, PersistedUser } from '../src/data/types.ts'
import { applyHeadToHead } from '../src/lib/ranking.ts'
import { dealRedeemable } from '../src/lib/deals.ts'
import { questProgress } from '../src/lib/quests.ts'
import { isSlowHourActive } from '../src/lib/time.ts'
import { scoreToTier } from '../src/theme/tokens.ts'
import { XP } from '../src/lib/xp.ts'
import {
  addOwnerDeal,
  addRestaurantReview,
  bumpAnalytics,
  countUserBites,
  createUserProfile,
  getAnalytics,
  getAppUser,
  getConfig,
  getRestaurant,
  getUser,
  insertBite,
  listBites,
  listFriends,
  listRestaurants,
  normalizeUser,
  saveUser,
  sendFriendRequest,
  listPendingRequests,
  listSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  listAllUsers,
  getUserName,
} from './db.ts'
import { signUp, signIn } from './auth.ts'

const uid = () => Math.random().toString(36).slice(2, 9)

// Decode JWT payload without verification (trust comes from HTTPS + Supabase)
function jwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return null
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

// Middleware to extract user ID from Authorization header
function extractUserId(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  
  ;(req as any).token = token
  ;(req as any).userId = null
  
  if (token) {
    const payload = jwtPayload(token)
    if (payload?.sub && typeof payload.sub === 'string') {
      ;(req as any).userId = payload.sub
    }
  }
  
  next()
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req as any).token
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

async function withStats(user: PersistedUser, userId: string) {
  const biteCount = await countUserBites(userId)
  return {
    ...normalizeUser(user),
    biteCount,
    reviewCount: user.reviews.filter((r) => r.verified).length,
  }
}

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next)
  }

export const api = Router()

// Apply auth middleware to all routes
api.use(extractUserId)

// Auth endpoints (no auth required)
api.post(
  '/auth/signup',
  asyncHandler(async (req, res) => {
    const { email, password, displayName } = req.body as {
      email: string
      password: string
      displayName: string
    }
    
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    try {
      const result = await signUp(email, password, displayName)
      res.json({
        user: result.user,
        access_token: result.session?.access_token || '',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed'
      console.error('Signup error:', errorMessage, { email, displayName })
      res.status(400).json({ error: errorMessage })
    }
  }),
)

api.post(
  '/auth/signin',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as {
      email: string
      password: string
    }
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' })
    }
    
    try {
      const result = await signIn(email, password)
      res.json({
        user: result.user,
        access_token: result.session?.access_token || '',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      console.error('Signin error:', errorMessage, { email })
      res.status(400).json({ error: errorMessage })
    }
  }),
)

api.get(
  '/health',
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, database: 'supabase' })
  }),
)

api.get(
  '/config',
  asyncHandler(async (_req, res) => {
    res.json(await getConfig())
  }),
)

api.get(
  '/restaurants',
  asyncHandler(async (_req, res) => {
    res.json(await listRestaurants())
  }),
)

api.get(
  '/restaurants/:id',
  asyncHandler(async (req, res) => {
    const r = await getRestaurant(req.params.id)
    if (!r) return res.status(404).json({ error: 'Restaurant not found' })
    await bumpAnalytics(r.id, 'views')
    const analytics = await getAnalytics(r.id)
    res.json({
      ...r,
      baseViews: (analytics.views ?? r.baseViews) + 1,
      baseSaves: analytics.saves ?? r.baseSaves,
      baseStampsCollected: analytics.stamps ?? r.baseStampsCollected,
      baseCouponsRedeemed: analytics.redemptions ?? r.baseCouponsRedeemed,
      baseVerifiedReviews: analytics.verified_reviews ?? r.baseVerifiedReviews,
      baseH2hWins: analytics.h2h_wins ?? r.baseH2hWins,
    })
  }),
)

api.get(
  '/friends',
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    res.json(await listFriends(userId))
  }),
)

api.get(
  '/users',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    res.json(await listAllUsers(userId))
  }),
)

api.post(
  '/friend-requests',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const { toUserId } = req.body as { toUserId: string }
    if (!toUserId) return res.status(400).json({ error: 'Missing toUserId' })
    if (toUserId === userId) return res.status(400).json({ error: 'Cannot send request to yourself' })
    await sendFriendRequest(userId, toUserId)
    res.json({ success: true })
  }),
)

api.get(
  '/friend-requests/pending',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const pending = await listPendingRequests(userId)
    // Enrich with sender names
    const enriched = await Promise.all(
      pending.map(async (r) => ({
        id: r.id,
        fromUserId: r.from_user_id,
        toUserId: r.to_user_id,
        fromName: await getUserName(r.from_user_id),
        createdAt: r.created_at,
      })),
    )
    res.json(enriched)
  }),
)

api.get(
  '/friend-requests/sent',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const sent = await listSentRequests(userId)
    const enriched = await Promise.all(
      sent.map(async (r) => ({
        id: r.id,
        fromUserId: r.from_user_id,
        toUserId: r.to_user_id,
        toName: await getUserName(r.to_user_id),
        status: r.status,
        createdAt: r.created_at,
      })),
    )
    res.json(enriched)
  }),
)

api.post(
  '/friend-requests/:id/accept',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    await acceptFriendRequest(req.params.id, userId)
    res.json({ success: true })
  }),
)

api.post(
  '/friend-requests/:id/reject',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    await rejectFriendRequest(req.params.id, userId)
    res.json({ success: true })
  }),
)

api.get(
  '/bites',
  asyncHandler(async (req, res) => {
    const restaurantId = typeof req.query.restaurantId === 'string' ? req.query.restaurantId : undefined
    res.json(await listBites(restaurantId))
  }),
)

api.get(
  '/user',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const user = await getAppUser(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  }),
)

api.put(
  '/user',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const body = req.body as PersistedUser
    await saveUser(userId, body)
    res.json(body)
  }),
)

api.post(
  '/user/onboarding',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const user = (await getUser(userId))!
    user.onboarded = true
    await saveUser(userId, user)
    res.json(await withStats(user, userId))
  }),
)

api.post(
  '/user/owner-mode',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const user = (await getUser(userId))!
    user.ownerMode = Boolean(req.body?.enabled)
    await saveUser(userId, user)
    res.json(await withStats(user, userId))
  }),
)

api.post(
  '/user/save/:restaurantId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const user = (await getUser(userId))!
    const id = req.params.restaurantId
    const saved = user.savedIds.includes(id)
    if (saved) {
      user.savedIds = user.savedIds.filter((x) => x !== id)
      await saveUser(userId, user)
      return res.json({ user: await withStats(user, userId), xpAwarded: 0 })
    }
    user.savedIds = [...user.savedIds, id]
    user.xp += XP.save
    await bumpAnalytics(id, 'saves')
    await saveUser(userId, user)
    res.json({ user: await withStats(user, userId), xpAwarded: XP.save })
  }),
)

api.post(
  '/user/check-in',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const { restaurantId, code } = req.body as { restaurantId: string; code: string }
    const r = await getRestaurant(restaurantId)
    if (!r) return res.status(404).json({ error: 'Restaurant not found' })
    if (code.trim().toUpperCase() !== r.checkInCode) {
      return res.status(400).json({ error: 'Invalid check-in code' })
    }

    const user = (await getUser(userId))!
    let xpAwarded = 0
    const already = user.visitedIds.includes(restaurantId)

    if (!already) {
      user.visitedIds = [...user.visitedIds, restaurantId]
      user.xp += XP.stamp
      xpAwarded += XP.stamp
      await bumpAnalytics(restaurantId, 'stamps')
    }

    const slow = isSlowHourActive(r.slowHour)
    if (slow && !user.slowHourVisitIds.includes(restaurantId)) {
      user.slowHourVisitIds = [...user.slowHourVisitIds, restaurantId]
      user.xp += XP.slowHour
      xpAwarded += XP.slowHour
    }

    await saveUser(userId, user)
    res.json({ user: await withStats(user, userId), slowHour: slow, xpAwarded, firstStamp: !already })
  }),
)

api.post(
  '/user/redeem',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const { dealId, restaurantId } = req.body as { dealId: string; restaurantId: string }
    const r = await getRestaurant(restaurantId)
    if (!r) return res.status(404).json({ error: 'Restaurant not found' })

    const user = (await getUser(userId))!
    const deal = r.deals.find((d) => d.id === dealId)
    if (!deal || !dealRedeemable(deal, r, user)) {
      return res.status(400).json({ error: 'Deal not redeemable' })
    }

    user.redeemedDealIds = [...user.redeemedDealIds, dealId]
    user.xp += XP.redeem
    await bumpAnalytics(restaurantId, 'redemptions')
    await saveUser(userId, user)
    res.json({ user: await withStats(user, userId), xpAwarded: XP.redeem })
  }),
)

api.post(
  '/user/reviews',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const { restaurantId, rating, text, tags } = req.body as {
      restaurantId: string
      rating: number
      text: string
      tags: string[]
    }
    const user = (await getUser(userId))!
    if (!user.visitedIds.includes(restaurantId)) {
      return res.status(400).json({ error: 'Must check in before reviewing' })
    }

    const review = {
      id: 'u-' + uid(),
      restaurantId,
      author: user.name,
      avatarSeed: user.avatarSeed,
      rating,
      text,
      date: 'Just now',
      verified: true,
      tags,
    }
    user.reviews = [review, ...user.reviews]
    user.xp += XP.review
    await bumpAnalytics(restaurantId, 'verified_reviews')
    await addRestaurantReview(restaurantId, review)
    await saveUser(userId, user)
    res.json({ user: await withStats(user, userId), review, xpAwarded: XP.review })
  }),
)

api.post(
  '/user/bites',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const body = req.body as {
      restaurantId: string
      dish: string
      caption: string
      rating: number
      tags: string[]
      photoSeed: string
    }
    const user = (await getUser(userId))!
    const bite: Bite = {
      id: 'u-' + uid(),
      author: user.name,
      avatarSeed: user.avatarSeed,
      createdAt: Date.now(),
      ...body,
    }
    await insertBite(bite, userId)
    user.xp += XP.bite
    await saveUser(userId, user)
    res.json({ user: await withStats(user, userId), bite, xpAwarded: XP.bite })
  }),
)

api.post(
  '/user/compare',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const { winnerId, loserId } = req.body as { winnerId: string; loserId: string }
    const user = (await getUser(userId))!
    const prevTier = scoreToTier(user.personalScores[winnerId] ?? 65)
    const next = applyHeadToHead(user.personalScores, winnerId, loserId)
    const newTier = scoreToTier(next[winnerId])
    user.personalScores = next
    user.comparisons += 1
    user.xp += XP.comparison
    await bumpAnalytics(winnerId, 'h2h_wins')
    await saveUser(userId, user)
    res.json({ user: await withStats(user, userId), newTier, changed: newTier !== prevTier, xpAwarded: XP.comparison })
  }),
)

api.post(
  '/user/tier/:restaurantId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const user = (await getUser(userId))!
    const id = req.params.restaurantId
    if (user.personalScores[id] != null) {
      return res.status(400).json({ error: 'Already ranked' })
    }
    user.personalScores = { ...user.personalScores, [id]: 65 }
    user.xp += XP.tier
    await saveUser(userId, user)
    res.json({ user: await withStats(user, userId), xpAwarded: XP.tier })
  }),
)

api.post(
  '/user/quests/:questId/claim',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const user = (await getUser(userId))!
    const restaurants = await listRestaurants()
    const friends = await listFriends(userId)
    const biteCount = await countUserBites(userId)
    const q = (await getConfig()).quests.find((x) => x.id === req.params.questId)
    if (!q) return res.status(404).json({ error: 'Quest not found' })
    const p = questProgress(q, user, restaurants, friends.length, biteCount)
    if (!p.claimable) return res.status(400).json({ error: 'Quest not claimable' })
    user.claimedQuestIds = [...user.claimedQuestIds, q.id]
    user.xp += XP.quest
    await saveUser(userId, user)
    res.json({ user: await withStats(user, userId), xpAwarded: XP.quest })
  }),
)

api.post(
  '/user/owner-deals',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId
    const { restaurantId, label, kind, value, slowHour } = req.body as {
      restaurantId: string
      label: string
      kind: Deal['kind']
      value: number
      slowHour?: boolean
    }
    const user = (await getUser(userId))!
    const deal: Deal = { id: 'own-' + uid(), createdAt: Date.now(), label, kind, value, slowHour }
    await addOwnerDeal(restaurantId, deal)
    res.json({ user: await withStats(user, userId), deal })
  }),
)

api.get(
  '/analytics/:restaurantId',
  asyncHandler(async (req, res) => {
    res.json(await getAnalytics(req.params.restaurantId))
  }),
)

api.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})
