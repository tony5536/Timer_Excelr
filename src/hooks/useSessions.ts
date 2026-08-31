import { useCallback, useEffect, useState } from 'react'
import type { Session, TimerPhase } from '../types'
import { combineDateAndTime } from '../utils/countdown'
import { loadSessions, migrateFromV1, saveSessions } from '../utils/storage'

/**
 * Central session state manager.
 *
 * Rules:
 * - Every update is an immutable array replace: prev.map(s => s.id === id ? updated : s)
 * - Session A operations NEVER touch Session B, C, etc.
 * - The `now` clock is passed in from the App root so all sessions share one tick.
 */
export function useSessions(now: number) {
  // Run migration once on mount (converts v1 localStorage keys → v2 sessions array)
  const [sessions, setSessions] = useState<Session[]>(() => {
    migrateFromV1()
    return loadSessions()
  })

  // Persist sessions to localStorage whenever they change
  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  // ─── Auto-transition: upcoming → live ──────────────────────────────────────
  useEffect(() => {
    setSessions((prev) => {
      let changed = false
      const next = prev.map((s) => {
        if (
          s.phase === 'upcoming' &&
          s.targetTimestamp !== null &&
          now >= s.targetTimestamp
        ) {
          changed = true
          return {
            ...s,
            phase: 'live' as TimerPhase,
            sessionStartTimestamp: s.sessionStartTimestamp ?? s.targetTimestamp,
            pauseTimestamp: null,
            totalPausedDuration: 0,
            updatedAt: now,
          }
        }
        return s
      })
      return changed ? next : prev
    })
  }, [now])

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  const createSession = useCallback(
    (fields: {
      title: string
      date: string
      startTime: string
      durationHours: number
      posterUrl?: string | null
      posterOpacity?: number
    }): Session => {
      const target = combineDateAndTime(fields.date, fields.startTime)
      const newSession: Session = {
        id: crypto.randomUUID(),
        title: fields.title,
        date: fields.date,
        startTime: fields.startTime,
        durationHours: fields.durationHours,

        targetTimestamp: target,
        sessionStartTimestamp: null,
        pauseTimestamp: null,
        totalPausedDuration: 0,
        completedDurationMs: 0,
        phase: 'upcoming',

        posterUrl: fields.posterUrl ?? null,
        posterOpacity: fields.posterOpacity ?? 30,

        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setSessions((prev) => [...prev, newSession])
      return newSession
    },
    [],
  )

  const updateSession = useCallback(
    (id: string, updates: Partial<Omit<Session, 'id' | 'createdAt'>>) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s,
        ),
      )
    },
    [],
  )

  /**
   * Update session config fields (title, date, startTime, durationHours).
   * Recalculates targetTimestamp and resets timer state to upcoming.
   * Only affects the given session ID.
   */
  const editSessionConfig = useCallback(
    (
      id: string,
      fields: {
        title: string
        date: string
        startTime: string
        durationHours: number
      },
    ) => {
      const target = combineDateAndTime(fields.date, fields.startTime)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                title: fields.title,
                date: fields.date,
                startTime: fields.startTime,
                durationHours: fields.durationHours,
                targetTimestamp: target,
                sessionStartTimestamp: null,
                pauseTimestamp: null,
                totalPausedDuration: 0,
                completedDurationMs: 0,
                phase: 'upcoming' as TimerPhase,
                updatedAt: Date.now(),
              }
            : s,
        ),
      )
    },
    [],
  )

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const duplicateSession = useCallback((id: string) => {
    setSessions((prev) => {
      const original = prev.find((s) => s.id === id)
      if (!original) return prev
      const duplicate: Session = {
        ...original,
        id: crypto.randomUUID(),
        title: `${original.title} (Copy)`,
        // Reset timer state — the duplicate starts fresh as upcoming
        sessionStartTimestamp: null,
        pauseTimestamp: null,
        totalPausedDuration: 0,
        completedDurationMs: 0,
        phase: 'upcoming',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      return [...prev, duplicate]
    })
  }, [])

  // ─── Timer actions (per-session, no cross-session side effects) ─────────────

  const pauseSession = useCallback((id: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.phase !== 'live') return s
        return {
          ...s,
          phase: 'paused' as TimerPhase,
          pauseTimestamp: Date.now(),
          updatedAt: Date.now(),
        }
      }),
    )
  }, [])

  const resumeSession = useCallback((id: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.phase !== 'paused' || s.pauseTimestamp === null) return s
        const nowVal = Date.now()
        const pausedMs = nowVal - s.pauseTimestamp
        return {
          ...s,
          phase: 'live' as TimerPhase,
          pauseTimestamp: null,
          totalPausedDuration: s.totalPausedDuration + pausedMs,
          updatedAt: nowVal,
        }
      }),
    )
  }, [])

  const endSession = useCallback((id: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.phase === 'completed') return s
        const nowVal = Date.now()
        let finalElapsed = 0
        if (s.phase === 'live' && s.sessionStartTimestamp !== null) {
          finalElapsed = Math.max(0, nowVal - s.sessionStartTimestamp - s.totalPausedDuration)
        } else if (s.phase === 'paused' && s.pauseTimestamp !== null && s.sessionStartTimestamp !== null) {
          finalElapsed = Math.max(
            0,
            s.pauseTimestamp - s.sessionStartTimestamp - s.totalPausedDuration,
          )
        }
        return {
          ...s,
          phase: 'completed' as TimerPhase,
          completedDurationMs: finalElapsed,
          pauseTimestamp: null,
          updatedAt: nowVal,
        }
      }),
    )
  }, [])

  // ─── Background per session ─────────────────────────────────────────────────

  const updateSessionPoster = useCallback((id: string, posterUrl: string | null) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, posterUrl, updatedAt: Date.now() } : s,
      ),
    )
  }, [])

  const updateSessionOpacity = useCallback((id: string, posterOpacity: number) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, posterOpacity, updatedAt: Date.now() } : s,
      ),
    )
  }, [])

  return {
    sessions,
    createSession,
    updateSession,
    editSessionConfig,
    deleteSession,
    duplicateSession,
    pauseSession,
    resumeSession,
    endSession,
    updateSessionPoster,
    updateSessionOpacity,
  }
}
