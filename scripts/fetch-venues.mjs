// 서울시 공공서비스예약(체육시설 > 테니스장) OpenAPI에서 데이터를 받아
// public/data/tennis.json 으로 정규화해 저장합니다.
//
// 사용법:
//   SEOUL_API_KEY=발급받은키 node scripts/fetch-venues.mjs
//   (키가 없으면 샘플 키로 최대 5건만 받습니다)
//   node scripts/fetch-venues.mjs --from-file raw.json   # 이미 받아둔 원본 JSON으로 변환만
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const API_KEY = process.env.SEOUL_API_KEY || 'sample'
const SERVICE = 'ListPublicReservationSport'
const CATEGORY = '테니스장'
const PAGE_SIZE = API_KEY === 'sample' ? 5 : 1000
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/tennis.json')

async function fetchPage(start, end) {
  const url = `http://openapi.seoul.go.kr:8088/${API_KEY}/json/${SERVICE}/${start}/${end}/${encodeURIComponent(CATEGORY)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for rows ${start}-${end}`)
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error(`JSON이 아닌 응답: ${text.slice(0, 300)}`)
  }
  const data = body[SERVICE]
  if (!data) throw new Error(`API 오류: ${JSON.stringify(body.RESULT ?? body).slice(0, 300)}`)
  return data
}

async function fetchAll() {
  const first = await fetchPage(1, PAGE_SIZE)
  const total = first.list_total_count
  const rows = [...first.row]
  if (API_KEY !== 'sample') {
    for (let start = PAGE_SIZE + 1; start <= total; start += PAGE_SIZE) {
      const page = await fetchPage(start, Math.min(start + PAGE_SIZE - 1, total))
      rows.push(...page.row)
    }
  }
  return { total, rows }
}

const toDate = (s) => (s ? s.slice(0, 10) : null) // "2025-12-01 00:00:00.0" -> "2025-12-01"
const toDateTime = (s) => (s ? s.slice(0, 16).replace(' ', 'T') : null)
const num = (s) => {
  const n = Number(s)
  return Number.isFinite(n) && n !== 0 ? n : null
}

// 서비스명에 적힌 이용 요일 구분 추정
function dayType(name) {
  if (/토|일요일|주말|공휴일/.test(name) && !/평일/.test(name)) return 'weekend'
  if (/평일/.test(name) && !/토|주말|공휴일/.test(name)) return 'weekday'
  return 'all'
}

function normalize(r) {
  return {
    id: r.SVCID,
    name: r.SVCNM.trim(),
    place: r.PLACENM?.trim() ?? '',
    area: r.AREANM?.trim() ?? '',
    status: r.SVCSTATNM?.trim() ?? '',
    payment: r.PAYATNM?.trim() ?? '',
    target: r.USETGTINFO?.trim() ?? '',
    url: r.SVCURL,
    image: r.IMGURL || null,
    tel: r.TELNO?.trim() || null,
    lat: num(r.Y),
    lng: num(r.X),
    openStart: toDate(r.SVCOPNBGNDT),
    openEnd: toDate(r.SVCOPNENDDT),
    receiptStart: toDateTime(r.RCPTBGNDT),
    receiptEnd: toDateTime(r.RCPTENDDT),
    hourStart: r.V_MIN || null,
    hourEnd: r.V_MAX || null,
    dayType: dayType(r.SVCNM),
    cancelRule: r.REVSTDDAYNM && r.REVSTDDAY ? `${r.REVSTDDAYNM} ${r.REVSTDDAY}일 전` : null,
  }
}

const fromFileIdx = process.argv.indexOf('--from-file')
let total, rows
if (fromFileIdx > -1) {
  const raw = JSON.parse(await readFile(process.argv[fromFileIdx + 1], 'utf8'))
  ;({ list_total_count: total, row: rows } = raw[SERVICE])
} else {
  ;({ total, rows } = await fetchAll())
}

const venues = rows.map(normalize)
await mkdir(dirname(OUT), { recursive: true })
await writeFile(
  OUT,
  JSON.stringify({ fetchedAt: new Date().toISOString(), total, partial: rows.length < total, venues }, null, 2),
)
console.log(`저장 완료: ${venues.length}/${total}건 -> ${OUT}`)
