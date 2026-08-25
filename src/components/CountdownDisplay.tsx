import type { CountdownValues, TimerPhase } from '../types'
import {
  formatCountdownAriaLabel,
  formatCountdownDisplay,
  formatStopwatchDisplay,
  padTwo,
} from '../utils/countdown'

interface CountdownDisplayProps {
  countdown: CountdownValues
  elapsedMs: number
  phase: TimerPhase
  hasStarted: boolean
}

const CARD_CONFIG = [
  { key: 'days', label: 'DAYS' },
  { key: 'hours', label: 'HOURS' },
  { key: 'minutes', label: 'MINUTES' },
  { key: 'seconds', label: 'SECONDS' },
] as const

export function CountdownDisplay({
  countdown,
  elapsedMs,
  phase,
  hasStarted,
}: CountdownDisplayProps) {
  const ariaLabel = formatCountdownAriaLabel(countdown)

  const primaryValue =
    phase === 'upcoming'
      ? formatCountdownDisplay(countdown)
      : formatStopwatchDisplay(elapsedMs)

  const subLabel =
    phase === 'upcoming'
      ? 'SESSION STARTS IN'
      : phase === 'live'
        ? 'SESSION IN PROGRESS'
        : phase === 'paused'
          ? 'SESSION PAUSED'
          : 'SESSION COMPLETED'

  return (
    <section className="timer-panel" aria-label="Session timer">
      <div className="timer-panel__label">{subLabel}</div>
      <div className="timer-panel__clock" role="timer" aria-label={`Time remaining: ${ariaLabel}`}>
        {primaryValue}
      </div>

      {phase === 'upcoming' && (
        <div className="timer-panel__meta" aria-live="polite">
          {CARD_CONFIG.map(({ key, label }) => (
            <div key={key} className="timer-panel__meta-item">
              <span className="timer-panel__meta-value">{padTwo(countdown[key])}</span>
              <span className="timer-panel__meta-label">{label}</span>
            </div>
          ))}
        </div>
      )}

      {phase !== 'upcoming' && (
        <div className="timer-panel__live-block" aria-live="polite">
          <div className="timer-panel__live-pill">{phase.toUpperCase()}</div>
          <div className="timer-panel__live-text">
            {hasStarted && phase === 'live' ? 'Session in progress' : phase === 'paused' ? 'Session paused' : 'Session ended'}
          </div>
        </div>
      )}
    </section>
  )
}
