import { useEffect, useMemo, useRef, useState } from 'react'
import { isReceiving } from '../lib/availability'
import { loadKakaoMaps, type KCustomOverlay, type KakaoMaps, type KMap } from '../lib/kakao'
import { groupPlaces, kakaoRouteUrl, placeKey, venueHref, type Place } from '../lib/places'
import type { Venue } from '../types'

interface Props {
  appKey: string
  venues: Venue[]
  selectedId: string | null
  onSelectVenue: (id: string) => void
  /** SDK 로드 실패 시 (다른 지도로 대체) */
  onError: (message: string) => void
}

const SEOUL = { lat: 37.5665, lng: 126.978 }

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (text !== undefined) e.textContent = text
  return e
}

/** 장소 정보 말풍선 (API 데이터는 textContent로만 넣음) */
function popupContent(p: Place, onClose: () => void) {
  const box = el('div', 'k-popup')
  const head = el('div', 'k-popup-head')
  head.append(el('strong', undefined, p.name))
  const close = el('button', 'k-popup-close', '×')
  close.setAttribute('aria-label', '닫기')
  close.onclick = onClose
  head.append(close)
  box.append(head)
  const ul = el('ul', 'popup-list')
  for (const v of p.venues) {
    const li = el('li')
    const a = el('a', undefined, v.name)
    a.href = v.url
    a.target = '_blank'
    a.rel = 'noreferrer'
    li.append(a, el('span', isReceiving(v) ? 'ok' : 'no', ` ${v.status}`))
    ul.append(li)
  }
  box.append(ul)
  const links = el('div', 'k-links')
  const detail = el('a', 'k-route', '상세 보기 ›')
  detail.href = venueHref(placeKey(p.venues[0]))
  const route = el('a', 'k-route', '길찾기 →')
  route.href = kakaoRouteUrl(p.name, p.lat, p.lng)
  route.target = '_blank'
  route.rel = 'noreferrer'
  links.append(detail, route)
  box.append(links)
  // 말풍선 안 클릭이 지도 클릭(닫기)으로 전달되지 않게
  box.addEventListener('mousedown', (e) => e.stopPropagation())
  box.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true })
  return box
}

export function KakaoMap({ appKey, venues, selectedId, onSelectVenue, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [api, setApi] = useState<{ maps: KakaoMaps; map: KMap } | null>(null)
  const markers = useRef<{ place: Place; overlay: KCustomOverlay; dot: HTMLElement }[]>([])
  const popup = useRef<KCustomOverlay | null>(null)
  const onSelect = useRef(onSelectVenue)
  useEffect(() => {
    onSelect.current = onSelectVenue
  })

  const places = useMemo(() => groupPlaces(venues), [venues])
  const placeSig = places.map((p) => p.key).join('|')
  const placesRef = useRef(places)
  useEffect(() => {
    placesRef.current = places
  })

  // 지도 생성
  useEffect(() => {
    let cancelled = false
    loadKakaoMaps(appKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return
        const map = new maps.Map(containerRef.current, { center: new maps.LatLng(SEOUL.lat, SEOUL.lng), level: 8 })
        map.addControl(new maps.ZoomControl(), maps.ControlPosition.RIGHT)
        maps.event.addListener(map, 'click', () => popup.current?.setMap(null))
        setApi({ maps, map })
      })
      .catch((e: Error) => !cancelled && onError(e.message))
    return () => {
      cancelled = true
    }
  }, [appKey, onError])

  // 숨겨졌던 지도가 다시 보이거나 크기가 바뀌면 다시 그림 (모바일 탭 전환)
  useEffect(() => {
    if (!api || !containerRef.current) return
    const ro = new ResizeObserver(() => api.map.relayout())
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [api])

  const showPopup = (p: Place) => {
    if (!api) return
    popup.current?.setMap(null)
    popup.current = new api.maps.CustomOverlay({
      position: new api.maps.LatLng(p.lat, p.lng),
      content: popupContent(p, () => popup.current?.setMap(null)),
      yAnchor: 1.15,
      zIndex: 10,
      clickable: true,
    })
    popup.current.setMap(api.map)
  }
  const showPopupRef = useRef(showPopup)
  useEffect(() => {
    showPopupRef.current = showPopup
  })

  // 마커 그리기 (시설 구성이 바뀔 때만 범위 다시 맞춤)
  useEffect(() => {
    if (!api) return
    const { maps, map } = api
    const places = placesRef.current
    for (const m of markers.current) m.overlay.setMap(null)
    popup.current?.setMap(null)
    markers.current = places.map((place) => {
      const dot = el('button', `k-marker ${place.open > 0 ? 'open' : 'closed'}`)
      dot.title = place.name
      dot.setAttribute('aria-label', `${place.name} 지도에서 보기`)
      dot.onclick = () => {
        onSelect.current(place.venues[0].id)
        showPopupRef.current(place)
      }
      const overlay = new maps.CustomOverlay({
        position: new maps.LatLng(place.lat, place.lng),
        content: dot,
        yAnchor: 0.5,
        xAnchor: 0.5,
        clickable: true,
      })
      overlay.setMap(map)
      return { place, overlay, dot }
    })
    if (places.length === 1) {
      map.setCenter(new maps.LatLng(places[0].lat, places[0].lng))
      map.setLevel(5)
    } else if (places.length > 1) {
      const bounds = new maps.LatLngBounds()
      for (const p of places) bounds.extend(new maps.LatLng(p.lat, p.lng))
      map.setBounds(bounds, 40, 40, 40, 40)
    }
    // placeSig: 지도에 표시할 시설 구성이 바뀔 때만 다시 그림
  }, [api, placeSig])

  // 목록에서 선택한 테니스장으로 이동
  useEffect(() => {
    if (!api || !selectedId) return
    let found: { place: Place; overlay: KCustomOverlay; dot: HTMLElement } | undefined
    for (const m of markers.current) {
      const active = m.place.venues.some((v) => v.id === selectedId)
      m.dot.classList.toggle('active', active)
      m.overlay.setZIndex(active ? 5 : 1)
      if (active) found = m
    }
    if (!found) return
    const { maps, map } = api
    if (map.getLevel() > 5) map.setLevel(5, { animate: true })
    map.panTo(new maps.LatLng(found.place.lat, found.place.lng))
    showPopupRef.current(found.place)
  }, [api, selectedId, placeSig])

  return <div ref={containerRef} className="map kakao-map" />
}
