# Startpage

A local-first startpage: a clock you can read across the room, today's agenda,
tasks, a scratchpad, and something to listen to. Built with React, Vite, and
pnpm from the design in `.design/Helium Startpage.dc.html`.

```sh
pnpm install
pnpm dev
pnpm build
pnpm check
```

Open `dist/index.html` directly in a browser after building, or point your
browser's new-tab page at it.

## The page

| Block | What it does |
| --- | --- |
| Clock | Big tabular time, 12/24h, optional seconds, long date, live conditions |
| World clocks | Any number of cities, by IANA time zone |
| Shortcuts | Quick links, seeded from `dashboard.yml`, editable in Settings |
| Year dots | One dot per day; click any day to open its events and tasks |
| Today | Type `09:30 Standup` and press Enter — a bare title files as untimed |
| Tasks | Check, remove, or clear the finished ones in one go |
| Note | A scratchpad that saves as you type |
| Sound | Locally generated noise, internet radio, or a YouTube video — see below |

Keys: `1` agenda, `2` task, `3` note, `4` play/pause, `f` focus mode,
`,` settings, `esc` to close or to let go of a field.

Everything is configurable under Settings (`,`): theme, background, accent,
fonts, corner radius, clock size, which blocks appear at all, and an export of
the whole lot as JSON. Nothing is ever sent anywhere — it all lives in this
browser's local storage.

## The player

[video.js](https://videojs.com/) drives the two sources that load something:

- **Radio** plays through video.js on an `<audio>` element. Because video.js
  bundles `@videojs/http-streaming`, HLS (`.m3u8`) and DASH (`.mpd`) stations
  work everywhere, not only in Safari. `streamSource()` types the URL by
  extension and falls back to `audio/mpeg` for extensionless Icecast streams.
- **Video** plays through video.js with the `videojs-youtube` tech, configured
  with `enablePrivacyEnhancedMode`, so the media itself comes from
  `youtube-nocookie.com`. In the card it draws its own control bar; as a page
  background it draws none, matching the design.
- **Noise** does not use video.js at all. It is synthesised sample by sample in
  a Web Audio graph, so there is no source for a player to load.

The transport row is the single control surface: pressing play sets an
*intention*, and `<MediaHost>` reports back what video.js actually managed to
do — `connecting…`, `buffering…`, `live · streaming`, `stream unavailable`.

Two things to know about `videojs-youtube`: its last release was 2023, and it
calls `videojs.createTimeRange`, which video.js 9 removes. `MediaHost` also
works around two of its bugs — it drops a `play()` that arrives before its
source is parsed, and it does not always emit `playing` for a background
player. Both are commented at the call site.

## Editing your shortcuts

`dashboard.yml` seeds the shortcut row on a browser that has never opened the
page. Each item needs a `name` and an HTTPS `url`; an optional Iconify `icon`
(from `lucide`, `simple-icons`, `material-symbols`, or `cbi`) is baked into the
bundle and drawn in the badge, and items without one fall back to their initial.
The build validates the file and fails on a duplicate URL, a non-HTTP link, or
an unknown icon.

Once you edit shortcuts in Settings they live in local storage, and the YAML no
longer overrides them.

## The offline contract

`pnpm check` runs `scripts/check-offline.mjs` against the build to hold four
guarantees:

1. **One file.** `dist/` contains nothing but `index.html` — script, styles, and
   all eight web fonts are inlined into it.
2. **Nothing loads on open.** No CDN, no Google Fonts, no remote stylesheet,
   image, or script. Open it on a plane and it renders complete.
3. **`fetch` only.** No `XMLHttpRequest`, `WebSocket`, `EventSource`, or
   `sendBeacon` anywhere in the bundle.
4. **A closed host list.** Every absolute URL in the bundle is either one of
   your own bookmarks or one of three endpoints, each reached only when you ask
   for it:

   | Host | Reached when |
   | --- | --- |
   | `api.open-meteo.com` | the weather panel is on — keyless, no account, just a coordinate |
   | `ice1.somafm.com` | you press play on a default radio station |
   | `www.youtube-nocookie.com` | the video panel's player and media |
   | `www.youtube.com` | `videojs-youtube`'s `iframe_api` |

Add an endpoint and the check fails until you list it in `ALLOWED_HOSTS` with a
reason — which is the point. Hosts that appear in the bundle only as inert text
(an SVG namespace, an RFC link in an error message) are listed separately in
`NON_REQUEST_HOSTS`, each with a reason you can check against the source.

`videojs-youtube` calls `loadScript('https://www.youtube.com/iframe_api')` at
module scope, so importing it normally would make **every** new tab fetch that
script. `ensureYoutubeTech()` defers the import until a video is actually
queued, which is verified in a browser: opening the page makes exactly one
request, to Open-Meteo.

### What the contract cannot cover

Once a YouTube video is playing, Google's embedded player fetches from its own
hosts — `googlevideo.com` for the media, `i.ytimg.com` for thumbnails,
`gstatic.com`, plus YouTube's own telemetry. Those hosts are chosen at runtime
by Google's script inside the iframe, so they never appear in our bundle and no
static check can enumerate them. This is true of any YouTube embed, including
the plain `<iframe>` this panel used before. If that matters to you, leave the
video panel off — nothing loads until you press play.

## Deploying

`.github/workflows/deploy.yml` builds on every push to `main` and publishes to
GitHub Pages. It runs `pnpm check` first, so a failing test or a broken offline
contract stops the deploy rather than publishing a page that breaks its own
promises.

One manual step, once: **Settings → Pages → Source → GitHub Actions**.

The build needs no base-path configuration. `dist/index.html` is a single file
with every reference inlined as a `data:` URI, so it works unchanged at a
project subpath, at a custom domain, or opened straight off disk.

### Locally instead

`pnpm deploy:local` copies the built file to `/tmp/startpage.html` (pass a path
to put it elsewhere). Point your homepage at `file:///tmp/startpage.html` once
and the URL never changes — rebuild, run it again, and refresh.

Two things to weigh before publishing to Pages: on a public repo the page and your
`dashboard.yml` bookmarks are public, and Pages on a private repo needs a paid
plan. Whatever you type into the page — tasks, notes, API keys — stays in your
own browser's local storage either way, and is never sent anywhere.

## Credits

The tab icon is Helium's own mark, the asterisk from
[imputnet/helium](https://github.com/imputnet/helium) (GPL-3.0), taken from
`resources/branding/product_logo.svg` and cropped to the framing their
`resources/favicons/favicon_ntp_*.png` use for the new tab page.

Those PNGs ship as `#3C4043` on transparent and count on Chromium recolouring
favicons for internal pages, which a normal web page never gets — so the icon
here is inline SVG that picks `#3C4043` on a light tab strip and `#FBFCFF` on a
dark one, verified in both.
