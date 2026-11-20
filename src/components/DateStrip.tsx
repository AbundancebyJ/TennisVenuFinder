import { dayOfWeek } from '../lib/availability'
import type { Holidays } from '../lib/holidays'
import type { DayWeather } from '../types'
import { WeatherBadge } from './WeatherBadge'

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  dates: string[]
  value: string | null
  counts: Record<string, number>
  weather: Record<string, DayWeather>
  holidays: Holidays
  onChange: (date: string | null) => void
}

export function DateStrip({ dates, value, counts, weather, holidays, onChange }: Props) {
  return (
    <div className="date-strip" role="tablist" aria-label="날짜 선택">
      {dates.map((d, i) => {
        const day = dayOfWeek(d)
        const holiday = holidays[d]
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
              {i === 0 ? '오늘' : WEEKDAY[day]}
              {i === 0 && <span className="dow-sub">({WEEKDAY[day]})</span>}
            </span>
            <span className="dom">
              {m}/{dd}
            </span>
            <span className={`holiday-name${holiday ? '' : ' blank'}`}>{holiday ? shortHoliday(holiday) : ' '}</span>
            <WeatherBadge weather={weather[d]} />
            <span className="tag">{counts[d] ?? 0}곳</span>
          </button>
        )
      })}
    </div>
  )
}

function shortHoliday(name: string) {
  const s = name.replace(/\s/g, '').replace('대체공휴일', '대체휴일').replace(/\(.*?\)/, '')
  return s.length > 5 ? `${s.slice(0, 5)}…` : s
}
