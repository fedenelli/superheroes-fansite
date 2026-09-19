// GENERATED from the legacy HTML by scripts/extract-releases.mjs +
// scripts/gen-data.mjs, then hand-checked. Edit this file directly from here on.

/** One song. `duration` is seconds, resolved at migration time by ffprobe. */
export interface Track {
  title: string;
  url: string;
  /** null when the source file could not be probed; the page measures it client-side instead. */
  duration: number | null;
}

/**
 * One half of the prev/next footer.
 *
 * `linkClass` is carried per link rather than derived from the side: the two
 * oldest pages use `pagination-previous` on the left, the seven newer ones
 * reuse `pagination-next` on both sides, and the CSS aligns those differently.
 * Preserved as-is so the migration introduces no visual change.
 */
export interface PageLink {
  href: string;
  label: string;
  kicker: string;
  linkClass: string;
  image: string;
}

export interface Release {
  slug: string;
  title: string;
  /** Verbatim <h2>; casing and accents are inconsistent across pages by design. */
  heading: string;
  description: string;
  ogTitle: string;
  /** Several pages word twitter:title and twitter:description differently from the og/meta pair. */
  twitterTitle: string;
  twitterDescription: string;
  ogImage: string;
  twitterImage: string;
  heroImage: string;
  /** Artwork shown in the footer player while a track from this release plays. */
  cover: string;
  downloadUrl: string;
  prev: PageLink | null;
  next: PageLink | null;
  tracks: Track[];
}

