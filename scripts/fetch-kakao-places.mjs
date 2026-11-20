// 테니스장마다 카카오맵 장소(장소 페이지·주소·전화)를 찾아 public/data/kakao-places.json 으로 저장합니다.
// 카카오 로컬 API(키워드 검색)를 사용하며, REST API 키가 없으면 건너뜁니다(앱은 카카오맵 검색 링크로 대체).
//
// 사용법: KAKAO_REST_KEY=REST_API_키 node scripts/fetch-kakao-places.mjs  (fetch-venues.mjs 실행 후)
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KEY = process.env.KAKAO_REST_KEY?.trim()
const DATA = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data')

if (!KEY) {
  console.log('KAKAO_REST_KEY 가 없어 카카오 장소 매칭을 건너뜁니다.')
  process.exit(0)
}

// 앱(src/lib/places.ts)과 같은 규칙
const placeName = (v) => v.place.split('>').pop().trim() || v.place
const placeKey = (v) => `${v.area}|${placeName(v)}`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function search(query, lng, lat) {
  const qs = new URLSearchParams({ query, size: '15' })
  if (lng && lat) {
    qs.set('x', String(lng))
    qs.set('y', String(lat))
    qs.set('radius', '2000')
    qs.set('sort', 'distance')
  }
  const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${qs}`, {
    headers: { Authorization: `KakaoAK ${KEY}` },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return (await res.json()).documents ?? []
}

/** 시설명에서 구별되는 단어만 추출 (예: "정릉테니스장" → ["정릉"], "보라매공원" → ["보라매"]) */
function coreTokens(name) {
  return name
    .replace(/소프트테니스장|테니스장|테니스|코트|공원|근린|한강|체육|시설|\d+면|[A-Z]코트|테스트/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
}

/**
 * 가장 그럴듯한 장소 고르기
 * - 테니스 관련 장소만 후보
 * - 이름의 핵심 단어(앞 두 글자 이상)가 겹치면 1.5km 이내 허용
 * - 겹치지 않으면 100m 이내만 허용 (근처 사설 레슨장 등 오매칭 방지)
 * - 이름이 "테니스장"처럼 일반적이면 500m 이내 가장 가까운 곳
 */
function pick(docs, name) {
  const tokens = coreTokens(name)
  const tennis = docs.filter((d) => /테니스/.test(d.place_name) || /테니스/.test(d.category_name))
  const dist = (d) => (d.distance ? Number(d.distance) : Infinity)
  const shares = (d) => tokens.some((t) => d.place_name.replace(/\s/g, '').includes(t.slice(0, 2)))
  if (!tokens.length) return tennis.find((d) => dist(d) <= 500) ?? null
  return tennis.find((d) => shares(d) && dist(d) <= 1500) ?? tennis.find((d) => dist(d) <= 100) ?? null
}

const { venues } = JSON.parse(await readFile(resolve(DATA, 'tennis.json'), 'utf8'))
const places = new Map()
for (const v of venues) if (!places.has(placeKey(v))) places.set(placeKey(v), v)

const out = {}
let matched = 0
for (const [key, v] of places) {
  const name = placeName(v)
  const queries = /테니스/.test(name) ? [name] : [`${name} 테니스장`, name]
  try {
    let doc = null
    for (const q of queries) {
      doc = pick(await search(q, v.lng, v.lat), name)
      if (doc) break
      await sleep(100)
    }
    console.log(`  ${doc ? '✓' : '✗'} ${key} → ${doc ? `${doc.place_name} (${doc.distance ?? '?'}m)` : '없음'}`)
    if (doc) {
      matched++
      out[key] = {
        id: doc.id,
        name: doc.place_name,
        url: doc.place_url,
        address: doc.address_name || null,
        roadAddress: doc.road_address_name || null,
        phone: doc.phone || null,
        category: doc.category_name || null,
      }
    }
  } catch (e) {
    console.warn(`  ${key}: ${e.message}`)
    if (/HTTP 40[13]/.test(e.message)) break // 키 문제면 더 시도하지 않음
  }
  await sleep(100)
}

await writeFile(resolve(DATA, 'kakao-places.json'), JSON.stringify({ fetchedAt: new Date().toISOString(), places: out }, null, 2))
console.log(`카카오 장소 매칭: ${matched}/${places.size}곳`)
