import { test, expect } from '@playwright/test';

/**
 * Regressions specific to swapping the DOM instead of reloading the document:
 * anything that used to run because a <script> tag was parsed now has to be
 * driven from `astro:page-load`.
 */

test('juicebox galleries initialise on a client-side navigation', async ({ page }) => {
  // Arrive via the home page, so the gallery page is swapped in rather than loaded.
  await page.goto('/');
  await page.click('a[href="/galeria-de-fotos"]');
  await expect(page).toHaveURL(/galeria-de-fotos$/);

  // Only the page's own containers: Juicebox nests another .juicebox-gallery inside each once it boots.
  const containers = page.locator('.juicebox-gallery[data-config]');
  await expect(containers).toHaveCount(3);

  // Juicebox replaces the container's contents once it boots.
  for (let i = 0; i < 3; i++) {
    await expect
      .poll(async () => (await containers.nth(i).innerHTML()).length, {
        message: `gallery ${i + 1} should be populated`,
        timeout: 20_000,
      })
      .toBeGreaterThan(0);
  }
  await expect(containers.first()).toHaveAttribute('data-jb-init', 'true');
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

test('juicebox galleries still render on a second client-side visit', async ({ page }) => {
  const missing: string[] = [];
  page.on('response', (r) => {
    if (r.status() === 404) missing.push(r.url());
  });

  await page.goto('/galeria-de-fotos');
  await expect(page.locator('.juicebox-gallery[data-config]').first()).toHaveAttribute('data-jb-init', 'true');
  await page.click('.shh-link[href="/gracias"]');
  await expect(page).toHaveURL(/gracias$/);
  await page.click('.shh-link[href="/galeria-de-fotos"]');
  await expect(page).toHaveURL(/galeria-de-fotos$/);

  // The theme stylesheet must still be the real one, not a root-relative 404.
  const theme = page.locator('head link[href*="/galleries/jbcore/classic/theme.css"]');
  await expect(theme).toHaveCount(1);
  // Unstyled Juicebox still fills the container, so check it actually has a size.
  await expect
    .poll(async () => (await page.locator('.juicebox-gallery[data-config]').first().boundingBox())?.height ?? 0)
    .toBeGreaterThan(200);
  expect(missing.filter((u) => u.includes('theme.css'))).toEqual([]);
});
