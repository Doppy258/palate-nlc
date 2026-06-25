import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowsDownUp,
  Check,
  FadersHorizontal,
  MagnifyingGlass,
  MapPin,
  Plus,
  List as ListIcon,
} from '@phosphor-icons/react'
import L from 'leaflet'
import type { GroupFit, MealType, Restaurant } from '../data/types'
import { usePalate } from '../providers/PalateProvider'
import { useStore } from '../store/useStore'
import { matchScores } from '../lib/match'
import { communityScores } from '../lib/ranking'
import { hasActiveDeal } from '../lib/deals'
import { friendSignal, friendsWhoSaved } from '../lib/friends'
import { isOpenNow, isSlowHourActive } from '../lib/time'
import { heroGradient } from '../lib/photos'
import { scoreToTier, TIER_STYLE } from '../theme/tokens'
import { cn } from '../lib/cn'
import { distanceMi } from '../lib/geo'
import { MEAL_LABEL } from '../lib/quests'
import { AppBar, Screen } from '../components/layout'
import { BottomSheet } from '../components/Sheet'
import { RestaurantCard } from '../components/RestaurantCard'
import { Avatar, Button, Chip, StarRating, TierBadge } from '../components/ui'
import { Reveal } from '../components/Reveal'
import { useUserLocation } from '../hooks/useUserLocation'
import { useIsDesktop } from '../lib/useMediaQuery'

type PriceFilter = 'u15' | 'u25' | 'premium' | null
type SortKey = 'match' | 'rating' | 'reviews' | 'community' | 'friends' | 'closest' | 'hidden' | 'deals'
type ViewMode = 'list' | 'map'

interface Filters {
  q: string
  cuisines: Set<string>
  price: PriceFilter
  meals: Set<MealType>
  minRating: number | null
  hasDeal: boolean
  slowNow: boolean
  openNow: boolean
  friendsSaved: boolean
  group: GroupFit | null
}

const EMPTY: Filters = {
  q: '',
  cuisines: new Set(),
  price: null,
  meals: new Set(),
  minRating: null,
  hasDeal: false,
  slowNow: false,
  openNow: false,
  friendsSaved: false,
  group: null,
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'match', label: 'Best match' },
  { key: 'rating', label: 'Highest rated' },
  { key: 'community', label: 'Highest community tier' },
  { key: 'friends', label: 'Most saved by friends' },
  { key: 'reviews', label: 'Most reviewed' },
  { key: 'closest', label: 'Closest' },
  { key: 'hidden', label: 'Hidden gems' },
  { key: 'deals', label: 'Newest deals' },
]

const ALL_MEALS: MealType[] = ['breakfast', 'brunch', 'lunch', 'dinner', 'dessert', 'drinks', 'late-night']
const ALL_GROUPS: { v: GroupFit; label: string }[] = [
  { v: 'solo', label: 'Solo' },
  { v: 'date', label: 'Date' },
  { v: 'small', label: 'Small group' },
  { v: 'large', label: 'Large group' },
  { v: 'family', label: 'Family' },
]

