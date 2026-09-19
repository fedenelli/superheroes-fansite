/**
 * The chrome behaviour that the legacy main.js / mainVideo.js actually ran.
 *
 * Most of that file was dead: it drove `header.header` (no <header> element
 * exists), `.starTitle`, `#ava-slider`, `.owl-carousel`, `.aqura-filter-content`,
 * `.sm-countdown`, `#instagram-sidebar-widget`, `.star` and `.player`, none of
 * which appear in any page. What remains is below.
 */

/** Only the very first render should sit behind the loading spinner. */
let firstLoad = true;

function sizeFullscreenHero(): void {
  const hero = document.querySelector<HTMLElement>('.breadcrumb-fullscreen');
  if (hero) hero.style.height = `${window.innerHeight}px`;
}

function hideLoader(): void {
  const loader = document.querySelector<HTMLElement>('.page-loader');
  if (!loader) return;

  const fade = () => {
    loader.style.transition = 'opacity .4s';
    loader.style.opacity = '0';
    window.setTimeout(() => {
      loader.style.display = 'none';
    }, 400);
  };

  // 800ms on a cold load, as before; instant on client-side navigation, where
  // a spinner between two already-rendered pages would just be a flash.
  if (firstLoad) {
    firstLoad = false;
    window.setTimeout(fade, 800);
  } else {
    loader.style.display = 'none';
  }
}

function bindMenu(): void {
  const toggle = () => {
    document.querySelector('.open-menu')?.classList.toggle('active');
    document.querySelector('.menu-fixed-container')?.classList.toggle('open');
  };
  document.querySelector('.open-menu')?.addEventListener('click', toggle);
  document.querySelector('.x-filter')?.addEventListener('click', toggle);
}

function bindGoTop(): void {
  document.querySelector('.goTop')?.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/** window survives navigation, so the scroll handler is bound once. */
window.addEventListener('scroll', () => {
  const goTop = document.querySelector<HTMLElement>('.goTop');
  if (goTop) goTop.style.bottom = window.scrollY > 300 ? '50px' : '-80px';
});

window.addEventListener('resize', sizeFullscreenHero);

document.addEventListener('astro:page-load', () => {
  sizeFullscreenHero();
  hideLoader();
  bindMenu();
  bindGoTop();

  // GTM only fires a pageview on the initial document load; client-side
  // navigations have to be announced or every page after the first goes
  // unrecorded.
  const dataLayer = ((window as unknown as { dataLayer?: unknown[] }).dataLayer ??= []);
  dataLayer.push({ event: 'astro_page_view', page_path: window.location.pathname });
});
