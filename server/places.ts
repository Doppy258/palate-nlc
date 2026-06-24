import https from 'node:https'
import type { Restaurant, Dish, MealType, GroupFit } from '../src/data/types.ts'
import { getSupabase } from './supabase.ts'

const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

// In-memory cache
let cache: { restaurants: Restaurant[]; ts: number } | null = null

function geoapifyRequest(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        timeout: 20000,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString()
          if (!res.statusCode || res.statusCode >= 400) {
            reject(new Error(`Geoapify error: ${res.statusCode} — ${body.slice(0, 200)}`))
          } else {
            resolve(body)
          }
        })
      },
    )
    req.on('timeout', () => { req.destroy(); reject(new Error('Geoapify timeout')) })
    req.on('error', reject)
    req.end()
  })
}

/** Deterministic seeded random (0..1). */
function mulberry32(a: number) {
  return () => {
    a |= 0; a = a + 0x6d2b79f5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const CUISINE_DISHES: Record<string, string[]> = {
  mexican: ['Tacos al Pastor', 'Carne Asada Burrito', 'Quesadilla', 'Loaded Nachos', 'Churros', 'Guacamole & Chips', 'Elote', 'Chilaquiles'],
  italian: ['Spaghetti Carbonara', 'Margherita Pizza', 'Bruschetta', 'Tiramisu', 'Risotto', 'Caesar Salad', 'Penne Arrabbiata', 'Gelato'],
  american: ['Classic Cheeseburger', 'BBQ Ribs', 'Club Sandwich', 'Mac & Cheese', 'Buffalo Wings', 'Steak & Fries', 'Fish & Chips', 'Apple Pie'],
  japanese: ['Tonkotsu Ramen', 'Sushi Platter', 'Teriyaki Bowl', 'Gyoza', 'Miso Soup', 'Tempura', 'Chicken Katsu', 'Matcha Cheesecake'],
  chinese: ['Kung Pao Chicken', 'Mapo Tofu', 'Dan Dan Noodles', 'Dim Sum Platter', 'Fried Rice', 'Spring Rolls', 'Hot & Sour Soup', 'Peking Duck'],
  thai: ['Pad Thai', 'Green Curry', 'Tom Yum Soup', 'Drunken Noodles', 'Mango Sticky Rice', 'Som Tum', 'Panang Curry', 'Coconut Soup'],
  indian: ['Butter Chicken', 'Biryani', 'Palak Paneer', 'Dal Makhani', 'Naan', 'Samosas', 'Tandoori Chicken', 'Gulab Jamun'],
  korean: ['Bulgogi', 'Bibimbap', 'Kimchi Jjigae', 'Korean Fried Chicken', 'Japchae', 'Tteokbokki', 'Sundubu Jjigae', 'Banchan Platter'],
  vietnamese: ['Pho', 'Banh Mi', 'Spring Rolls', 'Bun Cha', 'Com Tam', 'Egg Coffee', 'Cao Lau', 'Vietnamese Iced Coffee'],
  mediterranean: ['Gyro', 'Falafel Wrap', 'Hummus & Pita', 'Shawarma', 'Greek Salad', 'Baba Ganoush', 'Lamb Kebab', 'Baklava'],
  pizza: ['Margherita Pizza', 'Pepperoni Pizza', 'Quattro Formaggi', 'Prosciutto Pizza', 'Diavola Pizza', 'Truffle Pizza', 'Calzone', 'Garlic Knots'],
  burger: ['Classic Cheeseburger', 'Smash Burger', 'Black Bean Burger', 'Bacon Truffle Burger', 'Mushroom Swiss', 'Double Stack', 'Sliders', 'Onion Rings'],
  cafe: ['Cold Brew', 'Flat White', 'Matcha Latte', 'Croissant', 'Avocado Toast', 'Bagel & Cream Cheese', 'Chai Latte', 'Muffin'],
  sushi: ['Salmon Nigiri', 'Dragon Roll', 'Spicy Tuna Roll', 'Rainbow Roll', 'Edamame', 'Miso Soup', 'Chirashi Bowl', 'Green Tea Ice Cream'],
  breakfast: ['Pancakes', 'French Toast', 'Eggs Benedict', 'Breakfast Burrito', 'Avocado Toast', 'Granola Bowl', 'Omelette', 'Belgian Waffle'],
  bakery: ['Sourdough Bread', 'Cinnamon Roll', 'Croissant', 'Cookie', 'Banana Bread', 'Danish Pastry', 'Baguette', 'Brownie'],
  bbq: ['Brisket', 'Pulled Pork Sandwich', 'BBQ Ribs', 'Smoked Sausage', 'Burnt Ends', 'Cornbread', 'Mac & Cheese', 'Coleslaw'],
  seafood: ['Grilled Salmon', 'Lobster Roll', 'Fish & Chips', 'Shrimp Scampi', 'Cioppino', 'Oysters', 'Crab Cakes', 'Clam Chowder'],
  steak_house: ['Ribeye Steak', 'Filet Mignon', 'New York Strip', 'T-Bone Steak', 'Wagyu Burger', 'Loaded Baked Potato', 'Creamed Spinach', 'Cesar Salad'],
  ramen: ['Tonkotsu Ramen', 'Shoyu Ramen', 'Miso Ramen', 'Tsukemen', 'Gyoza', 'Chashu Bowl', 'Takoyaki', 'Karaage'],
}

const FALLBACK_DISHES = ['Chef Special', 'House Salad', 'Daily Soup', 'Grilled Chicken', 'Pasta of the Day', 'Seasonal Plate', 'Classic Entree', 'Dessert Sampler']

function dishesForCuisine(cuisine: string, _rand: () => number, name: string): Dish[] {
  const pool = Object.entries(CUISINE_DISHES).find(([key]) => cuisine.toLowerCase().includes(key))?.[1] ?? FALLBACK_DISHES
  // Deterministic selection based on restaurant name hash: same name → same dishes
  const nameRand = mulberry32(name.length + name.charCodeAt(0) + (name.charCodeAt(name.length - 1) ?? 0))
  const count = (nameRand() * 3 + 3) | 0
  const shuffled = [...pool].sort(() => nameRand() - 0.5)
  return shuffled.slice(0, count).map((n, i) => ({
    name: n,
    popularity: +(0.5 - i * 0.08 - nameRand() * 0.06).toFixed(2),
    photoSeed: n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-'),
  }))
}

const MEAL_BY_CUISINE: Record<string, MealType[]> = {
  mexican: ['lunch', 'dinner', 'late-night'],
  italian: ['dinner'],
  american: ['breakfast', 'lunch', 'dinner'],
  japanese: ['lunch', 'dinner'],
  chinese: ['lunch', 'dinner'],
  thai: ['lunch', 'dinner'],
  indian: ['lunch', 'dinner'],
  korean: ['lunch', 'dinner', 'late-night'],
  vietnamese: ['lunch', 'dinner'],
  mediterranean: ['lunch', 'dinner'],
  pizza: ['lunch', 'dinner', 'late-night'],
  burger: ['lunch', 'dinner'],
  cafe: ['breakfast', 'brunch', 'lunch'],
  sushi: ['lunch', 'dinner'],
  breakfast: ['breakfast', 'brunch'],
  bakery: ['breakfast', 'brunch', 'lunch'],
  bbq: ['lunch', 'dinner'],
  seafood: ['dinner'],
  steak_house: ['dinner'],
  ramen: ['lunch', 'dinner'],
}

const TAGS_BY_CUISINE: Record<string, string[]> = {
  mexican: ['spicy', 'cheap eats', 'good for groups', 'lively'],
  italian: ['cozy', 'romantic', 'wine', 'classic'],
  american: ['hearty', 'comfort food', 'casual', 'family-friendly'],
  japanese: ['fresh', 'umami', 'intimate', 'authentic'],
  chinese: ['spicy', 'large portions', 'quick', 'good value'],
  thai: ['spicy', 'flavorful', 'fresh', 'authentic'],
  indian: ['spicy', 'aromatic', 'vegetarian-friendly', 'good value'],
  korean: ['spicy', 'interactive', 'late-night', 'shareable'],
  vietnamese: ['fresh', 'light', 'herbal', 'authentic'],
  mediterranean: ['healthy', 'fresh', 'vegetarian-friendly', 'shareable'],
  pizza: ['casual', 'good for groups', 'quick', 'family-friendly'],
  burger: ['casual', 'hearty', 'quick', 'comfort food'],
  cafe: ['cozy', 'study spot', 'quiet', 'brunch'],
  sushi: ['fresh', 'intimate', 'date night', 'authentic'],
  breakfast: ['brunch', 'cozy', 'weekend spot', 'morning'],
  bakery: ['fresh baked', 'cozy', 'breakfast', 'dessert'],
  bbq: ['hearty', 'casual', 'good for groups', 'smoky'],
  seafood: ['fresh', 'upscale', 'date night', 'seafood'],
  steak_house: ['hearty', 'upscale', 'date night', 'celebration'],
  ramen: ['cozy', 'comfort food', 'quick', 'solo-friendly'],
}

const GROUP_FITS: GroupFit[] = ['solo', 'date', 'small', 'large', 'family']

function hoursForCuisine(cuisine: string, rand: () => number) {
  if (['breakfast', 'cafe', 'bakery'].some((c) => cuisine.includes(c))) {
    return { open: 7, close: 16 + Math.floor(rand() * 4) }
  }
  if (['pizza', 'burger', 'mexican', 'korean', 'ramen'].some((c) => cuisine.includes(c))) {
    return { open: 11, close: 22 + Math.floor(rand() * 3) }
  }
  return { open: 10 + Math.floor(rand() * 3), close: 20 + Math.floor(rand() * 4) }
}

function cuisineFromName(name: string): string {
  const lower = name.toLowerCase()
  const mapping: [RegExp, string][] = [
    [/taco|burrito|mexican/, 'Mexican'],
    [/pizza|italian|pasta|trattoria/, 'Italian'],
    [/sushi|ramen|japanese|teriyaki|izakaya/, 'Japanese'],
    [/pho|vietnamese|banh mi/, 'Vietnamese'],
    [/thai|pad thai|curry/, 'Thai'],
    [/korean|bulgogi|bibimbap/, 'Korean'],
    [/chinese|dim sum|dumpling|szechuan/, 'Chinese'],
    [/burger|grill|steak|bbq|rib|diner/, 'American'],
    [/cafe|coffee|bakery|bagel|roast/, 'Cafe'],
    [/indian|tandoori|biryani|curry/, 'Indian'],
    [/mediterranean|gyro|falafel|halal/, 'Mediterranean'],
    [/seafood|lobster|oyster|fish/, 'Seafood'],
    [/breakfast|pancake|waffle|brunch/, 'Breakfast'],
    [/taco|mexican|taqueria/, 'Mexican'],
    [/sushi|japanese|ramen/, 'Japanese'],
    [/pizza|italian/, 'Italian'],
  ]
  for (const [re, label] of mapping) {
    if (re.test(lower)) return label
  }
  return 'American'
}

function placeToRestaurant(feature: {
  properties: Record<string, unknown>
  geometry?: { coordinates?: number[] }
}): Restaurant | null {
  const p = feature.properties
  const name = (p.name as string) ?? ''
  if (!name) return null
  const coords = feature.geometry?.coordinates
  if (!coords || coords.length < 2) return null
  const lon = coords[0]
  const lat = coords[1]
  const id = 'r-' + ((p.place_id as string) ?? name.toLowerCase().replace(/\s+/g, '-'))
  const seed = name.length + Math.round(lon * 100)
  const rand = mulberry32(seed)
  const cuisine = cuisineFromName(name)
  const hours = hoursForCuisine(cuisine, rand)
  const meals = MEAL_BY_CUISINE[cuisine.toLowerCase()] ?? ['lunch', 'dinner']
  const photoId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-')

  return {
    id,
    name,
    cuisine,
    priceTier: [1, 2, 3][Math.floor(rand() * 3)],
    neighborhood: (p.district as string) ?? (p.city as string) ?? 'San Antonio',
    distanceMi: +(rand() * 3 + 0.2).toFixed(1),
    coordinates: { lat, lon },
    hours,
    rating: +(3.5 + rand() * 1.5).toFixed(1),
    reviewCount: Math.floor(rand() * 200) + 20,
    tags: [...(TAGS_BY_CUISINE[cuisine.toLowerCase()] ?? ['local', 'casual'])].slice(0, 4),
    photoSeeds: [`${photoId}-storefront`, `${photoId}-dish`],
    dishes: dishesForCuisine(cuisine, rand, name),
    deals: [],
    slowHour: {
      start: hours.open + Math.floor((hours.close - hours.open) * 0.35),
      end: hours.open + Math.floor((hours.close - hours.open) * 0.55),
      label: 'Happy hour special',
    },
    checkInCode: name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) + Math.floor(rand() * 900 + 100),
    meals,
    groupFit: GROUP_FITS.slice(0, Math.floor(rand() * 3) + 2),
    baseSaves: 0,
    baseH2hWins: 0,
    baseViews: 0,
    baseStampsCollected: 0,
    baseCouponsRedeemed: 0,
    baseVerifiedReviews: 0,
    reviews: [],
  }
}

async function fetchFromGeoapify(): Promise<Restaurant[]> {
  const apiKey = process.env.GEOAPIFY_API_KEY
  if (!apiKey) {
    throw new Error('GEOAPIFY_API_KEY not set in .env — get a free key at https://www.geoapify.com/')
  }
  // San Antonio center: 29.4241, -98.4936, radius 10km
  const url = `https://api.geoapify.com/v2/places?categories=catering.restaurant&filter=circle:-98.4936,29.4241,10000&limit=50&apiKey=${apiKey}`
  console.log('[places] Fetching restaurants from Geoapify API...')
  const text = await geoapifyRequest(url)
  const data = JSON.parse(text)
  const features = data.features ?? []
  const restaurants = features
    .map((f: Record<string, unknown>) => placeToRestaurant(f as Parameters<typeof placeToRestaurant>[0]))
    .filter((r: Restaurant | null): r is Restaurant => r !== null)
  console.log(`[places] Geoapify returned ${features.length} features, mapped ${restaurants.length} restaurants`)
  return restaurants
}

async function loadFromDb(): Promise<Restaurant[]> {
  try {
    const sb = getSupabase()
    const { data } = await sb.from('restaurants').select('id, data').order('data->>name')
    return (data ?? []).map((r: { data: unknown }) => r.data as Restaurant)
  } catch {
    return []
  }
}

async function saveToDb(restaurants: Restaurant[]) {
  try {
    const sb = getSupabase()
    await sb.from('restaurants').upsert(restaurants.map((r) => ({ id: r.id, data: r })))
  } catch (e) {
    console.warn('[places] Failed to cache restaurants to DB:', e)
  }
}

export async function getRestaurants(): Promise<Restaurant[]> {
  // Return fresh cache
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    console.log(`[places] Returning ${cache.restaurants.length} restaurants from cache (age: ${Math.round((Date.now() - cache.ts) / 1000)}s)`)
    return cache.restaurants
  }

  // Fetch from Geoapify
  try {
    const restaurants = await fetchFromGeoapify()
    console.log(`[places] Caching ${restaurants.length} restaurants for ${CACHE_TTL / 1000}s`)
    cache = { restaurants, ts: Date.now() }
    await saveToDb(restaurants)
    console.log(`[places] Persisted ${restaurants.length} restaurants to Supabase`)
    return restaurants
  } catch (e) {
    console.warn('[places] Geoapify fetch failed, using DB cache:', e)
  }

  // Fallback: load from Supabase DB
  const dbRestaurants = await loadFromDb()
  if (dbRestaurants.length > 0) {
    console.log(`[places] Loaded ${dbRestaurants.length} restaurants from Supabase fallback`)
    cache = { restaurants: dbRestaurants, ts: Date.now() }
    return dbRestaurants
  }

  console.warn('[places] No restaurants available from any source')
  return []
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  const restaurants = await getRestaurants()
  return restaurants.find((r) => r.id === id) ?? null
}
