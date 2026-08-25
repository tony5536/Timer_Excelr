import type { CountdownValues } from '../types'

/** Zero-pad a number to two digits (e.g. 0 → "00", 9 → "09"). */
export function padTwo(value: number): string {
  return value.toString().padStart(2, '0')
}

/**
 * Derive remaining time from target timestamp minus current time.
 * Recalculated on every tick to avoid drift (including inactive tabs).
 * Uses the user's local browser timezone.
 */
export function calculateRemaining(
  targetTimestamp: number,
  now: number = Date.now(),
): CountdownValues {
  const remainingMs = Math.max(0, targetTimestamp - now)
  const totalSeconds = Math.floor(remainingMs / 1000)

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

export function formatCountdownDisplay(values: CountdownValues): string {
  const totalSeconds =
    values.days * 86400 +
    values.hours * 3600 +
    values.minutes * 60 +
    values.seconds

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${padTwo(hours)} : ${padTwo(minutes)} : ${padTwo(seconds)}`
}

export function formatStopwatchDisplay(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${padTwo(hours)} : ${padTwo(minutes)} : ${padTwo(seconds)}`
}

export function formatStopwatchClock(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${padTwo(hours)} : ${padTwo(minutes)} : ${padTwo(seconds)}`
}

export function isCountdownZero(values: CountdownValues): boolean {
  return (
    values.days === 0 &&
    values.hours === 0 &&
    values.minutes === 0 &&
    values.seconds === 0
  )
}

/**
 * Combine HTML date (YYYY-MM-DD) and time (HH:mm) into a local timestamp.
 * No timezone conversion — uses the browser's local timezone.
 */
export function combineDateAndTime(
  dateStr: string,
  timeStr: string,
): number | null {
  if (!dateStr || !timeStr) return null

  const dateParts = dateStr.split('-').map(Number)
  const timeParts = timeStr.split(':').map(Number)

  if (dateParts.length !== 3 || timeParts.length < 2) return null

  const [year, month, day] = dateParts
  const [hours, minutes] = timeParts

  if ([year, month, day, hours, minutes].some((n) => Number.isNaN(n))) {
    return null
  }

  const target = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (Number.isNaN(target.getTime())) return null

  return target.getTime()
}

export function formatCountdownAriaLabel(values: CountdownValues): string {
  const parts: string[] = []

  if (values.days > 0) {
    parts.push(`${values.days} ${values.days === 1 ? 'day' : 'days'}`)
  }
  if (values.hours > 0 || values.days > 0) {
    parts.push(`${values.hours} ${values.hours === 1 ? 'hour' : 'hours'}`)
  }
  if (values.minutes > 0 || values.hours > 0 || values.days > 0) {
    parts.push(
      `${values.minutes} ${values.minutes === 1 ? 'minute' : 'minutes'}`,
    )
  }
  parts.push(`${values.seconds} ${values.seconds === 1 ? 'second' : 'seconds'}`)

  return parts.join(', ')
}
