import { ACCENT_SWATCHES, BG_SWATCHES, FONTS, MONOS } from "../../lib/appearance";
import type { ThemeChoice } from "../../lib/types";
import { useStore } from "../../store";
import { Check, Group, Pill, SliderRow } from "./controls";

const THEMES: [ThemeChoice, string][] = [
  ["system", "System"],
  ["light", "Pearl"],
  ["dark", "Midnight"],
];

function matches(current: string | null, value: string): boolean {
  return (current ?? "").toLowerCase() === value.toLowerCase();
}

export function AppearanceTab() {
  const { appearance, setAppearance, setTheme, theme } = useStore();

  return (
    <div className="settings__group">
      <Group label="Base theme">
        <div className="pills">
          {THEMES.map(([value, label]) => (
            <Pill grow key={value} label={label} on={theme === value} onClick={() => setTheme(value)} />
          ))}
        </div>
      </Group>

      <Group label="Background">
        <div className="swatches">
          {BG_SWATCHES.map((value) => (
            <button
              className={
                matches(appearance.bg, value) ? "swatch swatch--on" : "swatch"
              }
              key={value}
              onClick={() => setAppearance({ bg: value })}
              style={{ background: value }}
              title={value}
              type="button"
            />
          ))}
          <input
            aria-label="Custom background hex"
            className="field field--mono"
            onChange={(event) => setAppearance({ bg: event.target.value })}
            placeholder="#0E1123"
            style={{ width: 104 }}
            value={appearance.bg ?? ""}
          />
        </div>
      </Group>

      <Group label="Accent">
        <div className="swatches">
          {ACCENT_SWATCHES.map((value) => (
            <button
              className={
                matches(appearance.accent, value)
                  ? "swatch swatch--round swatch--on-fg"
                  : "swatch swatch--round"
              }
              key={value}
              onClick={() => setAppearance({ accent: value })}
              style={{ background: value }}
              title={value}
              type="button"
            />
          ))}
        </div>
      </Group>

      <div className="pair">
        <Group label="Display font">
          <select
            aria-label="Display font"
            className="field field--select"
            onChange={(event) => setAppearance({ font: event.target.value })}
            value={appearance.font}
          >
            {Object.keys(FONTS).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Group>
        <Group label="Mono font">
          <select
            aria-label="Mono font"
            className="field field--select"
            onChange={(event) => setAppearance({ mono: event.target.value })}
            value={appearance.mono}
          >
            {Object.keys(MONOS).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Group>
      </div>

      <div className="stack" style={{ gap: 14 }}>
        <SliderRow
          display={`${appearance.radius}px`}
          label="Corner radius"
          max={20}
          min={0}
          onChange={(radius) => setAppearance({ radius })}
          step={1}
          value={appearance.radius}
        />
        <SliderRow
          display={`${Math.round(appearance.clockScale * 100)}%`}
          label="Clock size"
          max={1.5}
          min={0.6}
          onChange={(clockScale) => setAppearance({ clockScale })}
          step={0.05}
          value={appearance.clockScale}
        />
        <Check
          checked={appearance.blur}
          label="Frosted panels (backdrop blur)"
          onChange={(blur) => setAppearance({ blur })}
        />
      </div>
    </div>
  );
}
