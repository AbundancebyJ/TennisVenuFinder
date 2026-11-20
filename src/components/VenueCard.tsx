import type { Venue } from '../types/venue'

const surfaceLabel: Record<Venue['surface'], string> = {
  hard: '하드',
  clay: '클레이',
  grass: '잔디',
  carpet: '인조잔디/카펫',
}

export function VenueCard({ venue }: { venue: Venue }) {
  return (
    <li className="venue-card">
      <h2>{venue.name}</h2>
      <p className="address">{venue.address}</p>
      <p className="meta">
        {surfaceLabel[venue.surface]} · 코트 {venue.courts}면 · {venue.indoor ? '실내' : '실외'}
      </p>
    </li>
  )
}
