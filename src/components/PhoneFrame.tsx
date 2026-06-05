import { createContext, useContext, useState, type ReactNode } from 'react'

// Overlay portal target lives at the frame root so sheets and toasts are
// clipped to the device on desktop, not flung to the viewport corners.
const OverlayContext = createContext<HTMLElement | null>(null)
export const useOverlayRoot = () => useContext(OverlayContext)

export function PhoneFrame({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  return (
    <div className="fixed inset-0 overflow-hidden bg-canvas">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 55% at 50% -5%, rgba(184,71,42,0.06), transparent 72%)',
        }}
      />
      <div className="relative mx-auto flex h-full max-w-[440px] md:items-center md:py-6">
        <div className="device relative mx-auto flex h-full w-full flex-col overflow-hidden bg-canvas md:h-[calc(100dvh-3rem)] md:max-h-[920px] md:rounded-[36px] md:border md:border-line md:shadow-pop">
          <OverlayContext.Provider value={node}>
            <div className="relative z-0 flex min-h-0 flex-1 flex-col">{children}</div>
            <div ref={setNode} className="pointer-events-none absolute inset-0 z-40" />
          </OverlayContext.Provider>
        </div>
      </div>
    </div>
  )
}
