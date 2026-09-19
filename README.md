# Superhéroes — sitio no oficial

Sitio de fans en homenaje a la banda argentina Superhéroes: discos para escuchar completos, rarezas, galería de fotos y material que mandan los fans. Está publicado en **[superheroes.com.ar](https://www.superheroes.com.ar)**.

Es un sitio estático hecho con [Astro](https://astro.build) y servido por [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/). El audio está alojado en DigitalOcean Spaces, fuera de este repo.

## Requisitos

- **Node 22.12 o superior** (la versión exacta está en `.nvmrc`). Astro 7 no arranca con versiones anteriores.
- `ffprobe` (de ffmpeg), solo si vas a recalcular duraciones de temas.

```sh
nvm use
npm install
```

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo de Astro |
| `npm run build` | Genera el sitio en `dist/` |
| `npm run preview` | Sirve `dist/` localmente |
| `npm test` | Tests end-to-end con Playwright (levanta `astro preview` solo) |
| `npm run cf:dev` | Build + `wrangler dev`, para probar ruteo y headers como en producción |
| `npm run durations -- <archivo.json>` | Vuelve a medir la duración de cada tema con ffprobe |
| `npm run deploy` | Build + `wrangler deploy` manual |

Para correr un solo test:

```sh
npx playwright test tests/player.spec.ts -g "queue outlives"
```

## Deploy

Producción se publica sola al pushear un tag de versión:

```sh
git tag v2.1.0 && git push origin v2.1.0
```

El workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) hace build, corre los tests (si fallan, no se publica), despliega el worker `superheroes` y crea el GitHub Release. Necesita los secrets `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` en el repo.

## Estructura

```
src/pages/             una página por ruta (discos, discografía, fotos, aportes, gracias, 404,
                       sitemap.xml y robots.txt)
src/layouts/Base.astro head, SEO, GTM, header, footer, reproductor y ClientRouter
src/components/        reproductor, tracklist, visor de fotos, títulos de cinta, etc.
src/scripts/           JS del cliente: reproductor, visor, UI
src/data/              el contenido: discos y temas, fotos, aportes, datos del sitio y SEO
src/assets/            fotos y aportes (pasan por el pipeline de imágenes de Astro)
public/assets/         CSS, fuentes e imágenes que se sirven tal cual
tests/                 tests de Playwright
```

## Cómo agregar contenido

**Una sesión de fotos.** Poné las fotos en `src/assets/fotos/<slug>/`, numeradas en el orden en que tienen que aparecer (`01.jpg`, `02.jpg`…), y agregá una entrada con el mismo `slug` en [`src/data/fotos.ts`](src/data/fotos.ts). El slug es la URL: `/galeria-de-fotos/<slug>`. Las fotos pueden ser de cualquier tamaño; Astro las redimensiona en el build.

**Un aporte de un fan.** Igual, pero en `src/assets/aportes/<slug>/` y [`src/data/aportes.ts`](src/data/aportes.ts), con título, quién lo mandó y un texto opcional.

En los dos casos el build falla si hay una carpeta sin entrada o una entrada sin carpeta, así que nunca se publica una página rota a medias.

**Discos y temas.** Están en [`src/data/releases.ts`](src/data/releases.ts). Las duraciones se guardan ahí mismo, así la página no tiene que descargar nada para mostrarlas; si cambia un archivo de audio, recalculalas con `npm run durations`.

## Cosas que conviene saber antes de tocar

- **El reproductor sigue sonando mientras navegás.** Eso depende de dos cosas: `transition:persist` en `Player.astro` y la cola guardada en el módulo `src/scripts/player.ts`, no en el DOM. Cualquier script que dependa del contenido de la página tiene que correr en `astro:page-load`.
- **`public/assets/css/master.css` no se importa desde Vite**, porque referencia las fuentes con rutas relativas y el bundler las rompería.
- **`build.format: 'file'`** mantiene las URLs sin barra final (`/album-verde`), iguales a las del sitio viejo. No lo cambies.
- **Las reglas de `public/_headers` no se pueden superponer**: Workers concatena los valores y se pierde el cache largo de los assets.

La explicación completa de la arquitectura y de estas restricciones está en [`CLAUDE.md`](CLAUDE.md).

## Problemas conocidos

El tema 21 de *Viejas Porquerías*, "La bicicleta de Saturno (en vivo)", está subido corrupto en DigitalOcean (5,2 MB de ceros). Se muestra deshabilitado en el tracklist hasta que se vuelva a subir desde el MP3 original.

---

Sitio hecho por fans, sin relación oficial con la banda.