/** Ordered as the prev/next chain walks them. */
export const RELEASES: Release[] = [
  {
    slug: "album-verde",
    title: "Album Verde",
    heading: "ALBUM VERDE",
    description: "El primer demo de Superhéroes. Un disco que seguro no cambió la historia del rock.",
    ogTitle: "Superhéroes - Álbum Verde",
    twitterTitle: "Superhéroes - Álbum Verde",
    twitterDescription: "El primer demo de Superhéroes. Un disco que seguro no cambió la historia del rock.",
    ogImage: "fbalbumverde.png",
    twitterImage: "twalbumverde.png",
    heroImage: "/assets/img/albums/album-verde_main.jpg",
    cover: "/assets/img/albums/cover1.jpg",
    downloadUrl: "https://drive.google.com/file/d/0B2ElIMffOhvfd2ZDMEVSWnpHNUU/view?usp=drive_link&resourcekey=0-n697PKqAyom0jUvY5FMLzQ",
    prev: {
      href: "/",
      label: "Discografía",
      kicker: "Anterior",
      linkClass: "pagination-previous",
      image: "/assets/img/albums/discosFooter.jpg",
    },
    next: {
      href: "/como-va-la-reserva",
      label: "Cómo va la Reserva",
      kicker: "Siguiente",
      linkClass: "pagination-next",
      image: "/assets/img/albums/comovalareservaFooter.jpg",
    },
    tracks: [
      { title: "De boliche en boliche", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/album-verde/01.mp3", duration: 178 },
      { title: "Golosinas", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/album-verde/02.mp3", duration: 147 },
      { title: "A mi me gustan todas las chicas", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/album-verde/03.mp3", duration: 225 },
      { title: "Pincha, Rompe, Cuelga, Garpa", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/album-verde/04.mp3", duration: 168 },
      { title: "El arbolito del amor", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/album-verde/05.mp3", duration: 168 },
      { title: "Feliz Domingo", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/album-verde/06.mp3", duration: 222 },
    ],
  },
  {
    slug: "como-va-la-reserva",
    title: "Cómo va la Reserva",
    heading: "COMO VA LA RESERVA",
    description: "Cómo va la Reserva, el demo que contiene el único hit de Superhéroes: He-man. Curiosamente se negaron a tocarlo durante 20 años.",
    ogTitle: "Superhéroes - Cómo va la Reserva",
    twitterTitle: "Superhéroes - Cómo va la Reserva",
    twitterDescription: "Cómo va la Reserva, el demo que contiene el único hit de Superhéroes: He-man. Curiosamente se negaron a tocarlo durante 20 años.",
    ogImage: "fbcomovalareserva.png",
    twitterImage: "twcomovalareserva.png",
    heroImage: "/assets/img/albums/como-va-la-reserva_main.jpg",
    cover: "/assets/img/albums/cover2.jpg",
    downloadUrl: "https://drive.google.com/file/d/0B2ElIMffOhvfNGl6aVBUWnliVG8/view?usp=drive_link&resourcekey=0-1eA7A4WoJ3YlE5_4Qy1KFA",
    prev: {
      href: "/album-verde",
      label: "Álbum Verde",
      kicker: "Anterior",
      linkClass: "pagination-previous",
      image: "/assets/img/albums/albumverdeFooter.jpg",
    },
    next: {
      href: "/escolares",
      label: "Escolares",
      kicker: "Siguiente",
      linkClass: "pagination-next",
      image: "/assets/img/albums/escolaresFooter.jpg",
    },
    tracks: [
      { title: "Brigada A - De vacaciones", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/como-va-la-reserva/01.mp3", duration: 308 },
      { title: "He-Man", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/como-va-la-reserva/02.mp3", duration: 166 },
      { title: "Seguí Participando", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/como-va-la-reserva/03.mp3", duration: 164 },
      { title: "La corriente del niño", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/como-va-la-reserva/04.mp3", duration: 135 },
      { title: "De boliche en boliche", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/como-va-la-reserva/05.mp3", duration: 172 },
      { title: "Las ovejas de la Agronomía", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/como-va-la-reserva/06.mp3", duration: 48 },
      { title: "A mi me gustan todas las chicas", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/como-va-la-reserva/07.mp3", duration: 251 },
      { title: "El asalto", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/como-va-la-reserva/08.mp3", duration: 151 },
      { title: "Yo no voy ni loco", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/como-va-la-reserva/09.mp3", duration: 182 },
      { title: "La bomba de Proieto", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/como-va-la-reserva/10.mp3", duration: 150 },
      { title: "Feliz Domingo", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/como-va-la-reserva/11.mp3", duration: 198 },
      { title: "Petarditos", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/como-va-la-reserva/12.mp3", duration: 197 },
    ],
  },
  {
    slug: "escolares",
    title: "Escolares",
    heading: "ESCOLARES",
    description: "Este es el disco que seguro no escuchaste cuando ibas al colegio. Pero no es culpa de Superhéroes. Es culpa de Xuxa.",
    ogTitle: "Superhéroes - Escolares",
    twitterTitle: "Superhéroes - Escolares",
    twitterDescription: "Este es el disco que seguro no escuchaste cuando ibas al colegio. Pero no es culpa de Superhéroes. Es culpa de Xuxa.",
    ogImage: "fbescolares.png",
    twitterImage: "twescolares.png",
    heroImage: "/assets/img/albums/escolares_main.jpg",
    cover: "/assets/img/albums/cover3.jpg",
    downloadUrl: "https://drive.google.com/file/d/0B2ElIMffOhvfcUg4OExPblF4WUk/view?usp=drive_link&resourcekey=0-2BoSGyM3BUHyBox02quR0w",
    prev: {
      href: "/como-va-la-reserva",
      label: "Cómo va la Reserva",
      kicker: "Anterior",
      linkClass: "pagination-previous",
      image: "/assets/img/albums/comovalareservaFooter.jpg",
    },
    next: {
      href: "/el-partido-codificado-del-domingo",
      label: "El Partido Codificado del Domingo",
      kicker: "Siguiente",
      linkClass: "pagination-next",
      image: "/assets/img/albums/partidocodificadoFooter.jpg",
    },
    tracks: [
      { title: "Preparatoria", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/escolares/01.mp3", duration: 170 },
      { title: "Mi novia es fea", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/escolares/02.mp3", duration: 178 },
      { title: "Nueva compañera", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/escolares/03.mp3", duration: 261 },
      { title: "Tiempo de cambios", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/escolares/04.mp3", duration: 184 },
      { title: "Empleado del mes", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/escolares/05.mp3", duration: 165 },
      { title: "Pasta yuta", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/escolares/06.mp3", duration: 121 },
      { title: "Voy a matar al peluquero", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/escolares/07.mp3", duration: 192 },
      { title: "Luchando por el metal", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/escolares/08.mp3", duration: 156 },
      { title: "Perdido por perdido", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/escolares/09.mp3", duration: 224 },
      { title: "La difícil", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/escolares/10.mp3", duration: 144 },
      { title: "Copo de nieve", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/escolares/11.mp3", duration: 172 },
      { title: "El plantón", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/escolares/12.mp3", duration: 261 },
      { title: "Frana y Miniussi", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/escolares/13.mp3", duration: 165 },
    ],
  },
  {
    slug: "el-partido-codificado-del-domingo",
    title: "El Partido Codificado del Domingo",
    heading: "EL PARTIDO CODIFICADO DEL DOMINGO",
    description: "Un disco con hits. Bah, en realidad no. Pero el tema en el que juegan con el dial de la radio está muy bueno.",
    ogTitle: "Superhéroes - El Partido Codificado del Domingo",
    twitterTitle: "Superhéroes - El Partido Codificado del Domingo",
    twitterDescription: "Un disco con hits. Bah, en realidad no. Pero el tema en el que juegan con el dial de la radio está muy bueno.",
    ogImage: "fbpartidocodificado.png",
    twitterImage: "twpartidocodificado.png",
    heroImage: "/assets/img/albums/partidocodificado_main.jpg",
    cover: "/assets/img/albums/cover4.jpg",
    downloadUrl: "https://drive.google.com/file/d/0B2ElIMffOhvfNkFFaHlFc2FMZ3c/view?usp=drive_link&resourcekey=0-UloAuFRE94JdrGGiKZJh1A",
    prev: {
      href: "/escolares",
      label: "Escolares",
      kicker: "Anterior",
      linkClass: "pagination-previous",
      image: "/assets/img/albums/albumverdeFooter.jpg",
    },
    next: {
      href: "/viejas-porquerias",
      label: "Viejas Porquerías",
      kicker: "Siguiente",
      linkClass: "pagination-next",
      image: "/assets/img/albums/viejasporqueriasFooter.jpg",
    },
    tracks: [
      { title: "Golosinas", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/01.mp3", duration: 164 },
      { title: "Brillantina", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/02.mp3", duration: 144 },
      { title: "Germinación", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/03.mp3", duration: 267 },
      { title: "La revisación", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/04.mp3", duration: 200 },
      { title: "El arbolito del amor", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/05.mp3", duration: 165 },
      { title: "Pincha, rompe, cuelga, garpa", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/06.mp3", duration: 169 },
      { title: "Bombero loco", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/07.mp3", duration: 156 },
      { title: "Pediculosis", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/08.mp3", duration: 141 },
      { title: "El Mundo de Ante Garmaz", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/09.mp3", duration: 185 },
      { title: "El recreo", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/10.mp3", duration: 182 },
      { title: "El rock del guardapolvo", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/11.mp3", duration: 152 },
      { title: "Lever Wurst", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/12.mp3", duration: 187 },
      { title: "Zapping", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/13.mp3", duration: 277 },
      { title: "Antiparras Buen Nado", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/partidocodificado/14.mp3", duration: 217 },
    ],
  },
  {
    slug: "viejas-porquerias",
    title: "Viejas Porquerías",
    heading: "Viejas porquerías que no entraron en ningún disco",
    description: "Rejunte de temas viejos, demos y demás. Diría que es un tesoro perdido, pero estaría mintiendo.",
    ogTitle: "Superhéroes - Viejas Porquerías",
    twitterTitle: "Superhéroes - Viejas Porquerías",
    twitterDescription: "Rejunte de temas viejos, demos y demás. Diría que es un tesoro perdido, pero estaría mintiendo.",
    ogImage: "fbviejasporquerias.png",
    twitterImage: "twviejasporquerias.png",
    heroImage: "/assets/img/albums/viejas-porquerias_main.jpg",
    cover: "/assets/img/albums/cover7.jpg",
    downloadUrl: "https://drive.google.com/file/d/0B2ElIMffOhvfVUJyRXJ6THZLWEk/view?usp=drive_link&resourcekey=0-E3nj9Guf_MWwH0Rv0OO7Ew",
    prev: {
      href: "/el-partido-codificado-del-domingo",
      label: "Partido Codificado del Domingo",
      kicker: "Anterior",
      linkClass: "pagination-next",
      image: "/assets/img/albums/partidocodificadoFooter.jpg",
    },
    next: {
      href: "/chiche-gelblung-presenta",
      label: "Chiche Gelblung Presenta",
      kicker: "Siguiente",
      linkClass: "pagination-next",
      image: "/assets/img/albums/chicheFooter.jpg",
    },
    tracks: [
      { title: "Al Italpark", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/01.mp3", duration: 150 },
      { title: "Ana María", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/02.mp3", duration: 144 },
      { title: "Crease o no", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/03.mp3", duration: 162 },
      { title: "Días de colonia (versión 1)", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/04.mp3", duration: 161 },
      { title: "Días de colonia (versión 2)", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/05.mp3", duration: 201 },
      { title: "El planeta de los simios", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/06.mp3", duration: 110 },
      { title: "El que se moja no se enoja", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/07.mp3", duration: 132 },
      { title: "Kevin", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/08.mp3", duration: 100 },
      { title: "Los marcianos", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/09.mp3", duration: 183 },
      { title: "Nos vamos de excursión", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/10.mp3", duration: 106 },
      { title: "Las ovejas de la Agronomía - Vienísima", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/11.mp3", duration: 83 },
      { title: "Paola (versión 1)", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/12.mp3", duration: 128 },
      { title: "Paola (versión 2)", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/13.mp3", duration: 145 },
      { title: "Zucoa", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/14.mp3", duration: 63 },
      { title: "Tu Sam", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/15.mp3", duration: 147 },
      { title: "Bañeros", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/16.mp3", duration: 548 },
      { title: "Paddle (en vivo)", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/17.mp3", duration: 289 },
      { title: "Sweet Home", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/18.mp3", duration: 166 },
      { title: "Petarditos (remix)", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/19.mp3", duration: 188 },
      { title: "The Look (cover de Roxette - en vivo)", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/20.mp3", duration: 144 },
      { title: "La bicicleta de Saturno (en vivo)", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/21.mp3", duration: null },
      { title: "Me das cada día más (cover de Valeria Lynch - en vivo)", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias/22.mp3", duration: 160 },
      { title: "Antiparras Buen Nado", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias2/01.mp3", duration: 103 },
      { title: "Capitán Garfio", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias2/02.mp3", duration: 16 },
      { title: "Copo de Nieve (Acústico)", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias2/03.mp3", duration: 261 },
      { title: "El Vendedor (Acústico)", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias2/04.mp3", duration: 234 },
      { title: "Italia '90 en El Delfín (Santa Teresita, 26/01/2002)", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias2/05.mp3", duration: 241 },
      { title: "Seguí Participando", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias2/06.mp3", duration: 129 },
      { title: "Pediculosis (Versión Canción de Cuna)", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/viejas-porquerias2/07.mp3", duration: 295 },
    ],
  },
  {
    slug: "chiche-gelblung-presenta",
    title: "Chiche Gelblung Presenta",
    heading: "Chiche Gelblung Presenta: Superhéroes",
    description: "Temas de los primeros dos discos de estudio de Superhéroes, presentados por Chiche Gelblung.",
    ogTitle: "Superhéroes - Chiche Gelbung Presenta",
    twitterTitle: "Superhéroes - Chiche Gelbung Presenta",
    twitterDescription: "Temas de los primeros dos discos de estudio de Superhéroes, presentados por el gran Chiche Gelblung.",
    ogImage: "fbchiche.jpg",
    twitterImage: "twchiche.jpg",
    heroImage: "/assets/img/albums/chiche_main.jpg",
    cover: "/assets/img/albums/cover8.png",
    downloadUrl: "https://drive.google.com/file/d/0B2ElIMffOhvfbzR6RTltZ3VsNjA/view?usp=drive_link&resourcekey=0-glEy3f6tcbhx6D4Mtnaa_Q",
    prev: {
      href: "/viejas-porquerias",
      label: "Viejas Porquerías",
      kicker: "Anterior",
      linkClass: "pagination-next",
      image: "/assets/img/albums/viejasporqueriasFooter.jpg",
    },
    next: {
      href: "/rock-and-pop-en-vivo",
      label: "Rock & Pop en Vivo",
      kicker: "Siguiente",
      linkClass: "pagination-next",
      image: "/assets/img/albums/rockandpopFooter.jpg",
    },
    tracks: [
      { title: "Bienvenida de Chiche", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/chiche-gelblung/01.mp3", duration: 28 },
      { title: "Chico Fatal", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/chiche-gelblung/02.mp3", duration: 221 },
      { title: "Santa Teresita", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/chiche-gelblung/03.mp3", duration: 466 },
      { title: "Habla Chiche 01", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/chiche-gelblung/04.mp3", duration: 24 },
      { title: "Estoy Out", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/chiche-gelblung/05.mp3", duration: 263 },
      { title: "La Bicicleta de Saturno", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/chiche-gelblung/06.mp3", duration: 274 },
      { title: "Habla Chiche 02", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/chiche-gelblung/07.mp3", duration: 10 },
      { title: "Hoy me puse a pensar en todo lo que hice. La verdad me deprimí", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/chiche-gelblung/08.mp3", duration: 162 },
      { title: "¿Qué hubiese hecho Mac Gyver?", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/chiche-gelblung/09.mp3", duration: 202 },
      { title: "Habla Chiche 03", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/chiche-gelblung/10.mp3", duration: 8 },
      { title: "El que está al lado del cantante de Los Piojos", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/chiche-gelblung/11.mp3", duration: 199 },
      { title: "Sobre como soltarle la mano a la vida", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/chiche-gelblung/12.mp3", duration: 190 },
      { title: "Se despide Chiche", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/chiche-gelblung/13.mp3", duration: 17 },
    ],
  },
  {
    slug: "rock-and-pop-en-vivo",
    title: "En vivo en Rock & Pop",
    heading: "En vivo en Rock & Pop - 6/10/2000",
    description: "Sí. Superhéroes tocó en la Rock & Pop. Con entrevista y todo. No es chiste.",
    ogTitle: "Superhéroes - En Vivo en Rock & Pop",
    twitterTitle: "Superhéroes - Vivo en Rock & Pop",
    twitterDescription: "Sí. Superhéroes tocó en la Rock & Pop. Con entrevista y todo. No es chiste.",
    ogImage: "fbrockandpop.png",
    twitterImage: "twrockandpop.png",
    heroImage: "/assets/img/albums/rockandpop_main.jpg",
    cover: "/assets/img/albums/cover5.jpg",
    downloadUrl: "https://drive.google.com/file/d/0B2ElIMffOhvfNDJ2YzNzRW9hMW8/view?usp=drive_link&resourcekey=0-c3Lesi9fZiiQe2tlL2f51g",
    prev: {
      href: "/chiche-gelblung-presenta",
      label: "Chiche Gelblung Presenta",
      kicker: "Anterior",
      linkClass: "pagination-next",
      image: "/assets/img/albums/chicheFooter.jpg",
    },
    next: {
      href: "/fm-patricios-en-vivo",
      label: "FM Patricios en vivo",
      kicker: "Anterior",
      linkClass: "pagination-next",
      image: "/assets/img/albums/fmpatriciosFooter.jpg",
    },
    tracks: [
      { title: "Intro", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/rockandpop/01.mp3", duration: 93 },
      { title: "Tanda", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/rockandpop/02.mp3", duration: 60 },
      { title: "Entrevista", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/rockandpop/03.mp3", duration: 494 },
      { title: "De boliche en boliche", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/rockandpop/04.mp3", duration: 174 },
      { title: "A mi me gustan todas las chicas", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/rockandpop/05.mp3", duration: 231 },
      { title: "El arbolito del amor", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/rockandpop/06.mp3", duration: 161 },
      { title: "Feliz Domingo", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/rockandpop/07.mp3", duration: 233 },
      { title: "La preparatoria", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/rockandpop/08.mp3", duration: 183 },
      { title: "Bombero loco", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/rockandpop/09.mp3", duration: 137 },
      { title: "Pediculosis", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/rockandpop/10.mp3", duration: 208 },
    ],
  },
  {
    slug: "fm-patricios-en-vivo",
    title: "En vivo en FM Patricios",
    heading: "En vivo en FM Patricios - 7/10/2001",
    description: "Sí. Superhéroes tocó en la Rock & Pop. Con entrevista y todo. No es chiste.",
    ogTitle: "Superhéroes en Vivo en FM Patricios",
    twitterTitle: "Superhéroes en Vivo en FM Patricios",
    twitterDescription: "Sitio web no oficial de Superhéroes.",
    ogImage: "fbprofile.png",
    twitterImage: "twprofile.jpg",
    heroImage: "/assets/img/albums/fmpatricios_main.jpg",
    cover: "/assets/img/albums/cover9.jpg",
    downloadUrl: "https://drive.google.com/open?id=0B2ElIMffOhvfalBtQi1OTTBidUU",
    prev: {
      href: "/rock-and-pop-en-vivo",
      label: "Rock & Pop en Vivo",
      kicker: "Anterior",
      linkClass: "pagination-next",
      image: "/assets/img/albums/rockandpopFooter.jpg",
    },
    next: {
      href: "/salon-pueyrredon-en-vivo",
      label: "En vivo en Salón Pueyrredon",
      kicker: "Siguiente",
      linkClass: "pagination-next",
      image: "/assets/img/albums/salonpueyrredonFooter.jpg",
    },
    tracks: [
      { title: "Tránsito - Voy a Matar al Peluquero", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/fm-patricios/01.mp3", duration: 286 },
      { title: "Entrevista", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/fm-patricios/02.mp3", duration: 213 },
      { title: "Fans Club", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/fm-patricios/03.mp3", duration: 184 },
      { title: "Pediculosis", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/fm-patricios/04.mp3", duration: 208 },
      { title: "La Preparatoria", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/fm-patricios/05.mp3", duration: 179 },
      { title: "Chico Fatal", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/fm-patricios/06.mp3", duration: 241 },
      { title: "Feliz Domingo", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/fm-patricios/07.mp3", duration: 238 },
    ],
  },
  {
    slug: "salon-pueyrredon-en-vivo",
    title: "En vivo en Salón Pueyrredón",
    heading: "En vivo en Salón Pueyrredón - 7/7/2012",
    description: "Grabación en vivo de uno de sus últimos recitales. Tal vez el mejor. Digo tal vez porque dudo que Bobby Flores pueda salir a desmentirme.",
    ogTitle: "Superhéroes - En Vivo en Salon Pueyrredón",
    twitterTitle: "Superhéroes - Vivo en Salón Pueyrredón",
    twitterDescription: "Grabación en vivo de uno de sus últimos recitales. Tal vez el mejor. Digo tal vez porque dudo que Bobby Flores pueda salir a desmentirme.",
    ogImage: "fbsalonpueyrredon.png",
    twitterImage: "twsalonpueyrredon.png",
    heroImage: "/assets/img/albums/salonpueyrredon_main.jpg",
    cover: "/assets/img/albums/cover6.jpg",
    downloadUrl: "https://drive.google.com/file/d/0B2ElIMffOhvfM1BUOUxNTTNxUnM/view?usp=drive_link&resourcekey=0-gdjOGGLPyITWHWYM2ZB-Gw",
    prev: {
      href: "/fm-patricios-en-vivo",
      label: "FM Patricios en vivo",
      kicker: "Anterior",
      linkClass: "pagination-next",
      image: "/assets/img/albums/fmpatriciosFooter.jpg",
    },
    next: {
      href: "/discografia",
      label: "Discografía",
      kicker: "Siguiente",
      linkClass: "pagination-next",
      image: "/assets/img/albums/discosFooter.jpg",
    },
    tracks: [
      { title: "Las ovejas de la Agronomía - Yo no voy ni loco", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/01.mp3", duration: 138 },
      { title: "Carne ensobrada sobre huevo agitada en astillas de pan (milanesa) $185", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/02.mp3", duration: 232 },
      { title: "Sos un boludo", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/03.mp3", duration: 195 },
      { title: "Voy a matar al peluquero", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/04.mp3", duration: 227 },
      { title: "Estoy out", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/05.mp3", duration: 263 },
      { title: "El que está al lado del cantante de Los Piojos", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/06.mp3", duration: 167 },
      { title: "Bon Jovi", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/07.mp3", duration: 154 },
      { title: "Chico fatal", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/08.mp3", duration: 273 },
      { title: "Lost", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/09.mp3", duration: 188 },
      { title: "Qué hubiese hecho Mc Gyver?", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/10.mp3", duration: 280 },
      { title: "Preparatoria", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/11.mp3", duration: 253 },
      { title: "Las cosas que le tenés que decir a tu novia para que siga siendo tu novia", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/12.mp3", duration: 296 },
      { title: "Luchando por el metal", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/13.mp3", duration: 194 },
      { title: "Tu jefe es menor que vos", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/14.mp3", duration: 350 },
      { title: "Una de las peores ideas que tuve en mi vida", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/15.mp3", duration: 184 },
      { title: "La bicicleta de Saturno", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/16.mp3", duration: 332 },
      { title: "Chomba rosa Legacy", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/17.mp3", duration: 157 },
      { title: "Santa Teresita", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/18.mp3", duration: 292 },
      { title: "Paddle", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/19.mp3", duration: 226 },
      { title: "Danger four", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/20.mp3", duration: 170 },
      { title: "Feliz domingo", url: "https://superheroes.nyc3.digitaloceanspaces.com/audio/salonpueyrredon/21.mp3", duration: 265 },
    ],
  },
];

export const releaseBySlug = new Map(RELEASES.map((r) => [r.slug, r]));
