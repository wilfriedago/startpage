/**
 * Icon lookup against the public Iconify API.
 *
 * This is the only part of the startpage that reaches the network without you
 * pressing play: it runs when you search for or pick a shortcut icon in
 * Settings, and never while the page is loading. The SVG of a picked icon is
 * cached in local storage, so shortcuts keep their icons offline afterwards.
 */

const API = 'https://api.iconify.design'
const SEARCH_LIMIT = 48

/** `prefix:name`, the same shape `dashboard.yml` accepts. */
const ICON_NAME = /^[a-z0-9-]+:[a-z0-9-]+$/

/**
 * Icon bodies are injected as markup, so they are allow-listed rather than
 * scrubbed: every element in the body must be one of these drawing primitives,
 * which rules out `script`, `style`, `foreignObject`, `use`, and the SMIL
 * elements that can graft an event handler onto a node. A body that fails is
 * dropped, not patched.
 */
const ALLOWED_ELEMENTS = new Set([
  'circle',
  'clippath',
  'defs',
  'desc',
  'ellipse',
  'g',
  'lineargradient',
  'line',
  'mask',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialgradient',
  'rect',
  'stop',
  'svg',
  'symbol',
  'title',
])

/** Attribute-level escapes the element allow-list cannot catch on its own. */
const UNSAFE_ATTRIBUTE = /\son\w+\s*=|javascript:/i

function isSafeBody(body: string): boolean {
  if (UNSAFE_ATTRIBUTE.test(body)) {
    return false
  }

  for (const [, element] of body.matchAll(/<\s*\/?\s*([a-zA-Z][\w:-]*)/g)) {
    // An unreadable tag name fails closed, the same as a disallowed one.
    if (!ALLOWED_ELEMENTS.has(element?.toLowerCase() ?? '')) {
      return false
    }
  }

  return true
}

interface Collection {
  height?: number
  icons?: Record<string, { body?: string; height?: number; width?: number } | undefined>
  width?: number
}

export interface IconMatch {
  /** Full `prefix:name`. */
  name: string
  svg: string
}

export function isIconName(value: string): boolean {
  return ICON_NAME.test(value)
}

/** Mirrors the shape the build-time plugin bakes into `virtual:dashboard`. */
function toSvg(body: string, width: number, height: number): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 ${width} ${height}"` +
    ` aria-hidden="true" focusable="false">${body}</svg>`
  )
}

async function getJson<T>(path: string, signal: AbortSignal): Promise<T | undefined> {
  const response = await fetch(`${API}/${path}`, { signal })
  return response.ok ? ((await response.json()) as T) : undefined
}

/** One request per prefix, however many icons that prefix contributed. */
async function fetchCollection(
  prefix: string,
  names: string[],
  signal: AbortSignal,
): Promise<IconMatch[]> {
  const collection = await getJson<Collection>(
    `${prefix}.json?icons=${names.map(encodeURIComponent).join(',')}`,
    signal,
  )
  if (!collection?.icons) {
    return []
  }

  const matches: IconMatch[] = []
  for (const name of names) {
    const icon = collection.icons[name]
    const body = icon?.body
    if (!body || !isSafeBody(body)) {
      continue
    }

    const width = icon.width ?? collection.width ?? 24
    const height = icon.height ?? collection.height ?? 24
    matches.push({ name: `${prefix}:${name}`, svg: toSvg(body, width, height) })
  }

  return matches
}

/** Resolves `prefix:name` strings to SVG, batching by prefix. Order is kept. */
export async function fetchIcons(names: string[], signal: AbortSignal): Promise<IconMatch[]> {
  const byPrefix = new Map<string, string[]>()
  for (const full of names) {
    const separator = full.indexOf(':')
    if (!isIconName(full)) {
      continue
    }

    const prefix = full.slice(0, separator)
    const group = byPrefix.get(prefix)
    if (group) {
      group.push(full.slice(separator + 1))
    } else {
      byPrefix.set(prefix, [full.slice(separator + 1)])
    }
  }

  const groups = await Promise.all(
    [...byPrefix].map(([prefix, group]) => fetchCollection(prefix, group, signal)),
  )
  const found = new Map(groups.flat().map((match) => [match.name, match]))

  return names.map((name) => found.get(name)).filter((match) => match !== undefined)
}

export async function searchIcons(query: string, signal: AbortSignal): Promise<IconMatch[]> {
  const term = query.trim()
  if (!term) {
    return []
  }

  const found = await getJson<{ icons?: string[] }>(
    `search?query=${encodeURIComponent(term)}&limit=${SEARCH_LIMIT}`,
    signal,
  )

  return found?.icons?.length ? fetchIcons(found.icons, signal) : []
}
