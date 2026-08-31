import { useEffect, useRef } from "react";

import type { MediaState } from "../lib/media";

interface RadioHostProps {
  onState: (state: MediaState) => void;
  shouldPlay: boolean;
  /** 0–100, matching the transport slider. */
  volume: number;
  url: string;
}

/**
 * A plain `<audio>` element for radio. Icecast streams are endless, so there is
 * no duration to report and nothing to seek — the transport shows them as live.
 */
export function RadioHost({ onState, shouldPlay, url, volume }: RadioHostProps) {
  const ref = useRef<HTMLAudioElement>(null);
  const report = useRef(onState);
  report.current = onState;

  useEffect(() => {
    const audio = ref.current;
    if (!audio) {
      return;
    }

    audio.volume = Math.min(1, Math.max(0, volume / 100));
  }, [volume]);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) {
      return;
    }

    if (!shouldPlay) {
      audio.pause();
      return;
    }

    report.current({ duration: null, position: 0, status: "loading" });
    audio.play().catch(() => report.current({ duration: null, position: 0, status: "error" }));
  }, [shouldPlay, url]);

  return (
    <audio
      onError={() => report.current({ duration: null, position: 0, status: "error" })}
      onPlaying={() => report.current({ duration: null, position: 0, status: "playing" })}
      onWaiting={() => report.current({ duration: null, position: 0, status: "loading" })}
      preload="none"
      ref={ref}
      src={url}
    />
  );
}
