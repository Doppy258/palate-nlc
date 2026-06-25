import type { LevelDef } from '../data/types'

const DEFAULT_LEVELS: LevelDef[] = [{ name: 'Local Newcomer', minXp: 0 }]
export const XP = {
  save: 5,
  tier: 10,
  comparison: 10,
  bite: 15,
  stamp: 25,
  review: 30,
  redeem: 30,
  quest: 75,
  slowHour: 50,
} as const

export interface LevelInfo {
  index: number // 1-based
  def: LevelDef
  next?: LevelDef
  intoLevel: number
  span: number
  progress: number // 0..1 within the current band
  xpToNext: number
}

export function levelFromXp(xp: number, levels: LevelDef[] = DEFAULT_LEVELS): LevelInfo {
  if (!levels || levels.length === 0) levels = DEFAULT_LEVELS
  let i = 0
  for (let k = 0; k < levels.length; k++) {
    if (xp >= levels[k].minXp) i = k
  }
  const def = levels[i]
  const next = levels[i + 1]
  const intoLevel = xp - def.minXp
  const span = next ? next.minXp - def.minXp : 0
  return {
    index: i + 1,
    def,
    next,
    intoLevel,
    span,
    progress: next ? Math.min(1, intoLevel / span) : 1,
    xpToNext: next ? next.minXp - xp : 0,
  }
}
