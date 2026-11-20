// 카카오 지도 JavaScript SDK 로더 (필요한 타입만 최소로 선언)
// 붙여넣기 시 섞인 공백·줄바꿈 제거
export const KAKAO_MAP_KEY: string | undefined = import.meta.env.VITE_KAKAO_MAP_KEY?.trim() || undefined

export interface KLatLng {
  getLat(): number
  getLng(): number
}
export interface KMap {
  setBounds(b: KLatLngBounds, ...padding: number[]): void
  setCenter(p: KLatLng): void
  panTo(p: KLatLng): void
  getLevel(): number
  setLevel(level: number, opts?: { animate?: boolean }): void
  relayout(): void
  addControl(control: unknown, position: number): void
}
export interface KLatLngBounds {
  extend(p: KLatLng): void
}
export interface KCustomOverlay {
  setMap(map: KMap | null): void
  setZIndex(z: number): void
}
export interface KakaoMaps {
  load(cb: () => void): void
  Map: new (el: HTMLElement, opts: { center: KLatLng; level: number }) => KMap
  LatLng: new (lat: number, lng: number) => KLatLng
  LatLngBounds: new () => KLatLngBounds
  CustomOverlay: new (opts: {
    position: KLatLng
    content: HTMLElement
    yAnchor?: number
    xAnchor?: number
    zIndex?: number
    clickable?: boolean
  }) => KCustomOverlay
  ZoomControl: new () => unknown
  ControlPosition: { RIGHT: number }
  event: { addListener(target: unknown, type: string, handler: () => void): void }
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps }
  }
}

let loading: Promise<KakaoMaps> | null = null

export function loadKakaoMaps(appKey: string): Promise<KakaoMaps> {
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const done = () => window.kakao!.maps.load(() => resolve(window.kakao!.maps))
    if (window.kakao?.maps) return done()
    const s = document.createElement('script')
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`
    s.async = true
    s.onload = () => (window.kakao?.maps ? done() : reject(new Error('카카오 지도 SDK를 불러오지 못했어요.')))
    s.onerror = () => reject(new Error('카카오 지도 SDK를 불러오지 못했어요. 앱 키와 등록된 사이트 도메인을 확인하세요.'))
    document.head.appendChild(s)
  })
  loading.catch(() => (loading = null))
  return loading
}
