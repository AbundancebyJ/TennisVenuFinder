import { useEffect, useMemo, useState } from 'react'
import { isReceiving } from '../lib/availability'
import { kakaoRouteUrl, kakaoSearchUrl, placeKey, placeName } from '../lib/places'
import { goBackToList } from '../lib/useHashRoute'
import type { DetailSection, KakaoPlace, Venue } from '../types'
import { VenueMap } from './VenueMap'

interface Props {
  placeId: string
  venues: Venue[]
  kakaoPlace: KakaoPlace | undefined
}

const DAY_LABEL = { weekday: '평일', weekend: '주말·공휴일', all: '평일·주말' } as const

const fmtDate = (d: string | null) => (d ? d.replace(/-/g, '.') : '-')
const fmtDateTime = (d: string | null) => (d ? d.replace(/-/g, '.').replace('T', ' ') : '-')
const uniq = <T,>(xs: (T | null | undefined)[]) => [...new Set(xs.filter((x): x is T => x !== null && x !== undefined && x !== ''))]

/** 공백·줄바꿈 차이는 무시하고 내용이 같은지 비교 */
const signature = (sections: DetailSection[]) =>
  sections.map((s) => `${s.title}:${s.body.replace(/\s+/g, ' ').trim()}`).join('|')

// 상세내용은 처음 상세 페이지를 열 때 한 번만 내려받음
let detailsCache: Promise<Record<string, DetailSection[]>> | null = null
function loadDetails() {
  detailsCache ??= fetch(`${import.meta.env.BASE_URL}data/details.json`)
    .then((r) => (r.ok ? r.json() : { details: {} }))
    .then((d: { details: Record<string, DetailSection[]> }) => d.details)
    .catch(() => ({}))
  return detailsCache
}

