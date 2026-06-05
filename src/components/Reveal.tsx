import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

// Quiet entrance: fade + small rise as content enters the viewport. Honors
// reduced motion. Used for lists and section blocks, never for everything.
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
