import type { SlotState, Venue } from '../types'

export const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 06시 ~ 22시 시작 슬롯

const pad = (n: number) => String(n).padStart(2, '0')

/** 로컬 날짜를 YYYY-MM-DD 로 */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function upcomingDates(days: number, from = new Date()): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)
    return toISODate(d)
  })
}

export function isWeekend(date: string): boolean {
  const day = new Date(`${date}T00:00:00`).getDay()
  return day === 0 || day === 6
}

const hourOf = (hhmm: string | null) => (hhmm ? Number(hhmm.slice(0, 2)) + Number(hhmm.slice(3, 5)) / 60 : null)

export const isReceiving = (v: Venue) => v.status === '접수중'

/** 해당 날짜에 이 서비스가 운영되는지 (운영기간 + 평일/주말 구분) */
export function operatesOn(v: Venue, date: string): boolean {
  if (v.openStart && date < v.openStart) return false
  if (v.openEnd && date > v.openEnd) return false
  if (v.dayType === 'weekday' && isWeekend(date)) return false
  if (v.dayType === 'weekend' && !isWeekend(date)) return false
  return true
}

export function slotState(v: Venue, date: string, hour: number, now = new Date()): SlotState {
  if (!operatesOn(v, date)) return 'none'
  const start = hourOf(v.hourStart) ?? 0
  const end = hourOf(v.hourEnd) ?? 24
  if (hour < start || hour + 1 > end) return 'none'
  const today = toISODate(now)
  if (date < today || (date === today && hour <= now.getHours())) return 'past'
  return isReceiving(v) ? 'open' : 'closed'
}

/** 날짜(+선택 시간)에 예약 가능한 슬롯 수 */
export function openSlotCount(v: Venue, date: string, hour: number | null, now = new Date()): number {
  const hours = hour === null ? HOURS : [hour]
  return hours.filter((h) => slotState(v, date, h, now) === 'open').length
}
