import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import type { Session } from '../types'
import { combineDateAndTime } from '../utils/countdown'

interface SessionFormViewProps {
  /** null = create mode, Session = edit mode */
  editingSession: Session | null
  onSave: (fields: {
    title: string
    date: string
    startTime: string
    durationHours: number
    posterUrl?: string | null
    posterOpacity?: number
  }) => void
  onCancel: () => void
}

export function SessionFormView({ editingSession, onSave, onCancel }: SessionFormViewProps) {
  const isEditMode = editingSession !== null

  const [title, setTitle] = useState(editingSession?.title ?? '')
  const [date, setDate] = useState(editingSession?.date ?? '')
  const [startTime, setStartTime] = useState(editingSession?.startTime ?? '')
  const [durationHours, setDurationHours] = useState(
    editingSession?.durationHours?.toString() ?? '2',
  )
  const [posterUrl, setPosterUrl] = useState<string | null>(editingSession?.posterUrl ?? null)
  const [posterOpacity, setPosterOpacity] = useState(editingSession?.posterOpacity ?? 30)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // If editingSession changes (e.g., navigating to a different edit), reset form
  useEffect(() => {
    setTitle(editingSession?.title ?? '')
    setDate(editingSession?.date ?? '')
    setStartTime(editingSession?.startTime ?? '')
    setDurationHours(editingSession?.durationHours?.toString() ?? '2')
    setPosterUrl(editingSession?.posterUrl ?? null)
    setPosterOpacity(editingSession?.posterOpacity ?? 30)
    setValidationError(null)
    setImageError(null)
  }, [editingSession])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setValidationError(null)

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setValidationError('Session title is required.')
      return
    }
    if (!date) {
      setValidationError('Please select a date.')
      return
    }
    if (!startTime) {
      setValidationError('Please select a start time.')
      return
    }
    const target = combineDateAndTime(date, startTime)
    if (target === null) {
      setValidationError('Please enter a valid date and time.')
      return
    }
    // Allow editing existing session even if time is in the past
    if (!isEditMode && target <= Date.now()) {
      setValidationError('Please select a future session time.')
      return
    }

    const hours = Math.max(0, parseFloat(durationHours) || 0)

    onSave({
      title: trimmedTitle,
      date,
      startTime,
      durationHours: hours,
      posterUrl,
      posterOpacity,
    })
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setImageError(null)
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, JPEG, WEBP).')
      return
    }

    try {
      setIsProcessingImage(true)
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read image file.'))
        reader.readAsDataURL(file)
      })
      setPosterUrl(url)
    } catch (err) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        setImageError('Image too large. Please select an image under 4MB.')
      } else {
        setImageError('Failed to upload image. Please try a smaller file.')
      }
    } finally {
      setIsProcessingImage(false)
    }
  }

  return (
    <main className="app-shell form-view">
      <div className="app-shell__container form-view__container">
        {/* Header */}
        <header className="app-header">
          <div className="brand">
            <img src="/excelr-logo.png" alt="ExcelR" className="brand__logo" />
          </div>
          <div className="app-header__label">EDL PROGRAM TIMER</div>
          <button type="button" className="secondary-button" onClick={onCancel}>
            ← Back
          </button>
        </header>

        <section className="form-view__body">
          <div className="form-view__heading">
            <p className="eyebrow">{isEditMode ? 'EDIT SESSION' : 'NEW SESSION'}</p>
            <h1 className="form-view__title">
              {isEditMode ? 'Edit Session' : 'Create New Session'}
            </h1>
          </div>

          {validationError && (
            <div className="validation-message" role="alert">
              {validationError}
            </div>
          )}

          <form className="session-form session-form--full" onSubmit={handleSubmit} noValidate>
            <div className="session-form__field">
              <label htmlFor="sf-title" className="session-form__label">
                Session Title
              </label>
              <input
                id="sf-title"
                type="text"
                className="session-form__input"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setValidationError(null) }}
                autoComplete="off"
                placeholder="e.g. FDP on Generative AI"
              />
            </div>

            <div className="session-form__row">
              <div className="session-form__field">
                <label htmlFor="sf-date" className="session-form__label">
                  Date
                </label>
                <input
                  id="sf-date"
                  type="date"
                  className="session-form__input"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setValidationError(null) }}
                />
              </div>

              <div className="session-form__field">
                <label htmlFor="sf-time" className="session-form__label">
                  Start Time
                </label>
                <input
                  id="sf-time"
                  type="time"
                  className="session-form__input"
                  value={startTime}
                  onChange={(e) => { setStartTime(e.target.value); setValidationError(null) }}
                />
              </div>

              <div className="session-form__field">
                <label htmlFor="sf-duration" className="session-form__label">
                  Duration (hours)
                </label>
                <input
                  id="sf-duration"
                  type="number"
                  min="0"
                  step="0.5"
                  className="session-form__input"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  placeholder="2"
                />
              </div>
            </div>

            {/* Background Poster */}
            <div className="session-form__field">
              <label className="session-form__label">Background Poster</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="visually-hidden"
                onChange={handleFileChange}
              />

              <div className="background-settings__controls">
                {!posterUrl ? (
                  <div className="background-settings__actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingImage}
                    >
                      {isProcessingImage ? 'Processing...' : 'Choose Poster'}
                    </button>
                    <span className="background-settings__status-text">No poster selected</span>
                  </div>
                ) : (
                  <div className="background-settings__actions">
                    <div
                      className="form-view__poster-preview"
                      style={{ backgroundImage: `url("${posterUrl}")` }}
                      aria-label="Poster preview"
                    />
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingImage}
                    >
                      {isProcessingImage ? 'Processing...' : 'Change Poster'}
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => setPosterUrl(null)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {imageError && (
                <div className="validation-message" role="alert">
                  {imageError}
                </div>
              )}
            </div>

            {/* Opacity slider */}
            <div className="session-form__field">
              <div className="background-settings__label-row">
                <label htmlFor="sf-opacity" className="session-form__label">
                  Background Opacity
                </label>
                <span className="background-settings__opacity-val">{posterOpacity}%</span>
              </div>
              <div className="background-settings__slider-wrapper">
                <input
                  id="sf-opacity"
                  type="range"
                  min="0"
                  max="100"
                  value={posterOpacity}
                  onChange={(e) => setPosterOpacity(Number(e.target.value))}
                  className="background-settings__slider"
                />
              </div>
            </div>

            <div className="session-form__actions session-form__actions--spread">
              <button type="button" className="secondary-button" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="primary-button" id="save-session-btn">
                {isEditMode ? 'Save Changes' : 'Create Session'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
