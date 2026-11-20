import { useEffect, useMemo, useState } from 'react'
import { DateStrip } from './components/DateStrip'
import { ThemeToggle } from './components/ThemeToggle'
import { VenueList } from './components/VenueList'
import { VenueMap } from './components/VenueMap'
import {
  compareVenues,
  dateDayType,
  isReceiving,
  matchesDayType,
  operatesOn,
  toISODate,
  upcomingDates,
} from './lib/availability'
import { holidayName } from './lib/holidays'
import { useTheme } from './lib/useTheme'
import type { Venue, VenueData } from './types'

const DAYS = 14
type DayFilter = 'all' | 'weekday' | 'weekend'
const DAY_FILTERS: { value: DayFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'weekday', label: '평일' },
  { value: 'weekend', label: '주말·공휴일' },
]

export default function App() {
  const { pref, setPref } = useTheme()
  const [data, setData] = useState<VenueData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [today, setToday] = useState(() => toISODate(new Date()))
  const dates = useMemo(() => upcomingDates(DAYS, new Date(`${today}T00:00:00`)), [today])

  const [date, setDate] = useState<string | null>(null)
  const [dayFilter, setDayFilter] = useState<DayFilter>('all')
  const [area, setArea] = useState('')
  const [query, setQuery] = useState('')
  const [onlyReceiving, setOnlyReceiving] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/tennis.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`데이터를 불러오지 못했어요 (${r.status})`)
        return r.json() as Promise<VenueData>
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  // 자정이 지나면 날짜 목록 갱신
  useEffect(() => {
    const t = setInterval(() => setToday(toISODate(new Date())), 60_000)
    return () => clearInterval(t)
  }, [])

  const venues = useMemo(() => data?.venues ?? [], [data])
  const areas = useMemo(() => [...new Set(venues.map((v) => v.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko')), [venues])

  // 검색·지역·접수상태 (날짜와 무관한 조건)
  const base = useMemo(() => {
    const q = query.trim().toLowerCase()
    return venues.filter(
      (v) =>
        (!area || v.area === area) &&
        (!q || `${v.name} ${v.place} ${v.area}`.toLowerCase().includes(q)) &&
        (!onlyReceiving || isReceiving(v)) &&
        (!v.openEnd || v.openEnd >= today),
    )
  }, [venues, area, query, onlyReceiving, today])

  const filtered = useMemo(() => {
    const list: Venue[] = base.filter((v) =>
      date ? operatesOn(v, date) : dayFilter === 'all' || matchesDayType(v, dayFilter),
    )
    return list.sort(compareVenues)
  }, [base, date, dayFilter])

  const dateCounts = useMemo(
    () => Object.fromEntries(dates.map((d) => [d, base.filter((v) => operatesOn(v, d)).length])),
    [base, dates],
  )

  const pickDate = (d: string | null) => {
    setDate(d)
    setDayFilter(d ? dateDayType(d) : 'all')
  }
  const pickDayFilter = (f: DayFilter) => {
    setDayFilter(f)
    setDate(null)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            🎾
          </span>
          <div>
            <h1>서울 테니스장 예약 현황</h1>
            {data && (
              <p className="updated">
                {new Date(data.fetchedAt).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })} 기준 ·{' '}
                {data.venues.length}개 예약 서비스
              </p>
            )}
          </div>
        </div>
        <ThemeToggle value={pref} onChange={setPref} />
      </header>

      {data?.partial && (
        <div className="notice warn">
          샘플 데이터({data.venues.length}/{data.total}건)를 표시하고 있어요. 전체 데이터는 서울 열린데이터광장 인증키를
          설정하면 받아옵니다.
        </div>
      )}

      <section className="controls">
        <div className="day-filter" role="radiogroup" aria-label="평일/주말">
          {DAY_FILTERS.map((f) => (
            <button
              key={f.value}
              role="radio"
              aria-checked={dayFilter === f.value}
              className={dayFilter === f.value ? 'active' : undefined}
              onClick={() => pickDayFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
          {date && (
            <span className="picked">
              {date.slice(5).replace('-', '/')} {holidayName(date) ? `· ${holidayName(date)}` : ''} 기준
            </span>
          )}
        </div>
        <DateStrip dates={dates} value={date} counts={dateCounts} onChange={pickDate} />
        <div className="filter-row">
          <input
            type="search"
            className="search"
            placeholder="공원·시설 이름 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="검색"
          />
          <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="구">
            <option value="">전체 구</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <label className="switch">
            <input type="checkbox" checked={onlyReceiving} onChange={(e) => setOnlyReceiving(e.target.checked)} />
            <span>접수중만</span>
          </label>
        </div>
      </section>

      <div className="view-switch" role="tablist" aria-label="보기 방식">
        <button role="tab" aria-selected={mobileView === 'list'} onClick={() => setMobileView('list')}>
          목록 ({filtered.length})
        </button>
        <button role="tab" aria-selected={mobileView === 'map'} onClick={() => setMobileView('map')}>
          지도
        </button>
      </div>

      <main className={`content show-${mobileView}`}>
        <section className="panel list-panel" aria-label="테니스장 목록">
          {error && <p className="notice error">{error}</p>}
          {!data && !error && <p className="empty">불러오는 중…</p>}
          {data && (
            <VenueList
              venues={filtered}
              selectedId={selectedId}
              onSelectVenue={(id) => {
                setSelectedId(id)
                setMobileView('map')
              }}
            />
          )}
        </section>
        <section className="panel map-panel" aria-label="지도">
          <VenueMap venues={filtered} selectedId={selectedId} onSelectVenue={setSelectedId} />
        </section>
      </main>

      <footer className="footer">
        <p>
          데이터: 서울시 공공서비스예약 OpenAPI (ListPublicReservationSport). 접수 상태와 운영 기간 기준이며, 실제 남은
          시간은 각 예약 페이지에서 확인하세요.
        </p>
      </footer>
    </div>
  )
}
