import { createContext, type ComponentChildren, type RefObject } from 'preact'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks'

import { defaultShortcuts } from 'virtual:dashboard'

import type { Shortcut } from './dashboard'
import { NoiseEngine, type NoiseId } from './lib/audio'
import {
  DEFAULT_APPEARANCE,
  applyAppearance,
  applyTheme,
  normalizeAppearance,
} from './lib/appearance'
import { load, save, usePersistent } from './lib/storage'
import { dayKey, parseEntry } from './lib/time'
import type {
  AgendaEvent,
  Appearance,
  City,
  Keys,
  PanelId,
  Panels,
  Source,
  Station,
  Task,
  ThemeChoice,
  Unit,
  VideoMode,
  WeatherState,
} from './lib/types'
import { IDLE, type MediaState } from './lib/media'
import { fetchWeather } from './lib/weather'
import { youtubeId } from './lib/youtube'

const WEATHER_INTERVAL = 900_000
const DEFAULT_PANELS: Panels = {
  agenda: true,
  clocks: true,
  greeting: true,
  hints: true,
  links: true,
  note: true,
  player: true,
  tasks: true,
  weather: true,
  year: true,
}

const DEFAULT_CITIES: City[] = [
  { label: 'Cotonou', tz: 'Africa/Porto-Novo' },
  { label: 'Nairobi', tz: 'Africa/Nairobi' },
  { label: 'Calgary', tz: 'America/Edmonton' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Berlin', tz: 'Europe/Berlin' },
]

export const DEFAULT_STATIONS: Station[] = [
  {
    genre: 'lo-fi + night drive',
    label: 'Lofi Night',
    url: 'https://ice1.somafm.com/slowjazz-128-mp3',
  },
  {
    genre: 'synthwave + retro-future',
    label: 'Sonic Universe',
    url: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
  },
  {
    genre: 'chill + beats',
    label: 'Groove Salad',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
  },
  { genre: 'downtempo', label: 'Fluid', url: 'https://ice1.somafm.com/fluid-128-mp3' },
  { genre: 'trip-hop', label: 'Secret Agent', url: 'https://ice1.somafm.com/secretagent-128-mp3' },
  { genre: 'ambient', label: 'Drone Zone', url: 'https://ice1.somafm.com/dronezone-128-mp3' },
  { genre: 'vocal chill', label: 'Lush', url: 'https://ice1.somafm.com/lush-128-mp3' },
  { genre: 'hip-hop', label: 'TuneIn Radio', url: 'https://hydra.cdnstream.com/1537_128' },
]

function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** Anything read back from local storage predates this session; give it an id. */
function withIds<T extends object>(items: (T & { id?: string })[]): (T & { id: string })[] {
  return items.map((item) => ({ ...item, id: item.id ?? newId() }))
}

export interface Tip {
  text: string
  x: number
  y: number
}

export interface Store {
  addCity: () => void
  addEvent: (raw: string, date: string) => void
  addShortcut: () => void
  addStation: () => void
  addTask: (title: string, due?: string) => void
  appearance: Appearance
  cities: City[]
  cityName: string
  clearDone: () => void
  closeDay: () => void
  closeSettings: () => void
  day: string | null
  eventRef: RefObject<HTMLInputElement>
  events: (AgendaEvent & { id: string })[]
  exportData: () => void
  focus: boolean
  hour12: boolean
  keys: Keys
  lat: string
  lon: string
  muteOnBlur: boolean
  noise: NoiseId
  note: string
  noteRef: RefObject<HTMLTextAreaElement>
  openDay: (key: string) => void
  openSettings: () => void
  panels: Panels
  playerStatus: string
  playing: boolean
  refreshWeather: () => void
  mediaState: MediaState
  muted: boolean
  /** Jump the current video to a position, in seconds. */
  seek: (seconds: number) => void
  seekTo: number | null
  removeCity: (index: number) => void
  removeEvent: (id: string) => void
  removeShortcut: (index: number) => void
  removeStation: (index: number) => void
  removeTask: (id: string) => void
  resetAppearance: () => void
  setAppearance: (patch: Partial<Appearance>) => void
  setCityName: (value: string) => void
  setHour12: (value: boolean) => void
  setKey: (name: keyof Keys, value: string) => void
  setLat: (value: string) => void
  setLon: (value: string) => void
  setMuteOnBlur: (value: boolean) => void
  setNoise: (value: NoiseId) => void
  setNote: (value: string) => void
  setPanel: (id: PanelId, on: boolean) => void
  /** Reported by the media hosts as playback progresses. */
  setMediaState: (state: MediaState) => void
  setPlayerStatus: (status: string) => void
  setSettingsTab: (id: string) => void
  setShowSeconds: (value: boolean) => void
  setSource: (value: Source) => void
  setStation: (index: number) => void
  setTheme: (value: ThemeChoice) => void
  setTip: (tip: Tip | null) => void
  setUnit: (value: Unit) => void
  setVideoMode: (value: VideoMode) => void
  setVolume: (value: number) => void
  setYtUrl: (value: string) => void
  settingsOpen: boolean
  settingsTab: string
  shortcuts: Shortcut[]
  showSeconds: boolean
  source: Source
  station: number
  stations: Station[]
  taskRef: RefObject<HTMLInputElement>
  tasks: (Task & { id: string })[]
  theme: ThemeChoice
  tip: Tip | null
  today: string
  toggleFocus: () => void
  toggleMute: () => void
  togglePlay: () => void
  toggleTask: (id: string) => void
  unit: Unit
  updateCity: (index: number, patch: Partial<City>) => void
  updateShortcut: (index: number, patch: Partial<Shortcut>) => void
  updateStation: (index: number, patch: Partial<Station>) => void
  useMyLocation: () => void
  videoMode: VideoMode
  volume: number
  weather: WeatherState
  ytUrl: string
}

const StoreContext = createContext<Store | null>(null)

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error('useStore must be used inside <StoreProvider>')
  }

  return store
}

