import { HOURS, slotState } from '../lib/availability'
import type { SlotState, Venue } from '../types'

interface Props {
  venues: Venue[]
  date: string
  hour: number | null
  selectedId: string | null
  now: Date
  onSelectHour: (hour: number | null) => void
  onSelectVenue: (id: string) => void
}

const LABEL: Record<SlotState, string> = {
  open: '예약 가능',
  closed: '접수 마감',
  past: '지난 시간',
  none: '운영 안 함',
}

export function TimeTable({ venues, date, hour, selectedId, now, onSelectHour, onSelectVenue }: Props) {
  if (venues.length === 0) {
    return <p className="empty">조건에 맞는 테니스장이 없어요. 날짜나 필터를 바꿔 보세요.</p>
  }
  return (
    <div className="timetable-wrap">
      <table className="timetable">
        <thead>
          <tr>
            <th scope="col" className="venue-col">
              테니스장
            </th>
            {HOURS.map((h) => (
              <th key={h} scope="col" className={`hour-col${hour === h ? ' active' : ''}`}>
                <button
                  onClick={() => onSelectHour(hour === h ? null : h)}
                  aria-pressed={hour === h}
                  title={`${h}시 시간대만 보기`}
                >
                  {h}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {venues.map((v) => (
            <tr key={v.id} className={v.id === selectedId ? 'selected' : undefined}>
              <th scope="row" className="venue-col">
                <button className="venue-name" onClick={() => onSelectVenue(v.id)}>
                  <span className="place">{v.place}</span>
                  <span className="svc">{v.name}</span>
                  <span className="sub">
                    {v.area} · {v.payment} · <span className={`status s-${v.status === '접수중' ? 'on' : 'off'}`}>{v.status}</span>
                  </span>
                </button>
              </th>
              {HOURS.map((h) => {
                const s = slotState(v, date, h, now)
                return (
                  <td
                    key={h}
                    className={`slot ${s}${hour === h ? ' hl' : ''}`}
                    title={`${h}:00–${h + 1}:00 ${LABEL[s]}`}
                  >
                    {s === 'open' ? (
                      <a href={v.url} target="_blank" rel="noreferrer" aria-label={`${v.name} ${h}시 예약 페이지`}>
                        ●
                      </a>
                    ) : (
                      <span aria-label={LABEL[s]} />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
