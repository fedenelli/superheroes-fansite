// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.superheroes.com.ar',

  // Emit `dist/album-verde.html` rather than `dist/album-verde/index.html`.
  // Combined with Workers' default `html_handling: "auto-trailing-slash"`, that
  // serves the page at `/album-verde` — exactly the URLs the .htaccess rewrite
  // produces today. The default 'directory' format would move every page to a
  // trailing-slash URL.
  build: {
    format: 'file',
  },

  // master.css and the fonts it references live in public/ and are served
  // verbatim, so there is nothing for Vite to resolve between them.
  devToolbar: {
    enabled: false,
  },
});
