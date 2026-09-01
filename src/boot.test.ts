import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import {
  DEFAULT_APPEARANCE,
  ROOT_STYLE_KEY,
  applyAppearance,
  applyTheme,
  normalizeAppearance,
} from './lib/appearance'
import type { Appearance, ThemeChoice } from './lib/types'

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8')

/** The inline boot script, taken from the page exactly as it ships. */
const bootSource = (() => {
  const match = html.match(/<script>([\s\S]*?)<\/script>/)
  if (!match?.[1]) {
    throw new Error('index.html no longer contains an inline boot script')
  }
  return match[1]
})()

/**
 * A `document.documentElement` thin enough to run both the boot script and
 * `applyAppearance` against, so the two can be compared property by property.
 */
function fakeRoot() {
  const properties = new Map<string, string>()
  const attributes = new Map<string, string>()
  const appended = new Set<unknown>()
  return {
    attributes,
    properties,
    element: {
      getAttribute: (name: string) => attributes.get(name) ?? null,
      removeAttribute: (name: string) => void attributes.delete(name),
      setAttribute: (name: string, value: string) => void attributes.set(name, value),
      style: {
        get cssText() {
          return [...properties].map(([key, value]) => `${key}: ${value};`).join(' ')
        },
        set cssText(text: string) {
          properties.clear()
          text
            .split(';')
            .map((rule) => rule.trim())
            .filter(Boolean)
            .forEach((rule) => {
              const at = rule.indexOf(':')
              properties.set(rule.slice(0, at).trim(), rule.slice(at + 1).trim())
            })
        },
        removeProperty: (name: string) => void properties.delete(name),
        setProperty: (name: string, value: string) => void properties.set(name, value),
      },
    },
    document: {
      createElement: (tag: string) => ({
        tagName: tag.toUpperCase(),
        textContent: '',
      }),
      head: {
        appendChild: (node: { textContent?: string }) => {
          appended.add(node)
          return node
        },
      },
    },
  }
}

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  })
})

/** Runs the app's real code, capturing what it settles on and what it persists. */
function applyViaApp(theme: ThemeChoice, appearance: Appearance) {
  const root = fakeRoot()
  vi.stubGlobal('document', { ...root.document, documentElement: root.element })
  applyTheme(theme)
  applyAppearance(appearance)
  return root
}

/** Runs the shipped boot script against a fresh root, reading the same storage. */
function applyViaBoot() {
  const root = fakeRoot()
  vi.stubGlobal('document', { ...root.document, documentElement: root.element })
  new Function(bootSource)()
  return root
}

const CASES: [string, ThemeChoice, Appearance][] = [
  ['midnight on defaults', 'dark', DEFAULT_APPEARANCE],
  ['system theme', 'system', DEFAULT_APPEARANCE],
  ['pearl theme', 'light', DEFAULT_APPEARANCE],
  [
    'a custom dark background and accent',
    'system',
    { ...DEFAULT_APPEARANCE, accent: '#E8613C', bg: '#1A1420', blur: false, radius: 4 },
  ],
  [
    'a custom light background',
    'dark',
    { ...DEFAULT_APPEARANCE, bg: '#F4F1EA', clockScale: 1.25, font: 'System UI' },
  ],
]

describe('appearance migration', () => {
  it('replaces removed bundled fonts while preserving other settings', () => {
    expect(
      normalizeAppearance({
        ...DEFAULT_APPEARANCE,
        accent: '#E8613C',
        font: 'DM Sans',
        mono: 'JetBrains Mono',
      }),
    ).toEqual({
      ...DEFAULT_APPEARANCE,
      accent: '#E8613C',
      font: 'IBM Plex Sans',
      mono: 'IBM Plex Mono',
    })
  })

  it('keeps zero-byte system font choices', () => {
    expect(
      normalizeAppearance({
        ...DEFAULT_APPEARANCE,
        font: 'System UI',
        mono: 'System Mono',
      }),
    ).toMatchObject({ font: 'System UI', mono: 'System Mono' })
  })
})

describe('the pre-paint boot script', () => {
  it.each(CASES)('reproduces %s exactly', (_name, theme, appearance) => {
    const app = applyViaApp(theme, appearance)
    store.set('helium-start:theme', JSON.stringify(theme))

    const boot = applyViaBoot()

    expect(Object.fromEntries(boot.properties)).toEqual(Object.fromEntries(app.properties))
    expect(boot.attributes.get('data-theme')).toBe(app.attributes.get('data-theme'))
  })

  it('persists the resolved declarations for the next load', () => {
    applyViaApp('dark', DEFAULT_APPEARANCE)
    expect(store.get(`helium-start:${ROOT_STYLE_KEY}`)).toMatch(/--font/)
  })

  it('leaves the stylesheet default alone when nothing is stored', () => {
    const boot = applyViaBoot()
    expect(boot.properties.size).toBe(0)
    expect(boot.attributes.size).toBe(0)
  })

  it('survives localStorage throwing, as in private mode', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('access denied')
      },
    })
    expect(() => applyViaBoot()).not.toThrow()
  })
})
