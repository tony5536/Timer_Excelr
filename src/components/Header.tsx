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
      <div className="brand">
        <img src="/excelr-logo.png" alt="ExcelR" className="brand__logo" />
      </div>

      <div className="app-header__label">EDL PROGRAM TIMER</div>

      <div className={`status-pill status-pill--${phase}`}>
        <span className="status-pill__dot" aria-hidden="true" />
        {statusText}
      </div>
    </header>
  )
}
