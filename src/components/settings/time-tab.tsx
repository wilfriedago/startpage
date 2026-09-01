import { isValidTimeZone } from '../../lib/time'
import { useStore } from '../../store'
import { Check, Group, Pill, RemoveButton } from './controls'

export function TimeTab() {
  const {
    addCity,
    cities,
    hour12,
    removeCity,
    setHour12,
    setShowSeconds,
    showSeconds,
    updateCity,
  } = useStore()

  return (
    <div className="settings__group">
      <div className="inline-row">
        <span className="inline-row__label">Time format</span>
        <div className="pills">
          <Pill label="13:00" mono on={!hour12} onClick={() => setHour12(false)} />
          <Pill label="1:00 PM" mono on={hour12} onClick={() => setHour12(true)} />
        </div>
      </div>

      <Check checked={showSeconds} label="Show seconds" onChange={setShowSeconds} />

      <Group label="World clocks">
        {cities.map((city, index) => (
          <div className="editor-row editor-row--pair" key={index}>
            <input
              aria-label="City label"
              className="field"
              onInput={(event) => updateCity(index, { label: event.currentTarget.value })}
              placeholder="Label"
              value={city.label}
            />
            <input
              aria-label="Time zone"
              className={
                isValidTimeZone(city.tz) ? 'field field--mono' : 'field field--mono field--invalid'
              }
              onInput={(event) => updateCity(index, { tz: event.currentTarget.value })}
              placeholder="Africa/Porto-Novo"
              value={city.tz}
            />
            <RemoveButton
              label={`Remove ${city.label || 'city'}`}
              onClick={() => removeCity(index)}
            />
          </div>
        ))}
        <button className="add-button" onClick={addCity} type="button">
          Add city
        </button>
      </Group>
    </div>
  )
}
