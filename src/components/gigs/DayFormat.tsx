import { useGigFormat } from './format'

// Bloc date « VEN / 14 / MARS » des listes de dates.
export function DayFormat({ day, className }: { day: string; className?: string }) {
  const f = useGigFormat()
  return (
    <span className={className}>
      <span className="label">{f.day(day, { weekday: 'short' })}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1 }}>
        {f.day(day, { day: 'numeric' })}
      </span>
      <span className="label">{f.day(day, { month: 'short', year: '2-digit' })}</span>
    </span>
  )
}

export function ChfText({ value }: { value: number }) {
  return <>{useGigFormat().chf(value)}</>
}
