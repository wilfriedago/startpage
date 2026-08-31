import { useStore } from "../../store";
import { Pill } from "./controls";

export function WeatherTab() {
  const {
    cityName,
    lat,
    lon,
    refreshWeather,
    setCityName,
    setLat,
    setLon,
    setUnit,
    unit,
    useMyLocation,
  } = useStore();

  return (
    <div className="settings__group" style={{ gap: 16 }}>
      <div className="weather-fields">
        <input
          aria-label="City"
          className="field"
          onInput={(event) => setCityName(event.currentTarget.value)}
          placeholder="City"
          value={cityName}
        />
        <input
          aria-label="Latitude"
          className="field field--mono"
          onInput={(event) => setLat(event.currentTarget.value)}
          placeholder="Lat"
          value={lat}
        />
        <input
          aria-label="Longitude"
          className="field field--mono"
          onInput={(event) => setLon(event.currentTarget.value)}
          placeholder="Lon"
          value={lon}
        />
      </div>

      <div className="inline-row">
        <span className="inline-row__label">Units</span>
        <div className="pills">
          <Pill label="Celsius" on={unit === "c"} onClick={() => setUnit("c")} />
          <Pill label="Fahrenheit" on={unit === "f"} onClick={() => setUnit("f")} />
        </div>
      </div>

      <div className="settings__actions">
        <button className="action-button" onClick={useMyLocation} type="button">
          Use my location
        </button>
        <button className="action-button" onClick={refreshWeather} type="button">
          Refresh now
        </button>
      </div>

      <p className="footnote">Live conditions from Open-Meteo — no API key, no account.</p>
    </div>
  );
}
