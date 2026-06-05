import { describe, expect, it } from 'vitest'
import { FRIENDS, INITIAL_USER, RESTAURANTS } from '../data/seed'
import { communityScores } from './ranking'
import { matchScores } from './match'
import { levelFromXp, XP } from './xp'
import { scoreToTier } from '../theme/tokens'

const user = INITIAL_USER

describe('community ranking', () => {
  it('places Luna Tacos in the S tier (matches the restaurant profile)', () => {
    const scores = communityScores(RESTAURANTS, user)
    expect(scoreToTier(scores['luna-tacos'])).toBe('S')
  })

  it('produces a believable spread across all tiers', () => {
    const scores = communityScores(RESTAURANTS, user)
    const tiers = new Set(RESTAURANTS.map((r) => scoreToTier(scores[r.id])))
    expect(tiers.size).toBeGreaterThanOrEqual(3)
  })
})

describe('best match', () => {
  it('ranks Luna Tacos highest among cheap (under $15) spots', () => {
    const m = matchScores(RESTAURANTS, user, FRIENDS)
    const cheap = RESTAURANTS.filter((r) => r.priceTier === 1)
    const top = cheap.slice().sort((a, b) => m[b.id] - m[a.id])[0]
    expect(top.id).toBe('luna-tacos')
  })
})

describe('xp and levels', () => {
  it('Lucas starts as Community Regular and levels up through the demo flow', () => {
    expect(levelFromXp(user.xp).def.name).toBe('Community Regular')
    const afterDemo = user.xp + XP.stamp + XP.review + XP.comparison // 25 + 30 + 10
    expect(levelFromXp(afterDemo).def.name).toBe('Local Champion')
  })
})
