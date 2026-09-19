/**
 * Persistent audio player.
 *
 * The legacy player kept everything in the DOM: the current track was
 * `.trak-item.active`, the next track was that element's `.next()` sibling, and
 * play state lived in `data-state` attributes on the album page's markup. That
 * is precisely why audio died on navigation — leaving the page destroyed the
 * queue.
 *
 * Here the queue lives in module scope instead. Astro's ClientRouter keeps the
 * same `document` across navigations, so this module is evaluated once and its
 * state outlives every page swap. The <audio> element survives alongside it
 * because <sh-player> is marked `transition:persist`.
 */

export interface Track {
  title: string;
  url: string;
  duration: number | null;
}

interface Queue {
  /** Which release these tracks came from, so the right rows get highlighted. */
  slug: string;
  cover: string;
  tracks: Track[];
}

const state: { queue: Queue | null; index: number } = { queue: null, index: -1 };

let audio: HTMLAudioElement | null = null;
let wired = false;

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel);

/** mm:ss, or h:mm:ss past an hour — matching what moment.duration produced before. */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function current(): Track | null {
  if (!state.queue || state.index < 0) return null;
  return state.queue.tracks[state.index] ?? null;
}

/**
 * jPlayer showed/hid these two with inline styles, and master.css has no rule
 * that hides either, so the inline toggle has to be reproduced here or both
 * icons would render at once.
 */
function renderTransport(playing: boolean): void {
  const play = $<HTMLElement>('.mesh-play');
  const pause = $<HTMLElement>('.mesh-pause');
  if (play) play.style.display = playing ? 'none' : '';
  if (pause) pause.style.display = playing ? '' : 'none';
}

/** Reflect the current track in the footer player. */
function renderNowPlaying(): void {
  const track = current();
  const title = $<HTMLElement>('.mesh-title');
  const thumb = $<HTMLImageElement>('.mesh-thumbnail img');
  if (title) title.textContent = track?.title ?? '';
  if (thumb && state.queue) thumb.src = state.queue.cover;

  const duration = $<HTMLElement>('.mesh-duration');
  if (duration) {
    const known = track?.duration ?? (audio && Number.isFinite(audio.duration) ? audio.duration : null);
    duration.textContent = known === null ? '' : formatTime(known);
  }
}

/**
 * Highlight the playing row, but only when the visible page is the release the
 * queue came from — otherwise browsing album B while album A plays would light
 * up an unrelated row.
 */
function renderTrackList(): void {
  const list = $<HTMLElement>('[data-release]');
  document.querySelectorAll('.trak-item').forEach((el) => el.classList.remove('active', 'playing'));
  if (!list || !state.queue || list.dataset.release !== state.queue.slug) return;

  const row = list.querySelectorAll<HTMLElement>('.trak-item')[state.index];
  if (!row) return;
  row.classList.add('active');
  if (audio && !audio.paused) row.classList.add('playing');
}

function render(): void {
  renderTransport(Boolean(audio && !audio.paused));
  renderNowPlaying();
  renderTrackList();
}

function play(index: number): void {
  if (!audio || !state.queue) return;
  const track = state.queue.tracks[index];
  if (!track) return;

  if (state.index !== index) {
    state.index = index;
    audio.src = track.url;
  }
  $<HTMLElement>('.main-music-player')?.classList.remove('hide-player');
  void audio.play().catch(() => {
    /* autoplay refusal or a dead file — leave the UI in its paused state */
  });
  render();
}

function step(delta: number): void {
  if (!state.queue) return;
  const next = state.index + delta;
  if (next < 0 || next >= state.queue.tracks.length) return;
  play(next);
}

/** Called when a row is clicked. Starts a queue, or toggles if it's the same track. */
function selectTrack(queue: Queue, index: number): void {
  const sameTrack =
    state.queue?.slug === queue.slug && state.index === index && audio?.src === queue.tracks[index].url;

  state.queue = queue;

  if (sameTrack && audio) {
    if (audio.paused) play(index);
    else {
      audio.pause();
      render();
    }
    return;
  }
  play(index);
}

/** Controls and <audio> events. The nodes persist, so this runs exactly once. */
function wirePersistentPlayer(): void {
  if (wired) return;
  audio = $<HTMLAudioElement>('#sh-audio');
  if (!audio) return;
  wired = true;

  $('.mesh-play')?.addEventListener('click', () => {
    if (state.index < 0) step(1);
    else play(state.index);
  });
  $('.mesh-pause')?.addEventListener('click', () => {
    audio?.pause();
    render();
  });
  $('.mesh-prev')?.addEventListener('click', () => step(-1));
  $('.mesh-next')?.addEventListener('click', () => step(1));

  $('.hide-player-button')?.addEventListener('click', () => {
    $('.main-music-player')?.classList.toggle('hide-player');
  });

  const seekBar = $<HTMLElement>('.mesh-seek-bar');
  seekBar?.addEventListener('click', (event) => {
    if (!audio || !Number.isFinite(audio.duration)) return;
    const rect = seekBar.getBoundingClientRect();
    const ratio = (event as MouseEvent).offsetX / rect.width;
    audio.currentTime = Math.min(Math.max(ratio, 0), 1) * audio.duration;
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio) return;
    const bar = $<HTMLElement>('.mesh-play-bar');
    const time = $<HTMLElement>('.mesh-current-time');
    const pct = Number.isFinite(audio.duration) ? (audio.currentTime / audio.duration) * 100 : 0;
    if (bar) bar.style.width = `${pct}%`;
    if (time) time.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', renderNowPlaying);
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);
  audio.addEventListener('ended', () => {
    if (!state.queue) return;
    if (state.index < state.queue.tracks.length - 1) step(1);
    else render();
  });

  // Reveal the player once the page has scrolled, and tuck it away at the very
  // bottom so it doesn't sit on top of the footer — both carried over verbatim.
  window.addEventListener('scroll', () => {
    const el = $<HTMLElement>('.main-music-player');
    if (!el) return;
    el.classList.toggle('active', window.scrollY >= 100);
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight;
    el.classList.toggle('hide-player-footer', atBottom);
  });

  renderTransport(false);
}

/** Bind the tracklist of whichever page just rendered. Fresh nodes each time. */
function bindPage(): void {
  wirePersistentPlayer();

  const list = $<HTMLElement>('[data-release]');
  if (!list) {
    render();
    return;
  }

  const payload = document.getElementById('sh-tracks');
  if (!payload?.textContent) return;

  const queue: Queue = {
    slug: list.dataset.release!,
    cover: list.dataset.cover!,
    tracks: JSON.parse(payload.textContent) as Track[],
  };

  list.querySelectorAll<HTMLElement>('.trak-item').forEach((row, index) => {
    row.querySelector('.play-pause-button')?.addEventListener('click', () => {
      selectTrack(queue, index);
    });
  });

  // Durations are baked into the data; only fill in any the build could not probe.
  list.querySelectorAll<HTMLElement>('.trak-item').forEach((row, index) => {
    const cell = row.querySelector<HTMLElement>('.trak-duration');
    if (!cell || queue.tracks[index]?.duration !== null) return;
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.addEventListener('loadedmetadata', () => {
      cell.textContent = formatTime(probe.duration);
    });
    probe.src = queue.tracks[index].url;
  });

  render();
}

document.addEventListener('astro:page-load', bindPage);
