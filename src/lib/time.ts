// All hours are 24h decimals (11 -> 11:00, 22.5 -> 22:30). One small clock
// helper keeps "open now" and "slow hour active" honest against the real time.

export function nowDecimal(d = new Date()): number {
  return d.getHours() + d.getMinutes() / 60
}

export function fmtHour(h: number): string {
  const norm = ((h % 24) + 24) % 24
  const hr = Math.floor(norm)
  const min = Math.round((norm - hr) * 60)
  const ampm = hr >= 12 ? 'PM' : 'AM'
  let display = hr % 12
  if (display === 0) display = 12
  return min ? `${display}:${String(min).padStart(2, '0')} ${ampm}` : `${display} ${ampm}`
}

type Hours = { open: number; close: number }

export function isOpenNow(hours: Hours, t = nowDecimal()): boolean {
  const { open, close } = hours
  if (close > open) return t >= open && t < close
  return t >= open || t < close // wraps past midnight
}

export function opensSoon(hours: Hours, t = nowDecimal()): boolean {
  const delta = hours.open - t
  return !isOpenNow(hours, t) && delta > 0 && delta <= 1
}

export function closesSoon(hours: Hours, t = nowDecimal()): boolean {
  const delta = hours.close - t
  return isOpenNow(hours, t) && delta > 0 && delta <= 1
}

export function openStatus(hours: Hours, t = nowDecimal()): string {
  if (closesSoon(hours, t)) return `Closes ${fmtHour(hours.close)}`
  if (isOpenNow(hours, t)) return 'Open now'
  if (opensSoon(hours, t)) return `Opens ${fmtHour(hours.open)}`
  return `Opens ${fmtHour(hours.open)}`
}

export function isSlowHourActive(
  slow: { start: number; end: number } | undefined,
  t = nowDecimal(),
): boolean {
  if (!slow) return false
  return t >= slow.start && t < slow.end
}
