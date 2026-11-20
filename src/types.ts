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

export type WeatherIcon = 'sun' | 'partly' | 'cloud' | 'rain' | 'snow' | 'sleet' | 'shower'

export interface DayWeather {
  icon: WeatherIcon | null
  tmin: number | null
  tmax: number | null
  /** 강수확률(%) */
  pop: number | null
  source: 'short' | 'mid'
}

export interface WeatherData {
  fetchedAt: string
  region: string
  days: Record<string, DayWeather>
}

export interface DetailSection {
  title: string
  body: string
}

export interface KakaoPlace {
  id: string
  name: string
  url: string
  address: string | null
  roadAddress: string | null
  phone: string | null
  category: string | null
}
