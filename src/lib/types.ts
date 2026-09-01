export type ThemeChoice = 'system' | 'light' | 'dark'
export type Source = 'noise' | 'radio' | 'video'
export type VideoMode = 'card' | 'background'
export type Unit = 'c' | 'f'

export interface Task {
  /** ISO `YYYY-MM-DD`; absent means the task is not pinned to a day. */
  due?: string
  done: boolean
  title: string
}

export interface AgendaEvent {
  /** `HH:MM`, or `—` when the entry had no leading time. */
  at: string
  /** ISO `YYYY-MM-DD`. */
  date: string
  id: string
  title: string
}

export interface City {
  label: string
  tz: string
}

export interface Station {
  genre: string
  label: string
  url: string
}

export interface Appearance {
  accent: string | null
  bg: string | null
  blur: boolean
  clockScale: number
  font: string
  mono: string
  radius: number
  scrim: number
}

export type PanelId =
  | 'greeting'
  | 'weather'
  | 'clocks'
  | 'links'
  | 'year'
  | 'agenda'
  | 'tasks'
  | 'note'
  | 'player'
  | 'hints'

export type Panels = Record<PanelId, boolean>

export interface Weather {
  code: number
  hi: number
  lo: number
  temp: number
}

export type WeatherState = Weather | 'error' | null

export interface Keys {
  apple: string
  google: string
  todoist: string
}
