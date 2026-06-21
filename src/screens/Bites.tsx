import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeft, Heart, MapPin, Plus, Tag } from '@phosphor-icons/react'
import type { Bite, Restaurant } from '../data/types'
import { RESTAURANTS, SEED_BITES } from '../data/seed'
import { useStore } from '../store/useStore'
import { primaryDeal, dealUnlocked } from '../lib/deals'
import { photo } from '../lib/photos'
import { cn } from '../lib/cn'
import { AppBar, Screen } from '../components/layout'
import { BottomSheet } from '../components/Sheet'
import { Avatar, Button, Chip, IconButton } from '../components/ui'
import { Reveal } from '../components/Reveal'

export default function Bites() {
  const navigate = useNavigate()
  const store = useStore()
  const [compose, setCompose] = useState(false)

  const feed = useMemo(
    () => [...store.bites, ...SEED_BITES].sort((a, b) => b.createdAt - a.createdAt),
    [store.bites],
  )

  return (
    <Screen
      appBar={
        <AppBar
          title="Bites"
          subtitle="Food stories from your circle"
          left={
            <IconButton onClick={() => navigate('/discover')} aria-label="Back">
              <CaretLeft size={20} />
            </IconButton>
          }
          right={
            <Button size="sm" icon={<Plus size={16} weight="bold" />} onClick={() => setCompose(true)}>
              Post
            </Button>
          }
        />
      }
    >
      <div className="space-y-4 px-4 pb-8 pt-4 lg:mx-auto lg:max-w-xl lg:pt-6">
        {feed.map((b, i) => (
          <Reveal key={b.id} delay={Math.min(i, 5) * 0.05}>
            <BiteCard bite={b} />
          </Reveal>
        ))}
      </div>
      <ComposeSheet open={compose} onClose={() => setCompose(false)} />
    </Screen>
  )
}

function BiteCard({ bite }: { bite: Bite }) {
  const navigate = useNavigate()
  const store = useStore()
  const r = RESTAURANTS.find((x) => x.id === bite.restaurantId)
  if (!r) return null
  const saved = store.savedIds.includes(r.id)
  const deal = primaryDeal(r, store)
  const dealOpen = deal ? dealUnlocked(deal, store) : false

  return (
    <article className="overflow-hidden rounded-card border border-line bg-surface shadow-soft">
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <Avatar seed={bite.avatarSeed} name={bite.author} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold text-ink">{bite.author}</div>
          <button onClick={() => navigate(`/r/${r.id}`)} className="flex items-center gap-1 text-[12px] text-ink-soft">
            <MapPin size={12} /> {r.name}
          </button>
        </div>
        <span className="tnum inline-flex items-center rounded-full bg-ink px-2.5 py-1 text-[12px] font-semibold text-white">
          {bite.rating.toFixed(1)}
        </span>
      </div>

      <button onClick={() => navigate(`/r/${r.id}`)} className="block w-full">
        <img src={photo(bite.photoSeed, 860, 760)} alt={bite.dish} className="h-64 w-full bg-surface-2 object-cover" />
      </button>

      <div className="p-3.5">
        <div className="text-[15px] font-semibold tracking-tight text-ink">{bite.dish}</div>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{bite.caption}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {bite.tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
          <button
            onClick={() => store.toggleSave(r.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition active:scale-95',
              saved ? 'border-ember-ring bg-ember-tint text-ember' : 'border-line text-ink-soft hover:bg-surface-2',
            )}
          >
            <Heart size={15} weight={saved ? 'fill' : 'regular'} /> {saved ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={() => navigate(`/r/${r.id}`)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12.5px] font-medium text-ink-soft transition hover:bg-surface-2 active:scale-95"
          >
            Visit
          </button>
          {deal && dealOpen && (
            <button
              onClick={() => navigate(`/r/${r.id}`)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-ember-tint px-3 py-1.5 text-[12.5px] font-semibold text-ember active:scale-95"
            >
              <Tag size={14} weight="fill" /> Deal
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function ComposeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const postBite = useStore((s) => s.postBite)
  const visitedFirst = useStore((s) => s.visitedIds)
  const [rid, setRid] = useState<string>('')
  const [dish, setDish] = useState('')
  const [caption, setCaption] = useState('')
  const [rating, setRating] = useState(8.5)
  const [tags, setTags] = useState<Set<string>>(new Set())

  // Prefer somewhere the user has actually been, but allow any spot.
  const ordered: Restaurant[] = useMemo(() => {
    const visited = RESTAURANTS.filter((r) => visitedFirst.includes(r.id))
    const rest = RESTAURANTS.filter((r) => !visitedFirst.includes(r.id))
    return [...visited, ...rest]
  }, [visitedFirst])

  const selected = RESTAURANTS.find((r) => r.id === rid)
  const suggested = selected ? selected.tags : []

  const submit = () => {
    if (!rid || !dish.trim()) return
    postBite({
      restaurantId: rid,
      dish: dish.trim(),
      caption: caption.trim() || 'Quick bite, big yes.',
      rating,
      tags: Array.from(tags),
      photoSeed: slugify(dish) || selected!.photoSeeds[0],
    })
    setRid('')
    setDish('')
    setCaption('')
    setRating(8.5)
    setTags(new Set())
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Post a Bite"
      footer={
        <Button full size="lg" onClick={submit} disabled={!rid || !dish.trim()}>
          Post Bite · +15 XP
        </Button>
      }
    >
      <div className="text-[13px] font-medium text-ink">Where?</div>
      <div className="-mx-1 mt-2 flex flex-wrap gap-1.5 px-1">
        {ordered.map((r) => (
          <Chip key={r.id} selected={rid === r.id} onClick={() => setRid(r.id)}>
            {r.name}
          </Chip>
        ))}
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[13px] font-medium text-ink">Dish</label>
        <input
          value={dish}
          onChange={(e) => setDish(e.target.value)}
          placeholder="e.g. Spicy Miso Ramen"
          className="h-11 w-full rounded-ctl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-ember focus:outline-none"
        />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[13px] font-medium text-ink">Your score</label>
          <span className="tnum text-sm font-semibold text-ember">{rating.toFixed(1)}/10</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={0.1}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: 'var(--color-ember)' }}
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[13px] font-medium text-ink">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          placeholder="Say something honest about it."
          className="w-full resize-none rounded-ctl border border-line bg-surface px-3.5 py-3 text-sm leading-relaxed text-ink placeholder:text-ink-faint focus:border-ember focus:outline-none"
        />
      </div>

      {suggested.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[13px] font-medium text-ink">Tags</div>
          <div className="flex flex-wrap gap-2">
            {suggested.map((t) => (
              <Chip
                key={t}
                selected={tags.has(t)}
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
            ))}
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
