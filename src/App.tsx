import { useEffect, useMemo, useState } from 'react'
import { DateStrip } from './components/DateStrip'
import { ThemeToggle } from './components/ThemeToggle'
import { TimeTable } from './components/TimeTable'
import { VenueMap } from './components/VenueMap'
import { isReceiving, openSlotCount, operatesOn, toISODate, upcomingDates } from './lib/availability'
import { useTheme } from './lib/useTheme'
import type { VenueData } from './types'

const DAYS = 14

export default function App() {
  const { pref, setPref } = useTheme()
  const [data, setData] = useState<VenueData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const dates = useMemo(() => upcomingDates(DAYS, now), [now])

  const [date, setDate] = useState(() => toISODate(new Date()))
  const [hour, setHour] = useState<number | null>(null)
  const [area, setArea] = useState('')
  const [query, setQuery] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'table' | 'map'>('table')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/tennis.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`데이터를 불러오지 못했어요 (${r.status})`)
        return r.json() as Promise<VenueData>
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  // 지난 시간 표시를 위해 1분마다 현재 시각 갱신
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const venues = useMemo(() => data?.venues ?? [], [data])
  const areas = useMemo(() => [...new Set(venues.map((v) => v.area).filter(Boolean))].sort(), [venues])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return venues
      .filter((v) => (area ? v.area === area : true))
      .filter((v) => (q ? `${v.name} ${v.place} ${v.area}`.toLowerCase().includes(q) : true))
      .filter((v) => operatesOn(v, date))
      .filter((v) => (onlyAvailable ? openSlotCount(v, date, hour, now) > 0 : true))
      .sort(
        (a, b) =>
          Number(isReceiving(b)) - Number(isReceiving(a)) ||
          openSlotCount(b, date, hour, now) - openSlotCount(a, date, hour, now) ||
          a.place.localeCompare(b.place, 'ko'),
      )
  }, [venues, area, query, date, onlyAvailable, hour, now])

  // 날짜별 예약 가능 시설 수 (지역·검색·시간 필터 반영)
  const dateCounts = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = venues
      .filter((v) => (area ? v.area === area : true))
      .filter((v) => (q ? `${v.name} ${v.place} ${v.area}`.toLowerCase().includes(q) : true))
    return Object.fromEntries(dates.map((d) => [d, base.filter((v) => openSlotCount(v, d, hour, now) > 0).length]))
  }, [venues, area, query, dates, hour, now])

  const selectVenue = (id: string) => {
    setSelectedId(id)
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
        <DateStrip dates={dates} value={date} counts={dateCounts} onChange={setDate} />
        <div className="filter-row">
          <input
            type="search"
            className="search"
            placeholder="공원·시설 이름 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="검색"
          />
          <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="지역">
            <option value="">전체 지역</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={hour ?? ''}
            onChange={(e) => setHour(e.target.value === '' ? null : Number(e.target.value))}
            aria-label="시간대"
          >
            <option value="">전체 시간</option>
            {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
              <option key={h} value={h}>
                {h}:00 ~ {h + 1}:00
              </option>
            ))}
          </select>
          <label className="switch">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
            <span>예약 가능만</span>
          </label>
        </div>
        <div className="legend" aria-hidden>
          <span>
            <i className="slot-dot open" /> 예약 가능
          </span>
          <span>
            <i className="slot-dot closed" /> 접수 마감
          </span>
          <span>
            <i className="slot-dot past" /> 지난 시간
          </span>
          <span className="hint">● 를 누르면 서울시 공공서비스예약 페이지로 이동해요</span>
        </div>
      </section>

      <div className="view-switch" role="tablist" aria-label="보기 방식">
        <button role="tab" aria-selected={mobileView === 'table'} onClick={() => setMobileView('table')}>
          시간표 ({filtered.length})
        </button>
        <button role="tab" aria-selected={mobileView === 'map'} onClick={() => setMobileView('map')}>
          지도
        </button>
      </div>

      <main className={`content show-${mobileView}`}>
        <section className="panel table-panel" aria-label="시간표">
          {error && <p className="notice error">{error}</p>}
          {!data && !error && <p className="empty">불러오는 중…</p>}
          {data && (
            <TimeTable
              venues={filtered}
              date={date}
              hour={hour}
              selectedId={selectedId}
              now={now}
              onSelectHour={setHour}
              onSelectVenue={(id) => {
                selectVenue(id)
                setMobileView('map')
              }}
            />
          )}
        </section>
        <section className="panel map-panel" aria-label="지도">
          <VenueMap
            venues={filtered}
            date={date}
            hour={hour}
            selectedId={selectedId}
            now={now}
            onSelectVenue={selectVenue}
          />
        </section>
      </main>

      <footer className="footer">
        <p>
          데이터: 서울시 공공서비스예약 OpenAPI (ListPublicReservationSport). 운영기간·운영시간·접수상태로 계산한 예약 가능
          후보이며, 실제 잔여 시간은 각 예약 페이지에서 확인하세요. 공휴일은 반영되지 않아요.
        </p>
      </footer>
    </div>
  )
}
