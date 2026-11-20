// 공공데이터포털 API로 공휴일(한국천문연구원 특일정보)과 서울 날씨(기상청 단기·중기예보)를 받아
// public/data/holidays.json, public/data/weather.json 으로 저장합니다.
// 한쪽이 실패해도 다른 쪽은 저장하고, 스크립트는 실패로 끝나지 않습니다(앱은 파일이 없으면 생략).
//
// 사용법: DATA_GO_KR_KEY=일반인증키(Decoding) node scripts/fetch-extras.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KEY = process.env.DATA_GO_KR_KEY
const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data')
const DAYS_AHEAD = 14

// 서울 대표 지점: 단기예보 격자(중구), 중기 육상예보(서울·인천·경기), 중기 기온(서울)
const GRID = { nx: 60, ny: 127 }
const MID_LAND_REG = '11B00000'
const MID_TA_REG = '11B10101'

if (!KEY) {
  console.log('DATA_GO_KR_KEY 가 없어 공휴일·날씨 수집을 건너뜁니다.')
  process.exit(0)
}

// ---------- 시간 (KST) ----------
const KST_OFFSET = 9 * 60 * 60 * 1000
const kstNow = () => new Date(Date.now() + KST_OFFSET) // UTC 메서드로 읽으면 KST 값
const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`
const iso = (yyyymmdd) => `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
const addDays = (d, n) => new Date(d.getTime() + n * 86400000)

async function call(url, params) {
  const qs = new URLSearchParams({ serviceKey: KEY, ...params })
  const res = await fetch(`${url}?${qs}`)
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error(`JSON이 아닌 응답(${res.status}): ${text.slice(0, 200)}`)
  }
  const header = body.response?.header
  if (!header) throw new Error(`API 오류: ${JSON.stringify(body).slice(0, 300)}`)
  if (header.resultCode !== '00') {
    // 03 = NODATA_ERROR (자료 없음)
    if (header.resultCode === '03') return []
    throw new Error(`API 오류 ${header.resultCode}: ${header.resultMsg}`)
  }
  const items = body.response.body?.items
  if (!items || items === '') return []
  const item = items.item
  return Array.isArray(item) ? item : item ? [item] : []
}

