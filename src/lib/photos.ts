// Not a photo service — we do NOT show fake images of food or places.
// Each restaurant and dish gets a deterministic, cuisine-aware gradient that
// looks intentional and designed, never like a missing placeholder.

const CUISINE_GRADIENT: Record<string, [string, string, string]> = {
  Mexican: ['#E85D2C', '#C73E1D', '#A03215'],
  Cafe: ['#D4A574', '#B8895C', '#9C6F47'],
  Bakery: ['#F4A460', '#D4833E', '#B8682E'],
  American: ['#4A90D9', '#357ABD', '#2563A0'],
  Japanese: ['#D8384A', '#B02A3A', '#8E1F2E'],
  Italian: ['#7CB342', '#558B2F', '#3E6B1F'],
  Korean: ['#E53935', '#C62828', '#A31C1C'],
  Thai: ['#FF8F00', '#E65100', '#BF360C'],
  Pizza: ['#F57C00', '#E65100', '#BF360C'],
  Sushi: ['#00897B', '#00695C', '#004D40'],
  Indian: ['#E65100', '#BF360C', '#871F00'],
  Vietnamese: ['#43A047', '#2E7D32', '#1B5E20'],
  'Bubble tea': ['#AD5BA1', '#7B1FA2', '#5C136B'],
  Mediterranean: ['#F9A825', '#F57F17', '#E65100'],
  Chinese: ['#D32F2F', '#B71C1C', '#8E1414'],
  Seafood: ['#00796B', '#004D40', '#00251A'],
  Steak_house: ['#6D4C41', '#4E342E', '#3E2723'],
  BBQ: ['#BF360C', '#871F00', '#5D1500'],
  Breakfast: ['#FFB300', '#FF8F00', '#E65100'],
  Burger: ['#E65100', '#BF360C', '#871F00'],
  Ramen: ['#E53935', '#C62828', '#A31C1C'],
}

const FALLBACK: [string, string, string] = ['#787774', '#5C5A56', '#3E3D3A']

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function colorsFor(cuisine: string): [string, string, string] {
  return CUISINE_GRADIENT[cuisine] ?? FALLBACK
}

function gradientAngle(seed: string): number {
  return (hash(seed) % 60) + 120
}

/** CSS `background` value for a restaurant hero card. */
export function heroGradient(seed: string, cuisine: string): string {
  const [c1, c2, c3] = colorsFor(cuisine)
  const angle = gradientAngle(seed)
  return `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`
}

/** CSS `background` value for a dish thumbnail. */
export function dishGradient(seed: string, cuisine?: string): string {
  const [c1, c2] = cuisine ? colorsFor(cuisine) : FALLBACK
  const angle = gradientAngle(seed)
  return `linear-gradient(${angle}deg, ${c1}88 0%, ${c2}88 100%)`
}

/** DiceBear illustrated avatar (kept — not a photo). */
export const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=fbeae0,f1efe9,e7eef0&radius=50&scale=92`
