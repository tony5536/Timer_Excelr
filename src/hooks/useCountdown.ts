import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CountdownValues, SessionConfig, TimerPhase } from '../types'
import { calculateRemaining, combineDateAndTime } from '../utils/countdown'
import {
  loadSessionConfig,
  loadTimerSnapshot,
  saveSessionConfig,
  saveTimerSnapshot,
} from '../utils/storage'

const EMPTY_COUNTDOWN: CountdownValues = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
}

interface UseCountdownReturn {
  config: SessionConfig
  countdown: CountdownValues
  elapsedMs: number
  phase: TimerPhase
  validationError: string | null
  isRunning: boolean
  isPaused: boolean
  hasStarted: boolean
  completedDurationMs: number
  updateConfig: (updates: Partial<SessionConfig>) => void
  saveSession: () => void
  pauseSession: () => void
  resumeSession: () => void
  endSession: () => void
  resetSession: () => void
  clearValidationError: () => void
}

function getTargetTimestamp(config: SessionConfig): number | null {
  return combineDateAndTime(config.date, config.startTime)
}

export function useCountdown(): UseCountdownReturn {
  const initialConfig = loadSessionConfig()
  const initialTimer = loadTimerSnapshot()

  const [config, setConfig] = useState<SessionConfig>(initialConfig)
  const [phase, setPhase] = useState<TimerPhase>(initialTimer.phase)
  const [targetTimestamp, setTargetTimestamp] = useState<number | null>(
    initialTimer.targetTimestamp ?? getTargetTimestamp(initialConfig),
  )
  const [sessionStartTimestamp, setSessionStartTimestamp] = useState<number | null>(
    initialTimer.sessionStartTimestamp,
  )
  const [pauseTimestamp, setPauseTimestamp] = useState<number | null>(
    initialTimer.pauseTimestamp,
  )
  const [totalPausedDuration, setTotalPausedDuration] = useState<number>(
    initialTimer.totalPausedDuration,
  )
  const [completedDurationMs, setCompletedDurationMs] = useState<number>(
    initialTimer.completedDurationMs,
  )
  const [validationError, setValidationError] = useState<string | null>(null)
  const [now, setNow] = useState<number>(Date.now())

  useEffect(() => {
    if (phase === 'completed') return

    const tick = () => setNow(Date.now())
    tick()

    const intervalId = window.setInterval(tick, 250)
    return () => window.clearInterval(intervalId)
  }, [phase])

  useEffect(() => {
    if (phase === 'upcoming' && targetTimestamp !== null && now >= targetTimestamp) {
      const startAt = targetTimestamp
      setPhase('live')
      setSessionStartTimestamp((current) => current ?? startAt)
      setPauseTimestamp(null)
      setTotalPausedDuration(0)
      setCompletedDurationMs(0)
    }
  }, [now, phase, targetTimestamp])

  useEffect(() => {
    if (phase === 'live' && sessionStartTimestamp === null) {
      setSessionStartTimestamp(Date.now())
    }
  }, [phase, sessionStartTimestamp])

  useEffect(() => {
    saveSessionConfig(config)
  }, [config])

  useEffect(() => {
    saveTimerSnapshot({
      phase,
      targetTimestamp,
      sessionStartTimestamp,
      pauseTimestamp,
      totalPausedDuration,
      completedDurationMs,
    })
  }, [
    completedDurationMs,
    pauseTimestamp,
    phase,
    sessionStartTimestamp,
    targetTimestamp,
    totalPausedDuration,
  ])

  const countdown = useMemo<CountdownValues>(() => {
    if (phase === 'upcoming' && targetTimestamp !== null) {
      return calculateRemaining(targetTimestamp, now)
    }

    return { ...EMPTY_COUNTDOWN }
  }, [now, phase, targetTimestamp])

  const elapsedMs = useMemo<number>(() => {
    if (phase === 'completed') return completedDurationMs
    if (sessionStartTimestamp === null) return 0

    if (phase === 'paused' && pauseTimestamp !== null) {
      return Math.max(0, pauseTimestamp - sessionStartTimestamp - totalPausedDuration)
    }

    return Math.max(0, now - sessionStartTimestamp - totalPausedDuration)
  }, [completedDurationMs, now, pauseTimestamp, phase, sessionStartTimestamp, totalPausedDuration])

  const isRunning = phase === 'live'
  const isPaused = phase === 'paused'
  const hasStarted = Boolean(
    targetTimestamp !== null &&
      (phase === 'live' || phase === 'paused' || phase === 'completed'),
  )

  const updateConfig = useCallback((updates: Partial<SessionConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates }
      const nextTarget = getTargetTimestamp(next)
      setTargetTimestamp(nextTarget)

      if (phase === 'upcoming' && nextTarget !== null) {
        setSessionStartTimestamp(null)
        setPauseTimestamp(null)
        setTotalPausedDuration(0)
        setCompletedDurationMs(0)
      }

      return next
    })
    setValidationError(null)
  }, [phase])

  const saveSession = useCallback(() => {
    setValidationError(null)

    const title = config.sessionTitle.trim()
    if (!title) {
      setValidationError('Session title is required.')
      return
    }

    if (!config.date) {
      setValidationError('Please select a date.')
      return
    }

    if (!config.startTime) {
      setValidationError('Please select a start time.')
      return
    }

    const target = getTargetTimestamp(config)
    if (target === null) {
      setValidationError('Please enter a valid date and time.')
      return
    }

    if (target <= Date.now()) {
      setValidationError('Please select a future session time.')
      return
    }

    setTargetTimestamp(target)
    setSessionStartTimestamp(null)
    setPauseTimestamp(null)
    setTotalPausedDuration(0)
    setCompletedDurationMs(0)
    setPhase('upcoming')
  }, [config])

  const pauseSession = useCallback(() => {
    if (phase !== 'live') return
    setPhase('paused')
    setPauseTimestamp(Date.now())
  }, [phase])

  const resumeSession = useCallback(() => {
    if (phase !== 'paused' || pauseTimestamp === null) return
    const nowValue = Date.now()
    const pausedMs = nowValue - pauseTimestamp
    setTotalPausedDuration((prev) => prev + pausedMs)
    setPauseTimestamp(null)
    setPhase('live')
  }, [pauseTimestamp, phase])

  const endSession = useCallback(() => {
    if (phase === 'completed') return

    const finalElapsed =
      phase === 'live'
        ? Math.max(0, Date.now() - (sessionStartTimestamp ?? Date.now()) - totalPausedDuration)
        : phase === 'paused' && pauseTimestamp !== null
          ? Math.max(0, pauseTimestamp - (sessionStartTimestamp ?? pauseTimestamp) - totalPausedDuration)
          : elapsedMs

    setCompletedDurationMs(finalElapsed)
    setPauseTimestamp(null)
    setPhase('completed')
  }, [elapsedMs, pauseTimestamp, phase, sessionStartTimestamp, totalPausedDuration])

  const resetSession = useCallback(() => {
    const target = getTargetTimestamp(config)
    setPhase('upcoming')
    setTargetTimestamp(target)
    setSessionStartTimestamp(null)
    setPauseTimestamp(null)
    setTotalPausedDuration(0)
    setCompletedDurationMs(0)
    setValidationError(null)
  }, [config])

  const clearValidationError = useCallback(() => {
    setValidationError(null)
  }, [])

  return {
    config,
    countdown,
    elapsedMs,
    phase,
    validationError,
    isRunning,
    isPaused,
    hasStarted,
    completedDurationMs,
    updateConfig,
    saveSession,
    pauseSession,
    resumeSession,
    endSession,
    resetSession,
    clearValidationError,
  }
}
