# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static fan site for the Argentine band Superhéroes (superheroes.com.ar), in Spanish. Astro builds it to plain HTML; Cloudflare Workers serves the built directory. All user-facing copy is in Spanish — match that, including the `<!-- INICIO / FIN -->` comment banners that delimit page sections.

**Node 22.12+ is required** (see `.nvmrc`). Astro 7 refuses to run on older versions; `nvm use` before anything else.

```
npm run dev        # astro dev
npm run build      # → dist/
npm test           # playwright; boots `astro preview` itself
npm run cf:dev     # build, then wrangler dev — use this to check routing/headers
npm run deploy     # build + wrangler deploy
npx playwright test tests/player.spec.ts -g "queue outlives"   # single test
```

## The one thing to understand: the player

Audio must keep playing while the visitor navigates. Two pieces make that work, and breaking either one silently reintroduces the bug the whole architecture exists to fix:

1. `src/components/Player.astro` wraps the player in `<sh-player transition:persist="player">`. Astro's `ClientRouter` keeps that exact DOM node across navigations, so the `<audio>` inside it is never torn down.
2. `src/scripts/player.ts` holds the queue in **module scope**, not the DOM. The ClientRouter keeps the same `document`, so the module is evaluated once and its state outlives every page swap.

The old implementation did the opposite — current track was `.trak-item.active`, next track was that element's next sibling, play state lived in `data-state` attributes — which is exactly why leaving an album page killed playback. **Never reintroduce DOM-sibling traversal for queue logic.**

Because content is swapped rather than reloaded, anything that used to run just by having a `<script>` tag parsed must now be driven from `astro:page-load`: tracklist bindings, Juicebox init (`src/scripts/galleries.ts`), GTM pageviews and the chrome handlers in `src/scripts/ui.ts`. Listeners on `window` or on the persisted player are bound **once**; listeners on swapped-in page content are rebound per navigation.

**Analytics.** `player.ts` pushes `album_start`, `audio_start`, `audio_progress` (25/50/75) and `audio_complete` to `dataLayer`, each with the full set of `audio_*` keys (GTM merges pushes, so an omitted key would keep a stale value). A start is reported on the `playing` event, not on click, so a file that fails to decode is never counted. The GTM container (GTM-N3SK6W) is configured outside this repo: these events reach GA4 only if it has a trigger and a GA4 event tag for them.

## Layout

```
src/pages/[slug].astro   the 9 release pages, from RELEASES
src/pages/index.astro    hero + 10-tile grid + photos banner
src/pages/discografia.astro    4 Bandcamp panels, no audio
src/pages/galeria-de-fotos.astro   3 Juicebox galleries
src/pages/gracias.astro  the dedication note (used to be the hamburger overlay)
src/layouts/Base.astro   head/meta, GTM, <Header/>, footer, <Player/>, ClientRouter
src/components/Header.astro   top bar: logo + Discos/Fotos/Gracias (/discografia is reached from the home grid)
src/data/releases.ts     the dataset — 9 releases, 125 tracks
src/data/pages.ts        home grid, studio albums, gallery configs
public/assets/           css, fonts, img, og_img, galleries — served verbatim
```

`Base.astro` takes a `variant`: `'home'` reproduces the wider chrome that `/` and `/discografia` use (4rem logo, 4/4/4 footer, centred social icons); everything else uses `'inner'` (3.5rem logo, 5/3/4 footer). That difference is in the original design, not an accident.

`Base.astro` also takes `overlayHeader`: the header starts transparent (with a dark scrim) and `ui.ts` adds `.is-solid` once the page scrolls. The black fill is a `::after` layer faded by opacity, not a `background` swap, because a gradient can't transition and would snap. Only pages whose first section is a full-bleed image set it — home, `/discografia` and the release pages. White-topped pages (fotos, gracias, 404) leave it off and the bar is always black. Below 768px the same `<nav>` becomes a full-screen menu; there is deliberately one set of links, not a second hidden copy, so tests that click `a[href=…]` never hit an invisible duplicate.

## Constraints that are easy to violate

**`public/assets/` is served unprocessed, deliberately.** `master.css` (16k lines, bundling Bootstrap 3's grid with the theme) references `url('../fonts/…')`. Importing it through Vite would hash and relocate it, breaking every `@font-face`. Link it as `/assets/css/master.css`; don't "optimise" it into the bundle.

**`build.format: 'file'`** emits `album-verde.html`, which Workers' `html_handling: "auto-trailing-slash"` serves at `/album-verde` — the URLs the old `.htaccess` rewrite produced. Switching to the default `'directory'` format would move every page to a trailing-slash URL and break existing links.

**`public/_headers` rules must not overlap.** When several match one request Workers *concatenates* their values, so a `/*` catch-all plus per-directory overrides yields `max-age=3600, …, max-age=31536000` — first value wins and long-lived asset caching silently dies. HTML intentionally has no rule and uses the platform default (`max-age=0` + ETag).

**Class names** like `trak-item`, `jp-playlist`, `albumIcon*` come from the original purchased theme and are load-bearing in `master.css`.

**The release tracklist** lives in `src/components/Tracklist.astro` (the "fotocopia" look: a photocopied bootleg back cover, Lado A / Lado B, label-maker tapes). `player.ts` and the tests still find rows by `.trak-item`, `.play-pause-button` and `.trak-duration`, and map the nth row to the nth track, so the sides must keep dataset order. `.trak-item.active` gets the highlighter and `.playing` animates the bars. Its styles are `is:global`, namespaced `.shz-*`, and scoped under `.shz` so they out-rank and reset the legacy `.trak-item` rules still in `master.css`. The highlighter colour is each release's `accent` in `releases.ts`; black titles sit on it, so keep it light. Pages can add `<head>` tags through Base's `head` slot; release pages use it to load Courier Prime.

**The player UI is self-contained.** `Player.astro` renders three views over the same state — the bottom bar (a mini-player below 768px), the "now playing" sheet (full screen on phones, queue panel on desktop) and a `.shp-pip` card that `player.ts` moves into a Document Picture-in-Picture window. Its styles are `is:global` and namespaced `.shp-*` on purpose: they get copied into the PiP document, and they must not use the legacy `mesh-*` classes that `master.css` still styles. Controls are wired per element via `[data-action]` (not delegated on `<sh-player>`), because the PiP card leaves that subtree. Big artwork uses each release's `heroImage`; the `cover` files are only 30×30.

**Audio lives on DigitalOcean Spaces**, not in the repo. Track durations are baked into `releases.ts` at build time; the page renders them statically instead of shipping a hidden `<audio preload="metadata">` per track. `npm run durations -- <file.json>` re-probes via ffprobe.

## Known broken content

`viejas-porquerias` track 21, "La bicicleta de Saturno (en vivo)", is 5.2 MB of zero bytes on DigitalOcean — a corrupt upload. It returns 200 but cannot decode, so it has `duration: null` and the tracklist renders it as a disabled "cinta masticada" row. Needs re-uploading from the source MP3; nothing in this repo can fix it.
