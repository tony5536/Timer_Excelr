import { useEffect, useRef, useState } from 'react'
import type { Session } from '../types'
import { useSessionTimer } from '../hooks/useSessionTimer'
import { BackgroundLayer } from './BackgroundLayer'
import { CountdownDisplay } from './CountdownDisplay'
import { formatCountdownDisplay, formatStopwatchClock } from '../utils/countdown'

interface SessionDetailViewProps {
  session: Session
  now: number
  onBack: () => void
  onPause: (id: string) => void
  onResume: (id: string) => void
  onEnd: (id: string) => void
  onUpdatePoster: (id: string, posterUrl: string | null) => void
  onUpdateOpacity: (id: string, opacity: number) => void
}

export function SessionDetailView({
  session,
  now,
  onBack,
  onPause,
  onResume,
  onEnd,
  onUpdatePoster,
  onUpdateOpacity,
}: SessionDetailViewProps) {
  const { effectivePhase, countdown, elapsedMs } = useSessionTimer(session, now)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const displayTitle = session.title.trim() || 'ExcelR Training Session'

  const formattedDate = (() => {
    if (!session.date) return 'No date selected'
    const [year, month, day] = session.date.split('-').map(Number)
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(year, month - 1, day))
  })()

  const formattedTime = (() => {
    if (!session.startTime) return ''
    const [hours, minutes] = session.startTime.split(':').map(Number)
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(2000, 0, 1, hours, minutes))
  })()

  const statusLabel =
    effectivePhase === 'live'
      ? 'LIVE'
      : effectivePhase === 'paused'
        ? 'PAUSED'
        : effectivePhase === 'completed'
          ? 'COMPLETED'
          : 'UPCOMING'

  const bgConfig = { posterUrl: session.posterUrl, opacity: session.posterOpacity }

  // ─── Fullscreen handling ──────────────────────────────────────────────────

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'f' || event.repeat) return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      )
        return
      event.preventDefault()
      if (document.fullscreenElement) {
        void document.exitFullscreen()
      } else {
        void document.documentElement.requestFullscreen().catch(() => {})
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      // ignore — some browsers deny
    }
  }

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
    setIsFullscreen(false)
  }

  // ─── Poster upload inside detail view ───────────────────────────────────
  const handlePosterSelect = async (file: File): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        onUpdatePoster(session.id, reader.result as string)
        resolve()
      }
      reader.onerror = () => reject(new Error('Failed to read image file.'))
      reader.readAsDataURL(file)
    })
  }

  // ─── Fullscreen display view ─────────────────────────────────────────────
  if (isFullscreen) {
    return (
      <main className="display-shell">
        <BackgroundLayer config={bgConfig} />
        <div className="display-shell__content">
          <div className="display-shell__brand">
            <img src="/excelr-logo.png" alt="ExcelR" className="display-shell__brand-logo" />
          </div>

          <h1 className="display-shell__title">{displayTitle}</h1>

          <div className={`display-shell__status display-shell__status--${effectivePhase}`}>
            <span className="status-pill__dot" aria-hidden="true" />
            {statusLabel}
          </div>

          <div className="display-shell__timer">
            {effectivePhase === 'upcoming'
              ? formatCountdownDisplay(countdown)
              : formatStopwatchClock(elapsedMs)}
          </div>

          <p className="display-shell__subtitle">
            {effectivePhase === 'upcoming'
              ? 'SESSION STARTS IN'
              : effectivePhase === 'live'
                ? 'SESSION IN PROGRESS'
                : effectivePhase === 'paused'
                  ? 'SESSION PAUSED'
                  : 'SESSION COMPLETED'}
          </p>

          <div className="display-shell__meta">
            <span>{formattedDate}</span>
            <span>{formattedTime}</span>
          </div>
        </div>

        <button type="button" className="display-shell__exit" onClick={exitFullscreen}>
          EXIT FULLSCREEN
        </button>
      </main>
    )
  }

  // ─── Normal control view ─────────────────────────────────────────────────
  return (
    <main className="app-shell">
      <BackgroundLayer config={bgConfig} />
      <div className="app-shell__container">

        {/* Header */}
        <header className="app-header">
          <div className="brand">
            <img src="/excelr-logo.png" alt="ExcelR" className="brand__logo" />
          </div>
          <div className="app-header__label">EDL PROGRAM TIMER</div>
          <div className={`status-pill status-pill--${effectivePhase}`}>
            <span className="status-pill__dot" aria-hidden="true" />
            {statusLabel}
          </div>
        </header>

        {/* Back navigation */}
        <div className="detail-nav">
          <button type="button" className="ghost-button detail-nav__back" onClick={onBack}>
            ← All Sessions
          </button>
        </div>

        {/* Hero */}
        <section className="hero-panel">
          <div className="hero-panel__topline">SESSION</div>
          <h1 className="hero-panel__title">{displayTitle}</h1>

          <div className="hero-panel__meta">
            <span>{formattedDate}</span>
            <span>{formattedTime}</span>
            {session.durationHours > 0 && <span>{session.durationHours}h duration</span>}
          </div>

          <CountdownDisplay
            countdown={countdown}
            elapsedMs={elapsedMs}
            phase={effectivePhase}
            hasStarted={Boolean(
              session.targetTimestamp !== null &&
                (effectivePhase === 'live' ||
                  effectivePhase === 'paused' ||
                  effectivePhase === 'completed'),
            )}
          />

          <div className="action-row">
            {effectivePhase === 'live' ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => onPause(session.id)}
              >
                Pause
              </button>
            ) : effectivePhase === 'paused' ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => onResume(session.id)}
              >
                Resume
              </button>
            ) : null}

            {effectivePhase !== 'completed' && (
              <button
                type="button"
                className="danger-button"
                onClick={() => setShowEndConfirm(true)}
              >
                End Session
              </button>
            )}

            <button type="button" className="primary-button" onClick={enterFullscreen}>
              Fullscreen Display
            </button>
          </div>
        </section>

        {/* Session info + background settings */}
        <div className="dashboard-grid">
          <div className="dashboard-grid__left">
            <section className="info-card">
              <div className="info-card__header">
                <p className="eyebrow">SESSION INFO</p>
              </div>
              <div className="info-card__grid">
                <div>
                  <span className="info-card__label">Session</span>
                  <strong>{displayTitle}</strong>
                </div>
                <div>
                  <span className="info-card__label">Date</span>
                  <strong>{formattedDate}</strong>
                </div>
                <div>
                  <span className="info-card__label">Start</span>
                  <strong>{formattedTime}</strong>
                </div>
                <div>
                  <span className="info-card__label">Status</span>
                  <strong className={`info-card__status info-card__status--${effectivePhase}`}>
                    <span className="status-pill__dot" aria-hidden="true" />
                    {statusLabel}
                  </strong>
                </div>
              </div>
            </section>

            {/* Inline background settings */}
            <InlineBackgroundSettings
              session={session}
              onSelectPoster={handlePosterSelect}
              onRemovePoster={() => onUpdatePoster(session.id, null)}
              onOpacityChange={(opacity) => onUpdateOpacity(session.id, opacity)}
            />
          </div>

          {/* Empty right column to maintain layout */}
          <div />
        </div>

        {/* Completed summary */}
        {effectivePhase === 'completed' && (
          <section className="complete-card">
            <p className="eyebrow">SESSION COMPLETED</p>
            <div className="complete-card__time">
              {new Date(session.completedDurationMs).toISOString().slice(11, 19)}
            </div>
          </section>
        )}
      </div>

      {/* End session confirmation */}
      {showEndConfirm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>End Session</h3>
            <p>Are you sure you want to end this session?</p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowEndConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  onEnd(session.id)
                  setShowEndConfirm(false)
                }}
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

