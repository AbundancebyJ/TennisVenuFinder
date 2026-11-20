import { isReceiving } from '../lib/availability'
import type { Venue } from '../types'

interface Props {
  venues: Venue[]
  selectedId: string | null
  onSelectVenue: (id: string) => void
}

const DAY_LABEL = { weekday: '평일', weekend: '주말·공휴일', all: '평일·주말' } as const

/** "난지물재생센터>난지물재생센터 테니스장" 처럼 계층이 붙은 시설명은 마지막 부분만 */
const placeName = (v: Venue) => v.place.split('>').pop()!.trim() || v.place

/** 같은 테니스장 안에서 구분되도록 서비스명에서 반복 정보(연도·요일·시설명) 제거 */
function courtName(v: Venue) {
  const place = placeName(v)
  let s = v.name
    .replace(/\(?\s*(평일|주말|토\/일\/공휴일|토요일|일요일|공휴일)[^)]*\)?/g, ' ')
    .replace(/-?\s*20\d\d년\s*/g, ' ')
  for (const word of [place, v.place, ...place.split(/\s+/)]) {
    if (word.length >= 2) s = s.split(word).join(' ')
  }
  s = s
    .replace(/\(\s*\)/g, ' ')
    .replace(/^[\s\-_>·]+|[\s\-_>·]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return s || '테니스장'
}

interface PlaceGroup {
  key: string
  name: string
  items: Venue[]
}

function groupBy(venues: Venue[]) {
  const areas: { area: string; places: PlaceGroup[]; count: number }[] = []
  for (const v of venues) {
    const area = v.area || '기타'
    let a = areas.at(-1)
    if (!a || a.area !== area) areas.push((a = { area, places: [], count: 0 }))
    const name = placeName(v)
    let p = a.places.find((x) => x.name === name)
    if (!p) a.places.push((p = { key: `${area}|${name}`, name, items: [] }))
    p.items.push(v)
    a.count++
  }
  return areas
}

export function VenueList({ venues, selectedId, onSelectVenue }: Props) {
  if (venues.length === 0) {
    return <p className="empty">조건에 맞는 테니스장이 없어요. 날짜나 필터를 바꿔 보세요.</p>
  }

  return (
    <div className="venue-list">
      {groupBy(venues).map((a) => (
        <section key={a.area} className="area-group" aria-label={a.area}>
          <h2 className="area-title">
            {a.area} <span>테니스장 {a.places.length}곳</span>
          </h2>
          {a.places.map((p) => {
            const first = p.items[0]
            const selected = p.items.some((v) => v.id === selectedId)
            const open = p.items.filter(isReceiving).length
            const pays = [...new Set(p.items.map((v) => v.payment).filter(Boolean))].join('·')
            return (
              <article key={p.key} className={`place-card${selected ? ' selected' : ''}`}>
                <header className="place-head">
                  <button className="place-name" onClick={() => onSelectVenue(first.id)} title="지도에서 보기">
                    <span aria-hidden>📍</span> {p.name}
                  </button>
                  <span className="place-sub">
                    {pays && <span>{pays}</span>}
                    {first.tel && (
                      <a href={`tel:${first.tel}`} className="tel">
                        {first.tel}
                      </a>
                    )}
                    <span className={open ? 'cnt on' : 'cnt'}>
                      접수중 {open}/{p.items.length}
                    </span>
                  </span>
                </header>
                <ul className="court-list">
                  {p.items.map((v) => {
                    const on = isReceiving(v)
                    return (
                      <li key={v.id} className={`court-row${on ? '' : ' off'}`}>
                        <span className="court-name" title={v.name}>
                          {courtName(v)}
                        </span>
                        <span className="court-meta">
                          <span className={`chip day-${v.dayType}`}>{DAY_LABEL[v.dayType]}</span>
                          {v.hourStart && v.hourEnd && (
                            <span className="hours">
                              {v.hourStart}–{v.hourEnd}
                            </span>
                          )}
                        </span>
                        <span className={`status ${on ? 's-on' : 's-off'}`}>{v.status}</span>
                        <a className={`reserve${on ? '' : ' muted'}`} href={v.url} target="_blank" rel="noreferrer">
                          예약사이트 이동
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </article>
            )
          })}
        </section>
      ))}
    </div>
  )
}