// ---------- 공휴일 ----------
async function fetchHolidays() {
  const now = kstNow()
  const months = new Set()
  for (let i = 0; i <= 3; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1))
    months.add(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`)
  }
  const holidays = {}
  for (const m of months) {
    const [solYear, solMonth] = m.split('-')
    const items = await call('https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo', {
      solYear,
      solMonth,
      _type: 'json',
      numOfRows: '50',
    })
    for (const it of items) {
      if (it.isHoliday !== 'Y') continue
      const date = iso(String(it.locdate))
      holidays[date] = holidays[date] ? `${holidays[date]}·${it.dateName}` : it.dateName
    }
  }
  return { months: [...months], holidays }
}

// ---------- 날씨 ----------
// 아이콘 종류: sun | partly | cloud | rain | snow | sleet | shower
const PTY_ICON = { 1: 'rain', 2: 'sleet', 3: 'snow', 4: 'shower', 5: 'rain', 6: 'sleet', 7: 'snow' }
const SKY_ICON = { 1: 'sun', 3: 'partly', 4: 'cloud' }

function iconFromText(wf) {
  if (!wf) return null
  if (/비\/눈|눈\/비|빗방울눈날림/.test(wf)) return 'sleet'
  if (/소나기/.test(wf)) return 'shower'
  if (/비|빗방울/.test(wf)) return 'rain'
  if (/눈/.test(wf)) return 'snow'
  if (/흐림/.test(wf)) return 'cloud'
  if (/구름많음/.test(wf)) return 'partly'
  if (/맑음/.test(wf)) return 'sun'
  return null
}

const ICON_RANK = { sun: 0, partly: 1, cloud: 2, shower: 3, rain: 4, sleet: 5, snow: 6 }
const worse = (a, b) => (!a ? b : !b ? a : ICON_RANK[b] > ICON_RANK[a] ? b : a)

/** 단기예보 발표시각: 02,05,08,11,14,17,20,23시 (발표 후 약 10분 뒤 제공) */
function latestVilageBase(now) {
  const t = new Date(now.getTime() - 15 * 60000)
  const hours = [2, 5, 8, 11, 14, 17, 20, 23]
  const h = t.getUTCHours()
  const base = [...hours].reverse().find((x) => x <= h)
  if (base === undefined) return { base_date: ymd(addDays(t, -1)), base_time: '2300' }
  return { base_date: ymd(t), base_time: `${pad(base)}00` }
}

async function fetchShortTerm() {
  const now = kstNow()
  const bases = [latestVilageBase(now)]
  // 오늘 최저·최고기온(TMN/TMX)은 02시 발표에 포함되므로 함께 조회
  const early = new Date(now.getTime() - 15 * 60000)
  if (early.getUTCHours() >= 2) {
    const b = { base_date: ymd(early), base_time: '0200' }
    if (b.base_time !== bases[0].base_time) bases.push(b)
  }
  const days = {}
  // 뒤 순서(02시 발표)를 먼저 넣고 최신 발표로 덮어씀
  for (const base of [...bases].reverse()) {
    const items = await call('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst', {
      dataType: 'JSON',
      numOfRows: '1500',
      pageNo: '1',
      ...base,
      nx: String(GRID.nx),
      ny: String(GRID.ny),
    })
    const byDate = {}
    for (const it of items) {
      const d = (byDate[it.fcstDate] ??= { tmp: [], pop: [], sky: [], pty: [] })
      const hour = Number(it.fcstTime.slice(0, 2))
      const v = Number(it.fcstValue)
      const daytime = hour >= 6 && hour <= 21
      if (it.category === 'TMN') d.tmn = v
      else if (it.category === 'TMX') d.tmx = v
      else if (it.category === 'TMP') d.tmp.push(v)
      else if (it.category === 'POP' && daytime) d.pop.push(v)
      else if (it.category === 'SKY' && daytime) d.sky.push(v)
      else if (it.category === 'PTY' && daytime) d.pty.push(v)
    }
    for (const [date, d] of Object.entries(byDate)) {
      const prev = days[iso(date)] ?? {}
      let icon = null
      for (const p of d.pty) if (p > 0) icon = worse(icon, PTY_ICON[p] ?? 'rain')
      if (!icon && d.sky.length) {
        // 낮 시간대 하늘상태 중 가장 많은 값
        const count = {}
        for (const s of d.sky) count[s] = (count[s] ?? 0) + 1
        const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0]
        icon = SKY_ICON[top] ?? null
      }
      days[iso(date)] = {
        icon: icon ?? prev.icon ?? null,
        tmin: d.tmn ?? prev.tmin ?? (d.tmp.length ? Math.min(...d.tmp) : null),
        tmax: d.tmx ?? prev.tmax ?? (d.tmp.length ? Math.max(...d.tmp) : null),
        pop: d.pop.length ? Math.max(...d.pop) : (prev.pop ?? null),
        source: 'short',
      }
    }
  }
  return days
}

/** 중기예보 발표시각: 06시, 18시 */
function latestMidTmFc(now) {
  const t = new Date(now.getTime() - 30 * 60000)
  const h = t.getUTCHours()
  if (h >= 18) return { tmFc: `${ymd(t)}1800`, date: t }
  if (h >= 6) return { tmFc: `${ymd(t)}0600`, date: t }
  const y = addDays(t, -1)
  return { tmFc: `${ymd(y)}1800`, date: y }
}

async function fetchMidTerm() {
  const { tmFc, date } = latestMidTmFc(kstNow())
  const [land] = await call('https://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst', {
    dataType: 'JSON',
    regId: MID_LAND_REG,
    tmFc,
  })
  const [ta] = await call('https://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa', {
    dataType: 'JSON',
    regId: MID_TA_REG,
    tmFc,
  })
  const days = {}
  for (let n = 3; n <= 10; n++) {
    const day = iso(ymd(addDays(date, n)))
    const wf = [land?.[`wf${n}Am`], land?.[`wf${n}Pm`], land?.[`wf${n}`]].filter(Boolean)
    const rn = [land?.[`rnSt${n}Am`], land?.[`rnSt${n}Pm`], land?.[`rnSt${n}`]].filter((x) => x !== undefined && x !== null && x !== '')
    const tmin = ta?.[`taMin${n}`]
    const tmax = ta?.[`taMax${n}`]
    if (!wf.length && tmin === undefined) continue
    days[day] = {
      icon: wf.map(iconFromText).reduce(worse, null),
      tmin: tmin ?? null,
      tmax: tmax ?? null,
      pop: rn.length ? Math.max(...rn.map(Number)) : null,
      source: 'mid',
    }
  }
  return days
}

async function fetchWeather() {
  const results = await Promise.allSettled([fetchMidTerm(), fetchShortTerm()])
  const [mid, short] = results
  if (mid.status === 'rejected') console.warn('중기예보 실패:', mid.reason.message)
  if (short.status === 'rejected') console.warn('단기예보 실패:', short.reason.message)
  if (mid.status === 'rejected' && short.status === 'rejected') throw new Error('단기·중기예보 모두 실패')
  // 단기예보가 더 정확하므로 겹치는 날짜는 단기예보 우선
  const merged = { ...(mid.value ?? {}), ...(short.value ?? {}) }
  const today = iso(ymd(kstNow()))
  const last = iso(ymd(addDays(kstNow(), DAYS_AHEAD)))
  return Object.fromEntries(Object.entries(merged).filter(([d]) => d >= today && d <= last).sort())
}

// ---------- 실행 ----------
await mkdir(OUT_DIR, { recursive: true })
const fetchedAt = new Date().toISOString()

try {
  const { months, holidays } = await fetchHolidays()
  await writeFile(resolve(OUT_DIR, 'holidays.json'), JSON.stringify({ fetchedAt, months, holidays }, null, 2))
  console.log(`공휴일 저장: ${Object.keys(holidays).length}일`, holidays)
} catch (e) {
  console.warn('공휴일 수집 실패:', e.message)
}

try {
  const days = await fetchWeather()
  await writeFile(resolve(OUT_DIR, 'weather.json'), JSON.stringify({ fetchedAt, region: '서울', days }, null, 2))
  console.log(`날씨 저장: ${Object.keys(days).length}일`)
  for (const [d, w] of Object.entries(days)) console.log(' ', d, JSON.stringify(w))
} catch (e) {
  console.warn('날씨 수집 실패:', e.message)
}
