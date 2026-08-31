import { useStore } from "../../store";
import { Check, Group, RemoveButton, SliderRow } from "./controls";

export function SoundTab() {
  const {
    addStation,
    appearance,
    muteOnBlur,
    removeStation,
    setAppearance,
    setMuteOnBlur,
    setYtUrl,
    stations,
    updateStation,
    ytUrl,
  } = useStore();

  return (
    <div className="settings__group">
      <Group label="Radio stations">
        {stations.map((station, index) => (
          <div className="editor-row editor-row--station" key={index}>
            <input
              aria-label="Station name"
              className="field"
              onInput={(event) => updateStation(index, { label: event.currentTarget.value })}
              placeholder="Name"
              value={station.label}
            />
            <input
              aria-label="Stream URL"
              className="field field--mono"
              onInput={(event) => updateStation(index, { url: event.currentTarget.value })}
              placeholder="https://…mp3"
              value={station.url}
            />
            <input
              aria-label="Genre"
              className="field field--mono"
              onInput={(event) => updateStation(index, { genre: event.currentTarget.value })}
              placeholder="genre"
              value={station.genre}
            />
            <RemoveButton
              label={`Remove ${station.label || "station"}`}
              onClick={() => removeStation(index)}
            />
          </div>
        ))}
        <button className="add-button" onClick={addStation} type="button">
          Add station
        </button>
      </Group>

      <Group label="Video">
        <input
          aria-label="YouTube URL or ID"
          className="field field--mono"
          onInput={(event) => setYtUrl(event.currentTarget.value)}
          placeholder="YouTube URL or ID"
          value={ytUrl}
        />
        <SliderRow
          display={`${appearance.scrim}%`}
          label="Background dim"
          max={90}
          min={0}
          onChange={(scrim) => setAppearance({ scrim })}
          step={5}
          value={appearance.scrim}
        />
        <Check
          checked={muteOnBlur}
          label="Pause audio when this tab loses focus"
          onChange={setMuteOnBlur}
        />
      </Group>
    </div>
  );
}
