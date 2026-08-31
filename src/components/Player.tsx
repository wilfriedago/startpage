import { RadioHost } from "./RadioHost";
import { Transport } from "./Transport";
import { VideoHost } from "./VideoHost";
import { NOISES } from "../lib/audio";
import { youtubeId, type MediaState } from "../lib/media";
import type { Source, VideoMode } from "../lib/types";
import { useStore } from "../store";

const SOURCE_TABS: [Source, string][] = [
  ["noise", "Noise"],
  ["radio", "Radio"],
  ["video", "Video"],
];

const VIDEO_MODES: [VideoMode, string][] = [
  ["card", "In the card"],
  ["background", "As page background"],
];

/** Turns a reported state into the design's status wording. */
function statusLine(state: MediaState, source: Source, videoMode: VideoMode, fallback: string): string {
  switch (state.status) {
    case "loading":
      return source === "radio" ? "connecting…" : "loading…";
    case "playing":
      return source === "radio"
        ? "live · streaming"
        : videoMode === "background"
          ? "playing behind the page"
          : "playing in the card";
    case "paused":
      return "paused";
    case "error":
      return source === "radio" ? "stream unavailable" : "video unavailable";
    default:
      return fallback;
  }
}

function nowPlayingLabel(store: ReturnType<typeof useStore>): string {
  const { noise, source, station, stations, ytUrl } = store;
  if (source === "noise") {
    return `${NOISES.find((entry) => entry.id === noise)?.label ?? "Noise"} noise`;
  }
  if (source === "radio") {
    const selected = stations[station];
    if (!selected) {
      return "No station";
    }
    return selected.label + (selected.genre ? ` · ${selected.genre}` : "");
  }

  const id = youtubeId(ytUrl);
  return id ? `YouTube · ${id}` : "No video set";
}

export function Player() {
  const store = useStore();
  const {
    mediaState,
    muted,
    noise,
    playerStatus,
    playing,
    seekTo,
    setMediaState,
    setNoise,
    setSource,
    setStation,
    setVideoMode,
    setYtUrl,
    source,
    station,
    stations,
    videoMode,
    volume,
    ytUrl,
  } = store;

  const id = youtubeId(ytUrl);
  const selected = stations[station];
  const level = muted ? 0 : volume;
  // The card holds the player whenever video is the source, so switching modes
  // is the only thing that moves it; it stays hidden until playback starts.
  const hostsVideo = source === "video" && Boolean(id) && videoMode === "card";
  const showCard = hostsVideo && playing;

  return (
    <section className="panel player">
      <div className="player__tabs" role="tablist">
        {SOURCE_TABS.map(([value, label]) => (
          <button
            aria-selected={source === value}
            className={source === value ? "player__tab player__tab--on" : "player__tab"}
            key={value}
            onClick={() => setSource(value)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="player__body">
        {source === "noise" && (
          <div className="chips">
            {NOISES.map((entry) => (
              <button
                className={noise === entry.id ? "chip chip--on" : "chip"}
                key={entry.id}
                onClick={() => setNoise(entry.id)}
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>
        )}

        {source === "radio" && (
          <div className="stations">
            {stations.map((entry, index) => (
              <button
                className={station === index ? "station station--on" : "station"}
                key={`${entry.url}-${index}`}
                onClick={() => setStation(index)}
                type="button"
              >
                <span
                  className={
                    station === index && playing ? "station__dot station__dot--live" : "station__dot"
                  }
                />
                <span className="station__label">{entry.label || "Untitled"}</span>
                <span className="station__genre">{entry.genre}</span>
              </button>
            ))}
          </div>
        )}

        {source === "video" && (
          <div className="video">
            <input
              aria-label="YouTube URL or video ID"
              className="field field--mono"
              onChange={(event) => setYtUrl(event.target.value)}
              placeholder="YouTube URL or video ID"
              value={ytUrl}
            />
            <div className="video__modes">
              {VIDEO_MODES.map(([value, label]) => (
                <button
                  className={videoMode === value ? "chip chip--on" : "chip"}
                  key={value}
                  onClick={() => setVideoMode(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            {hostsVideo && (
              <VideoHost
                className={showCard ? "video__frame" : "video__frame video__frame--hidden"}
                controls={false}
                id={id}
                onState={setMediaState}
                seekTo={seekTo}
                shouldPlay={playing}
                volume={level}
              />
            )}
          </div>
        )}
      </div>

      {source === "radio" && selected?.url && (
        <RadioHost
          onState={setMediaState}
          shouldPlay={playing}
          url={selected.url}
          volume={level}
        />
      )}

      <Transport
        status={
          source === "noise"
            ? playerStatus
            : statusLine(mediaState, source, videoMode, playerStatus)
        }
        title={nowPlayingLabel(store)}
      />
    </section>
  );
}
