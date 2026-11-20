import { dayOfWeek } from '../lib/availability'
import { holidayName } from '../lib/holidays'

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  dates: string[]
  value: string | null
  counts: Record<string, number>
  onChange: (date: string | null) => void
}

export function DateStrip({ dates, value, counts, onChange }: Props) {
  return (
    <div className="date-strip" role="tablist" aria-label="날짜 선택">
      {dates.map((d, i) => {
        const day = dayOfWeek(d)
        const holiday = holidayName(d)
        const tone = day === 0 || holiday ? ' red' : day === 6 ? ' blue' : ''
        const [, m, dd] = d.split('-').map(Number)
        return (
          <button
            key={d}
            role="tab"
            aria-selected={d === value}
            className={`date-chip${d === value ? ' active' : ''}${tone}`}
            onClick={() => onChange(d === value ? null : d)}
            title={holiday ?? undefined}
          >
            <span className="dow">
              {WEEKDAY[day]}
              {i === 0 && <em className="today">오늘</em>}
            </span>
            <span className="dom">
              {m}/{dd}
            </span>
            <span className={`tag${holiday ? ' holiday' : ''}`}>{holiday ? holiday.replace(/\(.*\)/, '').slice(0, 5) : `${counts[d] ?? 0}곳`}</span>
          </button>
        )
      })}
    </div>
  )
}
