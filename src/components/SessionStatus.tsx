import type { TimerState } from '../types'
import type { CountdownValues } from '../types'

interface SessionStatusProps {
  timerState: TimerState
  countdown: CountdownValues
  hasStarted: boolean
}

export function SessionStatus({
  timerState,
  countdown,
  hasStarted,
}: SessionStatusProps) {
  const isZero =
    countdown.days === 0 &&
    countdown.hours === 0 &&
    countdown.minutes === 0 &&
    countdown.seconds === 0

  let message: string
  if (isZero || timerState === 'finished') {
    message = hasStarted ? 'Session is starting now' : 'Session Started'
  } else {
    message = 'Session starts in'
  }

  return (
    <p className="session-status" aria-live="polite">
      {message}
    </p>
  )
}
