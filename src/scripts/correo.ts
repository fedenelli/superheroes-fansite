/**
 * Puts back together the addresses Correo.astro leaves encoded in the page.
 * The links are swapped in with the page, so this runs on every
 * `astro:page-load`; a link already decoded is skipped.
 */

function mostrarCorreos(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-correo]').forEach((a) => {
    const direccion = [...atob(a.dataset.correo!)].reverse().join('');
    const asunto = a.dataset.asunto ? `?subject=${encodeURIComponent(a.dataset.asunto)}` : '';
    a.href = `mailto:${direccion}${asunto}`;
    a.textContent = direccion;
    a.removeAttribute('data-correo');
  });
}

document.addEventListener('astro:page-load', mostrarCorreos);
