import { useMemo, useState } from 'react'
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
  ShieldCheck,
  Star,
  Tag,
} from '@phosphor-icons/react'
import type { Bite, Restaurant, Review, Tier } from '../data/types'
import { RESTAURANTS, SEED_BITES } from '../data/seed'
import { useStore } from '../store/useStore'
import { dealRedeemable, dealUnlocked, restaurantDeals } from '../lib/deals'
import { communityScores } from '../lib/ranking'
import { fmtHour, isSlowHourActive, openStatus } from '../lib/time'
import { photo } from '../lib/photos'
import { PRICE_LABEL, scoreToTier } from '../theme/tokens'
import { cn } from '../lib/cn'
import { AppBar, Screen } from '../components/layout'
import { BottomSheet, Modal } from '../components/Sheet'
import { Avatar, Button, Chip, IconButton, StarRating, TierBadge } from '../components/ui'
import { Reveal } from '../components/Reveal'

export default function RestaurantDetail() {
  const { id } = useParams()
  const store = useStore()
  const r = RESTAURANTS.find((x) => x.id === id)

  const [checkInOpen, setCheckInOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [success, setSuccess] = useState<null | { slowHour: boolean }>(null)

  const community = useMemo(() => communityScores(RESTAURANTS, store), [store])

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
  const deals = restaurantDeals(r, store)
  const bites = [...store.bites, ...SEED_BITES].filter((b) => b.restaurantId === r.id)
  const reviews: Review[] = [
    ...store.reviews.filter((rv) => rv.restaurantId === r.id),
    ...r.reviews,
  ]

  return (
    <Screen
      appBar={
        <AppBar
          title={r.name}
          subtitle={`${r.cuisine} · ${r.neighborhood}`}
          left={<BackButton />}
          right={
            <IconButton
              onClick={() => store.toggleSave(r.id)}
              aria-label={saved ? 'Saved' : 'Save'}
              className={saved ? 'text-ember' : ''}
            >
              <Heart size={20} weight={saved ? 'fill' : 'regular'} />
            </IconButton>
          }
        />
      }
    >
      <div className="lg:mx-auto lg:max-w-6xl lg:px-8 lg:pb-10">
        {/* Hero */}
        <div className="relative lg:mt-6 lg:overflow-hidden lg:rounded-card">
          <img
            src={photo(r.photoSeeds[0], 1280, 720)}
            alt={r.name}
            className="h-52 w-full bg-surface-2 object-cover lg:h-80"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2 lg:bottom-4 lg:left-5">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 text-[11px] font-semibold text-ink-soft backdrop-blur-sm">
              Community
            </span>
            <TierBadge tier={communityTier} className="ring-1 ring-white/60" />
            {isSlowHourActive(r.slowHour) && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-semibold text-ember backdrop-blur-sm">
                <PulseDot /> Slow-hour now
              </span>
            )}
          </div>
        </div>

        {/* Body: single column on mobile, content + sticky action rail on desktop */}
        <div className="px-4 pb-8 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:px-0 lg:pb-0 lg:pt-6">
          <div className="lg:min-w-0">
            {/* Title block */}
            <div className="mt-4 flex items-start justify-between gap-3 lg:mt-0">
              <div>
                <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-ink lg:text-[26px]">
                  {r.name}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-ink-soft">
                  <span>{r.cuisine}</span>
                  <Dot />
                  <span className="tnum">{PRICE_LABEL[r.priceTier]}</span>
                  <Dot />
                  <MapPin size={13} />
                  <span className="tnum">{r.distanceMi.toFixed(1)} mi</span>
                </div>
              </div>
              <StarRating value={r.rating} />
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-[13px]">
              <Clock size={14} className="text-ink-faint" />
              <span className={cn('font-medium', openStatus(r.hours) === 'Open now' ? 'text-ember' : 'text-ink-soft')}>
                {openStatus(r.hours)}
              </span>
              <span className="text-ink-faint">
                · {fmtHour(r.hours.open)} to {fmtHour(r.hours.close)}
              </span>
              <span className="text-ink-faint">· {r.reviewCount} reviews</span>
            </div>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {r.tags.map((t) => (
                <Chip key={t} tone="muted">
                  {t}
                </Chip>
              ))}
            </div>

            {/* Tier + actions live here on mobile, in the sticky rail on desktop */}
            <div className="mt-5 lg:hidden">
              <ActionPanel
                r={r}
                communityTier={communityTier}
                myTier={myTier}
                visited={visited}
                saved={saved}
                onCheckIn={() => setCheckInOpen(true)}
                onReview={() => setReviewOpen(true)}
              />
            </div>

            {/* Deals */}
            {deals.length > 0 && (
              <section className="mt-7">
                <h2 className="mb-3 text-base font-semibold tracking-tight text-ink">Deals and coupons</h2>
                <div className="space-y-2.5">
                  {deals.map((d) => (
                    <DealRow key={d.id} restaurant={r} deal={d} />
                  ))}
                </div>
                {!visited && (
                  <p className="mt-2 text-[12px] text-ink-faint">Check in to unlock and redeem coupons.</p>
                )}
              </section>
            )}

            {/* Popular dishes */}
            <section className="mt-7">
              <h2 className="mb-3 text-base font-semibold tracking-tight text-ink">Popular dishes</h2>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 no-scrollbar lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible lg:px-0">
                {[...r.dishes]
                  .sort((a, b) => b.popularity - a.popularity)
                  .map((d) => (
                    <div key={d.name} className="w-32 shrink-0 lg:w-auto">
                      <img
                        src={photo(d.photoSeed, 280, 280)}
                        alt={d.name}
                        className="h-28 w-32 rounded-card bg-surface-2 object-cover lg:h-32 lg:w-full"
                      />
                      <div className="mt-1.5 text-[12.5px] font-medium leading-tight text-ink">{d.name}</div>
                    </div>
                  ))}
              </div>
            </section>

            {/* Bites */}
            {bites.length > 0 && (
              <section className="mt-7">
                <h2 className="mb-3 text-base font-semibold tracking-tight text-ink">Bites from here</h2>
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                  {bites.map((b) => (
                    <BiteRow key={b.id} bite={b} />
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight text-ink">Reviews</h2>
                {visited && (
                  <button onClick={() => setReviewOpen(true)} className="text-[13px] font-semibold text-ember">
                    Leave a review
                  </button>
                )}
              </div>
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((rv) => (
                    <ReviewItem key={rv.id} review={rv} />
                  ))}
                </div>
              ) : (
                <p className="rounded-card border border-dashed border-line bg-surface-2 px-4 py-6 text-center text-[13px] text-ink-soft">
                  No reviews yet. Check in and be the first.
                </p>
              )}
            </section>
          </div>

          {/* Sticky action rail (desktop only) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[88px]">
              <ActionPanel
                r={r}
                communityTier={communityTier}
                myTier={myTier}
                visited={visited}
                saved={saved}
                onCheckIn={() => setCheckInOpen(true)}
                onReview={() => setReviewOpen(true)}
              />
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

function ActionPanel({
  r,
  communityTier,
  myTier,
  visited,
  saved,
  onCheckIn,
  onReview,
}: {
  r: Restaurant
  communityTier: Tier
  myTier: Tier | null
  visited: boolean
  saved: boolean
  onCheckIn: () => void
  onReview: () => void
}) {
  const store = useStore()
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <TierTile label="Community tier" tier={communityTier} />
        {myTier ? (
          <TierTile label="Your tier" tier={myTier} />
        ) : (
          <button
            onClick={() => store.addToTier(r.id)}
            className="flex flex-col items-start justify-center rounded-card border border-dashed border-line bg-surface-2 px-4 py-3 text-left transition hover:bg-surface active:scale-[0.99]"
          >
            <span className="text-[11px] uppercase tracking-wide text-ink-faint">Your tier</span>
            <span className="mt-0.5 text-sm font-semibold text-ember">Add to tier list</span>
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {!visited ? (
          <Button full size="lg" icon={<ShieldCheck size={18} weight="fill" />} onClick={onCheckIn}>
            Check in with code
          </Button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-ctl bg-ember-tint text-sm font-semibold text-ember">
              <SealCheck size={17} weight="fill" /> Stamp collected
            </div>
            <Button className="flex-1" variant="secondary" size="lg" onClick={onReview}>
              Leave a review
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            className="flex-1"
            icon={<Heart size={17} weight={saved ? 'fill' : 'regular'} className={saved ? 'text-ember' : ''} />}
            onClick={() => store.toggleSave(r.id)}
          >
            {saved ? 'Saved' : 'Save'}
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            icon={<ArrowsLeftRight size={17} />}
            onClick={() => navigate('/rank')}
          >
            Compare
          </Button>
        </div>
      </div>
    </div>
  )
}

function TierTile({ label, tier }: { label: string; tier: ReturnType<typeof scoreToTier> }) {
  return (
    <div className="flex items-center justify-between rounded-card border border-line bg-surface px-4 py-3">
      <span className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</span>
      <TierBadge tier={tier} size="lg" />
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
        'flex items-center gap-3 rounded-card border px-3.5 py-3',
        unlocked ? 'border-ember-ring bg-ember-tint' : 'border-line bg-surface-2',
      )}
    >
      <span className={cn('shrink-0', unlocked ? 'text-ember' : 'text-ink-faint')}>
        {unlocked ? <Tag size={18} weight="fill" /> : <Lock size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn('text-[13.5px] font-semibold', unlocked ? 'text-ember' : 'text-ink-soft')}>
          {deal.label}
        </div>
        {deal.requiresStamps != null && !unlocked && (
          <div className="tnum text-[11.5px] text-ink-faint">
            Unlock at {deal.requiresStamps} stamps · you have {store.visitedIds.length}
          </div>
        )}
      </div>
      {redeemed ? (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-ember">
          <Check size={15} weight="bold" /> Redeemed
        </span>
      ) : redeemable ? (
        <Button size="sm" onClick={() => store.redeem(deal.id, r.id)}>
          Redeem
        </Button>
      ) : (
        <span className="text-[11.5px] text-ink-faint">{unlocked ? 'Check in' : 'Locked'}</span>
      )}
    </div>
  )
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <div className="rounded-card border border-line bg-surface p-3.5">
      <div className="flex items-center gap-2.5">
        <Avatar seed={review.avatarSeed} name={review.author} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-semibold text-ink">{review.author}</span>
            {review.verified && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-green-tint px-1.5 py-0.5 text-[10px] font-semibold text-[#346538]">
                <SealCheck size={11} weight="fill" /> Verified
              </span>
            )}
          </div>
          <span className="text-[11.5px] text-ink-faint">{review.date}</span>
        </div>
        <StarRating value={review.rating} />
      </div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{review.text}</p>
      {review.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
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
    <div className="flex gap-3 rounded-card border border-line bg-surface p-3">
      <img src={photo(bite.photoSeed, 200, 200)} alt={bite.dish} className="h-16 w-16 shrink-0 rounded-ctl bg-surface-2 object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13.5px] font-semibold text-ink">{bite.dish}</span>
          <span className="tnum shrink-0 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">
            {bite.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-ink-soft">{bite.caption}</p>
        <span className="text-[11px] text-ink-faint">by {bite.author}</span>
      </div>
    </div>
  )
}

function PulseDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-70" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ember" />
    </span>
  )
}

function Dot() {
  return <span className="text-ink-faint">·</span>
}

/* ---- Check-in: human verification + restaurant code ---- */

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

  const submit = () => {
    if (!human) return setError('Confirm you are dining here.')
    if (code.trim().toUpperCase() !== r.checkInCode) return setError('That code does not match. Check the sign at the counter.')
    const { slowHour } = checkIn(r.id)
    setHuman(false)
    setCode('')
    setError('')
    onSuccess(slowHour)
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
      <p className="text-[13.5px] leading-relaxed text-ink-soft">
        Verified check-ins keep reviews and stamps real. Confirm you are here, then enter the code shown
        at {r.name}.
      </p>

      <button
        onClick={() => {
          setHuman((v) => !v)
          setError('')
        }}
        className={cn(
          'mt-4 flex w-full items-center gap-3 rounded-card border px-4 py-3 text-left transition active:scale-[0.99]',
          human ? 'border-ember-ring bg-ember-tint' : 'border-line bg-surface',
        )}
      >
        <span
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-md border',
            human ? 'border-ember bg-ember text-white' : 'border-line bg-surface',
          )}
        >
          {human && <Check size={15} weight="bold" />}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <ShieldCheck size={17} className={human ? 'text-ember' : 'text-ink-faint'} />
          I am dining here right now
        </span>
      </button>

      <div className="mt-3">
        <label className="mb-1.5 block text-[13px] font-medium text-ink">Restaurant code</label>
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError('')
          }}
          placeholder="e.g. TACO910"
          autoCapitalize="characters"
          className="tnum h-12 w-full rounded-ctl border border-line bg-surface px-3.5 text-base uppercase tracking-wider text-ink placeholder:text-ink-faint placeholder:normal-case focus:border-ember focus:outline-none"
        />
        <p className="mt-2 rounded-ctl bg-surface-2 px-3 py-2 text-[12px] text-ink-soft">
          Demo hint: the code at {r.name} is <span className="tnum font-semibold text-ink">{r.checkInCode}</span>
        </p>
        {error && <p className="mt-2 text-[12.5px] font-medium text-ember">{error}</p>}
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
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ember-tint text-ember">
        <SealCheck size={34} weight="fill" />
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-ink">Stamp collected</h3>
      <p className="mt-1 text-[13.5px] text-ink-soft">You checked in at {r.name}.</p>
      <div className="mt-4 space-y-1.5 rounded-card bg-surface-2 px-4 py-3 text-left text-[13px]">
        <Line text="Stamp added to your passport" xp={25} />
        {slowHour && <Line text="Slow-hour supporter bonus" xp={50} />}
        <Line text="Verified review unlocked" />
        <Line text="Coupons unlocked" />
      </div>
      <div className="mt-5 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={onDone}>
          Done
        </Button>
        <Button className="flex-1" onClick={onReview}>
          Leave a review
        </Button>
      </div>
    </div>
  )
}

function Line({ text, xp }: { text: string; xp?: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-ink-soft">
        <Check size={14} weight="bold" className="text-ember" /> {text}
      </span>
      {xp != null && <span className="tnum font-semibold text-ink">+{xp} XP</span>}
    </div>
  )
}

/* ---- Verified review composer ---- */

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
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className="active:scale-90">
            <Star size={30} weight={n <= rating ? 'fill' : 'regular'} className={n <= rating ? 'text-amber' : 'text-ink-faint'} />
          </button>
        ))}
        <span className="tnum ml-2 text-sm font-semibold text-ink">{rating.toFixed(1)}</span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What stood out? Keep it honest."
        rows={4}
        className="mt-4 w-full resize-none rounded-ctl border border-line bg-surface px-3.5 py-3 text-sm leading-relaxed text-ink placeholder:text-ink-faint focus:border-ember focus:outline-none"
      />

      <div className="mt-3">
        <div className="mb-2 text-[13px] font-medium text-ink">Add tags</div>
        <div className="flex flex-wrap gap-2">
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
