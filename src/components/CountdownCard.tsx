import { padTwo } from '../utils/countdown'

interface CountdownCardProps {
  value: number
  label: string
}

export function CountdownCard({ value, label }: CountdownCardProps) {
  return (
    <div className="countdown-card">
      <span className="countdown-card__value" aria-hidden="true">
        {padTwo(value)}
      </span>
      <span className="countdown-card__label">{label}</span>
    </div>
  )
}
