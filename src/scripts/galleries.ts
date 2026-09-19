/**
 * Juicebox galleries for /galeria-de-fotos.
 *
 * The legacy page dropped three <script src="…/juicebox.js"> tags inline and
 * called `new juicebox(...)` next to each container. Under the ClientRouter the
 * page content is swapped rather than reloaded, so the core is loaded once and
 * each container is initialised on `astro:page-load` — guarded, because
 * page-load also fires when navigating back to this page.
 */

const CORE = '/assets/galleries/jbcore/juicebox.js';

declare global {
  interface Window {
    juicebox?: new (options: Record<string, unknown>) => unknown;
  }
}

let corePromise: Promise<void> | null = null;

function loadCore(): Promise<void> {
  if (window.juicebox) return Promise.resolve();
  if (corePromise) return corePromise;

  corePromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CORE;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`could not load ${CORE}`));
    document.head.appendChild(script);
  });
  return corePromise;
}

async function initGalleries(): Promise<void> {
  const containers = document.querySelectorAll<HTMLElement>('.juicebox-gallery');
  if (containers.length === 0) return;

  try {
    await loadCore();
  } catch (error) {
    console.error(error);
    return;
  }
  if (!window.juicebox) return;

  containers.forEach((container) => {
    // A swapped-in container is a fresh node, but guard anyway so a repeat
    // page-load on the same DOM cannot stack two galleries in one box.
    if (container.dataset.jbInit === 'true') return;
    container.dataset.jbInit = 'true';

    new window.juicebox!({
      containerId: container.id,
      configUrl: container.dataset.config,
      galleryWidth: '80%',
      galleryHeight: '80%',
      backgroundColor: '#222222',
    });
  });
}

document.addEventListener('astro:page-load', () => {
  void initGalleries();
});
