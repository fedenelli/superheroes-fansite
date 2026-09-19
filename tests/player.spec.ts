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
  await page.click('.shp-bar [data-action="next"]');
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
  expect(durations.filter((d) => /^\d{2}:\d{2}$/.test(d.trim()))).toHaveLength(28);

  // Exactly one file on Spaces is corrupt: it is marked, and cannot be played.
  const dead = page.locator('.trak-item.is-dead');
  await expect(dead).toHaveCount(1);
  await expect(dead).toContainText('La bicicleta de Saturno');
  await expect(dead.locator('.play-pause-button')).toBeDisabled();
});

test('the player stays hidden until something is queued', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.shp-bar')).toBeHidden();

  await page.goto('/album-verde');
  await expect(page.locator('.shp-bar')).toBeHidden();
  await playTrack(page, 2);
  await expect(page.locator('.shp-bar')).toBeVisible();
  await expect(page.locator('.shp-bar [data-bind="title"]')).toHaveText('A mi me gustan todas las chicas');
  await expect(page.locator('.shp-bar [data-bind="album"]')).toHaveText('Album Verde');
  await expect(page.locator('.shp-bar [data-action="toggle"]').first()).toHaveAttribute('aria-label', 'Pausar');
});

test('the queue panel lists the release and jumps to a track', async ({ page }) => {
  await page.goto('/album-verde');
  await playTrack(page, 0);

  await page.click('.shp-bar [data-action="queue"]');
  const queue = page.locator('.shp-queue button');
  await expect(queue).toHaveCount(await page.locator('.trak-item').count());
  await expect(queue.first()).toHaveAttribute('aria-current', 'true');

  await queue.nth(3).click();
  await expect.poll(async () => (await audioState(page))?.src).toContain('/audio/album-verde/04.mp3');
  await expect(queue.nth(3)).toHaveAttribute('aria-current', 'true');
});

test('shuffle keeps the current track and plays every other one once', async ({ page }) => {
  await page.goto('/album-verde');
  await playTrack(page, 0);
  await page.click('.shp-bar [data-action="shuffle"]');
  await expect(page.locator('.shp-bar [data-action="shuffle"]')).toHaveAttribute('aria-pressed', 'true');

  const total = await page.locator('.trak-item').count();
  const seen = new Set<string>([(await audioState(page))!.src]);
  for (let i = 1; i < total; i++) {
    const before = (await audioState(page))!.src;
    await page.click('.shp-bar [data-action="next"]');
    await expect.poll(async () => (await audioState(page))?.src).not.toBe(before);
    seen.add((await audioState(page))!.src);
  }
  expect(seen.size).toBe(total);
});

test('media session carries the track for lock screens and headsets', async ({ page }) => {
  await page.goto('/album-verde');
  await playTrack(page, 1);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const m = navigator.mediaSession.metadata;
        return m && { title: m.title, artist: m.artist, album: m.album };
      })
    )
    .toEqual({ title: 'Golosinas', artist: 'Superhéroes', album: 'Album Verde' });
});

test('plays are reported to GTM with the track and the release', async ({ page }) => {
  const events = () =>
    page.evaluate(() =>
      ((window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? [])
        .filter((e) => String(e.event).startsWith('audio_') || e.event === 'album_start')
        .map(({ event, audio_title, audio_album_slug, audio_track_number, audio_percent, audio_trigger }) => ({
          event,
          audio_title,
          audio_album_slug,
          audio_track_number,
          audio_percent,
          audio_trigger,
        }))
    );

  await page.goto('/album-verde');
  await playTrack(page, 0);
  await expect.poll(events).toEqual([
    { event: 'album_start', audio_title: 'De boliche en boliche', audio_album_slug: 'album-verde', audio_track_number: 1, audio_percent: undefined, audio_trigger: 'tracklist' },
    { event: 'audio_start', audio_title: 'De boliche en boliche', audio_album_slug: 'album-verde', audio_track_number: 1, audio_percent: undefined, audio_trigger: 'tracklist' },
  ]);

  // The same release carries on across a navigation: a new song, not a new album.
  await page.click('a[href="/como-va-la-reserva"]');
  await expect(page).toHaveURL(/como-va-la-reserva$/);
  await page.click('.shp-bar [data-action="next"]');
  await expect.poll(async () => (await events()).at(-1)).toMatchObject({
    event: 'audio_start',
    audio_title: 'Golosinas',
    audio_track_number: 2,
    audio_trigger: 'next',
  });

  // Jump near the end: every milestone, the completion, then the autoplayed next song.
  await page.evaluate(() => {
    const audio = document.querySelector('#sh-audio') as HTMLAudioElement;
    audio.currentTime = audio.duration - 1;
  });
  await expect
    .poll(async () => (await events()).slice(3).map((e) => [e.event, e.audio_percent, e.audio_track_number, e.audio_trigger]))
    .toEqual([
      ['audio_progress', 25, 2, 'next'],
      ['audio_progress', 50, 2, 'next'],
      ['audio_progress', 75, 2, 'next'],
      ['audio_complete', 100, 2, 'next'],
      ['audio_start', undefined, 3, 'auto'],
    ]);
  expect((await events()).filter((e) => e.event === 'album_start')).toHaveLength(1);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('the mini-player opens a full-screen sheet with the controls', async ({ page }) => {
    await page.goto('/album-verde');
    await playTrack(page, 0);

    const bar = page.locator('.shp-bar');
    await expect(bar).toBeVisible();
    await expect(page.locator('.shp-bar .shp-center')).toBeHidden();
    const box = (await bar.boundingBox())!;
    expect(box.width).toBeGreaterThan(350);

    // Tapping the mini play button pauses, and does not open the sheet.
    await page.locator('.shp-mini-play').click();
    await expect.poll(async () => (await audioState(page))?.paused).toBe(true);
    await expect(page.locator('sh-player')).not.toHaveAttribute('data-expanded', '');

    await page.locator('.shp-bar [data-bind="title"]').click();
    const sheet = page.locator('.shp-sheet');
    await expect(sheet).toBeInViewport();
    const cover = (await sheet.locator('.shp-sheet-cover').boundingBox())!;
    expect(cover.width).toBeGreaterThan(300);

    await sheet.locator('[data-action="next"]').click();
    await expect.poll(async () => (await audioState(page))?.src).toContain('/audio/album-verde/02.mp3');

    await sheet.locator('[data-action="collapse"]').click();
    await expect(page.locator('sh-player')).not.toHaveAttribute('data-expanded', '');
  });
});

test('picture-in-picture moves a working player card into its own window', async ({ page, context }) => {
  // Stand in for Document PiP with a popup: same contract, a second document.
  await page.addInitScript(() => {
    if (window.opener) return;
    Object.defineProperty(window, 'documentPictureInPicture', {
      configurable: true,
      value: {
        window: null,
        requestWindow: async () => window.open('about:blank', 'pip', 'popup,width=320,height=360')!,
      },
    });
  });
  await page.goto('/album-verde');
  await playTrack(page, 0);

  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.click('.shp-bar [data-action="pip"]'),
  ]);
  const card = popup.locator('.shp-pip');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-bind="title"]')).toHaveText('De boliche en boliche');

  await card.locator('[data-action="next"]').click();
  await expect.poll(async () => (await audioState(page))?.src).toContain('/audio/album-verde/02.mp3');
  await expect(card.locator('[data-bind="title"]')).toHaveText('Golosinas');

  await popup.close();
  await expect(page.locator('sh-player .shp-pip')).toHaveCount(1);
});
