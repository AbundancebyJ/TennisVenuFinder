import type { DayWeather, WeatherIcon } from '../types'

const ICON: Record<WeatherIcon, { emoji: string; label: string }> = {
  sun: { emoji: '☀️', label: '맑음' },
  partly: { emoji: '⛅', label: '구름많음' },
  cloud: { emoji: '☁️', label: '흐림' },
  rain: { emoji: '🌧️', label: '비' },
  shower: { emoji: '🌦️', label: '소나기' },
  sleet: { emoji: '🌨️', label: '비/눈' },
  snow: { emoji: '❄️', label: '눈' },
}

function weatherLabel(w: DayWeather): string {
  const parts = [w.icon ? ICON[w.icon].label : null]
  if (w.tmin !== null && w.tmax !== null) parts.push(`최저 ${w.tmin}° / 최고 ${w.tmax}°`)
  if (w.pop !== null) parts.push(`강수확률 ${w.pop}%`)
  return parts.filter(Boolean).join(', ')
}

export function WeatherBadge({ weather }: { weather: DayWeather | undefined }) {
  if (!weather) return <span className="wx wx-none" aria-hidden />
  const wet = weather.icon === 'rain' || weather.icon === 'shower' || weather.icon === 'sleet' || weather.icon === 'snow'
  return (
    <span className="wx" title={weatherLabel(weather)} aria-label={weatherLabel(weather)}>
      <span className="wx-icon">{weather.icon ? ICON[weather.icon].emoji : '·'}</span>
      {weather.tmin !== null && weather.tmax !== null && (
        <span className="wx-temp">
          <span className="lo">{Math.round(weather.tmin)}°</span>
          <span className="hi">{Math.round(weather.tmax)}°</span>
        </span>
      )}
      {weather.pop !== null && weather.pop >= 30 && <span className={`wx-pop${wet ? ' wet' : ''}`}>{weather.pop}%</span>}
    </span>
  )
}
