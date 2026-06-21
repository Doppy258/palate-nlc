import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export function Screen({
  appBar,
  children,
  className,
}: {
  appBar?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className="absolute inset-0 flex flex-col">
      {appBar}
      <div className={cn('min-h-0 flex-1 overflow-y-auto no-scrollbar', className)}>{children}</div>
    </div>
  )
}

export function AppBar({
  title,
  subtitle,
  left,
  right,
}: {
  title: ReactNode
  subtitle?: ReactNode
  left?: ReactNode
  right?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-line bg-canvas/85 px-4 py-3 backdrop-blur-md lg:px-8 lg:py-4">
      {left}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[17px] font-semibold leading-tight tracking-tight text-ink lg:text-[19px]">
          {title}
        </h1>
        {subtitle && <p className="truncate text-xs text-ink-soft lg:text-[13px]">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}