export function StoreProvider({ children }: { children: ComponentChildren }) {
  const [theme, setThemeState] = usePersistent<ThemeChoice>('theme', 'system')
  const [appearance, setAppearanceState] = usePersistent<Appearance>(
    'ap',
    DEFAULT_APPEARANCE,
    normalizeAppearance,
  )
  const [panels, setPanels] = usePersistent<Panels>('panels', DEFAULT_PANELS)
  const [showSeconds, setShowSeconds] = usePersistent('seconds', true)
  const [hour12, setHour12] = usePersistent('hour12', true)
  const [note, setNote] = usePersistent('note', '')
  const [shortcuts, setShortcuts] = usePersistent<Shortcut[]>('shortcuts', defaultShortcuts)
  const [cities, setCities] = usePersistent<City[]>('cityList', DEFAULT_CITIES)
  const [cityName, setCityName] = usePersistent('cityName', 'Cotonou')
  const [lat, setLat] = usePersistent('lat', '6.37')
  const [lon, setLon] = usePersistent('lon', '2.43')
  const [unit, setUnit] = usePersistent<Unit>('unit', 'c')
  const [source, setSourceState] = usePersistent<Source>('source', 'radio')
  const [noise, setNoiseState] = usePersistent<NoiseId>('noise', 'brown')
  const [stations, setStations] = usePersistent<Station[]>('stations', DEFAULT_STATIONS)
  const [station, setStationState] = usePersistent('station', 0)
  const [ytUrl, setYtUrl] = usePersistent('ytUrl', '')
  const [videoMode, setVideoMode] = usePersistent<VideoMode>('videoMode', 'card')
  const [muteOnBlur, setMuteOnBlur] = usePersistent('muteOnBlur', false)
  const [volume, setVolumeState] = usePersistent('volume', 55)
  const [muted, setMuted] = usePersistent('muted', false)
  const [keys, setKeys] = usePersistent<Keys>('keys', { apple: '', google: '', todoist: '' })

  const [tasks, setTasks] = useState<(Task & { id: string })[]>(() =>
    withIds(load<Task[]>('tasks', [{ done: false, title: 'Draft the week plan' }])),
  )
  const [events, setEvents] = useState<(AgendaEvent & { id: string })[]>(() =>
    withIds(load<AgendaEvent[]>('events', [])),
  )

  const [focus, setFocus] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('appearance')
  const [day, setDay] = useState<string | null>(null)
  const [tip, setTip] = useState<Tip | null>(null)
  const [today, setToday] = useState(() => dayKey(new Date()))
  const [weather, setWeather] = useState<WeatherState>(null)
  const [weatherNonce, setWeatherNonce] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [playerStatus, setPlayerStatus] = useState('idle')
  const [mediaState, setMediaState] = useState<MediaState>(IDLE)
  const [seekTo, setSeekTo] = useState<number | null>(null)

  const eventRef = useRef<HTMLInputElement>(null)
  const taskRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const engineRef = useRef<NoiseEngine | null>(null)
  if (engineRef.current === null) {
    engineRef.current = new NoiseEngine()
  }
  const engine = engineRef.current

  // Theme and appearance live on `:root`, so they survive any re-render.
  useEffect(() => applyTheme(theme), [theme])
  useEffect(() => applyAppearance(appearance), [appearance])

  // The date only matters to the day the year grid highlights.
  useEffect(() => {
    const timer = setInterval(() => setToday(dayKey(new Date())), 30_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!lat || !lon) {
      return
    }

    const controller = new AbortController()
    fetchWeather(lat, lon, unit, controller.signal)
      .then(setWeather)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setWeather('error')
        }
      })

    return () => controller.abort()
  }, [lat, lon, unit, weatherNonce])

  useEffect(() => {
    const timer = setInterval(() => setWeatherNonce((value) => value + 1), WEATHER_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => () => engine.dispose(), [engine])

  /** video.js follows the `playing` intent on its own; only noise is imperative. */
  const stopPlayback = useCallback(
    (status: string) => {
      engine.stop()
      setPlaying(false)
      setPlayerStatus(status)
      setMediaState(IDLE)
    },
    [engine],
  )

  const playingRef = useRef(playing)
  playingRef.current = playing

  useEffect(() => {
    if (!muteOnBlur) {
      return
    }

    function onVisibility(): void {
      if (document.hidden && playingRef.current) {
        stopPlayback('paused · tab hidden')
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [muteOnBlur, stopPlayback])

  const persistTasks = useCallback((next: (Task & { id: string })[]) => {
    setTasks(next)
    save('tasks', next)
  }, [])

  const persistEvents = useCallback((next: (AgendaEvent & { id: string })[]) => {
    setEvents(next)
    save('events', next)
  }, [])

  const setAppearance = useCallback(
    (patch: Partial<Appearance>) => setAppearanceState((current) => ({ ...current, ...patch })),
    [setAppearanceState],
  )

  const startNoise = useCallback(
    (nextNoise: NoiseId) => {
      if (!engine.start(nextNoise)) {
        setPlayerStatus('no audio support')
        return
      }
      setPlaying(true)
      setPlayerStatus('generated locally · looping')
    },
    [engine],
  )

  /**
   * Play is an intent, not an action. Noise starts here because it is
   * synthesised on the spot; radio and video only flip the flag, and
   * `<MediaHost>` reports back what video.js actually managed to do.
   */
  const togglePlay = useCallback(() => {
    if (playing) {
      stopPlayback('paused')
      return
    }

    if (source === 'noise') {
      startNoise(noise)
      return
    }

    if (source === 'video') {
      if (!youtubeId(ytUrl)) {
        setPlayerStatus('paste a YouTube link first')
        return
      }
      setPlaying(true)
      setPlayerStatus('loading…')
      return
    }

    if (!stations[station]?.url) {
      setPlayerStatus('no station selected')
      return
    }

    setPlaying(true)
    setPlayerStatus('connecting…')
  }, [noise, playing, source, startNoise, station, stations, stopPlayback, ytUrl])

  const value = useMemo<Store>(
    () => ({
      addCity: () => setCities((current) => [...current, { label: '', tz: '' }]),
      addEvent: (raw, date) => {
        const text = raw.trim()
        if (!text) {
          return
        }
        const { at, title } = parseEntry(text)
        persistEvents([...events, { at, date, id: newId(), title }])
      },
      addShortcut: () => setShortcuts((current) => [...current, { name: '', url: '' }]),
      addStation: () => setStations((current) => [...current, { genre: '', label: '', url: '' }]),
      addTask: (title, due) => {
        const text = title.trim()
        if (!text) {
          return
        }
        persistTasks([...tasks, { done: false, due, id: newId(), title: text }])
      },
      appearance,
      cities,
      cityName,
      clearDone: () => persistTasks(tasks.filter((task) => !task.done)),
      closeDay: () => setDay(null),
      closeSettings: () => setSettingsOpen(false),
      day,
      eventRef,
      events,
      exportData: () => {
        const dump = {
          ap: appearance,
          cityList: cities,
          events,
          note,
          panels,
          shortcuts,
          stations,
          tasks,
        }
        const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'helium-startpage.json'
        anchor.click()
        setTimeout(() => URL.revokeObjectURL(url), 2000)
      },
      focus,
      hour12,
      keys,
      lat,
      lon,
      muteOnBlur,
      noise,
      note,
      noteRef,
      openDay: (key) => {
        setDay(key)
        setTip(null)
      },
      openSettings: () => setSettingsOpen(true),
      panels,
      playerStatus,
      playing,
      mediaState,
      muted,
      refreshWeather: () => setWeatherNonce((current) => current + 1),
      seek: (seconds) => setSeekTo(seconds),
      seekTo,
      setMediaState,
      removeCity: (index) => setCities((current) => current.filter((_, i) => i !== index)),
      removeEvent: (id) => persistEvents(events.filter((event) => event.id !== id)),
      removeShortcut: (index) => setShortcuts((current) => current.filter((_, i) => i !== index)),
      removeStation: (index) => {
        setStations((current) => current.filter((_, i) => i !== index))
        setStationState((current) => (current >= index && current > 0 ? current - 1 : current))
      },
      removeTask: (id) => persistTasks(tasks.filter((task) => task.id !== id)),
      resetAppearance: () => setAppearanceState({ ...DEFAULT_APPEARANCE }),
      setAppearance,
      setCityName,
      setHour12,
      setKey: (name, keyValue) => setKeys((current) => ({ ...current, [name]: keyValue })),
      setLat,
      setLon,
      setMuteOnBlur,
      setNoise: (next) => {
        setNoiseState(next)
        if (playing && source === 'noise') {
          startNoise(next)
        }
      },
      setNote,
      setPanel: (id, on) => setPanels((current) => ({ ...current, [id]: on })),
      setSettingsTab,
      setShowSeconds,
      setSource: (next) => {
        stopPlayback('idle')
        setSourceState(next)
      },
      // Switching stations mid-stream just changes the source video.js loads.
      setStation: setStationState,
      setTheme: setThemeState,
      setTip,
      setUnit,
      setVideoMode,
      setVolume: (next) => {
        engine.setVolume(next)
        setVolumeState(next)
      },
      setPlayerStatus,
      setYtUrl,
      settingsOpen,
      settingsTab,
      shortcuts,
      showSeconds,
      source,
      station,
      stations,
      taskRef,
      tasks,
      theme,
      tip,
      today,
      toggleFocus: () => setFocus((current) => !current),
      toggleMute: () => setMuted((current) => !current),
      togglePlay,
      toggleTask: (id) =>
        persistTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task))),
      unit,
      updateCity: (index, patch) =>
        setCities((current) =>
          current.map((city, i) => (i === index ? { ...city, ...patch } : city)),
        ),
      updateShortcut: (index, patch) =>
        setShortcuts((current) =>
          current.map((shortcut, i) => (i === index ? { ...shortcut, ...patch } : shortcut)),
        ),
      updateStation: (index, patch) =>
        setStations((current) =>
          current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
        ),
      useMyLocation: () => {
        navigator.geolocation?.getCurrentPosition((position) => {
          setLat(position.coords.latitude.toFixed(2))
          setLon(position.coords.longitude.toFixed(2))
        })
      },
      videoMode,
      volume,
      weather,
      ytUrl,
    }),
    [
      appearance,
      cities,
      cityName,
      day,
      engine,
      events,
      focus,
      hour12,
      keys,
      lat,
      lon,
      muteOnBlur,
      noise,
      note,
      panels,
      persistEvents,
      persistTasks,
      mediaState,
      muted,
      playerStatus,
      playing,
      seekTo,
      setAppearance,
      setAppearanceState,
      setCities,
      setCityName,
      setHour12,
      setKeys,
      setLat,
      setLon,
      setMuteOnBlur,
      setMuted,
      setNoiseState,
      setNote,
      setPanels,
      setShortcuts,
      setShowSeconds,
      setSourceState,
      setStationState,
      setStations,
      setThemeState,
      setUnit,
      setVideoMode,
      setVolumeState,
      setYtUrl,
      settingsOpen,
      settingsTab,
      shortcuts,
      showSeconds,
      source,
      startNoise,
      station,
      stations,
      stopPlayback,
      tasks,
      theme,
      tip,
      today,
      togglePlay,
      unit,
      videoMode,
      volume,
      weather,
      ytUrl,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
