import { useEffect, useRef } from "react";

import {
  IDLE,
  YOUTUBE_EMBED,
  embedUrl,
  youtubeCommand,
  youtubeListenRequest,
  youtubeStatus,
  type MediaState,
} from "../lib/media";

interface VideoHostProps {
  className?: string;
  /** Whether YouTube draws its own control bar inside the frame. */
  controls: boolean;
  id: string;
  onState: (state: MediaState) => void;
  seekTo?: number | null;
  shouldPlay: boolean;
  volume: number;
}

/**
 * A YouTube embed driven over postMessage — the same protocol Google's
 * `iframe_api` speaks, used directly. Nothing from youtube.com is loaded into
 * this origin: the player stays sealed inside its own youtube-nocookie frame,
 * and this page only ever posts commands at it.
 */
export function VideoHost({
  className,
  controls,
  id,
  onState,
  seekTo,
  shouldPlay,
  volume,
}: VideoHostProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const report = useRef(onState);
  report.current = onState;
  const ready = useRef(false);
  // YouTube reports duration, position and player state in separate messages,
  // so each one updates only the fields it actually carries.
  const latest = useRef<MediaState>(IDLE);

  const post = (message: string) => {
    ref.current?.contentWindow?.postMessage(message, YOUTUBE_EMBED.slice(0, -7));
  };

  // YouTube answers on the window; only its frame's messages are trusted.
  useEffect(() => {
    function onMessage(event: MessageEvent): void {
      if (event.source !== ref.current?.contentWindow) {
        return;
      }

      let payload: { info?: { currentTime?: number; duration?: number; playerState?: number } };
      try {
        payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      const info = payload?.info;
      if (!info) {
        return;
      }

      const status = info.playerState === undefined ? null : youtubeStatus(info.playerState);
      const next: MediaState = {
        duration:
          info.duration !== undefined && info.duration > 0 ? info.duration : latest.current.duration,
        position: info.currentTime ?? latest.current.position,
        status: status ?? latest.current.status,
      };

      if (
        next.duration === latest.current.duration &&
        next.position === latest.current.position &&
        next.status === latest.current.status
      ) {
        return;
      }

      latest.current = next;
      report.current(next);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Subscribe once the frame has loaded, so it starts reporting progress.
  const subscribe = () => {
    ready.current = true;
    latest.current = IDLE;
    post(youtubeListenRequest());
    post(youtubeCommand("setVolume", [volume]));
    if (!shouldPlay) {
      post(youtubeCommand("pauseVideo"));
    }
  };

  useEffect(() => {
    if (!ready.current) {
      return;
    }
    post(youtubeCommand(shouldPlay ? "playVideo" : "pauseVideo"));
  }, [shouldPlay]);

  useEffect(() => {
    if (ready.current) {
      post(youtubeCommand("setVolume", [volume]));
    }
  }, [volume]);

  useEffect(() => {
    if (ready.current && seekTo !== null && seekTo !== undefined) {
      post(youtubeCommand("seekTo", [seekTo, true]));
    }
  }, [seekTo]);

  return (
    <div className={className}>
      <iframe
        allow="autoplay; encrypted-media"
        onLoad={subscribe}
        ref={ref}
        src={embedUrl(id, { controls })}
        title="Video"
      />
    </div>
  );
}
