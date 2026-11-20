import type { ThemePref } from '../lib/useTheme'

const OPTIONS: { value: ThemePref; label: string; icon: string }[] = [
  { value: 'light', label: '라이트 모드', icon: '☀️' },
  { value: 'system', label: '시스템 설정', icon: '🖥️' },
  { value: 'dark', label: '다크 모드', icon: '🌙' },
]

export function ThemeToggle({ value, onChange }: { value: ThemePref; onChange: (v: ThemePref) => void }) {
  return (
    <div className="theme-toggle" role="radiogroup" aria-label="테마">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          aria-label={o.label}
          title={o.label}
          className={value === o.value ? 'active' : undefined}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
        </button>
      ))}
    </div>
  )
}
