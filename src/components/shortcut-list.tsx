import './shortcut-list.css'

import { Icon } from './shortcut-icon'
import { useStore } from '../store'

export function Shortcuts() {
  const { shortcuts } = useStore()
  const visible = shortcuts.filter((shortcut) => shortcut.name)

  if (visible.length === 0) {
    return null
  }

  return (
    <div className="stack">
      <h2 className="label">Shortcuts</h2>
      <nav className="shortcuts">
        {visible.map((shortcut, index) => (
          <a
            className="shortcut"
            href={shortcut.url || '#'}
            key={`${shortcut.url}-${index}`}
            rel="noreferrer noopener"
          >
            <span className="shortcut__badge">
              <Icon fallback={shortcut.name.slice(0, 1).toUpperCase()} name={shortcut.icon} />
            </span>
            <span>{shortcut.name}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
