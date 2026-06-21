import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowsLeftRight, Sparkle } from '@phosphor-icons/react'
import type { Restaurant, Tier } from '../data/types'
import { RESTAURANTS } from '../data/seed'
import { useStore } from '../store/useStore'
import { communityTiers, personalTiers } from '../lib/ranking'
import { photo } from '../lib/photos'
import { scoreToTier, TIER_ORDER, TIER_STYLE } from '../theme/tokens'
import { cn } from '../lib/cn'
import { AppBar, Screen } from '../components/layout'
import { StarRating, TierBadge } from '../components/ui'
import { Reveal } from '../components/Reveal'

type Tab = 'h2h' | 'mine' | 'community'

const QUESTIONS = [
  'Which would you rather go back to?',
  'Which one has better value?',
  'Which is the better pick tonight?',
  'Which one wins on a hungry day?',
]

interface Pair {
  a: Restaurant
  b: Restaurant
  q: string
}

export default function Rank() {
  const store = useStore()
  const [tab, setTab] = useState<Tab>('h2h')

  const pool = useMemo(() => {
    const ids = new Set([...store.visitedIds, ...store.savedIds, ...Object.keys(store.personalScores)])
    return RESTAURANTS.filter((r) => ids.has(r.id))
  }, [store.visitedIds, store.savedIds, store.personalScores])

  return (
    <Screen
      appBar={
        <AppBar
          title="Rank"
          subtitle={`${store.comparisons} comparisons made`}
          right={<Segmented tab={tab} setTab={setTab} />}
        />
      }
    >
      <div className="px-4 pb-8 pt-3 lg:mx-auto lg:max-w-3xl lg:px-8 lg:pt-6">
        {tab === 'h2h' && <HeadToHead pool={pool} />}
        {tab === 'mine' && <TierList tiers={personalTiers(RESTAURANTS, store)} includeWTT title="Your local food tier list" />}
        {tab === 'community' && <TierList tiers={communityTiers(RESTAURANTS, store)} title="Community ranking" />}
      </div>
    </Screen>
  )
}

function Segmented({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const opts: { v: Tab; label: string }[] = [
    { v: 'h2h', label: 'Match' },
    { v: 'mine', label: 'Mine' },
    { v: 'community', label: 'All' },
  ]
  return (
    <div className="flex rounded-full bg-surface-2 p-0.5">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => setTab(o.v)}
          className={cn(
            'rounded-full px-2.5 py-1 text-[12px] font-medium transition',
            tab === o.v ? 'bg-surface text-ink shadow-soft' : 'text-ink-soft',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---- Head to head ---- */

function HeadToHead({ pool }: { pool: Restaurant[] }) {
  const record = useStore((s) => s.recordComparison)
  const reduce = useReducedMotion()
  const [pair, setPair] = useState<Pair | null>(() => pickPair(pool, null))

  if (!pair || pool.length < 2) {
    return (
      <div className="rounded-card border border-dashed border-line bg-surface-2 px-6 py-12 text-center">
        <h3 className="text-sm font-semibold text-ink">Not enough spots to compare yet</h3>
        <p className="mx-auto mt-1 max-w-[30ch] text-[13px] text-ink-soft">
          Save or check in to a few restaurants, then come back to rank them head to head.
        </p>
      </div>
    )
  }

  const choose = (winner: Restaurant, loser: Restaurant) => {
    record(winner.id, loser.id)
    setPair(pickPair(pool, pair))
  }

  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-ember">
        <Sparkle size={14} weight="fill" /> Head to head
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${pair.a.id}-${pair.b.id}`}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-[19px] font-semibold leading-tight tracking-tight text-ink">{pair.q}</h2>
          <div className="relative mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
            <MatchCard r={pair.a} onPick={() => choose(pair.a, pair.b)} />
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
              <span className="tnum inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-[11px] font-bold uppercase text-ink-soft shadow-soft">
                or
              </span>
            </div>
            <MatchCard r={pair.b} onPick={() => choose(pair.b, pair.a)} />
          </div>
        </motion.div>
      </AnimatePresence>
      <p className="mt-4 text-center text-[12px] text-ink-faint">
        Each pick updates your tier list. Real preference beats equal star ratings.
      </p>
    </div>
  )
}

function MatchCard({ r, onPick }: { r: Restaurant; onPick: () => void }) {
  const store = useStore()
  const myScore = store.personalScores[r.id]
  return (
    <button
      onClick={onPick}
      className="group relative w-full overflow-hidden rounded-card border border-line bg-surface text-left shadow-soft transition hover:border-ember-ring hover:shadow-lift active:scale-[0.99]"
    >
      <div className="flex items-center gap-3.5 p-3">
        <img src={photo(r.photoSeeds[0], 240, 240)} alt={r.name} className="h-20 w-20 shrink-0 rounded-ctl bg-surface-2 object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold text-ink">{r.name}</h3>
            {myScore != null && <TierBadge tier={scoreToTier(myScore)} size="sm" />}
          </div>
          <div className="mt-0.5 text-[12.5px] text-ink-soft">
            {r.cuisine} · {r.neighborhood}
          </div>
          <div className="mt-1.5">
            <StarRating value={r.rating} />
          </div>
        </div>
      </div>
    </button>
  )
}

function pickPair(pool: Restaurant[], prev: Pair | null): Pair | null {
  if (pool.length < 2) return null
  for (let i = 0; i < 24; i++) {
    const a = pool[Math.floor(Math.random() * pool.length)]
    const b = pool[Math.floor(Math.random() * pool.length)]
    if (a.id === b.id) continue
    if (prev && ((prev.a.id === a.id && prev.b.id === b.id) || (prev.a.id === b.id && prev.b.id === a.id))) continue
    return { a, b, q: QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)] }
  }
  const [a, b] = pool
  return { a, b, q: QUESTIONS[0] }
}

/* ---- Tier lists ---- */

function TierList({
  tiers,
  title,
  includeWTT,
}: {
  tiers: Record<Tier, Restaurant[]>
  title: string
  includeWTT?: boolean
}) {
  const order: Tier[] = includeWTT ? [...TIER_ORDER, 'want-to-try'] : TIER_ORDER
  return (
    <div>
      <h2 className="mb-3 text-base font-semibold tracking-tight text-ink">{title}</h2>
      <div className="space-y-2.5">
        {order.map((t, i) => (
          <Reveal key={t} delay={i * 0.04}>
            <TierRow tier={t} restaurants={tiers[t]} />
          </Reveal>
        ))}
      </div>
    </div>
  )
}

function TierRow({ tier, restaurants }: { tier: Tier; restaurants: Restaurant[] }) {
  const navigate = useNavigate()
  const s = TIER_STYLE[tier]
  return (
    <div className="flex items-stretch gap-3 rounded-card border border-line bg-surface p-2.5">
      <div
        className="flex w-14 shrink-0 flex-col items-center justify-center rounded-ctl"
        style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
      >
        <span className="tnum text-base font-bold leading-none">{tier === 'want-to-try' ? 'WTT' : s.label}</span>
      </div>
      {restaurants.length > 0 ? (
        <div className="flex flex-1 gap-2 overflow-x-auto no-scrollbar">
          {restaurants.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/r/${r.id}`)}
              className="w-16 shrink-0 active:scale-95"
            >
              <img src={photo(r.photoSeeds[0], 160, 160)} alt={r.name} className="h-16 w-16 rounded-ctl bg-surface-2 object-cover" />
              <span className="mt-1 block truncate text-[10.5px] leading-tight text-ink-soft">{r.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center text-[12.5px] text-ink-faint">No spots here yet</div>
      )}
    </div>
  )
}
