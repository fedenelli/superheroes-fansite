/**
 * /aportes — loose material sent in by fans: a clipping, a stray photo. Whole
 * photo sessions go in the gallery (fotos.ts) instead.
 *
 * To add one: drop the images in `src/assets/aportes/<slug>/`, numbered in the
 * order they should appear (01.jpg, 02.jpg…), and add an entry below with the
 * same slug. Entries are shown in the order they are listed here, newest last.
 * As with the gallery, the build fails if a folder and an entry don't match.
 */
import type { ImageMetadata } from 'astro';
import type { Foto } from './fotos';

export interface Aporte {
  /** Folder name under src/assets/aportes/ and the anchor on the page (#slug). */
  slug: string;
  /** Printed on the label-maker tape. */
  titulo: string;
  /** Who sent it. */
  de: string;
  /** One or two sentences of context, optional. */
  texto?: string;
}

const APORTES_DATA: Aporte[] = [
  {
    slug: 'power-music-2002',
    titulo: 'Entrevista en Power Music',
    de: 'Anabella Monfort',
    texto:
      'Revista Power Music, año 6, nº 54, junio de 2002.',
  },
  {
    slug: 'villa-gesell',
    titulo: 'Superhéroes en Villa Gesell',
    de: 'Guille J Murphy',
  },
];

export interface AporteConFotos extends Aporte {
  fotos: Foto[];
}

const archivos = import.meta.glob<ImageMetadata>('../assets/aportes/*/*.{jpg,jpeg,JPG,JPEG,png,webp,avif}', {
  eager: true,
  import: 'default',
});

const porCarpeta = new Map<string, Foto[]>();
for (const [path, image] of Object.entries(archivos)) {
  const [carpeta, archivo] = path.split('/').slice(-2);
  if (!porCarpeta.has(carpeta)) porCarpeta.set(carpeta, []);
  porCarpeta.get(carpeta)!.push({ archivo, image });
}

const sinEntrada = [...porCarpeta.keys()].filter((c) => !APORTES_DATA.some((a) => a.slug === c));
if (sinEntrada.length) {
  throw new Error(`src/assets/aportes/: ${sinEntrada.join(', ')} no tiene entrada en src/data/aportes.ts`);
}

export const APORTES: AporteConFotos[] = APORTES_DATA.map((aporte) => {
  const fotos = (porCarpeta.get(aporte.slug) ?? []).sort((a, b) =>
    a.archivo.localeCompare(b.archivo, 'es', { numeric: true })
  );
  if (fotos.length === 0) {
    throw new Error(`src/data/aportes.ts: "${aporte.slug}" no tiene fotos en src/assets/aportes/${aporte.slug}/`);
  }
  return { ...aporte, fotos };
});
