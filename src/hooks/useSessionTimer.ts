import { useMemo } from 'react'
import type { CountdownValues, Session, TimerPhase } from '../types'
import { calculateRemaining } from '../utils/countdown'

export interface SessionTimerValues {
  effectivePhase: TimerPhase
  countdown: CountdownValues
  elapsedMs: number
}

const EMPTY_COUNTDOWN: CountdownValues = { days: 0, hours: 0, minutes: 0, seconds: 0 }

/**
 * Pure derived hook — NO internal state.
 * Computes timer display values for a single session from the shared `now` clock.
 *
 * Architecture:
 *   now (shared) + session.timestamps → derived timer values
 *
 * This means all sessions independently derive their own timers
 * from the same `now`, with NO cross-session state contamination.
 */
export function useSessionTimer(session: Session, now: number): SessionTimerValues {
  return useMemo<SessionTimerValues>(() => {
    const { phase, targetTimestamp, sessionStartTimestamp, pauseTimestamp, totalPausedDuration, completedDurationMs } = session

    // Auto-transition: upcoming → live when the clock passes targetTimestamp.
    // This is READ-ONLY derivation for display purposes.
    // The actual state mutation happens in useSessions.
    let effectivePhase: TimerPhase = phase
    if (phase === 'upcoming' && targetTimestamp !== null && now >= targetTimestamp) {
      effectivePhase = 'live'
    }

    // --- Countdown (upcoming) ---
    const countdown: CountdownValues =
      effectivePhase === 'upcoming' && targetTimestamp !== null
        ? calculateRemaining(targetTimestamp, now)
        : { ...EMPTY_COUNTDOWN }

    // --- Elapsed (live / paused / completed) ---
    let elapsedMs = 0
    if (effectivePhase === 'completed') {
      elapsedMs = completedDurationMs
    } else if (sessionStartTimestamp !== null) {
      if (effectivePhase === 'paused' && pauseTimestamp !== null) {
        elapsedMs = Math.max(0, pauseTimestamp - sessionStartTimestamp - totalPausedDuration)
      } else {
        elapsedMs = Math.max(0, now - sessionStartTimestamp - totalPausedDuration)
      }
    }

    return { effectivePhase, countdown, elapsedMs }
  }, [session, now])
}
