import { isReceiving } from './availability'
import type { Venue } from '../types'

export interface Place {
  key: string
  name: string
  lat: number
  lng: number
  venues: Venue[]
  /** 접수중인 서비스 수 */
  open: number
}

/** "난지물재생센터>난지물재생센터 테니스장" 처럼 계층이 붙은 시설명은 마지막 부분만 */
export const placeName = (v: Venue) => v.place.split('>').pop()!.trim() || v.place

/** 테니스장(구 + 시설명) 식별자 — 목록 묶음, 상세 페이지 주소, 카카오 장소 매칭에 공통 사용 */
export const placeKey = (v: Venue) => `${v.area}|${placeName(v)}`

/** 상세 페이지 주소 (GitHub Pages에서도 동작하도록 해시 라우팅) */
export const venueHref = (key: string) => `#/venue/${encodeURIComponent(key)}`

/** 좌표가 같은 서비스끼리 한 장소로 묶음 */
export function groupPlaces(venues: Venue[]): Place[] {
  const byKey = new Map<string, Place>()
  for (const v of venues) {
    if (v.lat === null || v.lng === null) continue
    const key = `${v.lat.toFixed(4)},${v.lng.toFixed(4)}`
    const p = byKey.get(key) ?? { key, name: placeName(v), lat: v.lat, lng: v.lng, venues: [], open: 0 }
    p.venues.push(v)
    p.open += Number(isReceiving(v))
    byKey.set(key, p)
  }
  return [...byKey.values()]
}

/** 카카오맵 길찾기(도착지) 링크 */
export const kakaoRouteUrl = (name: string, lat: number, lng: number) =>
  `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`

/** 카카오맵 검색 링크 (장소 매칭 정보가 없을 때) */
export const kakaoSearchUrl = (query: string) => `https://map.kakao.com/link/search/${encodeURIComponent(query)}`
