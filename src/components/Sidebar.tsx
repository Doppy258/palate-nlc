import { NavLink } from 'react-router-dom'
import {
  Camera,
  Compass,
  ForkKnife,
  Lightning,
  Ranking,
  Storefront,
  Ticket,
  User,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useStore } from '../store/useStore'
import { useLevels } from '../providers/PalateProvider'
import { levelFromXp } from '../lib/xp'
import { cn } from '../lib/cn'
import { Avatar, ProgressBar } from './ui'

const NAV: { to: string; label: string; Icon: Icon }[] = [
  { to: '/discover', label: 'Discover', Icon: Compass },
  { to: '/bites', label: 'Bites', Icon: Camera },
  { to: '/rank', label: 'Rank', Icon: Ranking },
  { to: '/passport', label: 'Passport', Icon: Ticket },
  { to: '/profile', label: 'Profile', Icon: User },
]

// Desktop-only primary navigation. Replaces the bottom tab bar at lg+. Renders
// the brand, the route list, and a live identity card wired to the same store.
export function Sidebar({ className }: { className?: string }) {
  const { name, avatarSeed, xp } = useStore()
  const levels = useLevels()
  const level = levelFromXp(xp, levels)

  return (
    <aside
      className={cn(
        'h-full w-64 shrink-0 flex-col border-r border-line bg-canvas/80 px-3 py-5 backdrop-blur-sm',
        className,
      )}
    >
      <NavLink to="/discover" className="flex items-center gap-2.5 px-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] bg-ember text-white">
          <ForkKnife size={19} weight="fill" />
        </span>
        <span className="text-lg font-semibold tracking-tight text-ink">Palate</span>
      </NavLink>

      <nav className="mt-7 flex flex-col gap-1">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-ctl px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-ember-tint text-ember' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <NavLink
          to="/profile"
          className="rounded-card border border-line bg-surface p-3 transition hover:bg-surface-2"
        >
          <div className="flex items-center gap-2.5">
            <Avatar seed={avatarSeed} name={name} size={38} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-semibold text-ink">{name}</div>
              <div className="truncate text-[12px] text-ink-soft">{level.def.name}</div>
            </div>
            <span className="tnum inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">
              <Lightning size={11} weight="fill" />
              {xp.toLocaleString()}
            </span>
          </div>
          <div className="mt-2.5">
            <ProgressBar value={level.progress * 100} />
          </div>
        </NavLink>

        <NavLink
          to="/owner"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-ctl px-3 py-2 text-[13px] font-medium transition',
              isActive ? 'bg-ember-tint text-ember' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
            )
          }
        >
          <Storefront size={17} />
          Business view
        </NavLink>
      </div>
    </aside>
  )
}
