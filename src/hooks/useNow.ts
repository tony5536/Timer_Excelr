import { useEffect, useState } from 'react'

/**
 * Returns the current timestamp, updated every 250 ms.
 * Use ONE instance at the App root and pass `now` down to all session components.
 * This is the shared clock — session state is still completely independent.
 */
export function useNow(): number {
  const [now, setNow] = useState<number>(Date.now)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [])

  return now
}
