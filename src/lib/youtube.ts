export const YOUTUBE_EMBED = "https://www.youtube-nocookie.com/embed/";

/** Accepts a watch URL, a short link, an embed link, or a bare video id. */
export function youtubeId(raw: string): string {
  const text = String(raw ?? "").trim();
  if (!text) {
    return "";
  }

  const match = text.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{6,})/)?.[1];
  if (match) {
    return match;
  }

  return /^[\w-]{6,}$/.test(text) ? text : "";
}

export function embedUrl(id: string, extra = ""): string {
  return `${YOUTUBE_EMBED}${id}?autoplay=1&playsinline=1&rel=0&loop=1&playlist=${id}${extra}`;
}
