import type { Tier } from '../data/types'

// Tier palette is a semantic data-encoding scale, distinct from the single
// locked ember brand accent. Applied via inline style in TierBadge so the
// scale stays dynamic and consistent everywhere.
export const TIER_STYLE: Record<
  Tier,
  { bg: string; fg: string; ring: string; label: string }
> = {
  'SSS+': { bg: '#FBF3DB', fg: '#8A5A00', ring: '#EFD9A0', label: 'SSS+' },
  S: { bg: '#FBEDE7', fg: '#B0461F', ring: '#F1D2C5', label: 'S' },
  A: { bg: '#E1F3FE', fg: '#1F6C9F', ring: '#C2E4F6', label: 'A' },
  B: { bg: '#EDF3EC', fg: '#346538', ring: '#D2E4D2', label: 'B' },
  C: { bg: '#F1F0EE', fg: '#787774', ring: '#E2E1DD', label: 'C' },
  'want-to-try': { bg: '#FFFFFF', fg: '#787774', ring: '#EAEAEA', label: 'Want to Try' },
}

// Rankable tiers, best to worst (excludes the want-to-try holding bucket).
export const TIER_ORDER: Tier[] = ['SSS+', 'S', 'A', 'B', 'C']

export const PRICE_LABEL: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$' }
export const PRICE_RANGE: Record<number, string> = {
  1: 'Under $15',
  2: '$15 to $30',
  3: '$30 and up',
}

// Score (0..100) to tier bucket. Shared by personal and community ranking.
export function scoreToTier(score: number): Tier {
  if (score >= 90) return 'SSS+'
  if (score >= 75) return 'S'
  if (score >= 55) return 'A'
  if (score >= 35) return 'B'
  return 'C'
}
