/**
 * schema.org descriptions printed as JSON-LD by Base.astro, so search engines
 * read the site as a band's discography rather than a pile of pages.
 */
import { SITE } from './site';
import type { Release } from './releases';

/** Where the band itself lives online — the same links as the footer icons. */
const SAME_AS = [
  'https://www.facebook.com/estoyout/',
  'https://twitter.com/superheroestw',
  'https://superheroes.bandcamp.com/',
  'https://www.youtube.com/user/iwantyouaround',
];

const url = (path: string) => `${SITE.origin}${path}`;

/** Referenced by @id from every other object, so it is described once. */
export const BANDA = {
  '@type': 'MusicGroup',
  '@id': url('/#banda'),
  name: SITE.artist,
  alternateName: 'Superheroes',
  genre: 'Rock',
  url: url('/'),
  image: url('/assets/og_img/fbprofile.png'),
  sameAs: SAME_AS,
};

export const SITIO = {
  '@type': 'WebSite',
  '@id': url('/#sitio'),
  name: SITE.artist,
  url: url('/'),
  inLanguage: 'es-AR',
  description: 'Sitio no oficial en homenaje a Superhéroes: discos, rarezas, fotos y aportes de los fans.',
  about: { '@id': BANDA['@id'] },
};

/** 245 → PT4M5S */
const iso = (seconds: number) => `PT${Math.floor(seconds / 60)}M${seconds % 60}S`;

export function album(release: Release) {
  const pagina = url(`/${release.slug}`);
  return {
    '@type': 'MusicAlbum',
    '@id': `${pagina}#disco`,
    name: release.title,
    description: release.description,
    url: pagina,
    image: url(release.heroImage),
    inLanguage: 'es',
    byArtist: { '@id': BANDA['@id'] },
    numTracks: release.tracks.length,
    track: {
      '@type': 'ItemList',
      numberOfItems: release.tracks.length,
      itemListElement: release.tracks.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'MusicRecording',
          name: t.title,
          byArtist: { '@id': BANDA['@id'] },
          inAlbum: { '@id': `${pagina}#disco` },
          ...(t.duration != null && { duration: iso(t.duration) }),
        },
      })),
    },
  };
}

/** Home › … › this page. `pasos` are [name, path] pairs after the home. */
export function migas(...pasos: [string, string][]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [['Inicio', '/'] as [string, string], ...pasos].map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: url(path),
    })),
  };
}

/** Wraps objects in one @graph so they share a single @context. */
export const grafo = (...nodos: object[]) => ({ '@context': 'https://schema.org', '@graph': nodos });
