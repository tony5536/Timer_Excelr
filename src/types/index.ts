export interface CountdownValues {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** Legacy single-session config — kept for migration only */
export interface SessionConfig {
  sessionTitle: string
  date: string
  startTime: string
}

export type TimerPhase = 'upcoming' | 'live' | 'paused' | 'completed'
export type TimerState = 'idle' | 'running' | 'finished'
export type DisplayMode = 'control' | 'display'

/** Legacy timer snapshot — kept for migration only */
export interface TimerSnapshot {
  phase: TimerPhase
  targetTimestamp: number | null
  sessionStartTimestamp: number | null
  pauseTimestamp: number | null
  totalPausedDuration: number
  completedDurationMs: number
}

export interface BackgroundConfig {
  posterUrl: string | null
  opacity: number
}

/** Application-level view state */
export type AppView = 'list' | 'create' | 'edit' | 'session'

/** Full independent session with its own timer state and background config */
export interface Session {
  id: string
  title: string
  date: string        // YYYY-MM-DD
  startTime: string   // HH:mm
  durationHours: number

  targetTimestamp: number | null
  sessionStartTimestamp: number | null
  pauseTimestamp: number | null
  totalPausedDuration: number
  completedDurationMs: number
  phase: TimerPhase

  posterUrl: string | null
  posterOpacity: number   // 0–100

  createdAt: number
  updatedAt: number
}