export function VenueDetail({ placeId, venues, kakaoPlace }: Props) {
  const items = useMemo(() => venues.filter((v) => placeKey(v) === placeId), [venues, placeId])
  const [details, setDetails] = useState<Record<string, DetailSection[]> | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [placeId])
  useEffect(() => {
    loadDetails().then(setDetails)
  }, [])

  if (items.length === 0) {
    return (
      <section className="detail panel">
        <button className="back" onClick={goBackToList}>
          ← 목록으로
        </button>
        <p className="empty">테니스장 정보를 찾을 수 없어요. 예약 서비스가 종료됐을 수 있어요.</p>
      </section>
    )
  }

  const first = items[0]
  const name = placeName(first)
  const image = items.find((v) => v.image)?.image
  const open = items.filter(isReceiving).length
  const tels = uniq([kakaoPlace?.phone, ...items.map((v) => v.tel)])
  const address = kakaoPlace?.roadAddress || kakaoPlace?.address
  const hasCoords = first.lat !== null && first.lng !== null

  // 서비스마다 상세내용이 같으면 한 번만 보여줌
  const detailGroups: { sections: DetailSection[]; names: string[] }[] = []
  for (const v of items) {
    const sections = details?.[v.id] ?? []
    if (!sections.length) continue
    const sig = signature(sections)
    const g = detailGroups.find((x) => signature(x.sections) === sig)
    if (g) g.names.push(v.name)
    else detailGroups.push({ sections, names: [v.name] })
  }

  return (
    <article className="detail">
      <button className="back" onClick={goBackToList}>
        ← 목록으로
      </button>

      <header className="detail-hero panel">
        {image && !imgFailed && (
          <img
            className="detail-img"
            src={image}
            alt={`${name} 사진`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        )}
        <div className="detail-title">
          <p className="detail-area">{first.area}</p>
          <h2>{name}</h2>
          {address && <p className="detail-address">{address}</p>}
          <p className="detail-badges">
            <span className={`status ${open ? 's-on' : 's-off'}`}>
              접수중 {open}/{items.length}
            </span>
            {uniq(items.map((v) => v.payment)).map((p) => (
              <span key={p} className="chip">
                {p}
              </span>
            ))}
          </p>
          <div className="detail-actions">
            {hasCoords && (
              <a className="btn" href={kakaoRouteUrl(name, first.lat!, first.lng!)} target="_blank" rel="noreferrer">
                🧭 길찾기
              </a>
            )}
            <a
              className="btn"
              href={kakaoPlace?.url ?? kakaoSearchUrl(`${first.area} ${name}`)}
              target="_blank"
              rel="noreferrer"
            >
              ⭐ 카카오맵 후기 보기
            </a>
            {tels[0] && (
              <a className="btn" href={`tel:${tels[0]}`}>
                📞 전화
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="detail-grid">
        <section className="panel detail-section">
          <h3>기본 정보</h3>
          <dl className="facts">
            <dt>장소</dt>
            <dd>
              {first.area} {first.place}
            </dd>
            {address && (
              <>
                <dt>주소</dt>
                <dd>{address}</dd>
              </>
            )}
            <dt>이용대상</dt>
            <dd>{uniq(items.map((v) => v.target)).join(', ') || '-'}</dd>
            <dt>이용요금</dt>
            <dd>{uniq(items.map((v) => v.payment)).join(', ') || '-'}</dd>
            <dt>이용시간</dt>
            <dd>{uniq(items.map((v) => (v.hourStart && v.hourEnd ? `${v.hourStart}~${v.hourEnd}` : null))).join(', ') || '-'}</dd>
            <dt>취소기준</dt>
            <dd>{uniq(items.map((v) => v.cancelRule)).join(', ') || '-'}</dd>
            <dt>문의전화</dt>
            <dd>
              {tels.length
                ? tels.map((t, i) => (
                    <span key={t}>
                      {i > 0 && ', '}
                      <a href={`tel:${t}`}>{t}</a>
                    </span>
                  ))
                : '-'}
            </dd>
          </dl>
        </section>

        <section className="panel detail-map">
          {hasCoords ? (
            <VenueMap venues={items} selectedId={selectedId} onSelectVenue={setSelectedId} />
          ) : (
            <p className="empty">위치 정보가 없어요.</p>
          )}
        </section>
      </div>

      <section className="panel detail-section">
        <h3>예약 서비스 ({items.length})</h3>
        <ul className="svc-list">
          {items.map((v) => {
            const on = isReceiving(v)
            return (
              <li key={v.id} className={`svc-item${on ? '' : ' off'}`}>
                <div className="svc-head">
                  <strong>{v.name}</strong>
                  <span className={`status ${on ? 's-on' : 's-off'}`}>{v.status}</span>
                </div>
                <dl className="svc-facts">
                  <dt>구분</dt>
                  <dd>
                    <span className={`chip day-${v.dayType}`}>{DAY_LABEL[v.dayType]}</span>
                  </dd>
                  <dt>접수기간</dt>
                  <dd>
                    {fmtDateTime(v.receiptStart)} ~ {fmtDateTime(v.receiptEnd)}
                  </dd>
                  <dt>이용기간</dt>
                  <dd>
                    {fmtDate(v.openStart)} ~ {fmtDate(v.openEnd)}
                  </dd>
                  <dt>이용시간</dt>
                  <dd>{v.hourStart && v.hourEnd ? `${v.hourStart} ~ ${v.hourEnd}` : '-'}</dd>
                </dl>
                <a className={`reserve${on ? '' : ' muted'}`} href={v.url} target="_blank" rel="noreferrer">
                  예약사이트 <span aria-hidden>↗</span>
                </a>
              </li>
            )
          })}
        </ul>
      </section>

      {details === null && <p className="empty">상세 안내를 불러오는 중…</p>}
      {detailGroups.map((g, i) => (
        <section key={i} className="panel detail-section">
          <h3>상세 안내</h3>
          {detailGroups.length > 1 && <p className="detail-for">{g.names.join(', ')}</p>}
          {g.sections.map((s, j) => (
            <div key={j} className="detail-block">
              <h4>{s.title}</h4>
              <p className="detail-text">{s.body}</p>
            </div>
          ))}
        </section>
      ))}

      <section className="panel detail-section review">
        <h3>카카오맵 후기</h3>
        <p className="muted-text">
          카카오맵은 후기를 외부에 제공하지 않아서, 별점과 방문 후기는 카카오맵에서 확인할 수 있어요.
          {!kakaoPlace && ' (정확한 장소를 찾지 못해 검색 결과로 연결돼요.)'}
        </p>
        <a
          className="btn btn-primary"
          href={kakaoPlace?.url ?? kakaoSearchUrl(`${first.area} ${name}`)}
          target="_blank"
          rel="noreferrer"
        >
          카카오맵에서 {kakaoPlace?.name ?? name} 후기 보기 →
        </a>
      </section>
    </article>
  )
}
