/**
 * /galeria-de-fotos — the photo sessions.
 *
 * To add a session: drop the photos in `src/assets/fotos/<slug>/` and add an
 * entry below with the same slug. The folder name is the URL
 * (/galeria-de-fotos/<slug>); photos are picked up from it automatically and
 * shown in filename order, so number them (01.jpg, 02.jpg…). Astro resizes
 * them at build time, so originals of any size are fine.
 *
 * The build fails if a folder has no entry or an entry has no folder, so a
 * half-added session never ships as a broken page.
 */
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

export interface Sesion {
  /** Folder name under src/assets/fotos/ and the URL segment. */
  slug: string;
  /** Where it happened — printed on the label-maker tape. */
  lugar: string;
  /** ISO date, YYYY-MM-DD. Sessions are listed in date order. */
  fecha: string;
  /** Who took or sent the photos, if we know. */
  credito?: string;
  /** Filename of the photo used on the index and as the share image; defaults to the first. */
  portada?: string;
}

const SESIONES_DATA: Sesion[] = [
  { slug: 'sira-2007-06-17', lugar: 'Sira', fecha: '2007-06-17' },
  { slug: 'roxy-2007-07-08', lugar: 'Roxy', fecha: '2007-07-08' },
  { slug: 'el-teatrito-2007-08-18', lugar: 'El Teatrito', fecha: '2007-08-18' },
];

export interface Foto {
  archivo: string;
  image: ImageMetadata;
}

export interface SesionConFotos extends Sesion {
  fotos: Foto[];
  portadaFoto: Foto;
}

const archivos = import.meta.glob<ImageMetadata>('../assets/fotos/*/*.{jpg,jpeg,JPG,JPEG,png,webp,avif}', {
  eager: true,
  import: 'default',
});

const porCarpeta = new Map<string, Foto[]>();
for (const [path, image] of Object.entries(archivos)) {
  const [carpeta, archivo] = path.split('/').slice(-2);
  if (!porCarpeta.has(carpeta)) porCarpeta.set(carpeta, []);
  porCarpeta.get(carpeta)!.push({ archivo, image });
}

const sinEntrada = [...porCarpeta.keys()].filter((c) => !SESIONES_DATA.some((s) => s.slug === c));
if (sinEntrada.length) {
  throw new Error(`src/assets/fotos/: ${sinEntrada.join(', ')} no tiene entrada en src/data/fotos.ts`);
}

export const SESIONES: SesionConFotos[] = SESIONES_DATA.map((sesion) => {
  const fotos = (porCarpeta.get(sesion.slug) ?? []).sort((a, b) =>
    a.archivo.localeCompare(b.archivo, 'es', { numeric: true })
  );
  if (fotos.length === 0) {
    throw new Error(`src/data/fotos.ts: "${sesion.slug}" no tiene fotos en src/assets/fotos/${sesion.slug}/`);
  }
  const portadaFoto = sesion.portada ? fotos.find((f) => f.archivo === sesion.portada) : fotos[0];
  if (!portadaFoto) {
    throw new Error(`src/data/fotos.ts: la portada "${sesion.portada}" no está en ${sesion.slug}/`);
  }
  return { ...sesion, fotos, portadaFoto };
}).sort((a, b) => a.fecha.localeCompare(b.fecha));

export const sesionHref = (s: Sesion) => `/galeria-de-fotos/${s.slug}`;

/** 17/06/2007 */
export function fechaCorta(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** 17 de junio de 2007 */
export function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`)
  );
}

/** Grid and filmstrip thumbnails: 440px tall, enough for a 2x screen at the grid's row height. */
const ALTO_MINIATURA = 440;
/** The viewer's copy: longest side capped, so a 6000px original sent by a fan doesn't ship as-is. */
const LADO_VISOR = 1800;

export interface Version {
  /** Thumbnail URL. */
  mini: string;
  /** Viewer URL. */
  grande: string;
  /** The untouched file, for "abrir original". */
  original: string;
  ancho: number;
  alto: number;
}

export async function versiones({ image }: Foto): Promise<Version> {
  const escala = Math.min(1, LADO_VISOR / Math.max(image.width, image.height));
  const [mini, grande] = await Promise.all([
    getImage({ src: image, height: Math.min(ALTO_MINIATURA, image.height), format: 'webp', quality: 72 }),
    getImage({
      src: image,
      width: Math.round(image.width * escala),
      height: Math.round(image.height * escala),
      format: 'webp',
      quality: 82,
    }),
  ]);
  return { mini: mini.src, grande: grande.src, original: image.src, ancho: image.width, alto: image.height };
}