export default function Discover() {
  const { restaurants, friends, bites } = usePalate()
  const store = useStore()
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [sort, setSort] = useState<SortKey>('match')
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [view, setView] = useState<ViewMode>('list')
  const desktop = useIsDesktop()

  const community = useMemo(() => communityScores(restaurants, store), [restaurants, store])
  const matches = useMemo(() => matchScores(restaurants, store, friends), [restaurants, store, friends])
  const userLocation = useUserLocation()

  const results = useMemo(() => {
    const filtered = restaurants.filter((r) => passesFilters(r, filters, store, friends))
    return sortList(filtered, sort, { matches, community }, friends, userLocation)
  }, [restaurants, filters, sort, matches, community, store, friends, userLocation])

  const activeCount = countActive(filters)

  return (
    <Screen
      appBar={
        <AppBar
          title="Discover"
          subtitle={`${restaurants.length} local spots near you`}
          right={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView(view === 'list' ? 'map' : 'list')}
                className="inline-flex h-10 items-center gap-1.5 rounded-ctl border border-line bg-surface px-3 text-[13px] font-medium text-ink transition hover:bg-surface-2 active:scale-95"
                aria-label={view === 'list' ? 'Map view' : 'List view'}
              >
                {view === 'list' ? <MapPin size={17} /> : <ListIcon size={17} />}
                {desktop && (view === 'list' ? 'Map' : 'List')}
              </button>
              <button
                onClick={() => setShowFilters(true)}
                className="relative inline-flex h-10 items-center gap-1.5 rounded-ctl border border-line bg-surface px-3 text-[13px] font-medium text-ink transition hover:bg-surface-2 active:scale-95"
              >
                <FadersHorizontal size={17} />
                {desktop && 'Filters'}
                {activeCount > 0 && (
                  <span className="tnum ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>
          }
        />
      }
    >
      <div className="px-4 pb-6 pt-3 lg:mx-auto lg:max-w-6xl lg:px-8 lg:pt-5">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-ctl border border-line bg-surface px-3">
          <MagnifyingGlass size={17} className="text-ink-faint" />
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Search restaurants, cuisines, tags"
            className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>

        <BitesStrip />

        <FriendActivityFeed />

        {/* Sort + count */}
        <div className="mt-4 flex items-center justify-between">
          <span className="tnum text-[12.5px] text-ink-soft">
            {view === 'list' ? `${results.length} results` : `${results.length} on map`}
          </span>
          <button
            onClick={() => setShowSort(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink transition hover:bg-surface-2 active:scale-95"
          >
            <ArrowsDownUp size={14} />
            {SORTS.find((s) => s.key === sort)!.label}
          </button>
        </div>

        {view === 'list' ? (
          <>
            {/* Feed */}
            <div className="mt-3 grid gap-3.5 lg:grid-cols-2 xl:grid-cols-3">
              {results.map((r, i) => (
                <Reveal key={r.id} delay={Math.min(i, 6) * 0.04} className="h-full">
                  <RestaurantCard restaurant={r} communityTier={scoreToTier(community[r.id])} />
                </Reveal>
              ))}
              {results.length === 0 && (
                <div className="rounded-card border border-dashed border-line bg-surface-2 px-6 py-12 text-center lg:col-span-2 xl:col-span-3">
                  <h3 className="text-sm font-semibold text-ink">Nothing matches yet</h3>
                  <p className="mx-auto mt-1 max-w-[30ch] text-[13px] text-ink-soft">
                    Try loosening a filter or two to see more local spots.
                  </p>
                  <Button variant="secondary" size="sm" className="mt-4" onClick={() => setFilters(EMPTY)}>
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <DiscoverMap
              restaurants={results}
              community={community}
              userLocation={userLocation}
              className="mt-3 h-[calc(100vh-280px)] rounded-card border border-line shadow-soft lg:h-[500px]"
            />
          </>
        )}
      </div>

      <FilterSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
        count={results.length}
        store={store}
      />
      <SortSheet open={showSort} onClose={() => setShowSort(false)} sort={sort} setSort={setSort} />
    </Screen>
  )
}

function DiscoverMap({
  restaurants,
  community,
  userLocation,
  className,
}: {
  restaurants: Restaurant[]
  community: Record<string, number>
  userLocation: { lat: number; lon: number } | null
  className?: string
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useMemo(() => {
    if (!mapRef.current || mapInstance.current) return

    const center = userLocation
      ? [userLocation.lat, userLocation.lon]
      : [29.4241, -98.4936]

    const map = L.map(mapRef.current, {
      center: center as [number, number],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    mapInstance.current = map
    requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  useMemo(() => {
    const map = mapInstance.current
    if (!map) return

    const markers = L.layerGroup()

    restaurants.forEach((r) => {
      const tier = scoreToTier(community[r.id] ?? 50)
      const ts = TIER_STYLE[tier]
      const marker = L.marker([r.coordinates.lat, r.coordinates.lon], {
        icon: L.divIcon({
          className: '',
          html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:${ts.bg};color:${ts.fg};font-size:12px;font-weight:700;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer;">${r.name.charAt(0)}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
      })

      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:180px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="font-weight:600;font-size:14px;">${r.name}</div>
            <span style="background:${ts.bg};color:${ts.fg};padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;box-shadow:inset 0 0 0 1px ${ts.ring};">${ts.label}</span>
          </div>
          <div style="color:#787774;font-size:12px;margin-top:2px;">${r.cuisine} · ${r.neighborhood}</div>
          <div style="margin-top:6px;display:flex;align-items:center;gap:6px;">
            <span style="background:#C99A3B;color:white;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:600;">${r.rating.toFixed(1)}</span>
            <span style="color:#787774;font-size:11px;">${r.reviewCount} reviews</span>
          </div>
          <div style="margin-top:8px;">
            <a href="#/r/${r.id}" style="display:inline-block;background:#B8472A;color:white;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:500;text-decoration:none;">View details →</a>
          </div>
        </div>
      `)

      markers.addLayer(marker)
    })

    markers.addTo(map)

    if (restaurants.length > 0) {
      const bounds = L.latLngBounds(restaurants.map((r) => [r.coordinates.lat, r.coordinates.lon]))
      if (userLocation) bounds.extend([userLocation.lat, userLocation.lon])
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }

    return () => {
      map.removeLayer(markers)
    }
    }, [restaurants, community])

  useMemo(() => {
    const map = mapInstance.current
    if (!map || !userLocation) return

    const existing = document.querySelector('.user-location-marker')
    if (existing) return

    L.marker([userLocation.lat, userLocation.lon], {
      icon: L.divIcon({
        className: 'user-location-marker',
        html: `<div style="width:14px;height:14px;background:#2563eb;border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    }).addTo(map)
  }, [userLocation])

  return <div ref={mapRef} className={className} />
}

function BitesStrip() {
  const navigate = useNavigate()
  const { bites } = usePalate()
  const previews = bites.slice(0, 8)
  return (
    <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 no-scrollbar">
      <button
        onClick={() => navigate('/bites')}
        className="flex shrink-0 flex-col items-center gap-1.5"
        aria-label="Open Bites"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-line text-ink-soft transition active:scale-95">
          <Plus size={20} />
        </span>
        <span className="text-[10.5px] text-ink-soft">Bites</span>
      </button>
      {previews.map((b) => {
        const initials = b.dish.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
        return (
          <button
            key={b.id}
            onClick={() => navigate('/bites')}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <span className="rounded-full bg-gradient-to-tr from-ember to-amber p-[2px]">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-surface bg-surface-2 text-[11px] font-bold text-ink-soft">
                {initials}
              </span>
            </span>
            <span className="max-w-14 truncate text-[10.5px] text-ink-soft">{b.author.split(' ')[0]}</span>
          </button>
        )
      })}
    </div>
  )
}

function FriendActivityFeed() {
  const { friends, restaurants, bites } = usePalate()
  const navigate = useNavigate()
  const store = useStore()

  const activities = useMemo(() => {
    const friendNames = new Set(friends.map((f) => f.name.toLowerCase()))
    const friendBites = bites
      .filter((b) => friendNames.has(b.author.toLowerCase()))
      .slice(0, 3)

    const friendActivity = friends.flatMap((f) => {
      const items: { type: string; friend: typeof f; restaurant: Restaurant | undefined }[] = []
      f.sTierIds.slice(0, 2).forEach((id) => {
        const r = restaurants.find((x) => x.id === id)
        if (r) items.push({ type: 'tier', friend: f, restaurant: r })
      })
      f.savedIds.slice(0, 2).forEach((id) => {
        if (!f.sTierIds.includes(id)) {
          const r = restaurants.find((x) => x.id === id)
          if (r) items.push({ type: 'save', friend: f, restaurant: r })
        }
      })
      f.biteRestaurantIds.slice(0, 1).forEach((id) => {
        const r = restaurants.find((x) => x.id === id)
        if (r) items.push({ type: 'bite', friend: f, restaurant: r })
      })
      return items
    })

    const all = [
      ...friendActivity.map((a) => ({ ...a, key: `activity-${a.type}-${a.friend.id}-${a.restaurant?.id}` })),
      ...friendBites.map((b) => {
        const r = restaurants.find((x) => x.id === b.restaurantId)
        return {
          type: 'bite-post' as const,
          friend: friends.find((f) => f.name.toLowerCase() === b.author.toLowerCase()),
          restaurant: r,
          bite: b,
          key: `bite-${b.id}`,
        }
      }),
    ]

    return all.slice(0, 6)
  }, [friends, restaurants, bites])

  if (activities.length === 0 || friends.length === 0) return null

  return (
    <div className="mt-4">
      <h3 className="mb-2.5 text-[12.5px] font-semibold uppercase tracking-wide text-ink-faint">
        Friend activity
      </h3>
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar">
        {activities.map((a) => {
          const r = a.restaurant
          if (!r) return null
          return (
            <button
              key={a.key}
              onClick={() => navigate(`/r/${r.id}`)}
              className="flex shrink-0 items-center gap-2.5 rounded-card border border-line bg-surface px-3 py-2.5 transition hover:bg-surface-2 active:scale-[0.99]"
            >
              <Avatar
                seed={a.friend?.avatarSeed ?? ''}
                name={a.friend?.name ?? ''}
                size={28}
              />
              <div className="min-w-0 max-w-[180px] text-left">
                <div className="truncate text-[12.5px] font-medium text-ink">
                  {r.name}
                </div>
                <div className="truncate text-[11px] text-ink-soft">
                  {a.type === 'tier' && `${a.friend?.name?.split(' ')[0]} ranked this S-tier`}
                  {a.type === 'save' && `${a.friend?.name?.split(' ')[0]} saved this`}
                  {a.type === 'bite' && `${a.friend?.name?.split(' ')[0]} posted a Bite`}
                  {a.type === 'bite-post' && `${a.friend?.name?.split(' ')[0]} · ${(a as any).bite?.dish}`}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---- filtering + sorting ---- */

function passesFilters(
  r: Restaurant,
  f: Filters,
  store: ReturnType<typeof useStore.getState>,
  friends: ReturnType<typeof usePalate>['friends'],
) {
  if (f.q) {
    const q = f.q.toLowerCase()
    const hit =
      r.name.toLowerCase().includes(q) ||
      r.cuisine.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q))
    if (!hit) return false
  }
  if (f.cuisines.size && !f.cuisines.has(r.cuisine)) return false
  if (f.price === 'u15' && r.priceTier !== 1) return false
  if (f.price === 'u25' && r.priceTier > 2) return false
  if (f.price === 'premium' && r.priceTier !== 3) return false
  if (f.meals.size && !r.meals.some((m) => f.meals.has(m))) return false
  if (f.minRating && r.rating < f.minRating) return false
  if (f.hasDeal && !hasActiveDeal(r, store)) return false
  if (f.slowNow && !isSlowHourActive(r.slowHour)) return false
  if (f.openNow && !isOpenNow(r.hours)) return false
  if (f.friendsSaved && friendsWhoSaved(r.id, friends).length === 0) return false
  if (f.group && !r.groupFit.includes(f.group)) return false
  return true
}

function sortList(
  list: Restaurant[],
  sort: SortKey,
  maps: { matches: Record<string, number>; community: Record<string, number> },
  friends: ReturnType<typeof usePalate>['friends'],
  userLocation?: { lat: number; lon: number } | null,
): Restaurant[] {
  const arr = [...list]
  const fSig = (r: Restaurant) => friendSignal(r.id, friends)
  switch (sort) {
    case 'match':
      return arr.sort((a, b) => maps.matches[b.id] - maps.matches[a.id])
    case 'rating':
      return arr.sort((a, b) => b.rating - a.rating)
    case 'reviews':
      return arr.sort((a, b) => b.reviewCount - a.reviewCount)
    case 'community':
      return arr.sort((a, b) => maps.community[b.id] - maps.community[a.id])
    case 'friends':
      return arr.sort((a, b) => fSig(b) - fSig(a))
    case 'closest':
      return arr.sort((a, b) => {
        if (!userLocation) return a.distanceMi - b.distanceMi
        return (
          distanceMi(userLocation.lat, userLocation.lon, a.coordinates.lat, a.coordinates.lon) -
          distanceMi(userLocation.lat, userLocation.lon, b.coordinates.lat, b.coordinates.lon)
        )
      })
    case 'hidden':
      return arr.sort(
        (a, b) =>
          Number(b.reviewCount < 25) - Number(a.reviewCount < 25) || b.rating - a.rating,
      )
    case 'deals':
      return arr.sort((a, b) => latestDeal(b) - latestDeal(a))
    default:
      return arr
  }
}

const latestDeal = (r: Restaurant) =>
  r.deals.length ? Math.max(...r.deals.map((d) => d.createdAt)) : 0

function countActive(f: Filters) {
  let n = 0
  if (f.cuisines.size) n++
  if (f.price) n++
  if (f.meals.size) n++
  if (f.minRating) n++
  if (f.hasDeal) n++
  if (f.slowNow) n++
  if (f.openNow) n++
  if (f.friendsSaved) n++
  if (f.group) n++
  return n
}

/* ---- filter sheet ---- */

function FilterSheet({
  open,
  onClose,
  filters,
  setFilters,
  count,
  store,
}: {
  open: boolean
  onClose: () => void
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
  count: number
  store: ReturnType<typeof useStore.getState>
}) {
  const { restaurants } = usePalate()
  const cuisines = useMemo(() => Array.from(new Set(restaurants.map((r) => r.cuisine))).sort(), [restaurants])
  const toggleSet = <T,>(set: Set<T>, v: T) => {
    const next = new Set(set)
    next.has(v) ? next.delete(v) : next.add(v)
    return next
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Filters"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setFilters({ ...EMPTY, q: filters.q })}>
            Clear all
          </Button>
          <Button full onClick={onClose}>
            Show {count} {count === 1 ? 'result' : 'results'}
          </Button>
        </div>
      }
    >
      <FilterGroup label="Cuisine">
        {cuisines.map((c) => (
          <Chip
            key={c}
            selected={filters.cuisines.has(c)}
            onClick={() => setFilters((f) => ({ ...f, cuisines: toggleSet(f.cuisines, c) }))}
          >
            {c}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup label="Price">
        {([
          ['u15', 'Under $15'],
          ['u25', 'Under $25'],
          ['premium', 'Premium'],
        ] as [PriceFilter, string][]).map(([v, label]) => (
          <Chip
            key={label}
            selected={filters.price === v}
            onClick={() => setFilters((f) => ({ ...f, price: f.price === v ? null : v }))}
          >
            {label}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup label="Meal">
        {ALL_MEALS.map((m) => (
          <Chip
            key={m}
            selected={filters.meals.has(m)}
            onClick={() => setFilters((f) => ({ ...f, meals: toggleSet(f.meals, m) }))}
          >
            {MEAL_LABEL[m]}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup label="Rating">
        {([
          [4, '4.0+'],
          [4.5, '4.5+'],
        ] as [number, string][]).map(([v, label]) => (
          <Chip
            key={label}
            selected={filters.minRating === v}
            onClick={() => setFilters((f) => ({ ...f, minRating: f.minRating === v ? null : v }))}
          >
            {label}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup label="Deals and status">
        <Chip selected={filters.hasDeal} onClick={() => setFilters((f) => ({ ...f, hasDeal: !f.hasDeal }))}>
          Has active deal
        </Chip>
        <Chip selected={filters.slowNow} onClick={() => setFilters((f) => ({ ...f, slowNow: !f.slowNow }))}>
          Slow-hour now
        </Chip>
        <Chip selected={filters.openNow} onClick={() => setFilters((f) => ({ ...f, openNow: !f.openNow }))}>
          Open now
        </Chip>
        <Chip
          selected={filters.friendsSaved}
          onClick={() => setFilters((f) => ({ ...f, friendsSaved: !f.friendsSaved }))}
        >
          Friends saved
        </Chip>
      </FilterGroup>

      <FilterGroup label="Group">
        {ALL_GROUPS.map(({ v, label }) => (
          <Chip
            key={v}
            selected={filters.group === v}
            onClick={() => setFilters((f) => ({ ...f, group: f.group === v ? null : v }))}
          >
            {label}
          </Chip>
        ))}
      </FilterGroup>
    </BottomSheet>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-4 last:border-0">
      <div className="mb-2.5 text-[13px] font-semibold text-ink">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function SortSheet({
  open,
  onClose,
  sort,
  setSort,
}: {
  open: boolean
  onClose: () => void
  sort: SortKey
  setSort: (s: SortKey) => void
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Sort by">
      <div className="py-1">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setSort(s.key)
              onClose()
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-ctl px-3 py-3 text-left text-sm transition hover:bg-surface-2',
              sort === s.key ? 'font-semibold text-ink' : 'text-ink-soft',
            )}
          >
            {s.label}
            {sort === s.key && <Check size={17} className="text-ember" weight="bold" />}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
