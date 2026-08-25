import type { TimerPhase } from '../types'

interface HeaderProps {
  phase: TimerPhase
}

export function Header({ phase }: HeaderProps) {
  const statusText =
    phase === 'live'
      ? 'LIVE'
      : phase === 'paused'
        ? 'PAUSED'
        : phase === 'completed'
          ? 'COMPLETED'
          : 'UPCOMING'

  return (
    <header className="app-header">
      <div className="brand" aria-label="ExcelR logo">
        <span className="brand__excel">Excel</span>
        <span className="brand__r">R</span>
      </div>

      <div className="app-header__label">SESSION TIMER</div>

      <div className={`status-pill status-pill--${phase}`}>
        <span className="status-pill__dot" aria-hidden="true" />
        {statusText}
      </div>
    </header>
  )
}
