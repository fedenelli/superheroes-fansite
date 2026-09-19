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

## Layout

```
src/pages/[slug].astro   the 9 release pages, from RELEASES
src/pages/index.astro    hero + 10-tile grid + photos banner
src/pages/discografia.astro    4 Bandcamp panels, no audio
src/pages/galeria-de-fotos.astro   3 Juicebox galleries
src/layouts/Base.astro   head/meta, GTM, chrome, <Player/>, ClientRouter
src/data/releases.ts     the dataset — 9 releases, 125 tracks
src/data/pages.ts        home grid, studio albums, gallery configs
public/assets/           css, fonts, img, og_img, galleries — served verbatim
```

`Base.astro` takes a `variant`: `'home'` reproduces the wider chrome that `/` and `/discografia` use (4rem logo, 4/4/4 footer, centred social icons); everything else uses `'inner'` (3.5rem logo, 5/3/4 footer). That difference is in the original design, not an accident.

## Constraints that are easy to violate

**`public/assets/` is served unprocessed, deliberately.** `master.css` (16k lines, bundling Bootstrap 3's grid with the theme) references `url('../fonts/…')`. Importing it through Vite would hash and relocate it, breaking every `@font-face`. Link it as `/assets/css/master.css`; don't "optimise" it into the bundle.

**`build.format: 'file'`** emits `album-verde.html`, which Workers' `html_handling: "auto-trailing-slash"` serves at `/album-verde` — the URLs the old `.htaccess` rewrite produced. Switching to the default `'directory'` format would move every page to a trailing-slash URL and break existing links.

**`public/_headers` rules must not overlap.** When several match one request Workers *concatenates* their values, so a `/*` catch-all plus per-directory overrides yields `max-age=3600, …, max-age=31536000` — first value wins and long-lived asset caching silently dies. HTML intentionally has no rule and uses the platform default (`max-age=0` + ETag).

**Class names** like `mesh-*`, `trak-item`, `jp-playlist`, `albumIcon*` come from the original purchased theme and are load-bearing in `master.css`. `.trak-item.playing` drives the play/pause icon swap; `.mesh-play`/`.mesh-pause` have no CSS hiding either, so `player.ts` toggles them inline the way jPlayer used to.

**Audio lives on DigitalOcean Spaces**, not in the repo. Track durations are baked into `releases.ts` at build time; the page renders them statically instead of shipping a hidden `<audio preload="metadata">` per track. `npm run durations -- <file.json>` re-probes via ffprobe.

## Known broken content

`viejas-porquerias` track 21, "La bicicleta de Saturno (en vivo)", is 5.2 MB of zero bytes on DigitalOcean — a corrupt upload. It returns 200 but cannot decode, so it has `duration: null` and will not play. Needs re-uploading from the source MP3; nothing in this repo can fix it.
