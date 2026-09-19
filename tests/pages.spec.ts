import { test, expect } from '@playwright/test';
import { SITE } from '../src/data/site';

/**
 * Regressions specific to swapping the DOM instead of reloading the document:
 * anything that used to run because a <script> tag was parsed now has to be
 * driven from `astro:page-load`.
 */

test('photo sessions are listed and open on a client-side navigation', async ({ page }) => {
  // Arrive via the home page, so both pages are swapped in rather than loaded.
  await page.goto('/');
  await page.click('a[href="/galeria-de-fotos"]');
  await expect(page).toHaveURL(/galeria-de-fotos$/);

  const sesiones = page.locator('a.shf-sesion');
  await expect(sesiones).toHaveCount(3);

  await page.click('a.shf-sesion[href="/galeria-de-fotos/roxy-2007-07-08"]');
  await expect(page).toHaveURL(/galeria-de-fotos\/roxy-2007-07-08$/);
  await expect(page.locator('a.shf-abrir')).toHaveCount(21);
  // The header still marks Fotos as the current section.
  await expect(page.locator('.shh-link[href="/galeria-de-fotos"]')).toHaveClass(/is-active/);
});

test('the viewer opens a photo, steps through, and closes', async ({ page }) => {
  await page.goto('/galeria-de-fotos/sira-2007-06-17');
  const visor = page.locator('dialog.shv');
  const img = visor.locator('[data-shv="img"]');
  const numero = visor.locator('[data-shv="numero"]');

  await page.locator('a.shf-abrir').nth(2).click();
  await expect(visor).toBeVisible();
  await expect(numero).toHaveText('3');
  await expect(page).toHaveURL(/#foto-3$/);
  // The full-size copy replaces the thumbnail once it has loaded.
  await expect(img).toHaveAttribute('src', (await visor.locator('.shv-mini').nth(2).getAttribute('data-grande'))!);
  expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);

  await page.keyboard.press('ArrowRight');
  await expect(numero).toHaveText('4');
  await expect(page).toHaveURL(/#foto-4$/);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(numero).toHaveText('2');

  await visor.locator('.shv-mini').nth(9).click();
  await expect(numero).toHaveText('10');

  await page.keyboard.press('Escape');
  await expect(visor).toBeHidden();
  // The dialog's close event is queued after it hides, so poll.
  await expect(page).toHaveURL(/sira-2007-06-17$/);
});

test('a #foto-n link opens the viewer on that photo', async ({ page }) => {
  await page.goto('/galeria-de-fotos/el-teatrito-2007-08-18#foto-12');
  await expect(page.locator('dialog.shv')).toBeVisible();
  await expect(page.locator('[data-shv="numero"]')).toHaveText('12');
});

test('every navigation is announced to GTM', async ({ page }) => {
  await page.goto('/');
  await page.click('a[href="/album-verde"]');
  await expect(page).toHaveURL(/album-verde$/);
  await page.click('a[href="/como-va-la-reserva"]');
  await expect(page).toHaveURL(/como-va-la-reserva$/);

  const paths = await page.evaluate(() =>
    ((window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? [])
      .filter((e) => e.event === 'astro_page_view')
      .map((e) => e.page_path)
  );
  // Initial load plus the two client-side navigations.
  expect(paths).toEqual(['/', '/album-verde', '/como-va-la-reserva']);
});

test('release pages keep their own metadata after a client-side navigation', async ({ page }) => {
  await page.goto('/');
  await page.click('a[href="/escolares"]');
  await expect(page).toHaveURL(/escolares$/);
  await expect(page).toHaveTitle('Escolares — Superheroes');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://www.superheroes.com.ar/escolares'
  );
});

test('the header marks the current section and turns solid on scroll', async ({ page }) => {
  await page.goto('/album-verde');
  const header = page.locator('.shh');
  await expect(page.locator('.shh-link.is-active')).toHaveText('Discos');
  await expect(header).not.toHaveClass(/is-solid/);

  await page.mouse.wheel(0, 600);
  await expect(header).toHaveClass(/is-solid/);

  await page.click('.shh-link[href="/gracias"]');
  await expect(page).toHaveURL(/gracias$/);
  await expect(page.locator('.shh-link[aria-current="page"]')).toHaveText('Gracias');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test('the header menu opens, navigates and closes', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('.shh-toggle');
    const gracias = page.locator('.shh-link[href="/gracias"]');

    await expect(gracias).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(gracias).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(gracias).toBeHidden();

    await toggle.click();
    await gracias.click();
    await expect(page).toHaveURL(/gracias$/);
    await expect(page.locator('.shh-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('h2', { hasText: 'Gracias.' })).toBeVisible();
  });
});

test('the viewer is rebound once per visit, not stacked', async ({ page }) => {
  await page.goto('/galeria-de-fotos/roxy-2007-07-08');
  await page.click('.shh-link[href="/gracias"]');
  await expect(page).toHaveURL(/gracias$/);
  await page.goBack();
  await expect(page).toHaveURL(/roxy-2007-07-08$/);

  await page.locator('a.shf-abrir').first().click();
  await expect(page.locator('dialog.shv')).toBeVisible();
  // Two stacked keydown handlers would jump two photos.
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-shv="numero"]')).toHaveText('2');
});

test('aportes lists each contribution and opens its photos in the viewer', async ({ page }) => {
  // Arrive client-side, so the page's scripts are bound by astro:page-load.
  await page.goto('/');
  await page.click('.shh-link[href="/aportes"]');
  await expect(page).toHaveURL(/aportes$/);
  await expect(page.locator('.shh-link[aria-current="page"]')).toHaveText('Aportes');

  await expect(page.locator('.sha-aporte')).toHaveCount(2);
  await expect(page.locator('#villa-gesell')).toContainText('Guille J Murphy');

  // Photos are numbered across the whole page, so the viewer runs through every aporte.
  await page.locator('#villa-gesell a.shf-abrir').click();
  await expect(page.locator('dialog.shv')).toBeVisible();
  await expect(page.locator('[data-shv="numero"]')).toHaveText('3');
});

test('the aportes email is not in the HTML but works once the page loads', async ({ page, request }) => {
  // Decoded here the same way correo.ts does it, so the address isn't in the repo either.
  const direccion = [...atob(SITE.correo)].reverse().join('');
  const [usuario, dominio] = direccion.split('@');

  const html = await (await request.get('/aportes')).text();
  expect(html).not.toContain(usuario);
  expect(html).not.toContain(dominio);

  await page.goto('/aportes');
  const correo = page.locator('#enviar a.correo');
  await expect(correo).toHaveText(direccion);
  await expect(correo).toHaveAttribute('href', `mailto:${direccion}?subject=${encodeURIComponent('Aporte para superheroes.com.ar')}`);
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 780 }]) {
  test(`the viewer fits a tall photo whole on screen at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    // The Power Music pages are portrait and taller than the screen at full size.
    await page.goto('/aportes#foto-1');
    const img = page.locator('dialog.shv [data-shv="img"]');
    await expect(img).toHaveAttribute('src', (await page.locator('.shv-mini').first().getAttribute('data-grande'))!);

    // object-fit letterboxes inside the element, so the element's box bounds the photo.
    const caja = (await img.boundingBox())!;
    const escenario = (await page.locator('[data-shv="escenario"]').boundingBox())!;
    expect(caja.y).toBeGreaterThanOrEqual(escenario.y);
    expect(caja.y + caja.height).toBeLessThanOrEqual(escenario.y + escenario.height + 1);
    expect(caja.x).toBeGreaterThanOrEqual(0);
    expect(caja.x + caja.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');
  });
}
