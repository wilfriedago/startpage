export const YOUTUBE_EMBED = 'https://www.youtube-nocookie.com/embed/'

/** What the transport needs to know, whatever is actually making the sound. */
export interface MediaState {
  /** Seconds, or null for a live stream with no meaningful position. */
  duration: number | null
  position: number
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'error'
}

export const IDLE: MediaState = { duration: null, position: 0, status: 'idle' }

/**
 * Builds the embed URL. `enablejsapi` is what lets the page drive the player
 * over postMessage, so no script from Google is ever loaded into this origin —
 * everything YouTube runs stays inside its own sandboxed frame.
 */
export function embedUrl(id: string, { controls }: { controls: boolean }): string {
  const params = new URLSearchParams({
    autoplay: '1',
    controls: controls ? '1' : '0',
    enablejsapi: '1',
    iv_load_policy: '3',
    loop: '1',
    modestbranding: '1',
    playlist: id,
    playsinline: '1',
    rel: '0',
  })
  // YouTube requires `origin` to accept commands, but it only exists in a page.
  if (typeof window !== 'undefined') {
    params.set('origin', window.location.origin)
  }
  return `${YOUTUBE_EMBED}${id}?${params}`
}

/** Accepts a watch URL, a short link, an embed link, or a bare video id. */
export function youtubeId(raw: string): string {
  const text = String(raw ?? '').trim()
  if (!text) {
    return ''
  }

  const match = text.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{6,})/)?.[1]
  if (match) {
    return match
  }

  return /^[\w-]{6,}$/.test(text) ? text : ''
}

/** The command envelope YouTube's embed listens for on its window. */
export function youtubeCommand(func: string, args: unknown[] = []): string {
  return JSON.stringify({ args, event: 'command', func })
}

export function youtubeListenRequest(): string {
  return JSON.stringify({ event: 'listening', id: 1 })
}

/**
 * YouTube reports state as a number. Only the ones the transport reacts to are
 * named; anything else leaves the current status alone.
 */
export function youtubeStatus(playerState: number): MediaState['status'] | null {
  switch (playerState) {
    case -1:
    case 3:
      return 'loading'
    case 1:
      return 'playing'
    case 2:
      return 'paused'
    default:
      return null
  }
}

/** `183` → `3:03`. Live streams show a dash. */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) {
    return '--:--'
  }

  const total = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(total / 60)
  const rest = String(total % 60).padStart(2, '0')
  if (minutes < 60) {
    return `${minutes}:${rest}`
  }

  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${rest}`
}
