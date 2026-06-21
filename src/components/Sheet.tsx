import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from '@phosphor-icons/react'
import { useIsDesktop } from '../lib/useMediaQuery'
import { cn } from '../lib/cn'
import { useOverlayRoot } from './AppShell'
import { IconButton } from './ui'

/* A bottom sheet scoped to the phone frame. Spring slide-up, dimmed scrim,
   scrollable body, optional sticky footer for the primary action. */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  const root = useOverlayRoot()
  const reduce = useReducedMotion()
  const desktop = useIsDesktop()
  if (!root) return null

  // Mobile: spring up from the bottom edge. Desktop: a centered dialog that
  // settles with a small scale, scoped to the content column via the portal.
  const panelInitial = reduce ? false : desktop ? { opacity: 0, scale: 0.96, y: 8 } : { y: '100%' }
  const panelAnimate = desktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }
  const panelExit = reduce ? { opacity: 0 } : desktop ? { opacity: 0, scale: 0.97 } : { y: '100%' }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            'pointer-events-auto absolute inset-0 z-50 flex flex-col',
            desktop ? 'items-center justify-center p-6' : 'justify-end',
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            className={cn(
              'relative flex flex-col overflow-hidden border-line bg-surface shadow-pop',
              desktop
                ? 'max-h-[85vh] w-full max-w-lg rounded-[20px] border'
                : 'max-h-[88%] rounded-t-[24px] border-t',
            )}
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={{ type: 'spring', stiffness: desktop ? 420 : 380, damping: desktop ? 34 : 38 }}
          >
            <div className="relative px-5 pb-3 pt-5">
              {!desktop && (
                <span className="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-line" />
              )}
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
                <IconButton onClick={onClose} aria-label="Close">
                  <X size={18} />
                </IconButton>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-5 pb-4">{children}</div>
            {footer && (
              <div className="border-t border-line bg-surface px-5 py-3 pb-[max(env(safe-area-inset-bottom),14px)]">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  )
}

/* Centered dialog for moments that deserve focus (check-in success, level up). */
export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  const root = useOverlayRoot()
  const reduce = useReducedMotion()
  if (!root) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-[340px] overflow-hidden rounded-[20px] border border-line bg-surface shadow-pop"
            initial={reduce ? false : { scale: 0.94, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  )
}
