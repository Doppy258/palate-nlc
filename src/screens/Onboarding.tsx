import { useNavigate } from 'react-router-dom'
import { ForkKnife, Ranking, Tag, Ticket } from '@phosphor-icons/react'
import { useStore } from '../store/useStore'
import { photo } from '../lib/photos'
import { Button } from '../components/ui'
import { Reveal } from '../components/Reveal'

const HIGHLIGHTS = [
  { Icon: Ranking, title: 'Rank, do not just rate', body: 'Build tier lists and settle it head to head.' },
  { Icon: Ticket, title: 'Collect visit stamps', body: 'Check in, earn XP, and complete food quests.' },
  { Icon: Tag, title: 'Unlock local deals', body: 'Coupons, student rates, and slow-hour drops.' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const name = useStore((s) => s.name)
  const completeOnboarding = useStore((s) => s.completeOnboarding)

  const start = async () => {
    await completeOnboarding()
    navigate('/discover', { replace: true })
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar px-6 pb-7 pt-7 lg:items-center lg:justify-center lg:px-8">
      <div className="flex w-full flex-1 flex-col lg:max-w-md lg:flex-none lg:rounded-[24px] lg:border lg:border-line lg:bg-surface lg:p-8 lg:shadow-pop">
      <Reveal>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] bg-ember text-white">
            <ForkKnife size={19} weight="fill" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink">Palate</span>
        </div>
      </Reveal>

      <Reveal delay={0.05} className="mt-5">
        <div className="relative overflow-hidden rounded-[20px]">
          <img
            src={photo('palate-onboarding-table-spread', 760, 620)}
            alt="A shared table of local dishes"
            className="h-44 w-full bg-surface-2 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/35 to-transparent" />
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-5">
        <h1 className="text-[26px] font-semibold leading-[1.12] tracking-tight text-ink">
          Find your next favorite spot.
        </h1>
        <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed text-ink-soft">
          Discover local restaurants, rank them into tiers, collect stamps, and unlock deals. Dining,
          made a little more like a game.
        </p>
      </Reveal>

      <div className="mt-5 space-y-3">
        {HIGHLIGHTS.map(({ Icon, title, body }, i) => (
          <Reveal key={title} delay={0.15 + i * 0.06}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-ctl bg-ember-tint text-ember">
                <Icon size={18} weight="fill" />
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">{title}</div>
                <div className="text-[13px] leading-snug text-ink-soft">{body}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

        <div className="mt-auto pt-6 lg:mt-8 lg:pt-0">
          <Button full size="lg" onClick={start}>
            Continue{name ? ` as ${name}` : ''}
          </Button>
          <p className="mt-3 text-center text-[11.5px] text-ink-faint">
            Start exploring local restaurants
          </p>
        </div>
      </div>
    </div>
  )
}
