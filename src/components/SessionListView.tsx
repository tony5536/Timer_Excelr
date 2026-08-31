import { useState } from 'react'
import type { Session } from '../types'
import { SessionCard } from './SessionCard'

interface SessionListViewProps {
  sessions: Session[]
  now: number
  onCreateNew: () => void
  onOpenSession: (id: string) => void
  onEditSession: (id: string) => void
  onDuplicateSession: (id: string) => void
  onDeleteSession: (id: string) => void
}

/**
 * Sort order: LIVE → UPCOMING (nearest first) → PAUSED → COMPLETED
 */
function sortSessions(sessions: Session[], now: number): Session[] {
  const phaseOrder: Record<string, number> = {
    live: 0,
    upcoming: 1,
    paused: 2,
    completed: 3,
  }

  return [...sessions].sort((a, b) => {
    // Auto-detect effective phase for sorting
    const aPhase =
      a.phase === 'upcoming' && a.targetTimestamp !== null && now >= a.targetTimestamp
        ? 'live'
        : a.phase
    const bPhase =
      b.phase === 'upcoming' && b.targetTimestamp !== null && now >= b.targetTimestamp
        ? 'live'
        : b.phase

    const orderDiff = (phaseOrder[aPhase] ?? 9) - (phaseOrder[bPhase] ?? 9)
    if (orderDiff !== 0) return orderDiff

    // Within upcoming: nearest start time first
    if (aPhase === 'upcoming' && bPhase === 'upcoming') {
      return (a.targetTimestamp ?? 0) - (b.targetTimestamp ?? 0)
    }
    // Within completed: most recently completed first
    if (aPhase === 'completed' && bPhase === 'completed') {
      return b.updatedAt - a.updatedAt
    }
    return 0
  })
}

export function SessionListView({
  sessions,
  now,
  onCreateNew,
  onOpenSession,
  onEditSession,
  onDuplicateSession,
  onDeleteSession,
}: SessionListViewProps) {
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)

  const sorted = sortSessions(sessions, now)

  const handleDeleteRequest = (id: string) => {
    const session = sessions.find((s) => s.id === id)
    if (session) setDeleteTarget(session)
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDeleteSession(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <main className="app-shell sessions-view">
      {/* Header */}
      <header className="sessions-header">
        <div className="brand">
          <img src="/excelr-logo.png" alt="ExcelR" className="brand__logo" />
        </div>

        <div className="sessions-header__center">
          <div className="app-header__label">EDL PROGRAM TIMER</div>
          <h1 className="sessions-header__title">Sessions</h1>
        </div>

        <button
          type="button"
          id="create-session-btn"
          className="primary-button sessions-header__create"
          onClick={onCreateNew}
        >
          + Create New Session
        </button>
      </header>

      {/* Session grid */}
      {sessions.length === 0 ? (
        <div className="sessions-empty">
          <div className="sessions-empty__icon">🕐</div>
          <h2 className="sessions-empty__title">No sessions yet</h2>
          <p className="sessions-empty__text">
            Create your first session to get started.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={onCreateNew}
          >
            + Create New Session
          </button>
        </div>
      ) : (
        <div className="sessions-grid">
          {sorted.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              now={now}
              onOpen={onOpenSession}
              onEdit={onEditSession}
              onDuplicate={onDuplicateSession}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Delete Session</h3>
            <p>
              Delete{' '}
              <strong>&ldquo;{deleteTarget.title}&rdquo;</strong>?
              <br />
              This cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
