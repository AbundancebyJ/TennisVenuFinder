import { isWeekend } from '../lib/availability'

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  dates: string[]
  value: string
  counts: Record<string, number>
  onChange: (date: string) => void
}

export function DateStrip({ dates, value, counts, onChange }: Props) {
  return (
    <div className="date-strip" role="tablist" aria-label="날짜 선택">
      {dates.map((d, i) => {
        const date = new Date(`${d}T00:00:00`)
        const day = date.getDay()
        return (
          <button
            key={d}
            role="tab"
            aria-selected={d === value}
            className={`date-chip${d === value ? ' active' : ''}${isWeekend(d) ? ' weekend' : ''}${day === 0 ? ' sun' : ''}`}
            onClick={() => onChange(d)}
          >
            <span className="dow">{i === 0 ? '오늘' : WEEKDAY[day]}</span>
            <span className="dom">
              {date.getMonth() + 1}/{date.getDate()}
            </span>
            <span className="cnt" aria-label={`예약 가능 ${counts[d] ?? 0}곳`}>
              {counts[d] ?? 0}곳
            </span>
          </button>
        )
      })}
    </div>
  )
}
