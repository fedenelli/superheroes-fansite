/**
 * The photo viewer on /galeria-de-fotos/<sesion>; markup in Visor.astro.
 *
 * Everything it touches is swapped in with the page, so it is rebound on every
 * `astro:page-load`. The open photo is mirrored in the hash (#foto-7) so a
 * link lands on it; the hash is updated with replaceState, keeping the
 * ClientRouter's own history.state intact.
 */

const HASH = /^#foto-(\d+)$/;
/** Horizontal drag, in px, that counts as a swipe; downward drag past CIERRE closes. */
const UMBRAL = 50;
const CIERRE = 110;

interface Foto {
  mini: string;
  grande: string;
  original: string;
  alt: string;
}

function setHash(n: number | null): void {
  const url = `${location.pathname}${location.search}${n === null ? '' : `#foto-${n}`}`;
  history.replaceState(history.state, '', url);
}

function bindVisor(): void {
  const dialog = document.querySelector<HTMLDialogElement>('dialog.shv');
  if (!dialog) return;

  const $ = <T extends HTMLElement>(name: string) => dialog.querySelector<T>(`[data-shv="${name}"]`)!;
  const img = $<HTMLImageElement>('img');
  const escenario = $('escenario');
  const numero = $('numero');
  const original = $<HTMLAnchorElement>('original');
  const anterior = $<HTMLButtonElement>('anterior');
  const siguiente = $<HTMLButtonElement>('siguiente');
  const minis = [...dialog.querySelectorAll<HTMLButtonElement>('.shv-mini')];
  const fotos: Foto[] = minis.map((b) => ({
    mini: b.dataset.mini!,
    grande: b.dataset.grande!,
    original: b.dataset.original!,
    alt: b.dataset.alt!,
  }));
  const enlaces = document.querySelectorAll<HTMLAnchorElement>('a.shf-abrir[data-foto]');

  let actual = 0;

  function precargar(i: number): void {
    if (fotos[i]) new Image().src = fotos[i].grande;
  }

  function mostrar(i: number): void {
    actual = Math.max(0, Math.min(fotos.length - 1, i));
    const foto = fotos[actual];

    // Show the cached thumbnail at once and swap in the big copy when it lands.
    img.src = foto.mini;
    img.alt = foto.alt;
    escenario.classList.add('is-cargando');
    const grande = new Image();
    grande.onload = () => {
      if (fotos[actual] !== foto) return;
      img.src = foto.grande;
      escenario.classList.remove('is-cargando');
    };
    grande.src = foto.grande;

    numero.textContent = String(actual + 1);
    original.href = foto.original;
    anterior.disabled = actual === 0;
    siguiente.disabled = actual === fotos.length - 1;
    minis.forEach((b, j) => b.setAttribute('aria-current', String(j === actual)));
    minis[actual].scrollIntoView({ block: 'nearest', inline: 'center' });

    precargar(actual + 1);
    precargar(actual - 1);
    if (dialog!.open) setHash(actual + 1);
  }

  function abrir(i: number): void {
    if (!dialog!.open) {
      dialog!.showModal();
      // The page underneath shouldn't scroll. body is replaced on navigation,
      // so this can't leak onto the next page.
      document.body.style.overflow = 'hidden';
    }
    mostrar(i);
  }

  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    setHash(null);
    // Leave focus (and the scroll position) on the photo you ended on.
    const enlace = enlaces[actual];
    enlace?.scrollIntoView({ block: 'nearest' });
    enlace?.focus({ preventScroll: true });
  });

  enlaces.forEach((a) => {
    a.addEventListener('click', (event) => {
      // Let modified clicks open the original in a new tab, as a plain link would.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      abrir(Number(a.dataset.foto));
    });
  });

  minis.forEach((b, i) => b.addEventListener('click', () => mostrar(i)));
  anterior.addEventListener('click', () => mostrar(actual - 1));
  siguiente.addEventListener('click', () => mostrar(actual + 1));
  $('cerrar').addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (event) => {
    const paso = ({ ArrowLeft: -1, ArrowRight: 1 } as Record<string, number>)[event.key];
    if (paso) mostrar(actual + paso);
    else if (event.key === 'Home') mostrar(0);
    else if (event.key === 'End') mostrar(fotos.length - 1);
    else return;
    event.preventDefault();
  });

  // Clicking the dark around the photo closes, like a lightbox backdrop. Pointer
  // capture retargets the click to the stage, so check where the press began.
  let arrastro = false;
  let enFondo = false;
  escenario.addEventListener('click', () => {
    if (enFondo && !arrastro) dialog.close();
  });

  // ---- swipe: sideways changes photo, down closes ----
  let inicio: { x: number; y: number; id: number } | null = null;

  escenario.addEventListener('pointerdown', (event) => {
    if ((event.target as HTMLElement).closest('button')) return;
    inicio = { x: event.clientX, y: event.clientY, id: event.pointerId };
    arrastro = false;
    enFondo = event.target === escenario;
    escenario.setPointerCapture(event.pointerId);
    escenario.classList.add('is-arrastrando');
  });

  escenario.addEventListener('pointermove', (event) => {
    if (!inicio || event.pointerId !== inicio.id) return;
    const dx = event.clientX - inicio.x;
    const dy = event.clientY - inicio.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) arrastro = true;
    if (Math.abs(dx) >= Math.abs(dy)) {
      img.style.transform = `translateX(${dx}px)`;
      img.style.opacity = '';
    } else if (dy > 0) {
      img.style.transform = `translateY(${dy}px)`;
      img.style.opacity = String(Math.max(0.3, 1 - dy / 400));
    }
  });

  const soltar = (event: PointerEvent) => {
    if (!inicio || event.pointerId !== inicio.id) return;
    const dx = event.clientX - inicio.x;
    const dy = event.clientY - inicio.y;
    inicio = null;
    escenario.classList.remove('is-arrastrando');
    img.style.transform = '';
    img.style.opacity = '';

    if (event.type === 'pointercancel') return;
    if (Math.abs(dx) > UMBRAL && Math.abs(dx) > Math.abs(dy)) mostrar(actual + (dx < 0 ? 1 : -1));
    else if (dy > CIERRE && dy > Math.abs(dx)) dialog.close();
  };
  escenario.addEventListener('pointerup', soltar);
  escenario.addEventListener('pointercancel', soltar);

  // A link to #foto-7 opens straight onto that photo.
  const n = Number(HASH.exec(location.hash)?.[1]);
  if (n >= 1 && n <= fotos.length) abrir(n - 1);
}

document.addEventListener('astro:page-load', bindVisor);
