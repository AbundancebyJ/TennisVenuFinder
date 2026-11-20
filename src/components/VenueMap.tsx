import { lazy, Suspense, useCallback, useState } from 'react'
import { KAKAO_MAP_KEY } from '../lib/kakao'
import type { Venue } from '../types'
import { KakaoMap } from './KakaoMap'

// 카카오 키가 없거나 SDK 로드에 실패하면 OpenStreetMap(Leaflet)으로 대체 — 필요할 때만 내려받음
const LeafletMap = lazy(() => import('./LeafletMap'))

interface Props {
  venues: Venue[]
  selectedId: string | null
  onSelectVenue: (id: string) => void
}

export function VenueMap(props: Props) {
  const [kakaoError, setKakaoError] = useState<string | null>(null)
  const onError = useCallback((msg: string) => {
    console.warn(msg)
    setKakaoError(msg)
  }, [])

  if (KAKAO_MAP_KEY && !kakaoError) return <KakaoMap appKey={KAKAO_MAP_KEY} onError={onError} {...props} />
  return (
    <Suspense fallback={<div className="map map-loading">지도를 불러오는 중…</div>}>
      <LeafletMap {...props} />
    </Suspense>
  )
}
