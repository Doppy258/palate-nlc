import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Lightning } from '@phosphor-icons/react'
import { useStore, type Toast } from '../store/useStore'
import { useOverlayRoot } from './PhoneFrame'
import { cn } from '../lib/cn'

export function Toaster() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  const root = useOverlayRoot()
  if (!root) return null

  return createPortal(
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDone={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>,
    root,
  )
}

function ToastCard({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, toast.tone === 'level' ? 3200 : 2500)
    return () => clearTimeout(id)
  }, [onDone, toast.tone])

  const tone =
    toast.tone === 'level'
      ? 'border-amber/40 bg-amber-tint'
      : toast.tone === 'tier'
        ? 'border-ember-ring bg-ember-tint'
        : 'border-line bg-surface'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 460, damping: 34 }}
      className={cn(
        'pointer-events-auto flex w-full max-w-[360px] items-center gap-3 rounded-full border px-4 py-2.5 shadow-lift',
        tone,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-ink">{toast.title}</div>
        {toast.detail && <div className="truncate text-[11.5px] text-ink-soft">{toast.detail}</div>}
      </div>
      {toast.xp != null && (
        <span className="tnum inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
          <Lightning size={12} weight="fill" />+{toast.xp}
        </span>
      )}
    </motion.div>
  )
}
