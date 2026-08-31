import { useCallback, useEffect, useRef, useState } from "react";

import { createPlayer, type Player } from "../lib/media";

interface MediaHostProps {
  className?: string;
  /** Whether video.js draws its own control bar over the media. */
  controls?: boolean;
  failureStatus: string;
  kind: "audio" | "video";
  onFailure: (status: string) => void;
  onStatus: (status: string) => void;
  playingStatus: string;
  /** Playback intent. The transport button owns this; the player follows. */
  shouldPlay: boolean;
  src: string;
  type: string;
  volume: number;
}

/**
 * Wraps one video.js player. Every input is a prop, so playback follows the
 * store declaratively — nothing here reaches back into React state directly.
 */
export function MediaHost({
  className,
  controls = false,
  failureStatus,
  kind,
  onFailure,
  onStatus,
  playingStatus,
  shouldPlay,
  src,
  type,
  volume,
}: MediaHostProps) {
  // A new source rebuilds the player rather than swapping the src in place:
  // videojs-youtube only wires up its YT.Player during construction.
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [ready, setReady] = useState(false);

  // Event handlers are bound once, so they read their callbacks through a ref
  // rather than forcing video.js to resubscribe on every render.
  const handlers = useRef({ failureStatus, onFailure, onStatus, playingStatus });
  handlers.current = { failureStatus, onFailure, onStatus, playingStatus };
  const shouldPlayRef = useRef(shouldPlay);
  shouldPlayRef.current = shouldPlay;

  /**
   * Pushes the current intent onto the player. Re-asserted whenever the tech
   * reports progress, because videojs-youtube drops a `play()` that arrives
   * before its source is parsed — silently, and without queueing it.
   */
  const applyIntent = useCallback(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    if (!shouldPlayRef.current) {
      player.pause();
      return;
    }

    player.play()?.catch(() => handlers.current.onFailure(handlers.current.failureStatus));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    // The YouTube tech is fetched on demand, so setup is asynchronous and the
    // effect may be torn down before the player exists.
    let disposed = false;

    void createPlayer(container, {
      controls,
      kind,
      onReady: () => setReady(true),
      source: { src, type },
    }).then(
      (player) => {
        if (disposed) {
          player.dispose();
          return;
        }

        playerRef.current = player;
        player.on("waiting", () => handlers.current.onStatus("buffering…"));
        player.on("playing", () => handlers.current.onStatus(handlers.current.playingStatus));
        player.on("error", () => handlers.current.onFailure(handlers.current.failureStatus));
        player.on("loadstart", applyIntent);
        player.on("loadedmetadata", applyIntent);
        player.on("canplay", applyIntent);

        // videojs-youtube does not always emit `playing` — notably for a
        // background player with controls off — so a clock that keeps moving is
        // the reliable signal that playback is under way.
        let lastTime = 0;
        player.on("timeupdate", () => {
          const time = player.currentTime() ?? 0;
          if (time > lastTime && shouldPlayRef.current) {
            handlers.current.onStatus(handlers.current.playingStatus);
          }
          lastTime = time;
        });
      },
    );

    return () => {
      disposed = true;
      setReady(false);
      const player = playerRef.current;
      playerRef.current = null;
      player?.dispose();
    };
    // `controls` is only an initial value here; the effect below keeps it current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyIntent, kind, src, type]);

  useEffect(() => {
    if (ready) {
      playerRef.current?.controls(controls);
    }
  }, [controls, ready]);

  useEffect(() => {
    if (ready) {
      playerRef.current?.volume(Math.min(1, Math.max(0, volume / 100)));
    }
  }, [ready, volume]);

  useEffect(() => {
    if (ready && src) {
      applyIntent();
    }
  }, [applyIntent, ready, shouldPlay, src, type]);

  return <div className={className} ref={containerRef} />;
}
