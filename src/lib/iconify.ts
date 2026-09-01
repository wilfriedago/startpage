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
 * Icon bodies are injected as markup, so both elements and attributes are
 * allow-listed rather than scrubbed. Across the ~23,600 bodies in the four
 * bundled collections only five elements and seventeen attributes ever appear;
 * the lists below are a deliberate superset covering gradients and masks, which
 * multi-colour sets in the wider catalogue do use.
 *
 * `svg` is absent because the wrapper is built here, and no URL-bearing
 * attribute (`href`, `xlink:href`, `style`) is admitted at all.
 */
const ALLOWED_ELEMENTS = new Set([
  'circle',
  'clippath',
  'defs',
  'desc',
  'ellipse',
  'g',
  'line',
  'lineargradient',
  'mask',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialgradient',
  'rect',
  'stop',
  'symbol',
  'title',
])

const ALLOWED_ATTRIBUTES = new Set([
  'clip-path',
  'clip-rule',
  'cx',
  'cy',
  'd',
  'fill',
  'fill-opacity',
  'fill-rule',
  'gradienttransform',
  'gradientunits',
  'height',
  'id',
  'mask',
  'offset',
  'opacity',
  'patterntransform',
  'patternunits',
  'points',
  'r',
  'rx',
  'ry',
  'stop-color',
  'stop-opacity',
  'stroke',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
  'transform',
  'viewbox',
  'width',
  'x',
  'x1',
  'x2',
  'y',
  'y1',
  'y2',
])

/**
 * A complete element tag. Attributes must be separated by whitespace, so a
 * slash-delimited handler (`<path/onload=…>`, which the HTML parser reads as an
 * attribute) fails to match here and is caught by the gap check below.
 */
const TAG =
  /<\/?([a-zA-Z][\w-]*)((?:\s+[^\s/>"'=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>`=<]+))?)*)\s*\/?>/g

const ATTRIBUTE = /([^\s/>"'=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>`=<]+)))?/g

/**
 * `url(#local)` references a gradient in the same document; anything else
 * leaves it. Backslashes are rejected outright because a CSS escape can spell
 * `url(` without writing it — `u\72l(https://…)` — and browsers disagree about
 * whether they decode escapes in presentation attributes. No body in the
 * bundled collections contains one, so there is nothing to lose by refusing.
 */
const UNSAFE_VALUE = /\\|javascript:|data:|url\(\s*['"]?(?!#)/i

function hasSafeAttributes(attributes: string): boolean {
  ATTRIBUTE.lastIndex = 0
  for (let match = ATTRIBUTE.exec(attributes); match !== null; match = ATTRIBUTE.exec(attributes)) {
    if (!ALLOWED_ATTRIBUTES.has((match[1] ?? '').toLowerCase())) {
      return false
    }
    if (UNSAFE_VALUE.test(match[2] ?? match[3] ?? match[4] ?? '')) {
      return false
    }
  }

  return true
}

/**
 * Every `<` in the body must open a tag this recognises. Anything the tag
 * pattern cannot consume — a comment, a CDATA block, a malformed tag — is left
 * in the gap between matches and rejects the whole body.
 */
function isSafeBody(body: string): boolean {
  let cursor = 0
  TAG.lastIndex = 0

  for (let match = TAG.exec(body); match !== null; match = TAG.exec(body)) {
    if (body.slice(cursor, match.index).includes('<')) {
      return false
    }
    cursor = TAG.lastIndex

    if (!ALLOWED_ELEMENTS.has((match[1] ?? '').toLowerCase())) {
      return false
    }
    if (!hasSafeAttributes(match[2] ?? '')) {
      return false
    }
  }

  return !body.slice(cursor).includes('<')
}

/** The API controls these, so a size is only usable if it really is a number. */
function dimension(value: unknown, fallback: unknown): number | undefined {
  const size = value ?? fallback
  return typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : undefined
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

    const width = dimension(icon.width, collection.width ?? 24)
    const height = dimension(icon.height, collection.height ?? 24)
    if (width === undefined || height === undefined) {
      continue
    }

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
