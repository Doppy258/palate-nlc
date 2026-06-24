import { useNavigate } from 'react-router-dom'
import { CheckCircle, Lightning, Lock, Medal, SealCheck, Ticket } from '@phosphor-icons/react'
import type { QuestGroup } from '../data/types'
import { useBadges, useLevels, usePalate, useQuests } from '../providers/PalateProvider'
import { useStore } from '../store/useStore'
import { levelFromXp } from '../lib/xp'
import { questProgress } from '../lib/quests'
import { badgeUnlocked } from '../lib/badges'
import { heroGradient } from '../lib/photos'
import { cn } from '../lib/cn'
import { AppBar, Screen } from '../components/layout'
import { Button, ProgressBar } from '../components/ui'
import { Reveal } from '../components/Reveal'

const STAMP_REWARD = 5

const GROUPS: { v: QuestGroup; label: string }[] = [
  { v: 'starter', label: 'Starter quests' },
  { v: 'food', label: 'Food quests' },
  { v: 'social', label: 'Social quests' },
  { v: 'business', label: 'Support local quests' },
]

export default function Passport() {
  const { restaurants, friends } = usePalate()
  const quests = useQuests()
  const badges = useBadges()
  const levels = useLevels()
  const store = useStore()
  const navigate = useNavigate()
  const level = levelFromXp(store.xp, levels)
  const stamps = store.visitedIds.length
  const rewardPct = Math.min(100, (stamps / STAMP_REWARD) * 100)
  const rewardDone = stamps >= STAMP_REWARD

  return (
    <Screen appBar={<AppBar title="Passport" subtitle={`${store.name}'s food passport`} />}>
      <div className="space-y-7 px-4 pb-8 pt-4 lg:mx-auto lg:max-w-5xl lg:px-8 lg:pt-6">
        {/* Level card */}
        <Reveal>
          <div className="overflow-hidden rounded-card border border-line bg-surface shadow-soft">
            <div className="flex items-center justify-between px-4 pt-4">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-ink-faint">Level {level.index}</div>
                <div className="text-lg font-semibold tracking-tight text-ink">{level.def.name}</div>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-white">
                <Lightning size={14} weight="fill" />
                <span className="tnum text-sm font-semibold">{store.xp.toLocaleString()} XP</span>
              </div>
            </div>
            <div className="px-4 pb-4 pt-3">
              <ProgressBar value={level.progress * 100} />
              <div className="mt-2 flex items-center justify-between text-[12px] text-ink-soft">
                {level.next ? (
                  <>
                    <span className="tnum">{level.xpToNext} XP to go</span>
                    <span>{level.next.name}</span>
                  </>
                ) : (
                  <span>Top level reached. Local Food Legend.</span>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Stamp reward + grid */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-ink">Stamps</h2>
            <span className="tnum text-[12.5px] text-ink-soft">
              {stamps}/{restaurants.length} collected
            </span>
          </div>

          <Reveal>
            <div className={cn('mb-4 rounded-card border px-4 py-3.5', rewardDone ? 'border-ember-ring bg-ember-tint' : 'border-line bg-surface')}>
              <div className="flex items-center gap-2">
                <Ticket size={18} weight="fill" className={rewardDone ? 'text-ember' : 'text-ink-soft'} />
                <span className="text-[13.5px] font-semibold text-ink">
                  {rewardDone ? 'Bonus coupon unlocked' : 'Collect 5 stamps for a bonus coupon'}
                </span>
              </div>
              <div className="mt-2.5">
                <ProgressBar value={rewardPct} />
                <div className="tnum mt-1.5 text-[12px] text-ink-soft">
                  {Math.min(stamps, STAMP_REWARD)} of {STAMP_REWARD} stamps
                </div>
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-5 gap-x-2 gap-y-3 lg:grid-cols-10">
            {restaurants.map((r) => {
              const got = store.visitedIds.includes(r.id)
              return (
                <button
                  key={r.id}
                  onClick={() => navigate(`/r/${r.id}`)}
                  className="flex flex-col items-center gap-1 active:scale-95"
                >
                  <span className="relative">
                    {got ? (
                      <>
                        <span
                          className="flex h-14 w-14 items-center justify-center rounded-full ring-2 ring-ember"
                          style={{ background: heroGradient(r.id, r.cuisine) }}
                        >
                          <span className="select-none text-lg font-bold text-white/80">
                            {r.name.charAt(0)}
                          </span>
                        </span>
                        <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ember text-white ring-2 ring-surface">
                          <SealCheck size={11} weight="fill" />
                        </span>
                      </>
                    ) : (
                      <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-line text-ink-faint">
                        <Lock size={16} />
                      </span>
                    )}
                  </span>
                  <span className={cn('max-w-14 truncate text-[10px] leading-tight', got ? 'text-ink' : 'text-ink-faint')}>
                    {r.name}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Quests */}
        <section>
          <h2 className="mb-3 text-base font-semibold tracking-tight text-ink">Quests</h2>
          <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-6 lg:space-y-0">
            {GROUPS.map((g) => (
              <div key={g.v}>
                <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-faint">{g.label}</div>
                <div className="space-y-2.5">
                  {quests.filter((q) => q.group === g.v).map((q) => (
                    <QuestRow key={q.id} questId={q.id} restaurants={restaurants} friendCount={friends.length} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="mb-3 text-base font-semibold tracking-tight text-ink">Badges</h2>
          <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-6">
            {badges.map((b) => {
              const on = badgeUnlocked(b, store, restaurants, store.biteCount)
              return (
                <Reveal key={b.id}>
                  <div
                    className={cn(
                      'flex h-full flex-col items-center rounded-card border px-2 py-3 text-center',
                      on ? 'border-ember-ring bg-ember-tint' : 'border-line bg-surface',
                    )}
                  >
                    <Medal size={26} weight={on ? 'fill' : 'regular'} className={on ? 'text-ember' : 'text-ink-faint'} />
                    <div className={cn('mt-1.5 text-[11.5px] font-semibold leading-tight', on ? 'text-ink' : 'text-ink-soft')}>
                      {b.name}
                    </div>
                    <div className="mt-0.5 text-[10px] leading-tight text-ink-faint">{b.condition}</div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </section>
      </div>
    </Screen>
  )
}

function QuestRow({
  questId,
  restaurants,
  friendCount,
}: {
  questId: string
  restaurants: ReturnType<typeof usePalate>['restaurants']
  friendCount: number
}) {
  const store = useStore()
  const claim = useStore((s) => s.claimQuest)
  const quests = useQuests()
  const quest = quests.find((q) => q.id === questId)!
  const p = questProgress(quest, store, restaurants, friendCount, store.biteCount)

  return (
    <div className="rounded-card border border-line bg-surface p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium text-ink">{quest.title}</div>
          <div className="tnum mt-0.5 text-[11.5px] text-ink-soft">
            {p.value}/{p.target} · +{quest.xp} XP
          </div>
        </div>
        {p.claimed ? (
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-faint">
            <CheckCircle size={16} weight="fill" /> Claimed
          </span>
        ) : p.claimable ? (
          <Button size="sm" onClick={() => claim(quest.id, quest.title)}>
            Claim
          </Button>
        ) : null}
      </div>
      {!p.claimed && (
        <div className="mt-2.5">
          <ProgressBar value={(p.value / p.target) * 100} tone={p.claimable ? 'ember' : 'ember'} />
        </div>
      )}
    </div>
  )
}
