import { MediaHost } from "./MediaHost";
import { NOISES } from "../lib/audio";
import { streamSource, youtubeSource } from "../lib/media";
import type { Source, VideoMode } from "../lib/types";
import { youtubeId } from "../lib/youtube";
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
    noise,
    playerStatus,
    playing,
    reportFailure,
    setNoise,
    setPlayerStatus,
    setSource,
    setStation,
    setVideoMode,
    setVolume,
    setYtUrl,
    source,
    station,
    stations,
    togglePlay,
    videoMode,
    volume,
    ytUrl,
  } = store;

  const id = youtubeId(ytUrl);
  const selected = stations[station];
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
              <MediaHost
                className={showCard ? "video__frame" : "video__frame video__frame--hidden"}
                controls
                failureStatus="video unavailable"
                kind="video"
                onFailure={reportFailure}
                onStatus={setPlayerStatus}
                playingStatus="playing in the card"
                shouldPlay={playing}
                volume={volume}
                {...youtubeSource(id)}
              />
            )}
          </div>
        )}
      </div>

      {source === "radio" && selected?.url && (
        <MediaHost
          className="media-host--hidden"
          failureStatus="stream unavailable"
          kind="audio"
          onFailure={reportFailure}
          onStatus={setPlayerStatus}
          playingStatus="live · streaming"
          shouldPlay={playing}
          volume={volume}
          {...streamSource(selected.url)}
        />
      )}

      <div className="transport">
        <button
          aria-label={playing ? "Pause" : "Play"}
          className="transport__play"
          onClick={togglePlay}
          type="button"
        >
          {playing ? "❙❙" : "▶"}
        </button>
        <div className="transport__text">
          <div className="transport__title">{nowPlayingLabel(store)}</div>
          <div className="transport__status">{playerStatus}</div>
        </div>
        <input
          aria-label="Volume"
          className="transport__volume"
          max={100}
          min={0}
          onChange={(event) => setVolume(Number(event.target.value))}
          type="range"
          value={volume}
        />
      </div>
    </section>
  );
}
