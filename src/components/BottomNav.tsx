import { NavLink } from 'react-router-dom'
import { Compass, Ranking, Ticket, User } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

const TABS = [
  { to: '/discover', label: 'Discover', Icon: Compass },
  { to: '/rank', label: 'Rank', Icon: Ranking },
  { to: '/passport', label: 'Passport', Icon: Ticket },
  { to: '/profile', label: 'Profile', Icon: User },
] as const

export function BottomNav() {
  return (
    <nav className="z-20 flex items-stretch border-t border-line bg-canvas/90 px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 backdrop-blur-md">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 rounded-ctl py-1 text-[10.5px] font-medium transition',
              isActive ? 'text-ember' : 'text-ink-faint hover:text-ink-soft',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={23} weight={isActive ? 'fill' : 'regular'} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