// ─── Inline background settings ────────────────────────────────────────────

interface InlineBgProps {
  session: Session
  onSelectPoster: (file: File) => Promise<void>
  onRemovePoster: () => void
  onOpacityChange: (opacity: number) => void
}

function InlineBackgroundSettings({
  session,
  onSelectPoster,
  onRemovePoster,
  onOpacityChange,
}: InlineBgProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP).')
      return
    }

    try {
      setIsProcessing(true)
      await onSelectPoster(file)
    } catch (err) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        setError('Image too large. Please select an image under 4MB.')
      } else {
        setError('Failed to upload image. Please try a smaller file.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <section className="info-card background-settings-card">
      <div className="info-card__header">
        <p className="eyebrow">BACKGROUND SETTINGS</p>
      </div>
      <div className="background-settings__body">
        <div className="background-settings__group">
          <label className="background-settings__label">BACKGROUND POSTER</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="visually-hidden"
            onChange={handleFileChange}
          />
          <div className="background-settings__controls">
            {!session.posterUrl ? (
              <div className="background-settings__actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Choose Poster'}
                </button>
                <span className="background-settings__status-text">No poster selected</span>
              </div>
            ) : (
              <div className="background-settings__actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Change Poster'}
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={onRemovePoster}
                  disabled={isProcessing}
                >
                  Remove Poster
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="validation-message" role="alert">
            {error}
          </div>
        )}

        <div className="background-settings__group">
          <div className="background-settings__label-row">
            <label htmlFor={`bg-opacity-${session.id}`} className="background-settings__label">
              BACKGROUND OPACITY
            </label>
            <span className="background-settings__opacity-val">{session.posterOpacity}%</span>
          </div>
          <div className="background-settings__slider-wrapper">
            <input
              id={`bg-opacity-${session.id}`}
              type="range"
              min="0"
              max="100"
              value={session.posterOpacity}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
              className="background-settings__slider"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
