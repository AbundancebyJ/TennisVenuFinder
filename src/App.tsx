import { useMemo, useState } from 'react'
import { venues } from './data/venues'
import { VenueCard } from './components/VenueCard'

export default function App() {
  const [query, setQuery] = useState('')
  const [indoorOnly, setIndoorOnly] = useState(false)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return venues.filter(
      (v) =>
        (!indoorOnly || v.indoor) &&
        (q === '' || `${v.name} ${v.address} ${v.region}`.toLowerCase().includes(q)),
    )
  }, [query, indoorOnly])

  return (
    <main className="app">
      <h1>🎾 Tennis Venue Finder</h1>
      <div className="filters">
        <input
          type="search"
          placeholder="테니스장 이름, 주소, 지역으로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={indoorOnly}
            onChange={(e) => setIndoorOnly(e.target.checked)}
          />
          실내만
        </label>
      </div>
      <p className="count">{results.length}곳</p>
      <ul className="venue-list">
        {results.map((v) => (
          <VenueCard key={v.id} venue={v} />
        ))}
      </ul>
    </main>
  )
}
