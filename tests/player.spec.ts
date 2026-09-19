import { test, expect, type Page } from '@playwright/test';

/**
 * The reason this migration exists: audio used to stop the moment you left an
 * album page, because the player's queue was the album page's DOM.
 */

/** Tag the audio node so we can prove it is the *same* element after a nav. */
async function tagAudio(page: Page): Promise<void> {
  await page.evaluate(() => {
    const audio = document.querySelector('#sh-audio') as (HTMLAudioElement & { __id?: number }) | null;
    if (audio) audio.__id = 1234;
  });
}

async function audioState(page: Page) {
  return page.evaluate(() => {
    const audio = document.querySelector('#sh-audio') as (HTMLAudioElement & { __id?: number }) | null;
    return audio
      ? { tag: audio.__id ?? null, src: audio.src, paused: audio.paused, t: audio.currentTime }
      : null;
  });
}

/** Click a row and wait until it is really playing. */
async function playTrack(page: Page, index: number): Promise<void> {
  await page.locator('.trak-item .play-pause-button').nth(index).click();
  await expect
    .poll(async () => (await audioState(page))?.paused, { message: 'audio should start' })
    .toBe(false);
}

test('audio survives client-side navigation to another release', async ({ page }) => {
  await page.goto('/album-verde');
  await playTrack(page, 0);
  await tagAudio(page);

  const before = await audioState(page);
  expect(before?.src).toContain('/audio/album-verde/01.mp3');

  // Navigate the way a visitor would: click the "next release" link.
  await page.click('a[href="/como-va-la-reserva"]');
  await expect(page).toHaveURL(/\/como-va-la-reserva$/);
  await expect(page.locator('h2').first()).toHaveText('COMO VA LA RESERVA');

  const after = await audioState(page);
  // Same DOM node — this is what transition:persist buys us.
  expect(after?.tag).toBe(1234);
  expect(after?.src).toBe(before?.src);
  expect(after?.paused).toBe(false);

  // ...and it is still actually advancing, not merely un-paused.
  await expect
    .poll(async () => (await audioState(page))!.t, { message: 'playhead should advance' })
    .toBeGreaterThan(before!.t);
});

test('the queue outlives the page it came from', async ({ page }) => {
  await page.goto('/album-verde');
  await playTrack(page, 0);

  await page.click('a[href="/como-va-la-reserva"]');
  await expect(page).toHaveURL(/\/como-va-la-reserva$/);

  // "Next" must still walk album-verde's tracklist, which is no longer rendered.
  await page.click('.mesh-next');
  await expect
    .poll(async () => (await audioState(page))?.src)
    .toContain('/audio/album-verde/02.mp3');
});

test('playback continues onto the home page and the gallery', async ({ page }) => {
  await page.goto('/album-verde');
  await playTrack(page, 0);
  await tagAudio(page);

  for (const [link, url] of [
    ['a[href="/"]', /\/$/],
    ['a[href="/galeria-de-fotos"]', /galeria-de-fotos$/],
  ] as const) {
    await page.click(link);
    await expect(page).toHaveURL(url);
    const state = await audioState(page);
    expect(state?.tag, `audio node replaced after navigating to ${url}`).toBe(1234);
    expect(state?.paused, `audio paused after navigating to ${url}`).toBe(false);
  }
});

test('only the playing release highlights a row', async ({ page }) => {
  await page.goto('/album-verde');
  await playTrack(page, 0);
  await expect(page.locator('.trak-item').first()).toHaveClass(/playing/);

  await page.click('a[href="/como-va-la-reserva"]');
  await expect(page).toHaveURL(/como-va-la-reserva$/);
  // A different album is on screen, so none of its rows should look active.
  await expect(page.locator('.trak-item.playing')).toHaveCount(0);

  // Going back to the playing release restores the highlight.
  await page.click('a[href="/album-verde"]');
  await expect(page).toHaveURL(/album-verde$/);
  await expect(page.locator('.trak-item').first()).toHaveClass(/playing/);
});

test('durations render from build-time data, with no per-track audio elements', async ({ page }) => {
  await page.goto('/viejas-porquerias');
  // The legacy page shipped one hidden <audio preload="metadata"> per track.
  await expect(page.locator('.trak-item audio')).toHaveCount(0);

  const durations = await page.locator('.trak-duration').allTextContents();
  expect(durations).toHaveLength(29);
  const unresolved = durations.filter((d) => d.trim() === '00:00');
  // Exactly one file on Spaces is corrupt and could not be probed.
  expect(unresolved).toHaveLength(1);
});
