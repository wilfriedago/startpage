import { useState } from 'preact/hooks'

import { useStore } from '../../store'
import { RemoveButton } from './controls'
import { IconButton, IconPanel } from './icon-picker'

export function ShortcutsTab() {
  const { addShortcut, removeShortcut, shortcuts, updateShortcut } = useStore()
  const [picking, setPicking] = useState<number | null>(null)

  return (
    <div className="stack" style={{ gap: 10 }}>
      {shortcuts.map((shortcut, index) => (
        <div className="stack" key={index} style={{ gap: 8 }}>
          <div className="editor-row editor-row--shortcut">
            <IconButton
              fallback={(shortcut.name.slice(0, 1) || '?').toUpperCase()}
              name={shortcut.icon}
              on={picking === index}
              onClick={() => setPicking(picking === index ? null : index)}
            />
            <input
              aria-label="Shortcut name"
              className="field"
              onInput={(event) => updateShortcut(index, { name: event.currentTarget.value })}
              placeholder="Name"
              value={shortcut.name}
            />
            <input
              aria-label="Shortcut URL"
              className="field field--mono"
              onInput={(event) => updateShortcut(index, { url: event.currentTarget.value })}
              placeholder="https://"
              value={shortcut.url}
            />
            <RemoveButton
              label={`Remove ${shortcut.name || 'shortcut'}`}
              onClick={() => {
                removeShortcut(index)
                setPicking(null)
              }}
            />
          </div>
          {picking === index && (
            <IconPanel
              onSelect={(icon) => {
                updateShortcut(index, { icon })
                setPicking(null)
              }}
              value={shortcut.icon}
            />
          )}
        </div>
      ))}
      <button className="add-button" onClick={addShortcut} type="button">
        Add shortcut
      </button>
      <p className="footnote">
        A web page can&rsquo;t read browser bookmarks — that needs a Helium extension or new-tab
        override, so shortcuts live here. The defaults come from <code>dashboard.yml</code>. Icon
        search is the one thing here that calls out to the network; whatever you pick is stored on
        this device and keeps working offline.
      </p>
    </div>
  )
}
