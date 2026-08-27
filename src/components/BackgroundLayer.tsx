import type { BackgroundConfig } from '../types'

interface BackgroundLayerProps {
  config: BackgroundConfig
}

export function BackgroundLayer({ config }: BackgroundLayerProps) {
  if (!config.posterUrl) {
    return null
  }

  const opacityDecimal = Math.max(0, Math.min(100, config.opacity)) / 100

  return (
    <div className="background-poster-wrapper" aria-hidden="true">
      <div
        className="background-poster-image"
        style={{
          backgroundImage: `url("${config.posterUrl}")`,
          opacity: opacityDecimal,
        }}
      />
      <div className="background-poster-overlay" />
    </div>
  )
}
