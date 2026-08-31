import { describe, expect, it } from "vitest";

import { YOUTUBE_OPTIONS, streamSource, youtubeSource } from "./lib/media";

describe("youtube options", () => {
  // videojs-youtube reads `this.options_.poster || (…derive from img.youtube.com,
  // then checkHighResPoster())`. A truthy poster short-circuits the whole chain,
  // which is the only thing keeping Google's thumbnail host out of the network
  // log — and out of the offline contract's allowlist.
  it("sets an inline poster so no thumbnail is fetched from img.youtube.com", () => {
    expect(YOUTUBE_OPTIONS.poster).toMatch(/^data:image\//);
  });

  it("keeps the media on the privacy-enhanced host", () => {
    expect(YOUTUBE_OPTIONS.enablePrivacyEnhancedMode).toBe(true);
  });

  it("builds a source video.js routes to the youtube tech", () => {
    expect(youtubeSource("dQw4w9WgXcQ")).toEqual({
      src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      type: "video/youtube",
    });
  });
});

describe("streamSource", () => {
  it("types HLS and DASH so video.js reaches for http-streaming", () => {
    expect(streamSource("https://example.org/live.m3u8").type).toBe("application/x-mpegURL");
    expect(streamSource("https://example.org/live.mpd").type).toBe("application/dash+xml");
  });

  it("falls back to audio/mpeg for extensionless icecast streams", () => {
    expect(streamSource("https://ice1.somafm.com/groovesalad-128-mp3").type).toBe("audio/mpeg");
  });

  it("ignores the query string when sniffing the extension", () => {
    expect(streamSource("https://example.org/live.m3u8?token=abc").type).toBe(
      "application/x-mpegURL",
    );
  });
});
