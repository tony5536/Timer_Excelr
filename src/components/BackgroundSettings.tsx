import { type ChangeEvent, useRef, useState } from 'react'
import type { BackgroundConfig } from '../types'

interface BackgroundSettingsProps {
  config: BackgroundConfig
  onSelectPoster: (file: File) => Promise<void>
  onRemovePoster: () => void
  onOpacityChange: (opacity: number) => void
}

export function BackgroundSettings({
  config,
  onSelectPoster,
  onRemovePoster,
  onOpacityChange,
}: BackgroundSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = event.target.files?.[0]
    if (!file) return

    // Reset input value so re-selecting same file triggers onChange
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
        setError('Image file size is too large to store. Please select an image under 4MB.')
      } else {
        setError('Failed to upload image. Please try a smaller file.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleChooseClick = () => {
    fileInputRef.current?.click()
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
            {!config.posterUrl ? (
              <div className="background-settings__actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleChooseClick}
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
                  onClick={handleChooseClick}
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
            <label htmlFor="bg-opacity-slider" className="background-settings__label">
              BACKGROUND OPACITY
            </label>
            <span className="background-settings__opacity-val">{config.opacity}%</span>
          </div>

          <div className="background-settings__slider-wrapper">
            <input
              id="bg-opacity-slider"
              type="range"
              min="0"
              max="100"
              value={config.opacity}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
              className="background-settings__slider"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
