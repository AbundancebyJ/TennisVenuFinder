import { useEffect, useMemo, useRef } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { isReceiving } from '../lib/availability'
import { groupPlaces, kakaoRouteUrl, placeKey, venueHref, type Place } from '../lib/places'
import type { Venue } from '../types'

interface Props {
  venues: Venue[]
  selectedId: string | null
  onSelectVenue: (id: string) => void
}

const SEOUL: [number, number] = [37.5665, 126.978]

function FitBounds({ places }: { places: Place[] }) {
  const map = useMap()
  const latest = useRef(places)
  useEffect(() => {
    latest.current = places
  })
  // 시설 구성이 바뀔 때만 다시 맞춤 (시간대 변경 등으로는 지도가 움직이지 않도록)
  const sig = places.map((p) => p.key).join('|')
  useEffect(() => {
    const places = latest.current
    if (places.length === 0) return
    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 14)
      return
    }
    const bounds: LatLngBoundsExpression = places.map((p) => [p.lat, p.lng])
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 })
  }, [sig, map])
  return null
}

// 모바일에서 숨겨졌던 지도가 다시 보일 때 크기 재계산
function AutoResize() {
  const map = useMap()
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    return () => ro.disconnect()
  }, [map])
  return null
}

function FlyTo({ place }: { place: Place | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (place) map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 14), { duration: 0.6 })
  }, [place, map])
  return null
}

export default function LeafletMap({ venues, selectedId, onSelectVenue }: Props) {
  const places = useMemo(() => groupPlaces(venues), [venues])

  const selectedPlace = places.find((p) => p.venues.some((v) => v.id === selectedId))

  return (
    <MapContainer center={SEOUL} zoom={11} className="map" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AutoResize />
      <FitBounds places={places} />
      <FlyTo place={selectedPlace} />
      {places.map((p) => {
        const active = p === selectedPlace
        return (
          <CircleMarker
            key={p.key}
            center={[p.lat, p.lng]}
            radius={active ? 13 : 9}
            className={`marker ${p.open > 0 ? 'marker-open' : 'marker-closed'}${active ? ' marker-active' : ''}`}
            pathOptions={{ weight: active ? 3 : 2, fillOpacity: 0.85 }}
            eventHandlers={{ click: () => onSelectVenue(p.venues[0].id) }}
          >
            <Popup>
              <strong>{p.name}</strong>
              <ul className="popup-list">
                {p.venues.map((v) => {
                  const on = isReceiving(v)
                  return (
                    <li key={v.id}>
                      <a href={v.url} target="_blank" rel="noreferrer">
                        {v.name}
                      </a>
                      <span className={on ? 'ok' : 'no'}> {v.status}</span>
                    </li>
                  )
                })}
              </ul>
              <div className="k-links">
                <a className="k-route" href={venueHref(placeKey(p.venues[0]))}>
                  상세 보기 ›
                </a>
                <a className="k-route" href={kakaoRouteUrl(p.name, p.lat, p.lng)} target="_blank" rel="noreferrer">
                  길찾기 →
                </a>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
