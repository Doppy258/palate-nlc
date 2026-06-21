import { useEffect, useState } from 'react'

// Subscribe to a CSS media query. SPA-only (no SSR), so reading matchMedia
// during the initial state is safe. Used to switch sheet/dialog behavior and
// any layout logic that genuinely needs JS rather than a Tailwind variant.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

// The breakpoint where the phone frame gives way to the desktop shell. Mirrors
// Tailwind's `lg` (1024px) so JS and CSS switch at the same width.
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
