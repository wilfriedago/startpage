import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import { fetchIcons, isIconName, searchIcons } from './lib/iconify'

/** Stands in for the Iconify API. Returns one collection payload per prefix. */
function stubApi(collections: Record<string, unknown>) {
  const calls: string[] = []
  const fetchMock = vi.fn((url: string) => {
    calls.push(url)
    const prefix = new URL(url).pathname.replace(/^\/|\.json$/g, '')
    const body = collections[prefix]

    return Promise.resolve({
      json: () => Promise.resolve(body),
      ok: body !== undefined,
    } as Response)
  })
  vi.stubGlobal('fetch', fetchMock)

  return calls
}

function collection(icons: Record<string, { body: string }>) {
  return { height: 24, icons, prefix: 'x', width: 24 }
}

const signal = new AbortController().signal

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('isIconName', () => {
  it('accepts the same shape dashboard.yml accepts', () => {
    expect(isIconName('lucide:server')).toBe(true)
    expect(isIconName('simple-icons:home-assistant')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isIconName('lucide')).toBe(false)
    expect(isIconName('Lucide:Server')).toBe(false)
    expect(isIconName('lucide:server:extra')).toBe(false)
    expect(isIconName('')).toBe(false)
  })
})

describe('fetchIcons', () => {
  it('renders a body into a themeable 1em SVG', async () => {
    stubApi({ lucide: collection({ server: { body: '<path d="M0 0"/>' } }) })

    const [icon] = await fetchIcons(['lucide:server'], signal)

    expect(icon?.name).toBe('lucide:server')
    expect(icon?.svg).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"' +
        ' aria-hidden="true" focusable="false"><path d="M0 0"/></svg>',
    )
  })

  it('asks each prefix for all of its icons in one request', async () => {
    const calls = stubApi({
      lucide: collection({ server: { body: '<path/>' }, shield: { body: '<path/>' } }),
      'simple-icons': collection({ n8n: { body: '<path/>' } }),
    })

    const found = await fetchIcons(['lucide:server', 'simple-icons:n8n', 'lucide:shield'], signal)

    expect(calls).toHaveLength(2)
    expect(calls.some((url) => url.includes('lucide.json?icons=server,shield'))).toBe(true)
    // Results come back in the order asked for, not the order fetched.
    expect(found.map((icon) => icon.name)).toEqual([
      'lucide:server',
      'simple-icons:n8n',
      'lucide:shield',
    ])
  })

  it('drops icons the collection did not return', async () => {
    stubApi({ lucide: collection({ server: { body: '<path/>' } }) })

    const found = await fetchIcons(['lucide:server', 'lucide:missing'], signal)

    expect(found.map((icon) => icon.name)).toEqual(['lucide:server'])
  })

  it('skips a prefix the API does not know', async () => {
    stubApi({})

    expect(await fetchIcons(['nope:thing'], signal)).toEqual([])
  })

  // The body is injected as markup, so anything outside the drawing primitives
  // is dropped rather than patched.
  it.each([
    ['a script element', '<script>alert(1)</script><path/>'],
    ['an event handler', '<path onload="alert(1)" d="M0 0"/>'],
    ['a spaced event handler', '<path\tonclick = "alert(1)"/>'],
    ['a javascript: url', '<a href="javascript:alert(1)"><path/></a>'],
    ['inline style markup', '<style>*{display:none}</style><path/>'],
    ['foreignObject html', '<foreignObject><img src=x onerror=alert(1)></foreignObject>'],
    ['an external use reference', '<use href="data:image/svg+xml,x"/>'],
    ['a SMIL handler graft', '<set attributeName="onclick" to="alert(1)"/><path/>'],
  ])('rejects %s', async (_label, body) => {
    stubApi({ lucide: collection({ evil: { body } }) })

    expect(await fetchIcons(['lucide:evil'], signal)).toEqual([])
  })

  it('keeps the primitives real icons are made of', async () => {
    const body =
      '<g fill="none" stroke="currentColor"><rect width="20" height="8"/>' +
      '<circle cx="4" cy="4" r="2"/><path d="M6 6h.01"/></g>'
    stubApi({ lucide: collection({ server: { body } }) })

    const [icon] = await fetchIcons(['lucide:server'], signal)

    expect(icon?.svg).toContain(body)
  })
})

describe('searchIcons', () => {
  it('does not call the API for an empty query', async () => {
    const calls = stubApi({})

    expect(await searchIcons('   ', signal)).toEqual([])
    expect(calls).toHaveLength(0)
  })
})
