import { useStore } from '../../store'

export function DataTab() {
  const { clearDone, events, exportData, resetAppearance, shortcuts, stations, tasks } = useStore()

  return (
    <div className="stack" style={{ gap: 14 }}>
      <p className="body-text">
        {tasks.length} tasks · {events.length} events · {shortcuts.length} shortcuts ·{' '}
        {stations.length} stations. Nothing leaves this browser.
      </p>
      <div className="settings__actions">
        <button className="action-button action-button--primary" onClick={exportData} type="button">
          Export JSON
        </button>
        <button className="action-button" onClick={clearDone} type="button">
          Clear finished tasks
        </button>
        <button className="action-button" onClick={resetAppearance} type="button">
          Reset appearance
        </button>
      </div>
    </div>
  )
}
