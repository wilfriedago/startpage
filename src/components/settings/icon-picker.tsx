import './icon-picker.css'

import { useEffect, useRef, useState } from 'preact/hooks'

import { icons as baked } from 'virtual:dashboard'

import { type IconMatch, searchIcons } from '../../lib/iconify'
import { useStore } from '../../store'
import { Icon } from '../shortcut-icon'

const DEBOUNCE = 300

/** Icons from `dashboard.yml`. Offered before you type, and always offline. */
const BUNDLED: IconMatch[] = Object.entries(baked)
  .map(([name, svg]) => ({ name, svg }))
  .sort((a, b) => a.name.localeCompare(b.name))

type Status = 'ready' | 'searching' | 'empty' | 'unreachable'

/** The swatch in the shortcut row that opens the panel below it. */
export function IconButton({
  fallback,
  name,
  on,
  onClick,
}: {
  fallback: string
  name: string | undefined
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-expanded={on}
      aria-label={name === undefined ? 'Choose an icon' : `Change icon, currently ${name}`}
      className={on ? 'icon-button icon-button--on' : 'icon-button'}
      onClick={onClick}
      type="button"
    >
      <Icon fallback={fallback} name={name} />
    </button>
  )
}

export function IconPanel({
  onSelect,
  value,
}: {
  onSelect: (icon: string | undefined) => void
  value: string | undefined
}) {
  const { cacheIcon } = useStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<IconMatch[]>(BUNDLED)
  const [status, setStatus] = useState<Status>('ready')
  const search = useRef<HTMLInputElement>(null)

  useEffect(() => {
    search.current?.focus()
  }, [])

  useEffect(() => {
    const term = query.trim()
    if (!term) {
      setResults(BUNDLED)
      setStatus('ready')
      return
    }

    const controller = new AbortController()
    setStatus('searching')
    const timer = setTimeout(() => {
      searchIcons(term, controller.signal)
        .then((matches) => {
          // A request that resolved just before its cleanup ran must not
          // replace the results of the search that replaced it.
          if (controller.signal.aborted) {
            return
          }

          setResults(matches)
          setStatus(matches.length > 0 ? 'ready' : 'empty')
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResults([])
            setStatus('unreachable')
          }
        })
    }, DEBOUNCE)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const choose = (match: IconMatch) => {
    cacheIcon(match.name, match.svg)
    onSelect(match.name)
  }

  return (
    <div className="icon-panel">
      <div className="icon-panel__head">
        <input
          aria-label="Search icons"
          className="field"
          onInput={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search icons…"
          ref={search}
          value={query}
        />
        {value !== undefined && (
          <button className="icon-panel__clear" onClick={() => onSelect(undefined)} type="button">
            Clear
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="icon-panel__grid">
          {results.map((match) => (
            <button
              aria-label={match.name}
              className={
                match.name === value ? 'icon-panel__cell icon-panel__cell--on' : 'icon-panel__cell'
              }
              dangerouslySetInnerHTML={{ __html: match.svg }}
              key={match.name}
              onClick={() => choose(match)}
              title={match.name}
              type="button"
            />
          ))}
        </div>
      )}

      <p className="icon-panel__note">
        {status === 'searching' && 'Searching…'}
        {status === 'empty' && `Nothing matches “${query.trim()}”.`}
        {status === 'unreachable' &&
          'Could not reach the icon service. The bundled icons below still work.'}
        {status === 'ready' &&
          (query.trim()
            ? 'Picked icons are saved on this device and keep working offline.'
            : 'Icons from dashboard.yml. Type to search the Iconify catalogue.')}
      </p>
    </div>
  )
}
