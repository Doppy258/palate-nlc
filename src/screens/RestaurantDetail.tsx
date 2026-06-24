import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowsLeftRight,
  CaretLeft,
  Check,
  Clock,
  Heart,
  Lock,
  MapPin,
  SealCheck,
  ShareNetwork,
  ShieldCheck,
  Star,
  Tag,
} from '@phosphor-icons/react'
import type { Bite, Restaurant, Review, Tier } from '../data/types'
import { usePalate } from '../providers/PalateProvider'
import { useStore } from '../store/useStore'
import { dealRedeemable, dealUnlocked, restaurantDeals } from '../lib/deals'
import { communityScores } from '../lib/ranking'
import { fmtHour, isSlowHourActive, openStatus } from '../lib/time'
import { PRICE_LABEL, scoreToTier } from '../theme/tokens'
import { cn } from '../lib/cn'
import { AppBar, Screen } from '../components/layout'
import { BottomSheet, Modal } from '../components/Sheet'
import { Avatar, Button, Chip, IconButton, StarRating, TierBadge } from '../components/ui'
import { LocationMap } from '../components/LocationMap'
import { useUserLocation } from '../hooks/useUserLocation'

export default function RestaurantDetail() {
  const { id } = useParams()
  const { restaurants, bites: allBites } = usePalate()
  const store = useStore()
  const r = restaurants.find((x) => x.id === id)
  const navigate = useNavigate()

  const [checkInOpen, setCheckInOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [success, setSuccess] = useState<null | { slowHour: boolean }>(null)

  const community = useMemo(() => communityScores(restaurants, store), [restaurants, store])

  if (!r) {
    return (
      <Screen appBar={<AppBar title="Not found" left={<BackButton />} />}>
        <div className="px-4 py-10 text-center text-sm text-ink-soft">That spot does not exist.</div>
      </Screen>
    )
  }

  const saved = store.savedIds.includes(r.id)
  const visited = store.visitedIds.includes(r.id)
  const myScore = store.personalScores[r.id]
  const myTier = myScore != null ? scoreToTier(myScore) : null
  const communityTier = scoreToTier(community[r.id])
  const deals = restaurantDeals(r)
  const bites = allBites.filter((b) => b.restaurantId === r.id)
  const reviews: Review[] = r.reviews
  const userLocation = useUserLocation()

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: r.name,
          text: `Check out ${r.name} — ${r.cuisine} in ${r.neighborhood}`,
          url: window.location.href,
        })
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href)
      store.pushToast({ title: 'Link copied', detail: `${r.name} URL copied to clipboard` })
    }
  }

  return (
    <Screen
      appBar={
        <AppBar
          title={r.name}
          subtitle={`${r.cuisine} · ${r.neighborhood}`}
          left={<BackButton />}
          right={
            <div className="flex items-center gap-1">
              <IconButton onClick={handleShare} aria-label="Share">
                <ShareNetwork size={20} />
              </IconButton>
              <IconButton
                onClick={() => store.toggleSave(r.id)}
                aria-label={saved ? 'Saved' : 'Save'}
                className={saved ? 'text-ember' : ''}
              >
                <Heart size={20} weight={saved ? 'fill' : 'regular'} />
              </IconButton>
            </div>
          }
        />
      }
    >
      <div className="lg:mx-auto lg:max-w-6xl lg:px-8 lg:pb-10">
        {/* Map banner with user location */}
        <div className="relative lg:mt-6">
          <LocationMap
            lat={r.coordinates.lat}
            lon={r.coordinates.lon}
            userLocation={userLocation}
            zoom={14}
            className="h-48 w-full lg:h-56 lg:rounded-card"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent" />

          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-semibold text-ink-soft backdrop-blur-sm">
              Community
            </span>
            <TierBadge tier={communityTier} className="ring-1 ring-white/60" />
            {isSlowHourActive(r.slowHour) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-semibold text-ember backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ember" />
                </span>
                Slow hour
              </span>
            )}
          </div>
        </div>

        <div className="px-4 pb-6 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 lg:px-0 lg:pb-0 lg:pt-5">
          <div className="lg:min-w-0">
            {/* Title row */}
            <div className="mt-3 flex items-start justify-between gap-3 lg:mt-3">
              <div>
                <h1 className="text-xl font-semibold leading-tight tracking-tight text-ink lg:text-2xl">
                  {r.name}
                </h1>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-ink-soft">
                  <span>{r.cuisine}</span>
                  <Dot />
                  <span className="tnum">{PRICE_LABEL[r.priceTier]}</span>
                  <Dot />
                  <MapPin size={12} />
                  <span className="tnum">{r.distanceMi.toFixed(1)} mi</span>
                </div>
              </div>
              <StarRating value={r.rating} />
            </div>

            <div className="mt-1 flex items-center gap-1 text-xs">
              <Clock size={12} className="text-ink-faint" />
              <span className={cn('font-medium', openStatus(r.hours) === 'Open now' ? 'text-ember' : 'text-ink-soft')}>
                {openStatus(r.hours)}
              </span>
              <span className="text-ink-faint"> · {fmtHour(r.hours.open)}–{fmtHour(r.hours.close)}</span>
              <span className="text-ink-faint"> · {r.reviewCount} reviews</span>
            </div>

            {/* Tags — inline dots */}
            <div className="mt-2.5 flex flex-wrap gap-1">
              {r.tags.slice(0, 5).map((t) => (
                <Chip key={t} tone="muted">
                  {t}
                </Chip>
              ))}
              {r.tags.length > 5 && (
                <Chip tone="plain">+{r.tags.length - 5}</Chip>
              )}
            </div>

            {/* Mobile actions inline */}
            <div className="mt-3 lg:hidden">
              <div className="flex items-center gap-2">
                {!visited ? (
                  <Button size="sm" icon={<ShieldCheck size={15} weight="fill" />} onClick={() => setCheckInOpen(true)}>
                    Check in
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-ctl bg-ember-tint px-3 py-1.5 text-xs font-semibold text-ember">
                    <SealCheck size={14} weight="fill" /> Stamped
                  </span>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Heart size={15} weight={saved ? 'fill' : 'regular'} className={saved ? 'text-ember' : ''} />}
                  onClick={() => store.toggleSave(r.id)}
                >
                  {saved ? 'Saved' : 'Save'}
                </Button>
                <Button size="sm" variant="secondary" icon={<ArrowsLeftRight size={15} />} onClick={() => navigate('/rank')}>
                  Compare
                </Button>
                {visited && (
                  <Button size="sm" variant="secondary" onClick={() => setReviewOpen(true)}>
                    Review
                  </Button>
                )}
                {myTier && (
                  <span className="ml-auto">
                    <TierBadge tier={myTier} size="sm" />
                  </span>
                )}
              </div>
            </div>

            {/* Deals — compact list */}
            {deals.length > 0 && (
              <section className="mt-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Deals</h2>
                <div className="space-y-1.5">
                  {deals.map((d) => (
                    <DealRow key={d.id} restaurant={r} deal={d} />
                  ))}
                </div>
              </section>
            )}

            {/* Popular dishes — clean text list */}
            {r.dishes.length > 0 && (
              <section className="mt-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Popular dishes</h2>
                <div className="space-y-1.5">
                  {[...r.dishes]
                    .sort((a, b) => b.popularity - a.popularity)
                    .slice(0, 6)
                    .map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between gap-3 rounded-ctl border border-line bg-surface px-3 py-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="tnum w-4 shrink-0 text-center text-xs font-medium text-ink-faint">{i + 1}</span>
                          <span className="truncate text-[13px] font-medium text-ink">{d.name}</span>
                        </div>
                        <span className="tnum shrink-0 text-[11px] text-ink-soft">{Math.round(d.popularity * 100)}%</span>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* Bites — no fake photos, just avatars + text */}
            {bites.length > 0 && (
              <section className="mt-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Bites</h2>
                <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
                  {bites.slice(0, 4).map((b) => (
                    <BiteRow key={b.id} bite={b} />
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Reviews</h2>
                {visited && (
                  <button onClick={() => setReviewOpen(true)} className="text-xs font-semibold text-ember">
                    + Write
                  </button>
                )}
              </div>
              {reviews.length > 0 ? (
                <div className="space-y-2">
                  {reviews.slice(0, 5).map((rv) => (
                    <ReviewItem key={rv.id} review={rv} />
                  ))}
                </div>
              ) : (
                <p className="rounded-ctl border border-dashed border-line bg-surface-2 px-3 py-4 text-center text-xs text-ink-soft">
                  No reviews yet. Check in and be the first.
                </p>
              )}
            </section>
          </div>

          {/* Desktop sticky rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-[88px] space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <TierTile label="Community" tier={communityTier} />
                {myTier ? (
                  <TierTile label="Your tier" tier={myTier} />
                ) : (
                  <button
                    onClick={() => store.addToTier(r.id)}
                    className="flex flex-col items-start justify-center rounded-card border border-dashed border-line bg-surface-2 px-3 py-2.5 text-left transition hover:bg-surface active:scale-[0.99]"
                  >
                    <span className="text-[10px] uppercase tracking-wide text-ink-faint">Your tier</span>
                    <span className="mt-0.5 text-xs font-semibold text-ember">Rank it</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {!visited ? (
                  <Button full icon={<ShieldCheck size={17} weight="fill" />} onClick={() => setCheckInOpen(true)}>
                    Check in with code
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="flex flex-1 items-center justify-center gap-1.5 rounded-ctl bg-ember-tint py-2.5 text-sm font-semibold text-ember">
                      <SealCheck size={16} weight="fill" /> Stamped
                    </span>
                    <Button className="flex-1" variant="secondary" onClick={() => setReviewOpen(true)}>
                      Review
                    </Button>
                  </div>
                )}
                <Button
                  variant="secondary"
                  full
                  icon={<Heart size={17} weight={saved ? 'fill' : 'regular'} className={saved ? 'text-ember' : ''} />}
                  onClick={() => store.toggleSave(r.id)}
                >
                  {saved ? 'Saved' : 'Save'}
                </Button>
                <Button variant="secondary" full icon={<ArrowsLeftRight size={17} />} onClick={() => navigate('/rank')}>
                  Compare
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <CheckInSheet
        open={checkInOpen}
        restaurant={r}
        onClose={() => setCheckInOpen(false)}
        onSuccess={(slowHour) => {
          setCheckInOpen(false)
          setSuccess({ slowHour })
        }}
      />
      <ReviewSheet open={reviewOpen} restaurant={r} onClose={() => setReviewOpen(false)} />
      <Modal open={!!success} onClose={() => setSuccess(null)}>
        {success && <CheckInSuccess restaurant={r} slowHour={success.slowHour} onDone={() => setSuccess(null)} onReview={() => { setSuccess(null); setReviewOpen(true) }} />}
      </Modal>
    </Screen>
  )
}

function BackButton() {
  const navigate = useNavigate()
  return (
    <IconButton onClick={() => navigate(-1)} aria-label="Back">
      <CaretLeft size={20} />
    </IconButton>
  )
}

function TierTile({ label, tier }: { label: string; tier: ReturnType<typeof scoreToTier> }) {
  return (
    <div className="flex items-center justify-between rounded-card border border-line bg-surface px-3 py-2.5">
      <span className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</span>
      <TierBadge tier={tier} size="sm" />
    </div>
  )
}

function DealRow({ restaurant: r, deal }: { restaurant: Restaurant; deal: ReturnType<typeof restaurantDeals>[number] }) {
  const store = useStore()
  const unlocked = dealUnlocked(deal, store)
  const redeemable = dealRedeemable(deal, r, store)
  const redeemed = store.redeemedDealIds.includes(deal.id)

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-ctl border px-3 py-2',
        unlocked ? 'border-ember-ring bg-ember-tint' : 'border-line bg-surface-2',
      )}
    >
      <span className={cn('shrink-0', unlocked ? 'text-ember' : 'text-ink-faint')}>
        {unlocked ? <Tag size={15} weight="fill" /> : <Lock size={13} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn('text-xs font-semibold', unlocked ? 'text-ember' : 'text-ink-soft')}>
          {deal.label}
        </div>
        {deal.requiresStamps != null && !unlocked && (
          <div className="tnum text-[10px] text-ink-faint">
            {deal.requiresStamps} stamps needed · {store.visitedIds.length} collected
          </div>
        )}
      </div>
      {redeemed ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ember">
          <Check size={13} weight="bold" /> Used
        </span>
      ) : redeemable ? (
        <Button size="sm" onClick={() => store.redeem(deal.id, r.id)}>Redeem</Button>
      ) : (
        <span className="text-[11px] text-ink-faint">{unlocked ? 'Check in' : 'Locked'}</span>
      )}
    </div>
  )
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <div className="rounded-ctl border border-line bg-surface p-3">
      <div className="flex items-center gap-2">
        <Avatar seed={review.avatarSeed} name={review.author} size={28} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-semibold text-ink">{review.author}</span>
            {review.verified && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-green-tint px-1.5 py-0.5 text-[9px] font-semibold text-[#346538]">
                <SealCheck size={10} weight="fill" /> Verified
              </span>
            )}
          </div>
          <span className="text-[10px] text-ink-faint">{review.date}</span>
        </div>
        <StarRating value={review.rating} />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{review.text}</p>
      {review.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {review.tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      )}
    </div>
  )
}

function BiteRow({ bite }: { bite: Bite }) {
  return (
    <div className="flex gap-2.5 rounded-ctl border border-line bg-surface p-2.5">
      <Avatar seed={bite.avatarSeed} name={bite.author} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold text-ink">{bite.dish}</span>
          <span className="tnum shrink-0 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">
            {bite.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink-soft">{bite.caption}</p>
        <span className="text-[10px] text-ink-faint">by {bite.author}</span>
      </div>
    </div>
  )
}

function Dot() {
  return <span className="text-ink-faint">·</span>
}

/* ---- Check-in ---- */

function CheckInSheet({
  open,
  restaurant: r,
  onClose,
  onSuccess,
}: {
  open: boolean
  restaurant: Restaurant
  onClose: () => void
  onSuccess: (slowHour: boolean) => void
}) {
  const checkIn = useStore((s) => s.checkIn)
  const [human, setHuman] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const submit = async () => {
    if (!human) return setError('Confirm you are dining here.')
    if (code.trim().length === 0) return setError('Enter the restaurant code.')
    try {
      const { slowHour } = await checkIn(r.id, code.trim())
      setHuman(false)
      setCode('')
      setError('')
      onSuccess(slowHour)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-in failed')
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Check in"
      footer={
        <Button full size="lg" onClick={submit} disabled={!human || code.length === 0}>
          Verify and collect stamp
        </Button>
      }
    >
      <p className="text-xs leading-relaxed text-ink-soft">
        Confirm you are here, then enter the code shown at {r.name}.
      </p>
      <button
        onClick={() => { setHuman((v) => !v); setError('') }}
        className={cn(
          'mt-3 flex w-full items-center gap-3 rounded-ctl border px-4 py-3 text-left transition active:scale-[0.99]',
          human ? 'border-ember-ring bg-ember-tint' : 'border-line bg-surface',
        )}
      >
        <span
          className={cn(
            'inline-flex h-5 w-5 items-center justify-center rounded-[4px] border',
            human ? 'border-ember bg-ember text-white' : 'border-line bg-surface',
          )}
        >
          {human && <Check size={13} weight="bold" />}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-ink">
          <ShieldCheck size={15} className={human ? 'text-ember' : 'text-ink-faint'} />
          I am dining here right now
        </span>
      </button>
      <div className="mt-3">
        <label className="mb-1 text-xs font-medium text-ink">Restaurant code</label>
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value); setError('') }}
          placeholder="e.g. TACO910"
          autoCapitalize="characters"
          className="tnum h-11 w-full rounded-ctl border border-line bg-surface px-3 text-sm uppercase tracking-wider text-ink placeholder:text-ink-faint placeholder:normal-case focus:border-ember focus:outline-none"
        />
        <p className="mt-1.5 rounded-ctl bg-surface-2 px-3 py-1.5 text-[11px] text-ink-soft">
          Demo hint: the code is <span className="tnum font-semibold text-ink">{r.checkInCode}</span>
        </p>
        {error && <p className="mt-1.5 text-xs font-medium text-ink-soft">{error}</p>}
      </div>
    </BottomSheet>
  )
}

function CheckInSuccess({
  restaurant: r,
  slowHour,
  onDone,
  onReview,
}: {
  restaurant: Restaurant
  slowHour: boolean
  onDone: () => void
  onReview: () => void
}) {
  return (
    <div className="p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ember-tint text-ember">
        <SealCheck size={30} weight="fill" />
      </div>
      <h3 className="mt-3 text-base font-semibold tracking-tight text-ink">Stamp collected</h3>
      <p className="mt-1 text-xs text-ink-soft">You checked in at {r.name}.</p>
      <div className="mt-3 space-y-1 rounded-ctl bg-surface-2 px-3 py-2.5 text-left text-xs">
        <Line text="Stamp added to passport" xp={25} />
        {slowHour && <Line text="Slow-hour supporter bonus" xp={50} />}
        <Line text="Verified review unlocked" />
        <Line text="Coupons unlocked" />
      </div>
      <div className="mt-4 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={onDone}>Done</Button>
        <Button className="flex-1" onClick={onReview}>Leave a review</Button>
      </div>
    </div>
  )
}

function Line({ text, xp }: { text: string; xp?: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1 text-ink-soft">
        <Check size={12} weight="bold" className="text-ember" /> {text}
      </span>
      {xp != null && <span className="tnum font-semibold text-ink">+{xp} XP</span>}
    </div>
  )
}

/* ---- Review composer ---- */

function ReviewSheet({ open, restaurant: r, onClose }: { open: boolean; restaurant: Restaurant; onClose: () => void }) {
  const addReview = useStore((s) => s.addReview)
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [tags, setTags] = useState<Set<string>>(new Set())

  const suggested = Array.from(new Set([...r.tags, 'great service', 'worth the hype', 'quick lunch']))

  const submit = () => {
    addReview(r.id, { rating, text: text.trim() || 'Solid spot. Would come back.', tags: Array.from(tags) })
    setText('')
    setTags(new Set())
    setRating(5)
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`Review ${r.name}`}
      footer={
        <Button full size="lg" onClick={submit}>
          Post verified review
        </Button>
      }
    >
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className="active:scale-90">
            <Star size={26} weight={n <= rating ? 'fill' : 'regular'} className={n <= rating ? 'text-amber' : 'text-ink-faint'} />
          </button>
        ))}
        <span className="tnum ml-2 text-xs font-semibold text-ink">{rating.toFixed(1)}</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What stood out? Keep it honest."
        rows={3}
        className="mt-3 w-full resize-none rounded-ctl border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-faint focus:border-ember focus:outline-none"
      />
      <div className="mt-3">
        <div className="mb-1.5 text-xs font-medium text-ink">Tags</div>
        <div className="flex flex-wrap gap-1.5">
          {suggested.map((t) => {
            const on = tags.has(t)
            return (
              <Chip
                key={t}
                selected={on}
                onClick={() =>
                  setTags((prev) => {
                    const next = new Set(prev)
                    next.has(t) ? next.delete(t) : next.add(t)
                    return next
                  })
                }
              >
                {t}
              </Chip>
            )
          })}
        </div>
      </div>
    </BottomSheet>
  )
}
