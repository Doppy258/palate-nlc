import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretRight, Lightning, Storefront, SignOut, UserPlus } from '@phosphor-icons/react'
import type { Friend, Restaurant } from '../data/types'
import { useBadges, useLevels, usePalate } from '../providers/PalateProvider'
import { useAuth } from '../providers/AuthProvider'
import { useStore } from '../store/useStore'
import { levelFromXp } from '../lib/xp'
import { badgeUnlocked } from '../lib/badges'
import { personalTiers } from '../lib/ranking'
import { TIER_ORDER, TIER_STYLE } from '../theme/tokens'
import { heroGradient } from '../lib/photos'
import { AppBar, Screen } from '../components/layout'
import { Avatar, Button, Chip, ProgressBar, TierBadge } from '../components/ui'
import { Reveal } from '../components/Reveal'
import { api } from '../api/client'

const rname = (restaurants: Restaurant[], id: string) =>
  restaurants.find((r) => r.id === id)?.name ?? 'a spot'

export default function Profile() {
  const { restaurants, friends } = usePalate()
  const [pendingCount, setPendingCount] = useState(0)
  const badges = useBadges()
  const levels = useLevels()
  const { logout } = useAuth()
  const store = useStore()
  const navigate = useNavigate()
  const level = levelFromXp(store.xp, levels)
  const tiers = personalTiers(restaurants, store)
  const badgesEarned = badges.filter((b) => badgeUnlocked(b, store, restaurants, store.biteCount)).length
  const saved = restaurants.filter((r) => store.savedIds.includes(r.id))

  useEffect(() => {
    api.getPendingFriendRequests().then((r) => setPendingCount(r.length)).catch(() => {})
  }, [])

  const favCuisines = useMemo(() => {
    const ids = new Set([...store.visitedIds, ...Object.keys(store.personalScores)])
    const counts: Record<string, number> = {}
    for (const r of restaurants) if (ids.has(r.id)) counts[r.cuisine] = (counts[r.cuisine] ?? 0) + 1
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([c]) => c)
  }, [store.visitedIds, store.personalScores, restaurants])

  const stats = [
    { label: 'Stamps', value: store.visitedIds.length },
    { label: 'Reviews', value: store.reviewCount },
    { label: 'Bites', value: store.biteCount },
    { label: 'Quests', value: store.claimedQuestIds.length },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <Screen
      appBar={
        <AppBar
          title="Profile"
          right={
            <button
              onClick={() => navigate('/owner')}
              className="inline-flex h-10 items-center gap-1.5 rounded-ctl border border-line bg-surface px-3 text-[12.5px] font-medium text-ink transition hover:bg-surface-2 active:scale-95"
            >
              <Storefront size={16} /> Business
            </button>
          }
        />
      }
    >
      <div className="px-4 pb-8 pt-3 lg:mx-auto lg:max-w-5xl lg:px-8 lg:pt-6">
        <div className="lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-x-8">
          {/* Primary column */}
          <div className="space-y-7">
            {/* Identity */}
            <Reveal>
              <div className="flex items-center gap-4">
                <Avatar seed={store.avatarSeed} name={store.name} size={64} className="ring-2 ring-surface shadow-soft" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-semibold tracking-tight text-ink">{store.name}</h1>
                  <div className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-soft">
                    <span>{level.def.name}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">
                      <Lightning size={11} weight="fill" />
                      <span className="tnum">{store.xp.toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={level.progress * 100} />
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2.5">
              {stats.map((s) => (
                <div key={s.label} className="rounded-card border border-line bg-surface px-2 py-3 text-center">
                  <div className="tnum text-xl font-semibold text-ink">{s.value}</div>
                  <div className="text-[11px] text-ink-soft">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Favourite cuisines */}
            {favCuisines.length > 0 && (
              <section>
                <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink-faint">Favorite cuisines</h2>
                <div className="flex flex-wrap gap-2">
                  {favCuisines.map((c) => (
                    <Chip key={c} tone="accent">
                      {c}
                    </Chip>
                  ))}
                </div>
              </section>
            )}

            {/* Tier summary */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight text-ink">Your tier list</h2>
                <button onClick={() => navigate('/rank')} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-ember">
                  Open <CaretRight size={14} />
                </button>
              </div>
              <div className="rounded-card border border-line bg-surface p-3.5">
                <div className="flex flex-wrap gap-2">
                  {[...TIER_ORDER, 'want-to-try' as const].map((t) => (
                    <div
                      key={t}
                      className="flex items-center gap-2 rounded-md border border-line bg-surface-2 px-2.5 py-1.5"
                    >
                      <TierBadge tier={t} size="sm" />
                      <span className="tnum text-[13px] font-semibold text-ink">{tiers[t].length}</span>
                    </div>
                  ))}
                </div>
                {/* Tier distribution bar */}
                {(() => {
                  const allTiers = [...TIER_ORDER, 'want-to-try' as const]
                  const total = allTiers.reduce((s, t) => s + tiers[t].length, 0)
                  if (total === 0) return null
                  return (
                    <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full bg-surface-2">
                      {allTiers.map((t) => {
                        const pct = (tiers[t].length / total) * 100
                        if (pct === 0) return null
                        return (
                          <div
                            key={t}
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: TIER_STYLE[t].bg,
                              boxShadow: `inset 0 0 0 1px ${TIER_STYLE[t].ring}`,
                            }}
                          />
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </section>

            {/* Want to Try */}
            {saved.length > 0 && (
              <section>
                <h2 className="mb-3 text-base font-semibold tracking-tight text-ink">Want to Try</h2>
                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 no-scrollbar lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-3 lg:overflow-visible lg:px-0">
                  {saved.map((r) => (
                    <button key={r.id} onClick={() => navigate(`/r/${r.id}`)} className="w-28 shrink-0 active:scale-95 lg:w-auto">
                      <div
                        className="flex h-24 w-28 items-center justify-center rounded-card lg:h-28 lg:w-full"
                        style={{ background: heroGradient(r.id, r.cuisine) }}
                      >
                        <span className="select-none text-3xl font-bold text-white/40">
                          {r.name.charAt(0)}
                        </span>
                      </div>
                      <div className="mt-1.5 truncate text-[12.5px] font-medium text-ink">{r.name}</div>
                      <div className="text-[11px] text-ink-soft">{r.cuisine}</div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Secondary column */}
          <div className="mt-7 space-y-7 lg:mt-0">
            {/* Friends */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight text-ink">Friends</h2>
                <button
                  onClick={() => navigate('/friends')}
                  className="relative inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink transition hover:bg-surface-2 active:scale-95"
                >
                  <UserPlus size={14} />
                  Find Friends
                  {pendingCount > 0 && (
                    <span className="tnum inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>
              <div className="space-y-2.5">
                {friends.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
                    <Avatar seed={f.avatarSeed} name={f.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-ink">{f.name}</div>
                      <div className="truncate text-[12px] text-ink-soft">{friendActivity(f, restaurants)}</div>
                    </div>
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-ink-soft">Following</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Badges link */}
            <div className="flex items-center justify-between rounded-card border border-line bg-surface px-4 py-3.5">
              <div>
                <div className="text-[13.5px] font-semibold text-ink">Badges earned</div>
                <div className="tnum text-[12px] text-ink-soft">{badgesEarned} of {badges.length}</div>
              </div>
              <button onClick={() => navigate('/passport')} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-ember">
                View <CaretRight size={14} />
              </button>
            </div>

            <Button variant="ghost" full icon={<SignOut size={16} />} onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </div>
    </Screen>
  )
}

function friendActivity(f: Friend, restaurants: Restaurant[]): string {
  if (f.sTierIds.length) return `Ranked ${rname(restaurants, f.sTierIds[0])} S tier`
  if (f.biteRestaurantIds.length) return `Posted a Bite at ${rname(restaurants, f.biteRestaurantIds[0])}`
  if (f.savedIds.length) return `Saved ${rname(restaurants, f.savedIds[0])}`
  return 'New to Palate'
}
