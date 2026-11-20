import { useEffect, useState } from 'react'

export type Route = { view: 'list' } | { view: 'venue'; key: string }

function parse(hash: string): Route {
  const m = hash.match(/^#\/venue\/(.+)$/)
  if (m) {
    try {
      return { view: 'venue', key: decodeURIComponent(m[1]) }
    } catch {
      /* 잘못된 주소는 목록으로 */
    }
  }
  return { view: 'list' }
}

// 목록에서 상세로 들어온 경우에만 '뒤로가기'로 돌아감 (외부 링크로 바로 들어온 경우는 목록 주소로 이동)
let enteredFromList = false

/** #/venue/<테니스장 키> 형태의 해시 주소를 읽음 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash))
  useEffect(() => {
    const onChange = () =>
      setRoute((prev) => {
        const next = parse(window.location.hash)
        enteredFromList = prev.view === 'list' && next.view === 'venue'
        return next
      })
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function goBackToList() {
  if (enteredFromList) window.history.back()
  else window.location.hash = ''
}
