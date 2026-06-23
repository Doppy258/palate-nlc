import { useNavigate } from 'react-router-dom'
import { CaretRight, Heart, Lock, MapPin, SealCheck, Tag } from '@phosphor-icons/react'
import type { Restaurant, Tier } from '../data/types'
import { usePalate } from '../providers/PalateProvider'
import { useStore } from '../store/useStore'
import { dealUnlocked, primaryDeal } from '../lib/deals'
import { friendsWhoSaved } from '../lib/friends'
import { isSlowHourActive, openStatus } from '../lib/time'
import { PRICE_LABEL } from '../theme/tokens'
import { cn } from '../lib/cn'
import { Avatar, Chip, StarRating, TierBadge } from './ui'
import { LocationMap } from './LocationMap'
import { useUserLocation } from '../hooks/useUserLocation'

export function RestaurantCard({
  restaurant: r,
  communityTier,
}: {
  restaurant: Restaurant
  communityTier: Tier
}) {
  const navigate = useNavigate()
  const { friends } = usePalate()
  const store = useStore()
  const saved = store.savedIds.includes(r.id)
  const visited = store.visitedIds.includes(r.id)
  const deal = primaryDeal(r, store)
  const dealOpen = deal ? dealUnlocked(deal, store) : false
  const savers = friendsWhoSaved(r.id, friends)
  const slowActive = isSlowHourActive(r.slowHour)
  const userLocation = useUserLocation()

  return (
    <article
      onClick={() => navigate(`/r/${r.id}`)}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-card border border-line bg-surface shadow-soft transition hover:shadow-lift active:scale-[0.995]"
    >
      <div className="relative">
        <LocationMap
          lat={r.coordinates.lat}
          lon={r.coordinates.lon}
          userLocation={userLocation}
          zoom={14}
          className="h-40 w-full"
        />
        <div className="absolute left-3 top-3">
          <TierBadge tier={communityTier} className="shadow-soft ring-1 ring-white/60" />
        </div>
        {slowActive && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-semibold text-ember backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ember" />
            </span>
            Slow-hour deal now
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            store.toggleSave(r.id)
          }}
          aria-label={saved ? 'Remove from Want to Try' : 'Save to Want to Try'}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/85 text-ink shadow-soft backdrop-blur-sm transition active:scale-90"
        >
          <Heart size={18} weight={saved ? 'fill' : 'regular'} className={saved ? 'text-ember' : ''} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold leading-tight tracking-tight text-ink">{r.name}</h3>
          <StarRating value={r.rating} />
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-soft">
          <span>{r.cuisine}</span>
          <Dot />
          <span className="tnum">{PRICE_LABEL[r.priceTier]}</span>
          <Dot />
          <MapPin size={13} />
          <span className="tnum">{r.distanceMi.toFixed(1)} mi</span>
          <Dot />
          <span className={cn(openStatus(r.hours) === 'Open now' ? 'text-ink' : '')}>
            {openStatus(r.hours)}
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {r.tags.slice(0, 3).map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>

        {deal && (
          <div
            className={cn(
              'mt-3 flex items-center gap-2 rounded-ctl px-2.5 py-2 text-[12.5px]',
              dealOpen ? 'bg-ember-tint text-ember' : 'bg-surface-2 text-ink-soft',
            )}
          >
            {dealOpen ? <Tag size={15} weight="fill" /> : <Lock size={14} />}
            <span className="min-w-0 flex-1 truncate font-medium">{deal.label}</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 lg:mt-auto">
          {savers.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {savers.slice(0, 3).map((f) => (
                  <Avatar key={f.id} seed={f.avatarSeed} name={f.name} size={20} className="ring-2 ring-surface" />
                ))}
              </div>
              <span className="text-[11.5px] text-ink-soft">
                {savers.length} {savers.length === 1 ? 'friend' : 'friends'} saved
              </span>
            </div>
          ) : (
            <span className="text-[11.5px] text-ink-faint">New to your circle</span>
          )}
          {visited ? (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ember">
              <SealCheck size={14} weight="fill" /> Stamped
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-faint">
              <CaretRight size={13} /> View
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

function Dot() {
  return <span className="text-ink-faint">·</span>
}
