import { isReceiving } from '../lib/availability'
import type { Venue } from '../types'

interface Props {
  venues: Venue[]
  selectedId: string | null
  onSelectVenue: (id: string) => void
}

const DAY_LABEL = { weekday: '평일', weekend: '주말·공휴일', all: '전체' } as const

// 서비스명에서 반복되는 연도·평일/주말 표기와 시설명을 덜어내 짧게
function shortName(v: Venue) {
  const s = v.name
    .replace(/\(?\s*(평일|주말|토\/일\/공휴일|토요일|일요일|공휴일)[^)]*\)?/g, '')
    .replace(/-?\s*20\d\d년\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return s || v.name
}

export function VenueList({ venues, selectedId, onSelectVenue }: Props) {
  if (venues.length === 0) {
    return <p className="empty">조건에 맞는 테니스장이 없어요. 날짜나 필터를 바꿔 보세요.</p>
  }

  const groups: { area: string; items: Venue[] }[] = []
  for (const v of venues) {
    const last = groups.at(-1)
    if (last && last.area === v.area) last.items.push(v)
    else groups.push({ area: v.area || '기타', items: [v] })
  }

  return (
    <div className="venue-list">
      {groups.map((g) => (
        <section key={g.area} className="area-group" aria-label={g.area}>
          <h2 className="area-title">
            {g.area} <span>{g.items.length}</span>
          </h2>
          <ul>
            {g.items.map((v) => {
              const on = isReceiving(v)
              return (
                <li key={v.id} className={`venue-row${v.id === selectedId ? ' selected' : ''}${on ? '' : ' off'}`}>
                  <button className="venue-main" onClick={() => onSelectVenue(v.id)} title="지도에서 보기">
                    <span className="place">{v.place}</span>
                    <span className="svc">{shortName(v)}</span>
                  </button>
                  <div className="venue-meta">
                    <span className={`chip day-${v.dayType}`}>{DAY_LABEL[v.dayType]}</span>
                    {v.hourStart && v.hourEnd && (
                      <span className="hours">
                        {v.hourStart}–{v.hourEnd}
                      </span>
                    )}
                    <span className="pay">{v.payment}</span>
                  </div>
                  <div className="venue-action">
                    <span className={`status ${on ? 's-on' : 's-off'}`}>{v.status}</span>
                    <a className={`reserve${on ? '' : ' disabled'}`} href={v.url} target="_blank" rel="noreferrer">
                      {on ? '예약하기' : '상세'}
                    </a>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
