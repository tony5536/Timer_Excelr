import type { SessionConfig, TimerSnapshot } from '../types'

const STORAGE_KEY = 'excelr-session-config'
const TIMER_STORAGE_KEY = 'excelr-session-timer'

export const DEFAULT_SESSION_TITLE = 'ExcelR Training Session'
export const DEFAULT_DATE = '2026-08-25'
export const DEFAULT_START_TIME = '15:00'

export const DEFAULT_CONFIG: SessionConfig = {
  sessionTitle: DEFAULT_SESSION_TITLE,
  date: DEFAULT_DATE,
  startTime: DEFAULT_START_TIME,
}

export const DEFAULT_TIMER_SNAPSHOT: TimerSnapshot = {
  phase: 'upcoming',
  targetTimestamp: null,
  sessionStartTimestamp: null,
  pauseTimestamp: null,
  totalPausedDuration: 0,
  completedDurationMs: 0,
}

export function loadSessionConfig(): SessionConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...DEFAULT_CONFIG }

    const parsed = JSON.parse(stored) as Partial<SessionConfig>
    return {
      sessionTitle:
        typeof parsed.sessionTitle === 'string' && parsed.sessionTitle.trim()
          ? parsed.sessionTitle
          : DEFAULT_SESSION_TITLE,
      date:
        typeof parsed.date === 'string' && parsed.date
          ? parsed.date
          : DEFAULT_DATE,
      startTime:
        typeof parsed.startTime === 'string' && parsed.startTime
          ? parsed.startTime
          : DEFAULT_START_TIME,
    }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveSessionConfig(config: SessionConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // localStorage may be unavailable or full — fail silently
  }
}

export function loadTimerSnapshot(): TimerSnapshot {
  try {
    const stored = localStorage.getItem(TIMER_STORAGE_KEY)
    if (!stored) {
      return { ...DEFAULT_TIMER_SNAPSHOT }
    }

    const parsed = JSON.parse(stored) as Partial<TimerSnapshot>
    return {
      phase:
        parsed.phase === 'live' ||
        parsed.phase === 'paused' ||
        parsed.phase === 'completed'
          ? parsed.phase
          : 'upcoming',
      targetTimestamp:
        typeof parsed.targetTimestamp === 'number' ? parsed.targetTimestamp : null,
      sessionStartTimestamp:
        typeof parsed.sessionStartTimestamp === 'number'
          ? parsed.sessionStartTimestamp
          : null,
      pauseTimestamp:
        typeof parsed.pauseTimestamp === 'number' ? parsed.pauseTimestamp : null,
      totalPausedDuration:
        typeof parsed.totalPausedDuration === 'number'
          ? parsed.totalPausedDuration
          : 0,
      completedDurationMs:
        typeof parsed.completedDurationMs === 'number'
          ? parsed.completedDurationMs
          : 0,
    }
  } catch {
    return { ...DEFAULT_TIMER_SNAPSHOT }
  }
}

export function saveTimerSnapshot(snapshot: TimerSnapshot): void {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // localStorage may be unavailable or full — fail silently
  }
}
