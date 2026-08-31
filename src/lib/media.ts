import videojs from "video.js";

import type Player from "video.js/dist/types/player";

export type { Player };

/** A source video.js can load: a stream URL, or a YouTube watch link. */
export interface MediaSource {
  src: string;
  type: string;
}

export const YOUTUBE_WATCH = "https://www.youtube.com/watch?v=";

/**
 * A transparent 1×1 pixel. videojs-youtube otherwise derives a poster from
 * img.youtube.com and probes a second thumbnail on top of it; setting one
 * up front short-circuits both, so no image is fetched from Google.
 */
const BLANK_POSTER = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * Options handed to the YouTube tech. `poster` is load-bearing for the offline
 * contract, not cosmetic — see `media.test.ts`.
 */
export const YOUTUBE_OPTIONS = {
  // Keeps the media itself on youtube-nocookie.com.
  enablePrivacyEnhancedMode: true,
  iv_load_policy: 3,
  modestbranding: 1,
  poster: BLANK_POSTER,
  rel: 0,
  ytControls: 0,
} as const;

export function youtubeSource(id: string): MediaSource {
  return { src: `${YOUTUBE_WATCH}${id}`, type: "video/youtube" };
}

/**
 * Radio streams arrive with no reliable extension, so the type is inferred from
 * the URL and left blank when unknown — video.js then probes the response.
 */
export function streamSource(url: string): MediaSource {
  const path = url.split("?")[0] ?? "";
  if (/\.m3u8$/i.test(path)) {
    return { src: url, type: "application/x-mpegURL" };
  }
  if (/\.mpd$/i.test(path)) {
    return { src: url, type: "application/dash+xml" };
  }
  if (/\.(aac|m4a)$/i.test(path)) {
    return { src: url, type: "audio/aac" };
  }
  if (/\.ogg$/i.test(path)) {
    return { src: url, type: "audio/ogg" };
  }

  return { src: url, type: "audio/mpeg" };
}

let youtubeTech: Promise<unknown> | null = null;

/**
 * videojs-youtube calls `loadScript('https://www.youtube.com/iframe_api')` at
 * module scope, so merely importing it makes every new tab fetch Google's
 * script. Deferring the import until a video is actually queued keeps that
 * request tied to the video panel, which is the only place it belongs.
 */
export function ensureYoutubeTech(): Promise<unknown> {
  youtubeTech ??= import("videojs-youtube");
  return youtubeTech;
}

interface CreateOptions {
  controls: boolean;
  kind: "audio" | "video";
  onReady: (player: Player) => void;
  source: MediaSource;
}

/**
 * Builds the element video.js needs and hands back the player. The element is
 * created imperatively rather than rendered by React: video.js replaces it with
 * its own markup, and React must not try to reconcile what it no longer owns.
 */
export async function createPlayer(
  container: HTMLElement,
  options: CreateOptions,
): Promise<Player> {
  if (options.kind === "video") {
    await ensureYoutubeTech();
  }

  const element = document.createElement(options.kind === "audio" ? "audio" : "video");
  element.className = "video-js";
  element.setAttribute("playsinline", "");
  container.appendChild(element);

  return videojs(
    element,
    {
      audioOnlyMode: options.kind === "audio",
      autoplay: false,
      bigPlayButton: false,
      controls: options.controls,
      fill: options.kind === "video",
      loadingSpinner: options.kind === "video",
      loop: true,
      preload: "none",
      // The source is set at construction, not after: the YouTube tech reads the
      // video id in its constructor, and never builds a player without one.
      sources: [options.source],
      techOrder: options.kind === "video" ? ["youtube", "html5"] : ["html5"],
      youtube: YOUTUBE_OPTIONS,
    },
    function onPlayerReady(this: Player) {
      options.onReady(this);
    },
  );
}
