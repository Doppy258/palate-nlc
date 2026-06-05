// Deterministic placeholder imagery. Restaurant + dish + Bite photos come from
// Picsum by descriptive seed; people use a consistent illustrated avatar style
// (with an initials fallback handled in the Avatar component).
export const photo = (seed: string, w = 800, h = 600) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`

export const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=fbeae0,f1efe9,e7eef0&radius=50&scale=92`
