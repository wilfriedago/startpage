/** ISO `YYYY-MM-DD` in local time — the key every event and task is filed under. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function formatTime(date: Date, hour12: boolean, timeZone?: string): string {
  return hour12
    ? date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true,
        minute: '2-digit',
        timeZone,
      })
    : date.toLocaleTimeString([], { hour: '2-digit', hour12: false, minute: '2-digit', timeZone })
}

/** The clock face drops the meridiem — it is shown separately, beside the digits. */
export function formatClock(date: Date, hour12: boolean): string {
  return hour12 ? formatTime(date, true).replace(/\s*[AP]M$/i, '') : formatTime(date, false)
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatTime(new Date(), false, timeZone)
    return true
  } catch {
    return false
  }
}

export function daysInYear(year: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  return leap ? 366 : 365
}

export interface YearGrid {
  /** Blank cells before Jan 1 so the grid reads Monday-first, top to bottom. */
  pad: number
  days: { key: string; label: string; ordinal: number }[]
  todayIndex: number
  total: number
}

export function buildYear(now: Date): YearGrid {
  const year = now.getFullYear()
  const total = daysInYear(year)
  const jan1 = new Date(year, 0, 1)
  const today = new Date(year, now.getMonth(), now.getDate())
  const todayIndex = Math.round((today.getTime() - jan1.getTime()) / 86_400_000)

  const days = Array.from({ length: total }, (_, index) => {
    const date = new Date(year, 0, 1 + index)
    return {
      key: dayKey(date),
      label: date.toLocaleDateString([], { day: 'numeric', month: 'short', weekday: 'short' }),
      ordinal: index,
    }
  })

  return { days, pad: (jan1.getDay() + 6) % 7, todayIndex, total }
}

export function greetingFor(hour: number): string {
  if (hour < 5) {
    return 'Still up'
  }
  if (hour < 12) {
    return 'Good morning'
  }
  return hour < 18 ? 'Good afternoon' : 'Good evening'
}

/** Splits `09:30 Standup` into its time and title; untimed text keeps an em dash. */
export function parseEntry(raw: string): { at: string; title: string } {
  const match = raw.match(/^(\d{1,2}[:.]\d{2})\s+(.*)$/)
  const at = match?.[1]
  const title = match?.[2]
  if (at === undefined || title === undefined) {
    return { at: '—', title: raw }
  }

  return { at: at.replace('.', ':').padStart(5, '0'), title }
}
