/** Content for the pages that are not releases: home grid, /discografia, /galeria-de-fotos. */

export interface GridTile {
  href: string;
  img: string;
  /** alt text and the <h3> caption, which are the same string on every tile today. */
  label: string;
  /** Theme class on .album-icon; absent on the very first tile. */
  iconClass?: string;
}

/**
 * The home grid, kept as three explicit rows because rows 2 and 3 carry
 * `padding-top:4rem` and the last row is short (2 tiles, not 4).
 */
export const HOME_GRID: GridTile[][] = [
  [
    { href: '/album-verde', img: '/assets/img/content/albumverde.png', label: 'Álbum Verde' },
    { href: '/como-va-la-reserva', img: '/assets/img/content/comovalareserva.png', label: 'Cómo va la Reserva', iconClass: 'albumIcon1' },
    { href: '/escolares', img: '/assets/img/content/escolares.png', label: 'Escolares', iconClass: 'albumIcon2' },
    { href: '/el-partido-codificado-del-domingo', img: '/assets/img/content/partidocodificado.png', label: 'El Partido Codificado del Domingo', iconClass: 'albumIcon3' },
  ],
  [
    { href: '/viejas-porquerias', img: '/assets/img/content/viejasporquerias.png', label: 'Viejas Porquerías que no entraron en ningún disco', iconClass: 'albumIcon4' },
    { href: '/chiche-gelblung-presenta', img: '/assets/img/content/chiche-gelblung.png', label: 'Chiche Gelblung Presenta', iconClass: 'albumIcon1' },
    { href: '/rock-and-pop-en-vivo', img: '/assets/img/content/rockandpop.png', label: 'Vivo en Rock & Pop', iconClass: 'albumIcon2' },
    { href: '/fm-patricios-en-vivo', img: '/assets/img/content/fmpatricios.png', label: 'Vivo en FM Patricios', iconClass: 'albumIcon4' },
  ],
  [
    { href: '/salon-pueyrredon-en-vivo', img: '/assets/img/content/salonpueyrredon.png', label: 'Vivo en Salón Pueyrredón', iconClass: 'albumIcon5' },
    { href: '/discografia', img: '/assets/img/content/superheroes.png', label: 'Más Discos', iconClass: 'albumIcon6' },
  ],
];

export interface StudioAlbum {
  title: string;
  /** Rendered as raw HTML because the first title carries a <br />. */
  titleHtml: string;
  background: string;
  /** Dark text is used only on the first panel. */
  darkText?: boolean;
  links: { href: string; label: string }[];
}

/** /discografia — the studio records, which stream on Bandcamp rather than here. */
export const STUDIO_ALBUMS: StudioAlbum[] = [
  {
    title: 'César Luis Menotti / Carlos Salvador Bilardo',
    titleHtml: 'César Luis Menotti <br /> Carlos Salvador Bilardo',
    background: '/assets/img/albums/a1.jpg',
    darkText: true,
    links: [
      { href: 'https://superheroes.bandcamp.com/album/c-sar-luis-menotti', label: 'Escuchar Menotti' },
      { href: 'https://superheroes.bandcamp.com/album/carlos-salvador-bilardo', label: 'Escuchar Bilardo' },
    ],
  },
  {
    title: 'Este CD no tiene nombre',
    titleHtml: 'Este CD no tiene nombre',
    background: '/assets/img/albums/a2.jpg',
    links: [{ href: 'https://superheroes.bandcamp.com/album/este-cd-no-tiene-nombre', label: 'Escuchar' }],
  },
  {
    title: 'Ubaldisney',
    titleHtml: 'Ubaldisney',
    background: '/assets/img/albums/a3.jpg',
    links: [{ href: 'https://superheroes.bandcamp.com/album/ubaldisney', label: 'Escuchar' }],
  },
  {
    title: 'Game over',
    titleHtml: 'Game over',
    background: '/assets/img/albums/a4.jpg',
    links: [{ href: 'https://superheroes.bandcamp.com/album/game-over', label: 'Escuchar' }],
  },
];

export interface Gallery {
  heading: string;
  configUrl: string;
  containerId: string;
}

/** /galeria-de-fotos — three Juicebox galleries, in the order the page shows them. */
export const GALLERIES: Gallery[] = [
  { heading: 'Sira - 17/06/2007', configUrl: '/assets/galleries/config02.xml', containerId: 'juicebox-container1' },
  { heading: 'Roxy - 08/07/2007', configUrl: '/assets/galleries/config01.xml', containerId: 'juicebox-container2' },
  { heading: 'El Teatrito - 18/08/2007', configUrl: '/assets/galleries/config03.xml', containerId: 'juicebox-container3' },
];
