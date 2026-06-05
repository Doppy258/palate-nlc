import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useState } from 'react'
import { Star } from '@phosphor-icons/react'
import type { Tier } from '../data/types'
import { TIER_STYLE } from '../theme/tokens'
import { avatarUrl } from '../lib/photos'
import { cn } from '../lib/cn'

/* Button: one solid ember CTA, plus quiet secondary and ghost variants.
   Tactile scale on press, no heavy shadows. */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  const sizes = {
    sm: 'h-9 px-3.5 text-[13px] gap-1.5',
    md: 'h-11 px-5 text-sm gap-2',
    lg: 'h-12 px-6 text-[15px] gap-2',
  }
  const variants = {
    primary: 'bg-ember text-white hover:bg-ember-hover shadow-soft',
    secondary: 'bg-surface text-ink border border-line hover:bg-surface-2',
    ghost: 'bg-transparent text-ink-soft hover:bg-surface-2 hover:text-ink',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-ctl font-medium',
        'transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
        sizes[size],
        variants[variant],
        full && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

export function IconButton({
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft',
        'transition hover:bg-surface-2 hover:text-ink active:scale-95',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/* Pill / Chip. Doubles as a selectable filter token. */
export function Chip({
  children,
  tone = 'muted',
  selected,
  onClick,
  className,
}: {
  children: ReactNode
  tone?: 'muted' | 'accent' | 'plain'
  selected?: boolean
  onClick?: () => void
  className?: string
}) {
  const base =
    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium whitespace-nowrap transition'
  const tones = {
    muted: 'bg-surface-2 text-ink-soft',
    accent: 'bg-ember-tint text-ember',
    plain: 'border border-line text-ink-soft',
  }
  const sel = 'bg-ink text-white'
  const Comp = onClick ? 'button' : 'span'
  return (
    <Comp
      onClick={onClick}
      className={cn(base, selected ? sel : tones[tone], onClick && 'active:scale-95', className)}
    >
      {children}
    </Comp>
  )
}

export function TierBadge({
  tier,
  size = 'md',
  className,
}: {
  tier: Tier
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const s = TIER_STYLE[tier]
  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 min-w-[20px]',
    md: 'text-xs px-2 py-0.5 min-w-[26px]',
    lg: 'text-sm px-2.5 py-1 min-w-[34px]',
  }
  const label = tier === 'want-to-try' ? 'WTT' : s.label
  return (
    <span
      className={cn(
        'tnum inline-flex items-center justify-center rounded-md font-semibold tracking-tight',
        sizes[size],
        className,
      )}
      style={{ background: s.bg, color: s.fg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
      title={tier === 'want-to-try' ? 'Want to Try' : `${s.label} tier`}
    >
      {label}
    </span>
  )
}

export function Card({
  children,
  className,
  interactive,
  onClick,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-card border border-line bg-surface shadow-soft',
        interactive && 'cursor-pointer transition hover:shadow-lift active:scale-[0.995]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function ProgressBar({
  value,
  max = 100,
  tone = 'ember',
  className,
}: {
  value: number
  max?: number
  tone?: 'ember' | 'amber'
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-2', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700',
          tone === 'ember' ? 'bg-ember' : 'bg-amber',
        )}
        style={{ width: `${pct}%`, transitionTimingFunction: 'var(--ease-out)' }}
      />
    </div>
  )
}

export function Avatar({
  seed,
  name,
  size = 36,
  className,
}: {
  seed: string
  name?: string
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const initials = (name ?? seed)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  if (failed) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full bg-ember-tint font-semibold text-ember',
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {initials}
      </span>
    )
  }
  return (
    <img
      src={avatarUrl(seed)}
      alt={name ?? ''}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={cn('shrink-0 rounded-full bg-surface-2 object-cover', className)}
      style={{ width: size, height: size }}
    />
  )
}

export function StarRating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <Star size={14} weight="fill" className="text-amber" />
      <span className="tnum text-[13px] font-semibold text-ink">{value.toFixed(1)}</span>
    </span>
  )
}

export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: ReactNode
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('rounded-card border border-line bg-surface p-4', className)}>
      <div className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="tnum mt-1 text-2xl font-semibold text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-soft">{hint}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-2', className)} />
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface-2 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-ink-faint">{icon}</div>}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {body && <p className="mt-1 max-w-[34ch] text-[13px] leading-relaxed text-ink-soft">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SectionHeader({
  title,
  trailing,
  className,
}: {
  title: string
  trailing?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-baseline justify-between', className)}>
      <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
      {trailing}
    </div>
  )
}
