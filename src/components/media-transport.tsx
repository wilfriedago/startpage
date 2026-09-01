import './media-transport.css'

import type { JSX } from 'preact'

import { formatDuration } from '../lib/media'
import { useStore } from '../store'

const PLAY = (
  <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12">
    <path d="M4.5 2.6 13 8l-8.5 5.4z" fill="currentColor" />
  </svg>
)

const PAUSE = (
  <svg aria-hidden="true" viewBox="0 0 16 16" width="12" height="12">
    <path d="M4 2.5h2.6v11H4zM9.4 2.5H12v11H9.4z" fill="currentColor" />
  </svg>
)

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="15"
      stroke="currentColor"
      strokeWidth="1.3"
      viewBox="0 0 16 16"
      width="15"
    >
      <path d="M3 6h2.2L8.5 3.3v9.4L5.2 10H3z" strokeLinejoin="round" />
      {muted ? (
        <path d="m11 6.2 3 3.6M14 6.2l-3 3.6" strokeLinecap="round" />
      ) : (
        <path d="M10.8 6.1a2.7 2.7 0 0 1 0 3.8M12.7 4.6a5 5 0 0 1 0 6.8" strokeLinecap="round" />
      )}
    </svg>
  )
}

interface TransportProps {
  status: string
  title: string
}

/** The player's control surface: scrub, play, mute, volume. */
export function Transport({ status, title }: TransportProps) {
  const { mediaState, muted, playing, seek, setVolume, toggleMute, togglePlay, volume } = useStore()
  const { duration, position } = mediaState
  const seekable = duration !== null && duration > 0
  const progress = seekable ? Math.min(100, (position / duration) * 100) : 0

  return (
    <div className="transport">
      {seekable && (
        <div className="transport__seek">
          <span className="transport__time">{formatDuration(position)}</span>
          <input
            aria-label="Seek"
            className="scrub"
            max={duration}
            min={0}
            onInput={(event) => seek(Number(event.currentTarget.value))}
            step={1}
            style={{ '--progress': `${progress}%` } as JSX.CSSProperties}
            type="range"
            value={Math.min(position, duration)}
          />
          <span className="transport__time">{formatDuration(duration)}</span>
        </div>
      )}

      <div className="transport__row">
        <button
          aria-label={playing ? 'Pause' : 'Play'}
          className="transport__play"
          onClick={togglePlay}
          type="button"
        >
          {playing ? PAUSE : PLAY}
        </button>

        <div className="transport__text">
          <div className="transport__title">{title}</div>
          <div className="transport__status">{status}</div>
        </div>

        <button
          aria-label={muted ? 'Unmute' : 'Mute'}
          aria-pressed={muted}
          className="transport__mute"
          onClick={toggleMute}
          type="button"
        >
          <SpeakerIcon muted={muted} />
        </button>

        <input
          aria-label="Volume"
          className="scrub transport__volume"
          max={100}
          min={0}
          onInput={(event) => setVolume(Number(event.currentTarget.value))}
          step={1}
          style={{ '--progress': `${muted ? 0 : volume}%` } as JSX.CSSProperties}
          type="range"
          value={muted ? 0 : volume}
        />
      </div>
    </div>
  )
}
