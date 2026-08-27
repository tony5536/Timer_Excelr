export interface CountdownValues {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export interface SessionConfig {
  sessionTitle: string
  date: string
  startTime: string
}

export type TimerPhase = 'upcoming' | 'live' | 'paused' | 'completed'
export type TimerState = 'idle' | 'running' | 'finished'
export type DisplayMode = 'control' | 'display'

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

