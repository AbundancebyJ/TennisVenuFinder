export type Surface = 'hard' | 'clay' | 'grass' | 'carpet'

export interface Venue {
  id: string
  name: string
  address: string
  region: string
  surface: Surface
  courts: number
  indoor: boolean
  lat: number
  lng: number
}
