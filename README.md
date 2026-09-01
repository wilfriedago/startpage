# Startpage

A local-first startpage: a clock you can read across the room, today's agenda,
tasks, a scratchpad, and something to listen to. Built with Preact, Vite, and
pnpm from the design in `.design/Helium Startpage.dc.html`.

```sh
pnpm install
pnpm dev
pnpm build
pnpm verify
```

Open `dist/index.html` directly in a browser after building, or point your
browser's new-tab page at it.

Component modules use kebab-case filenames, and component-specific styles live
beside their TSX file with the same basename. `src/app.css` is reserved for the
page shell and genuinely shared layout primitives; global resets and embedded
fonts remain in `src/styles/`.

## The page

| Block        | What it does                                                            |
| ------------ | ----------------------------------------------------------------------- |
| Clock        | Big tabular time, 12/24h, optional seconds, long date, live conditions  |
| World clocks | Any number of cities, by IANA time zone                                 |
| Shortcuts    | Quick links, seeded from `dashboard.yml`, editable in Settings          |
| Year dots    | One dot per day; click any day to open its events and tasks             |
| Today        | Type `09:30 Standup` and press Enter — a bare title files as untimed    |
| Tasks        | Check, remove, or clear the finished ones in one go                     |
| Note         | A scratchpad that saves as you type                                     |
| Sound        | Locally generated noise, internet radio, or a YouTube video — see below |

Keys: `1` agenda, `2` task, `3` note, `4` play/pause, `f` focus mode,
`,` settings, `esc` to close or to let go of a field.

Everything is configurable under Settings (`,`): theme, background, accent,
fonts, corner radius, clock size, which blocks appear at all, and an export of
the whole lot as JSON. Nothing is ever sent anywhere — it all lives in this
browser's local storage.

## The player

Three sources, none of them a media framework:

- **Noise** is synthesised sample by sample in a Web Audio graph. `cafe` is
  shaped pink noise, `airplane` shaped brown.
- **Radio** is a plain `<audio>` element. Streams are endless, so the transport
  shows them as live and offers no scrub bar.
- **Video** is a `youtube-nocookie.com` iframe driven over `postMessage` — the
  same protocol Google's `iframe_api` speaks, used directly. Nothing from
  youtube.com is loaded into this origin: the page only posts commands at a
  sandboxed frame, and reads back position, duration and player state.

The transport is the single control surface: play/pause, a scrub bar with
elapsed and total time where there is something to seek, mute, and volume. The
sliders are styled by hand rather than with `accent-color`, so the filled part
of the track follows the value.

This replaced video.js, which was **745 KiB — 56% of the whole page**. Dropping
it did not measurably change the first paint (that is dominated by nothing we
control), but it halved the file and removed the last third-party script.

The one thing lost with it is HLS and DASH playback, which video.js provided
through `@videojs/http-streaming`. Ordinary MP3 and AAC Icecast streams — every
default station — play natively. A `.m3u8` station would need `hls.js` adding
back, at roughly 150 KiB.

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

`pnpm verify` runs `scripts/check-offline.mjs` against the build to hold four
guarantees:

1. **One file.** `dist/` contains nothing but `index.html` — script, styles, and
   IBM Plex Sans and IBM Plex Mono are inlined into it.
2. **Nothing loads on open.** No CDN, no Google Fonts, no remote stylesheet,
   image, or script. Open it on a plane and it renders complete.
3. **`fetch` only.** No `XMLHttpRequest`, `WebSocket`, `EventSource`, or
   `sendBeacon` anywhere in the bundle.
4. **A closed host list.** Every absolute URL in the bundle is either one of
   your own bookmarks or one of five endpoints, each reached only when you ask
   for it:

   | Host                       | Reached when                                                     |
   | -------------------------- | ---------------------------------------------------------------- |
   | `api.open-meteo.com`       | the weather panel is on — keyless, no account, just a coordinate |
   | `ice1.somafm.com`          | you press play on a default radio station                        |
   | `hydra.cdnstream.com`      | you press play on the default TuneIn station                     |
   | `www.youtube-nocookie.com` | you point the video panel at a video — the iframe mounts then    |
   | `api.iconify.design`       | you search for or pick a shortcut icon in Settings               |

Add an endpoint and the check fails until you list it in `ALLOWED_HOSTS` with a
reason — which is the point. Hosts that appear in the bundle only as inert text
(an SVG namespace, an RFC link in an error message) are listed separately in
`NON_REQUEST_HOSTS`, each with a reason you can check against the source.

The video panel drives its embed over `postMessage` rather than loading
Google's `iframe_api`, so nothing from `youtube.com` is ever fetched. Icons work
the same way: the ones named in `dashboard.yml` are inlined at build time, and
an icon you pick in Settings is cached as SVG in local storage, so it renders on
later loads without another request. Both are verified in a browser — opening
the page makes exactly one request, to Open-Meteo.

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
GitHub Pages. It runs `pnpm verify` first, so a failing test or a broken offline
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
