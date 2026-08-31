import type { BackgroundConfig, Session, SessionConfig, TimerSnapshot } from '../types'
import { combineDateAndTime } from './countdown'

// ─── Legacy keys (v1 single-session) ───────────────────────────────────────
const LEGACY_CONFIG_KEY = 'excelr-session-config'
const LEGACY_TIMER_KEY = 'excelr-session-timer'
const LEGACY_BG_KEY = 'excelr-background-config'

// ─── New multi-session key ──────────────────────────────────────────────────
const SESSIONS_KEY = 'excelr-sessions'

// ─── Legacy defaults (kept so migration can reference them) ─────────────────
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

const DEFAULT_BACKGROUND_CONFIG: BackgroundConfig = {
  posterUrl: null,
  opacity: 30,
}

// ─── Legacy load helpers (used only for migration) ──────────────────────────

function legacyLoadSessionConfig(): SessionConfig {
  try {
    const stored = localStorage.getItem(LEGACY_CONFIG_KEY)
    if (!stored) return { ...DEFAULT_CONFIG }
    const parsed = JSON.parse(stored) as Partial<SessionConfig>
    return {
      sessionTitle:
        typeof parsed.sessionTitle === 'string' && parsed.sessionTitle.trim()
          ? parsed.sessionTitle
          : DEFAULT_SESSION_TITLE,
      date: typeof parsed.date === 'string' && parsed.date ? parsed.date : DEFAULT_DATE,
      startTime:
        typeof parsed.startTime === 'string' && parsed.startTime
          ? parsed.startTime
          : DEFAULT_START_TIME,
    }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

function legacyLoadTimerSnapshot(): TimerSnapshot {
  try {
    const stored = localStorage.getItem(LEGACY_TIMER_KEY)
    if (!stored) return { ...DEFAULT_TIMER_SNAPSHOT }
    const parsed = JSON.parse(stored) as Partial<TimerSnapshot>
    return {
      phase:
        parsed.phase === 'live' || parsed.phase === 'paused' || parsed.phase === 'completed'
          ? parsed.phase
          : 'upcoming',
      targetTimestamp:
        typeof parsed.targetTimestamp === 'number' ? parsed.targetTimestamp : null,
      sessionStartTimestamp:
        typeof parsed.sessionStartTimestamp === 'number' ? parsed.sessionStartTimestamp : null,
      pauseTimestamp:
        typeof parsed.pauseTimestamp === 'number' ? parsed.pauseTimestamp : null,
      totalPausedDuration:
        typeof parsed.totalPausedDuration === 'number' ? parsed.totalPausedDuration : 0,
      completedDurationMs:
        typeof parsed.completedDurationMs === 'number' ? parsed.completedDurationMs : 0,
    }
  } catch {
    return { ...DEFAULT_TIMER_SNAPSHOT }
  }
}

function legacyLoadBackgroundConfig(): BackgroundConfig {
  try {
    const stored = localStorage.getItem(LEGACY_BG_KEY)
    if (!stored) return { ...DEFAULT_BACKGROUND_CONFIG }
    const parsed = JSON.parse(stored) as Partial<BackgroundConfig>
    const opacity =
      typeof parsed.opacity === 'number' && parsed.opacity >= 0 && parsed.opacity <= 100
        ? parsed.opacity
        : DEFAULT_BACKGROUND_CONFIG.opacity
    const posterUrl =
      typeof parsed.posterUrl === 'string' && parsed.posterUrl.trim() ? parsed.posterUrl : null
    return { posterUrl, opacity }
  } catch {
    return { ...DEFAULT_BACKGROUND_CONFIG }
  }
}

// ─── Migration: v1 → v2 ─────────────────────────────────────────────────────

/**
 * If old single-session keys exist and the new sessions key does NOT,
 * convert the old data into the first Session and write it.
 * Then remove the old keys.
 */
export function migrateFromV1(): void {
  const hasOldConfig = localStorage.getItem(LEGACY_CONFIG_KEY) !== null
  const hasOldTimer = localStorage.getItem(LEGACY_TIMER_KEY) !== null
  const hasNewSessions = localStorage.getItem(SESSIONS_KEY) !== null

  if ((!hasOldConfig && !hasOldTimer) || hasNewSessions) {
    // Nothing to migrate, or already migrated
    return
  }

  const config = legacyLoadSessionConfig()
  const timer = legacyLoadTimerSnapshot()
  const bg = legacyLoadBackgroundConfig()

  const target =
    timer.targetTimestamp ?? combineDateAndTime(config.date, config.startTime)

  const migratedSession: Session = {
    id: crypto.randomUUID(),
    title: config.sessionTitle,
    date: config.date,
    startTime: config.startTime,
    durationHours: 2,

    targetTimestamp: target,
    sessionStartTimestamp: timer.sessionStartTimestamp,
    pauseTimestamp: timer.pauseTimestamp,
    totalPausedDuration: timer.totalPausedDuration,
    completedDurationMs: timer.completedDurationMs,
    phase: timer.phase,

    posterUrl: bg.posterUrl,
    posterOpacity: bg.opacity,

    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  saveSessions([migratedSession])

  // Remove old keys
  try {
    localStorage.removeItem(LEGACY_CONFIG_KEY)
    localStorage.removeItem(LEGACY_TIMER_KEY)
    localStorage.removeItem(LEGACY_BG_KEY)
  } catch {
    // ignore
  }
}

// ─── Multi-session storage ───────────────────────────────────────────────────

function validateSession(raw: unknown): raw is Session {
  if (typeof raw !== 'object' || raw === null) return false
  const s = raw as Record<string, unknown>
  return (
    typeof s.id === 'string' &&
    typeof s.title === 'string' &&
    typeof s.date === 'string' &&
    typeof s.startTime === 'string' &&
    typeof s.phase === 'string' &&
    ['upcoming', 'live', 'paused', 'completed'].includes(s.phase as string)
  )
}

export function loadSessions(): Session[] {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(validateSession).map((s) => ({
      ...s,
      durationHours: s.durationHours ?? 2,
      posterUrl: s.posterUrl ?? null,
      posterOpacity: s.posterOpacity ?? 30,
      totalPausedDuration: s.totalPausedDuration ?? 0,
      completedDurationMs: s.completedDurationMs ?? 0,
      createdAt: s.createdAt ?? Date.now(),
      updatedAt: s.updatedAt ?? Date.now(),
    }))
  } catch {
    return []
  }
}

export function saveSessions(sessions: Session[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  } catch {
    // localStorage may be full — fail silently
  }
}

// ─── Legacy functions — kept so existing imports don't break ─────────────────

export function loadSessionConfig(): SessionConfig {
  return legacyLoadSessionConfig()
}
export function saveSessionConfig(_config: SessionConfig): void { /* retired */ }
export function loadTimerSnapshot(): TimerSnapshot {
  return legacyLoadTimerSnapshot()
}
export function saveTimerSnapshot(_snapshot: TimerSnapshot): void { /* retired */ }
export function loadBackgroundConfig(): BackgroundConfig {
  return legacyLoadBackgroundConfig()
}
export function saveBackgroundConfig(_config: BackgroundConfig): void { /* retired */ }
export function clearBackgroundConfig(): void { /* retired */ }
