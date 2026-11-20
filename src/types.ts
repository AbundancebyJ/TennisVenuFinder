export type DayType = 'weekday' | 'weekend' | 'all'

export interface Venue {
  id: string
  name: string
  place: string
  area: string
  status: string
  payment: string
  target: string
  url: string
  image: string | null
  tel: string | null
  lat: number | null
  lng: number | null
  openStart: string | null
  openEnd: string | null
  receiptStart: string | null
  receiptEnd: string | null
  hourStart: string | null
  hourEnd: string | null
  dayType: DayType
  cancelRule: string | null
}

export interface VenueData {
  fetchedAt: string
  total: number
  partial: boolean
  venues: Venue[]
}
