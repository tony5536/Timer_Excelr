import type { Session } from '../types'
import { useSessionTimer } from '../hooks/useSessionTimer'
import { formatCountdownDisplay, formatStopwatchDisplay } from '../utils/countdown'

interface SessionCardProps {
  session: Session
  now: number
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

function formatCardDate(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function formatCardTime(timeStr: string): string {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(2000, 0, 1, hours, minutes))
}

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'UPCOMING',
  live: 'LIVE',
  paused: 'PAUSED',
  completed: 'COMPLETED',
}

export function SessionCard({ session, now, onOpen, onEdit, onDuplicate, onDelete }: SessionCardProps) {
  const { effectivePhase, countdown, elapsedMs } = useSessionTimer(session, now)

  const timerDisplay =
    effectivePhase === 'upcoming'
      ? formatCountdownDisplay(countdown)
      : formatStopwatchDisplay(elapsedMs)

  const statusLabel = STATUS_LABELS[effectivePhase] ?? effectivePhase.toUpperCase()

  return (
    <div className={`session-card session-card--${effectivePhase}`}>
      {/* Status badge */}
      <div className={`session-card__status status-pill status-pill--${effectivePhase}`}>
        <span className="status-pill__dot" aria-hidden="true" />
        {statusLabel}
      </div>

      {/* Title */}
      <h2 className="session-card__title">{session.title}</h2>

      {/* Date / time */}
      <div className="session-card__meta">
        <span>{formatCardDate(session.date)}</span>
        <span className="session-card__meta-sep">•</span>
        <span>{formatCardTime(session.startTime)}</span>
        {session.durationHours > 0 && (
          <>
            <span className="session-card__meta-sep">•</span>
            <span>{session.durationHours}h</span>
          </>
        )}
      </div>

      {/* Timer display */}
      <div className={`session-card__timer session-card__timer--${effectivePhase}`} role="timer">
        {timerDisplay}
      </div>

      {/* Poster thumbnail */}
      {session.posterUrl && (
        <div
          className="session-card__poster-thumb"
          style={{
            backgroundImage: `url("${session.posterUrl}")`,
            opacity: session.posterOpacity / 100,
          }}
          aria-hidden="true"
        />
      )}

      {/* Actions */}
      <div className="session-card__actions">
        <button
          type="button"
          className="primary-button session-card__btn"
          onClick={() => onOpen(session.id)}
        >
          Open
        </button>
        <button
          type="button"
          className="secondary-button session-card__btn"
          onClick={() => onEdit(session.id)}
        >
          Edit
        </button>
        <button
          type="button"
          className="secondary-button session-card__btn"
          onClick={() => onDuplicate(session.id)}
          title="Duplicate session"
        >
          Duplicate
        </button>
        {effectivePhase !== 'live' && (
          <button
            type="button"
            className="danger-button session-card__btn"
            onClick={() => onDelete(session.id)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
