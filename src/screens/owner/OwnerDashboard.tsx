import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CaretLeft,
  Clock,
  Eye,
  Heart,
  Plus,
  SealCheck,
  Tag,
  Ticket,
  Trophy,
} from '@phosphor-icons/react'
import type { Deal, Restaurant } from '../../data/types'
import { usePalate } from '../../providers/PalateProvider'
import { useStore } from '../../store/useStore'
import { communityScores } from '../../lib/ranking'
import { restaurantDeals } from '../../lib/deals'
import { friendsWhoSaved } from '../../lib/friends'
import { fmtHour } from '../../lib/time'
import { scoreToTier } from '../../theme/tokens'
import { cn } from '../../lib/cn'
import { AppBar, Screen } from '../../components/layout'
import { BottomSheet } from '../../components/Sheet'
import { Button, Chip, IconButton, TierBadge } from '../../components/ui'
import { Reveal } from '../../components/Reveal'

export default function OwnerDashboard() {
  const { restaurants, friends } = usePalate()
  const navigate = useNavigate()
  const store = useStore()
  const [rid, setRid] = useState('')
  const [dealOpen, setDealOpen] = useState(false)

  useEffect(() => {
    if (!rid && restaurants[0]) setRid(restaurants[0].id)
  }, [restaurants, rid])

  const r = restaurants.find((x) => x.id === rid)

  const community = useMemo(() => communityScores(restaurants, store), [restaurants, store])

  if (!r) {
    return (
      <Screen appBar={<AppBar title="Business view" left={<IconButton onClick={() => navigate('/profile')} aria-label="Back"><CaretLeft size={20} /></IconButton>} />}>
        <div className="px-4 py-10 text-center text-sm text-ink-soft">No restaurants in the database yet.</div>
      </Screen>
    )
  }

  const stats = ownerStats(r, store, friends)
  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const day = i === 6 ? stats.views : Math.round(stats.views * (0.1 + Math.random() * 0.15))
        return Math.max(day, 0)
      }),
    [r, stats.views],
  )
  const weekMax = Math.max(...week)

  return (
    <Screen
      appBar={
        <AppBar
          title="Business view"
          subtitle="Sample analytics"
          left={
            <IconButton onClick={() => navigate('/profile')} aria-label="Back">
              <CaretLeft size={20} />
            </IconButton>
          }
        />
      }
    >
      <div className="px-4 pb-8 pt-3 lg:mx-auto lg:max-w-3xl lg:px-8 lg:pt-6">
        {/* Restaurant switcher */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
          {restaurants.map((x) => (
            <Chip key={x.id} selected={x.id === rid} onClick={() => setRid(x.id)}>
              {x.name}
            </Chip>
          ))}
        </div>

        {/* Header */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">{r.name}</h1>
            <div className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-soft">
              <span>Community</span>
              <TierBadge tier={scoreToTier(community[r.id])} size="sm" />
              <span className="tnum">{r.rating.toFixed(1)} avg</span>
            </div>
          </div>
          <Button size="sm" icon={<Plus size={16} weight="bold" />} onClick={() => setDealOpen(true)}>
            New deal
          </Button>
        </div>

        {/* Metrics */}
        <div className="mt-4 grid grid-cols-3 gap-2.5 lg:grid-cols-6">
          <Metric icon={<Eye size={16} />} label="Views" value={stats.views} />
          <Metric icon={<Heart size={16} />} label="Saves" value={stats.saves} />
          <Metric icon={<Ticket size={16} />} label="Stamps" value={stats.stamps} />
          <Metric icon={<Tag size={16} />} label="Redeemed" value={stats.redemptions} />
          <Metric icon={<SealCheck size={16} />} label="Reviews" value={stats.verified} />
          <Metric icon={<Trophy size={16} />} label="Tier" value={scoreToTier(community[r.id])} mono={false} />
        </div>

        {/* Views chart */}
        <Reveal>
          <div className="mt-5 rounded-card border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink">Views, last 7 days</span>
              <span className="tnum text-[12px] text-ink-soft">{week.reduce((a, b) => a + b, 0)} total</span>
            </div>
            <div className="mt-3 flex h-20 items-end gap-2">
              {week.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-[4px] bg-ember/85 transition-[height] duration-500"
                      style={{ height: `${(v / weekMax) * 100}%`, transitionTimingFunction: 'var(--ease-out)' }}
                    />
                  </div>
                  <span className="text-[10px] text-ink-faint">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Top tags */}
        <Block title="Most common tags">
          <div className="flex flex-wrap gap-2">
            {r.tags.map((t) => (
              <Chip key={t} tone="accent">
                {t}
              </Chip>
            ))}
          </div>
        </Block>

        {/* Popular dishes */}
        <Block title="Most popular dishes">
          <div className="space-y-2.5">
            {[...r.dishes]
              .sort((a, b) => b.popularity - a.popularity)
              .map((d) => (
                <div key={d.name}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-ink">{d.name}</span>
                    <span className="tnum text-ink-soft">{Math.round(d.popularity * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-ember" style={{ width: `${d.popularity * 100}%` }} />
                  </div>
                </div>
              ))}
          </div>
        </Block>

        {/* Slow hour + quest traffic */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {r.slowHour && (
            <InfoRow
              icon={<Clock size={17} />}
              title="Slow-hour performance"
              body={`${fmtHour(r.slowHour.start)} to ${fmtHour(r.slowHour.end)} · ${r.slowHour.label}`}
              metric={`${Math.round(r.baseCouponsRedeemed * 0.6)} redemptions`}
            />
          )}
          <InfoRow
            icon={<Trophy size={17} />}
            title="Top quest traffic"
            body="Try 3 new local restaurants"
            metric={`${Math.round(r.baseStampsCollected * 0.4)} visits`}
          />
        </div>

        {/* Live deals */}
        <Block title="Your live deals">
          <div className="space-y-2.5">
            {r.deals.map((d) => (
              <div key={d.id} className="flex items-center gap-2.5 rounded-card border border-line bg-surface px-3.5 py-2.5">
                <Tag size={16} weight="fill" className="text-ember" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{d.label}</span>
                {d.id.startsWith('own-') && (
                  <span className="shrink-0 rounded-full bg-ember-tint px-2 py-0.5 text-[10.5px] font-semibold text-ember">
                    Live on Discover
                  </span>
                )}
              </div>
            ))}
          </div>
        </Block>
      </div>

      <CreateDealSheet open={dealOpen} restaurant={r} onClose={() => setDealOpen(false)} />
    </Screen>
  )
}

function ownerStats(
  r: Restaurant,
  store: ReturnType<typeof useStore.getState>,
  friends: ReturnType<typeof usePalate>['friends'],
) {
  const dealIds = new Set(restaurantDeals(r).map((d) => d.id))
  return {
    views: r.baseViews,
    saves: r.baseSaves + (store.savedIds.includes(r.id) ? 1 : 0) + friendsWhoSaved(r.id, friends).length,
    stamps: r.baseStampsCollected + (store.visitedIds.includes(r.id) ? 1 : 0),
    redemptions: r.baseCouponsRedeemed + store.redeemedDealIds.filter((id) => dealIds.has(id)).length,
    verified: r.baseVerifiedReviews,
  }
}

function Metric({
  icon,
  label,
  value,
  mono = true,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-3">
      <div className="text-ink-faint">{icon}</div>
      <div className={cn('mt-1.5 text-lg font-semibold text-ink', mono && 'tnum')}>{value}</div>
      <div className="text-[11px] text-ink-soft">{label}</div>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-base font-semibold tracking-tight text-ink">{title}</h2>
      {children}
    </section>
  )
}

function InfoRow({
  icon,
  title,
  body,
  metric,
}: {
  icon: React.ReactNode
  title: string
  body: string
  metric: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-3.5">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-ctl bg-ember-tint text-ember">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold text-ink">{title}</div>
        <div className="truncate text-[12px] text-ink-soft">{body}</div>
      </div>
      <span className="tnum shrink-0 text-[12.5px] font-semibold text-ink">{metric}</span>
    </div>
  )
}

const DEAL_PRESETS: { kind: Deal['kind']; label: string; value: number; slowHour?: boolean }[] = [
  { kind: 'percent', label: '15% off after 3 PM', value: 0.7 },
  { kind: 'amount', label: '$5 off orders over $25', value: 0.5 },
  { kind: 'free', label: 'Free drink with any meal', value: 0.5 },
  { kind: 'slow-hour', label: '20% off, 2 to 4 PM', value: 0.7, slowHour: true },
  { kind: 'student', label: 'Student combo, $9 with ID', value: 0.6 },
]

function CreateDealSheet({
  open,
  restaurant,
  onClose,
}: {
  open: boolean
  restaurant: Restaurant
  onClose: () => void
}) {
  const create = useStore((s) => s.createOwnerDeal)
  const [preset, setPreset] = useState(0)
  const [label, setLabel] = useState(DEAL_PRESETS[0].label)

  const choose = (i: number) => {
    setPreset(i)
    setLabel(DEAL_PRESETS[i].label)
  }

  const publish = () => {
    const p = DEAL_PRESETS[preset]
    create(restaurant.id, { label: label.trim() || p.label, kind: p.kind, value: p.value, slowHour: p.slowHour })
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`New deal for ${restaurant.name}`}
      footer={
        <Button full size="lg" onClick={publish}>
          Publish deal
        </Button>
      }
    >
      <p className="text-[13px] leading-relaxed text-ink-soft">
        Published deals appear on Discover and your restaurant page immediately.
      </p>
      <div className="mt-3 text-[13px] font-medium text-ink">Deal type</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {DEAL_PRESETS.map((p, i) => (
          <Chip key={p.label} selected={preset === i} onClick={() => choose(i)}>
            {presetName(p.kind)}
          </Chip>
        ))}
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block text-[13px] font-medium text-ink">Offer text</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-11 w-full rounded-ctl border border-line bg-surface px-3.5 text-sm text-ink focus:border-ember focus:outline-none"
        />
      </div>
    </BottomSheet>
  )
}

function presetName(kind: Deal['kind']) {
  const map: Record<Deal['kind'], string> = {
    percent: 'Percent off',
    amount: 'Amount off',
    free: 'Free item',
    'slow-hour': 'Slow hour',
    student: 'Student',
    'first-time': 'First time',
    stamp: 'Stamp reward',
    group: 'Group',
  }
  return map[kind]
}
