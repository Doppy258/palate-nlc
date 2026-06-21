import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowsDownUp,
  Check,
  FadersHorizontal,
  MagnifyingGlass,
  Plus,
} from '@phosphor-icons/react'
import type { GroupFit, MealType, Restaurant } from '../data/types'
import { FRIENDS, RESTAURANTS, SEED_BITES } from '../data/seed'
import { useStore } from '../store/useStore'
import { matchScores } from '../lib/match'
import { communityScores } from '../lib/ranking'
import { hasActiveDeal } from '../lib/deals'
import { friendSignal, friendsWhoSaved } from '../lib/friends'
import { isOpenNow, isSlowHourActive } from '../lib/time'
import { photo } from '../lib/photos'
import { scoreToTier } from '../theme/tokens'
import { cn } from '../lib/cn'
import { MEAL_LABEL } from '../lib/quests'
import { AppBar, Screen } from '../components/layout'
import { BottomSheet } from '../components/Sheet'
import { RestaurantCard } from '../components/RestaurantCard'
import { Button, Chip } from '../components/ui'
import { Reveal } from '../components/Reveal'

type PriceFilter = 'u15' | 'u25' | 'premium' | null
type SortKey = 'match' | 'rating' | 'reviews' | 'community' | 'friends' | 'closest' | 'hidden' | 'deals'

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
  const store = useStore()
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [sort, setSort] = useState<SortKey>('match')
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  const community = useMemo(() => communityScores(RESTAURANTS, store), [store])
  const matches = useMemo(() => matchScores(RESTAURANTS, store, FRIENDS), [store])

  const results = useMemo(() => {
    const filtered = RESTAURANTS.filter((r) => passesFilters(r, filters, store))
    return sortList(filtered, sort, { matches, community })
  }, [filters, sort, matches, community, store])

  const activeCount = countActive(filters)

  return (
    <Screen
      appBar={
        <AppBar
          title="Discover"
          subtitle={`${RESTAURANTS.length} local spots near Mill District`}
          right={
            <button
              onClick={() => setShowFilters(true)}
              className="relative inline-flex h-10 items-center gap-1.5 rounded-ctl border border-line bg-surface px-3 text-[13px] font-medium text-ink transition hover:bg-surface-2 active:scale-95"
            >
              <FadersHorizontal size={17} />
              Filters
              {activeCount > 0 && (
                <span className="tnum ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </button>
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

        {/* Sort + count */}
        <div className="mt-4 flex items-center justify-between">
          <span className="tnum text-[12.5px] text-ink-soft">{results.length} results</span>
          <button
            onClick={() => setShowSort(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink transition hover:bg-surface-2 active:scale-95"
          >
            <ArrowsDownUp size={14} />
            {SORTS.find((s) => s.key === sort)!.label}
          </button>
        </div>

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

function BitesStrip() {
  const navigate = useNavigate()
  const previews = SEED_BITES.slice(0, 7)
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
      {previews.map((b) => (
        <button
          key={b.id}
          onClick={() => navigate('/bites')}
          className="flex shrink-0 flex-col items-center gap-1.5"
        >
          <span className="rounded-full bg-gradient-to-tr from-ember to-amber p-[2px]">
            <img
              src={photo(b.photoSeed, 120, 120)}
              alt={b.dish}
              className="h-14 w-14 rounded-full border-2 border-surface bg-surface-2 object-cover"
            />
          </span>
          <span className="max-w-14 truncate text-[10.5px] text-ink-soft">{b.author.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  )
}

/* ---- filtering + sorting ---- */

function passesFilters(r: Restaurant, f: Filters, store: ReturnType<typeof useStore.getState>) {
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
  if (f.friendsSaved && friendsWhoSaved(r.id, FRIENDS).length === 0) return false
  if (f.group && !r.groupFit.includes(f.group)) return false
  return true
}

function sortList(
  list: Restaurant[],
  sort: SortKey,
  maps: { matches: Record<string, number>; community: Record<string, number> },
): Restaurant[] {
  const arr = [...list]
  const fSig = (r: Restaurant) => friendSignal(r.id, FRIENDS)
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
      return arr.sort((a, b) => a.distanceMi - b.distanceMi)
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
  const cuisines = useMemo(() => Array.from(new Set(RESTAURANTS.map((r) => r.cuisine))).sort(), [])
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
