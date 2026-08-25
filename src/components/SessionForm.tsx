import type { FormEvent } from 'react'
import type { SessionConfig, TimerPhase } from '../types'

interface SessionFormProps {
  config: SessionConfig
  phase: TimerPhase
  validationError: string | null
  isEditing: boolean
  onConfigChange: (updates: Partial<SessionConfig>) => void
  onSave: () => void
  onToggleEdit: () => void
  onClearError: () => void
}

export function SessionForm({
  config,
  phase,
  validationError,
  isEditing,
  onConfigChange,
  onSave,
  onToggleEdit,
  onClearError,
}: SessionFormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSave()
  }

  return (
    <aside className={`session-panel ${isEditing ? 'session-panel--open' : ''}`}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">SESSION SETTINGS</p>
          <h3>Session setup</h3>
        </div>
        <button type="button" className="secondary-button" onClick={onToggleEdit}>
          {isEditing ? 'Close' : 'Edit Session'}
        </button>
      </div>

      {validationError && (
        <div className="validation-message" role="alert">
          {validationError}
        </div>
      )}

      {isEditing && (
        <form className="session-form" onSubmit={handleSubmit} noValidate>
          <div className="session-form__field">
            <label htmlFor="session-title" className="session-form__label">
              Session Title
            </label>
            <input
              id="session-title"
              type="text"
              className="session-form__input"
              value={config.sessionTitle}
              onChange={(event) => onConfigChange({ sessionTitle: event.target.value })}
              onFocus={onClearError}
              autoComplete="off"
              disabled={phase === 'live'}
            />
          </div>

          <div className="session-form__field">
            <label htmlFor="session-date" className="session-form__label">
              Date
            </label>
            <input
              id="session-date"
              type="date"
              className="session-form__input"
              value={config.date}
              onChange={(event) => onConfigChange({ date: event.target.value })}
              onFocus={onClearError}
              disabled={phase === 'live'}
            />
          </div>

          <div className="session-form__field">
            <label htmlFor="session-time" className="session-form__label">
              Start Time
            </label>
            <input
              id="session-time"
              type="time"
              className="session-form__input"
              value={config.startTime}
              onChange={(event) => onConfigChange({ startTime: event.target.value })}
              onFocus={onClearError}
              disabled={phase === 'live'}
            />
          </div>

          <div className="session-form__actions">
            <button type="submit" className="primary-button">
              Save Session
            </button>
          </div>
        </form>
      )}
    </aside>
  )
}
