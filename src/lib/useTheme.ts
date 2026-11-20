import { useEffect, useState } from 'react'

export type ThemePref = 'system' | 'light' | 'dark'
const KEY = 'tvf-theme'

function load(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* 저장소 사용 불가 */
  }
  return 'system'
}

const media = () => window.matchMedia('(prefers-color-scheme: dark)')

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(load)
  const [systemDark, setSystemDark] = useState(() => media().matches)

  useEffect(() => {
    const m = media()
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [])

  const resolved: 'light' | 'dark' = pref === 'system' ? (systemDark ? 'dark' : 'light') : pref

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    try {
      localStorage.setItem(KEY, pref)
    } catch {
      /* 무시 */
    }
  }, [pref, resolved])

  return { pref, setPref, resolved }
}
