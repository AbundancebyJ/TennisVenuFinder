import type { DayType, Venue } from '../types'
import type { Holidays } from './holidays'

const pad = (n: number) => String(n).padStart(2, '0')

/** 로컬 날짜를 YYYY-MM-DD 로 */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function upcomingDates(days: number, from = new Date()): string[] {
  return Array.from({ length: days }, (_, i) =>
    toISODate(new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)),
  )
}

export const dayOfWeek = (date: string) => new Date(`${date}T00:00:00`).getDay()

/** 토·일·공휴일이면 주말 요금/서비스 기준 */
export function isWeekendOrHoliday(date: string, holidays: Holidays): boolean {
  const d = dayOfWeek(date)
  return d === 0 || d === 6 || date in holidays
}

export const dateDayType = (date: string, holidays: Holidays): Exclude<DayType, 'all'> =>
  isWeekendOrHoliday(date, holidays) ? 'weekend' : 'weekday'

export const isReceiving = (v: Venue) => v.status === '접수중'

/** 평일/주말 구분이 맞는지 (구분 없는 서비스는 둘 다 해당) */
export const matchesDayType = (v: Venue, type: Exclude<DayType, 'all'>) => v.dayType === 'all' || v.dayType === type

/** 해당 날짜에 이 서비스가 운영되는지 (운영기간 + 평일/주말·공휴일 구분) */
export function operatesOn(v: Venue, date: string, holidays: Holidays): boolean {
  if (v.openStart && date < v.openStart) return false
  if (v.openEnd && date > v.openEnd) return false
  return matchesDayType(v, dateDayType(date, holidays))
}

/** 이름 정렬용: "2026년", "(평일)" 같은 군더더기 없이 비교 */
export function compareVenues(a: Venue, b: Venue): number {
  return (
    a.area.localeCompare(b.area, 'ko') ||
    a.place.localeCompare(b.place, 'ko') ||
    a.name.localeCompare(b.name, 'ko', { numeric: true })
  )
}
