import { describe, expect, it } from "vitest";

import { embedUrl, formatDuration, youtubeCommand, youtubeId, youtubeStatus } from "./lib/media";
import { DEFAULT_STATIONS } from "./store";

describe("youtubeId", () => {
  it("accepts every shape a person might paste", () => {
    const id = "aqz-KE-bpKQ";
    expect(youtubeId(`https://www.youtube.com/watch?v=${id}`)).toBe(id);
    expect(youtubeId(`https://youtu.be/${id}`)).toBe(id);
    expect(youtubeId(`https://www.youtube.com/embed/${id}`)).toBe(id);
    expect(youtubeId(`https://www.youtube.com/shorts/${id}`)).toBe(id);
    expect(youtubeId(id)).toBe(id);
  });

  it("rejects anything that is not an id", () => {
    expect(youtubeId("")).toBe("");
    expect(youtubeId("not a link")).toBe("");
  });
});

describe("embedUrl", () => {
  it("keeps the player on the privacy-preserving host", () => {
    expect(embedUrl("abc123", { controls: false })).toMatch(
      /^https:\/\/www\.youtube-nocookie\.com\/embed\/abc123\?/,
    );
  });

  // The page drives the embed over postMessage instead of loading Google's
  // iframe_api, which is the only reason no youtube.com script is needed.
  it("enables the JS API so the transport can control it", () => {
    const url = new URL(embedUrl("abc123", { controls: false }));
    expect(url.searchParams.get("enablejsapi")).toBe("1");
    expect(url.searchParams.get("controls")).toBe("0");
    expect(url.searchParams.get("playlist")).toBe("abc123");
  });

  it("can hand control back to YouTube's own bar", () => {
    const url = new URL(embedUrl("abc123", { controls: true }));
    expect(url.searchParams.get("controls")).toBe("1");
  });
});

describe("youtubeCommand", () => {
  it("builds the envelope the embed listens for", () => {
    expect(JSON.parse(youtubeCommand("setVolume", [40]))).toEqual({
      args: [40],
      event: "command",
      func: "setVolume",
    });
  });
});

describe("youtubeStatus", () => {
  it("maps the player states the transport reacts to", () => {
    expect(youtubeStatus(1)).toBe("playing");
    expect(youtubeStatus(2)).toBe("paused");
    expect(youtubeStatus(3)).toBe("loading");
    expect(youtubeStatus(-1)).toBe("loading");
  });

  it("leaves the status alone for states it does not model", () => {
    expect(youtubeStatus(5)).toBeNull();
  });
});

describe("formatDuration", () => {
  it("formats minutes and hours, and shows live streams as unknown", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(63)).toBe("1:03");
    expect(formatDuration(3661)).toBe("1:01:01");
    expect(formatDuration(null)).toBe("--:--");
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("--:--");
  });
});

describe("default stations", () => {
  it("includes lo-fi and synthwave presets that feel analog.fm-like out of the box", () => {
    expect(DEFAULT_STATIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          genre: expect.stringMatching(/lo[- ]?fi|study|chill/i),
          label: expect.stringMatching(/lo[- ]?fi|night|rain|study|cafe/i),
        }),
        expect.objectContaining({
          genre: expect.stringMatching(/synthwave|retro|electro|neon/i),
          label: "Sonic Universe",
          url: "https://ice1.somafm.com/sonicuniverse-128-mp3",
        }),
      ]),
    );
  });
});
