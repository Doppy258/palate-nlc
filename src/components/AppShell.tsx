import { createContext, useContext, useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'

// Overlay portal target lives at the content-surface root so sheets and toasts
// are clipped to the device on mobile and to the content column on desktop,
// never flung to the viewport corners.
const OverlayContext = createContext<HTMLElement | null>(null)
export const useOverlayRoot = () => useContext(OverlayContext)

/**
 * Responsive application shell.
 *
 * Below lg the app is a centered phone (the original mobile experience, with
 * the bottom tab bar living inside `children`). At lg+ the phone frame
 * dissolves: a persistent Sidebar takes over navigation and the content
 * surface expands into a real desktop column. One render of `children` serves
 * both — only the surrounding chrome changes via Tailwind breakpoints.
 *
 * `chrome` mirrors the app's "show navigation" rule: it gates the desktop
 * Sidebar so full-bleed routes (onboarding, business view) stay focused.
 */
export function AppShell({ children, chrome }: { children: ReactNode; chrome: boolean }) {
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

      <div className="relative mx-auto flex h-full w-full lg:max-w-[1440px]">
        {chrome && <Sidebar className="hidden lg:flex" />}

        {/* Content surface: phone device on mobile, plain wide column on desktop. */}
        <div className="relative mx-auto flex h-full w-full max-w-[440px] md:items-center md:py-6 lg:m-0 lg:max-w-none lg:flex-1 lg:items-stretch lg:py-0">
          <div className="device relative mx-auto flex h-full w-full flex-col overflow-hidden bg-canvas md:h-[calc(100dvh-3rem)] md:max-h-[920px] md:rounded-[36px] md:border md:border-line md:shadow-pop lg:h-full lg:max-h-none lg:rounded-none lg:border-0 lg:shadow-none">
            <OverlayContext.Provider value={node}>
              <div className="relative z-0 flex min-h-0 flex-1 flex-col">{children}</div>
              <div ref={setNode} className="pointer-events-none absolute inset-0 z-40" />
            </OverlayContext.Provider>
          </div>
        </div>
      </div>
    </div>
  )
}
