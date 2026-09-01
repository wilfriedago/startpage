import type { Unit, Weather } from './types'

/** WMO weather codes, each with the glyph the design uses in the date row. */
const WMO: Record<number, [string, string]> = {
  0: ['Clear', '○'],
  1: ['Mostly clear', '○'],
  2: ['Partly cloudy', '◔'],
  3: ['Overcast', '●'],
  45: ['Fog', '≡'],
  48: ['Freezing fog', '≡'],
  51: ['Light drizzle', '⋮'],
  53: ['Drizzle', '⋮'],
  55: ['Heavy drizzle', '⋮'],
  61: ['Light rain', '⁞'],
  63: ['Rain', '⁞'],
  65: ['Heavy rain', '⁞'],
  66: ['Freezing rain', '⁞'],
  67: ['Freezing rain', '⁞'],
  71: ['Light snow', '✳'],
  73: ['Snow', '✳'],
  75: ['Heavy snow', '✳'],
  77: ['Snow grains', '✳'],
  80: ['Showers', '⁞'],
  81: ['Showers', '⁞'],
  82: ['Heavy showers', '⁞'],
  85: ['Snow showers', '✳'],
  86: ['Snow showers', '✳'],
  95: ['Thunderstorm', '↯'],
  96: ['Thunderstorm', '↯'],
  99: ['Thunderstorm', '↯'],
}

export const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'

export function describe(code: number): [string, string] {
  return WMO[code] ?? ['—', '○']
}

/**
 * Open-Meteo needs no key and no account, so the request carries nothing but a
 * coordinate. Fired on load, when the location changes, and every 15 minutes.
 */
export async function fetchWeather(
  lat: string,
  lon: string,
  unit: Unit,
  signal?: AbortSignal,
): Promise<Weather> {
  const query = new URLSearchParams({
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min',
    forecast_days: '1',
    latitude: lat,
    longitude: lon,
    timezone: 'auto',
  })
  if (unit === 'f') {
    query.set('temperature_unit', 'fahrenheit')
  }

  const response = await fetch(`${WEATHER_ENDPOINT}?${query}`, { signal })
  if (!response.ok) {
    throw new Error(`Open-Meteo responded ${response.status}`)
  }

  const data = await response.json()
  if (!data?.current) {
    throw new Error('Open-Meteo returned no current conditions')
  }

  return {
    code: data.current.weather_code,
    hi: Math.round(data.daily.temperature_2m_max[0]),
    lo: Math.round(data.daily.temperature_2m_min[0]),
    temp: Math.round(data.current.temperature_2m),
  }
}
