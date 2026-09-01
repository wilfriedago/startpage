import { readFile, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { parse } from 'yaml'

/** Hosts the running page may contact, and what triggers the request. */
const ALLOWED_HOSTS = new Map([
  ['api.open-meteo.com', 'weather, keyless, on a coordinate you set'],
  ['ice1.somafm.com', 'default radio streams, only once you press play'],
  ['hydra.cdnstream.com', 'the default TuneIn station, only once you press play'],
  ['www.youtube-nocookie.com', "the video panel's iframe, once you press play"],
])

/**
 * Hosts that appear in the bundle as text but are never requested. Each needs a
 * reason that someone can check against the source, not just an assertion.
 */
const NON_REQUEST_HOSTS = new Map([['www.w3.org', 'the SVG namespace on every bundled icon']])

const output = resolve(process.argv[2] ?? 'dist/index.html')
const html = await readFile(output, 'utf8')
const failures = []

// 1. Nothing loads from a third party when the page opens.
const loadTimeChecks = [
  [/<(?:script|img|iframe|source)\b[^>]*\bsrc=["'](?:https?:)?\/\//i, 'a remote resource URL'],
  [/<link\b[^>]*\bhref=["'](?:https?:)?\/\//i, 'a remote link resource'],
  [/(?:@import\s+|url\()\s*["']?(?:https?:)?\/\//i, 'a remote URL in CSS'],
  [/<(?:script|link)\b[^>]*(?:src|href)=["']\.\/assets\//i, 'an external Vite asset'],
]
for (const [pattern, description] of loadTimeChecks) {
  if (pattern.test(html)) {
    failures.push(`built HTML contains ${description}`)
  }
}

// 2. No transport but `fetch` — no beacons, sockets, or event streams.
const bannedPrimitive = /\b(?:XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/.exec(html)
if (bannedPrimitive) {
  failures.push(`built JavaScript uses ${bannedPrimitive[0].replace(/\s*\($/, '')}`)
}

// 3. Every absolute URL in the bundle is either one of your own bookmarks, an
//    allowed endpoint, or a documented string that is never requested.
const source = await readFile(new URL('../dashboard.yml', import.meta.url), 'utf8')
const bookmarkHosts = new Set(
  parse(source).categories.flatMap((category) =>
    category.items.map((item) => new URL(item.url).host),
  ),
)

const unexpected = new Set()
for (const [url] of html.matchAll(/https?:\/\/[\w.-]+/g)) {
  const host = new URL(url).host
  if (!NON_REQUEST_HOSTS.has(host) && !ALLOWED_HOSTS.has(host) && !bookmarkHosts.has(host)) {
    unexpected.add(host)
  }
}
for (const host of unexpected) {
  failures.push(`built bundle names an unlisted host: ${host}`)
}

// 4. The build really is one file.
const outputFiles = await readdir(dirname(output), { withFileTypes: true })
const strays = outputFiles.filter((entry) => entry.isFile() && entry.name !== 'index.html')
if (strays.length > 0) {
  failures.push(`build directory contains ${strays.map((entry) => entry.name).join(', ')}`)
}

if (failures.length > 0) {
  console.error('Offline contract: FAIL')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exitCode = 1
} else {
  const kib = Math.round(Buffer.byteLength(html) / 1024)
  console.log(`Offline contract: PASS (${kib} KiB single file, 0 load-time requests)`)
  for (const [host, reason] of ALLOWED_HOSTS) {
    console.log(`  opt-in endpoint: ${host} — ${reason}`)
  }
}
