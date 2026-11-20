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

/** 특정 날짜·시간대의 상태 */
export type SlotState =
  | 'open' // 접수중 + 운영시간 내 → 예약 가능 후보
  | 'closed' // 운영시간 내지만 접수 마감/중지
  | 'past' // 이미 지난 시간
  | 'none' // 운영하지 않음
