import { useEffect, useMemo, useState } from 'react'
import { CountdownDisplay } from './components/CountdownDisplay'
import { Header } from './components/Header'
import { SessionForm } from './components/SessionForm'
import { useCountdown } from './hooks/useCountdown'
import type { DisplayMode } from './types'
import { formatCountdownDisplay, formatStopwatchClock } from './utils/countdown'
import './App.css'

function App() {
  const {
    config,
    countdown,
    elapsedMs,
    phase,
    validationError,
    hasStarted,
    completedDurationMs,
    updateConfig,
    saveSession,
    pauseSession,
    resumeSession,
    endSession,
    clearValidationError,
  } = useCountdown()

  const [viewMode, setViewMode] = useState<DisplayMode>('control')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const displayTitle = config.sessionTitle.trim() || 'ExcelR Training Session'

  const formattedDate = useMemo(() => {
    if (!config.date) return 'No date selected'
    const [year, month, day] = config.date.split('-').map(Number)
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(year, month - 1, day))
  }, [config.date])

  const formattedTime = useMemo(() => {
    if (!config.startTime) return '00:00'

    const [hours, minutes] = config.startTime.split(':').map(Number)
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(2000, 0, 1, hours, minutes))
  }, [config.startTime])

  const statusLabel =
    phase === 'live'
      ? 'LIVE'
      : phase === 'paused'
        ? 'PAUSED'
        : phase === 'completed'
          ? 'COMPLETED'
          : 'UPCOMING'

  const hasDisplayScreen = viewMode === 'display' || isFullscreen

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement)
      setIsFullscreen(active)

      if (!active && viewMode === 'display') {
        setViewMode('control')
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [viewMode])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'f' || event.repeat) return

      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      event.preventDefault()
      if (document.fullscreenElement) {
        void document.exitFullscreen()
        return
      }

      if (viewMode === 'display') {
        setViewMode('control')
      } else {
        setViewMode('display')
        void document.documentElement.requestFullscreen().catch(() => {
          setViewMode('control')
        })
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [viewMode])

  const enterDisplayMode = async () => {
    setViewMode('display')
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      setViewMode('display')
    }
  }

  const exitDisplayMode = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
    setViewMode('control')
    setIsFullscreen(false)
  }

  const handleSave = () => {
    saveSession()
    setIsEditing(false)
  }

  const handleEndConfirm = () => {
    endSession()
    setShowConfirmation(false)
  }

  if (hasDisplayScreen) {
    return (
      <main className="display-shell">
        <div className="display-shell__content">
          <div className="display-shell__brand" aria-label="ExcelR brand">
            <span className="display-shell__brand-excel">Excel</span>
            <span className="display-shell__brand-r">R</span>
          </div>

          <h1 className="display-shell__title">{displayTitle}</h1>

          <div className={`display-shell__status display-shell__status--${phase}`}>
            <span className="status-pill__dot" aria-hidden="true" />
            {statusLabel}
          </div>

          <div className="display-shell__timer">
            {phase === 'upcoming'
              ? formatCountdownDisplay(countdown)
              : formatStopwatchClock(elapsedMs)}
          </div>

          <p className="display-shell__subtitle">
            {phase === 'upcoming'
              ? 'SESSION STARTS IN'
              : phase === 'live'
                ? 'SESSION IN PROGRESS'
                : phase === 'paused'
                  ? 'SESSION PAUSED'
                  : 'SESSION COMPLETED'}
          </p>

          <div className="display-shell__meta">
            <span>{formattedDate}</span>
            <span>{formattedTime}</span>
          </div>
        </div>

        <button type="button" className="display-shell__exit" onClick={exitDisplayMode}>
          EXIT FULLSCREEN
        </button>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <div className="app-shell__container">
        <Header phase={phase} />

        <section className="hero-panel">
          <div className="hero-panel__topline">SESSION</div>
          <h1 className="hero-panel__title">{displayTitle}</h1>

          <div className="hero-panel__meta">
            <span>{formattedDate}</span>
            <span>{formattedTime}</span>
          </div>

          <CountdownDisplay
            countdown={countdown}
            elapsedMs={elapsedMs}
            phase={phase}
            hasStarted={hasStarted}
          />

          <div className="action-row">
            {phase === 'live' ? (
              <button type="button" className="secondary-button" onClick={pauseSession}>
                Pause
              </button>
            ) : phase === 'paused' ? (
              <button type="button" className="secondary-button" onClick={resumeSession}>
                Resume
              </button>
            ) : null}

            {phase !== 'completed' && (
              <button type="button" className="danger-button" onClick={() => setShowConfirmation(true)}>
                End Session
              </button>
            )}

            <button type="button" className="secondary-button" onClick={() => setViewMode('display')}>
              Display Mode
            </button>

            <button type="button" className="primary-button" onClick={enterDisplayMode}>
              Fullscreen Display
            </button>
          </div>
        </section>

        <div className="dashboard-grid">
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
                <strong className={`info-card__status info-card__status--${phase}`}>
                  <span className="status-pill__dot" aria-hidden="true" />
                  {statusLabel}
                </strong>
              </div>
            </div>
          </section>

          <SessionForm
            config={config}
            phase={phase}
            validationError={validationError}
            isEditing={isEditing}
            onConfigChange={updateConfig}
            onSave={handleSave}
            onToggleEdit={() => setIsEditing((prev) => !prev)}
            onClearError={clearValidationError}
          />
        </div>

        {phase === 'completed' && (
          <section className="complete-card">
            <p className="eyebrow">SESSION COMPLETED</p>
            <div className="complete-card__time">{new Date(completedDurationMs).toISOString().slice(11, 19)}</div>
          </section>
        )}
      </div>

      {showConfirmation && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>End Session</h3>
            <p>Are you sure you want to end this session?</p>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setShowConfirmation(false)}>
                Cancel
              </button>
              <button type="button" className="danger-button" onClick={handleEndConfirm}>
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
