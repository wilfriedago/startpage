import { save } from "./storage";
import type { Appearance, ThemeChoice } from "./types";

const DEFAULT_FONT = "IBM Plex Sans";
const DEFAULT_MONO = "IBM Plex Mono";
const DEFAULT_FONT_STACK = "'IBM Plex Sans',system-ui,sans-serif";
const DEFAULT_MONO_STACK = "'IBM Plex Mono',ui-monospace,monospace";

export const FONTS: Record<string, string> = {
  "IBM Plex Sans": DEFAULT_FONT_STACK,
  "System UI": "system-ui,-apple-system,sans-serif",
};

export const MONOS: Record<string, string> = {
  "IBM Plex Mono": DEFAULT_MONO_STACK,
  "System Mono": "ui-monospace,SFMono-Regular,Menlo,monospace",
};

export const DEFAULT_APPEARANCE: Appearance = {
  accent: null,
  bg: null,
  blur: true,
  clockScale: 1,
  font: DEFAULT_FONT,
  mono: DEFAULT_MONO,
  radius: 10,
  scrim: 45,
};

/** Migrates saved settings that refer to font families no longer bundled. */
export function normalizeAppearance(value: Appearance): Appearance {
  const candidate = value && typeof value === "object" ? value : DEFAULT_APPEARANCE;
  return {
    ...DEFAULT_APPEARANCE,
    ...candidate,
    font: Object.hasOwn(FONTS, candidate.font) ? candidate.font : DEFAULT_FONT,
    mono: Object.hasOwn(MONOS, candidate.mono) ? candidate.mono : DEFAULT_MONO,
  };
}

export const BG_SWATCHES = [
  "#0E1123",
  "#101314",
  "#14161F",
  "#1A1420",
  "#FBFCFF",
  "#F4F1EA",
  "#EDF0F7",
];

export const ACCENT_SWATCHES = ["#3450D1", "#9DAEFF", "#E8613C", "#3EA981", "#C9A227", "#B95BD0"];

/**
 * Where the resolved `:root` declarations are cached for the next page load.
 * The boot script in `index.html` replays this before the first paint, so it
 * needs no copy of the logic below — see `boot.test.ts`.
 */
export const ROOT_STYLE_KEY = "root-style";

/** Custom-background variables, cleared when the background falls back to the theme. */
const DERIVED = ["--bg1", "--fg", "--dim", "--faint", "--line", "--panel", "--hover"] as const;

export function applyTheme(theme: ThemeChoice): void {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

/**
 * Writes the appearance settings onto `:root` as inline custom properties, so
 * they win over both the stylesheet defaults and the dark-mode media query.
 *
 * A custom background derives the whole neutral ramp from its own luminance —
 * pick a dark hex and the text flips to light, and vice versa.
 */
export function applyAppearance(appearance: Appearance): void {
  const style = document.documentElement.style;
  style.setProperty("--font", FONTS[appearance.font] ?? DEFAULT_FONT_STACK);
  style.setProperty("--mono", MONOS[appearance.mono] ?? DEFAULT_MONO_STACK);
  style.setProperty("--radius", `${appearance.radius}px`);
  style.setProperty("--clock", `calc(clamp(84px,12vw,168px) * ${appearance.clockScale})`);
  style.setProperty("--blur", appearance.blur ? "blur(14px)" : "none");

  if (appearance.accent) {
    style.setProperty("--accent", appearance.accent);
  } else {
    style.removeProperty("--accent");
  }

  const hex = (appearance.bg ?? "").trim();
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    DERIVED.forEach((property) => style.removeProperty(property));
    style.removeProperty("color-scheme");
    save(ROOT_STYLE_KEY, style.cssText);
    return;
  }

  const packed = Number.parseInt(hex.slice(1), 16);
  const red = (packed >> 16) & 255;
  const green = (packed >> 8) & 255;
  const blue = packed & 255;
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  const isDark = luminance < 0.5;
  const channels = isDark ? "251,252,255" : "14,17,35";

  style.setProperty("--bg1", hex);
  style.setProperty("--fg", isDark ? "#FBFCFF" : "#0E1123");
  style.setProperty("--dim", `rgba(${channels},.58)`);
  style.setProperty("--faint", `rgba(${channels},.36)`);
  style.setProperty("--line", `rgba(${channels},.14)`);
  style.setProperty("--panel", `rgba(${channels},.04)`);
  style.setProperty("--hover", `rgba(${channels},.09)`);
  // Keeps native range sliders, checkboxes and selects legible on the custom ground.
  style.setProperty("color-scheme", isDark ? "dark" : "light");
  save(ROOT_STYLE_KEY, style.cssText);
}
