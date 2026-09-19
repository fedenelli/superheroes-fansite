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
 *
 * The UI (see Player.astro) is three views over this one state: the bottom bar,
 * the "now playing" sheet, and a card that can be moved into a Document
 * Picture-in-Picture window. Every view is rendered from `state`; none of them
 * is ever read back to decide what plays next.
 */

import { SITE } from '../data/site';

export interface Track {
  title: string;
  url: string;
  duration: number | null;
}

interface Queue {
  /** Which release these tracks came from, so the right rows get highlighted. */
  slug: string;
  album: string;
  /** 30px thumbnail, for the bar. */
  cover: string;
  /** Large band photo, cropped square wherever the artwork is shown big. */
  art: string;
  tracks: Track[];
}

type Repeat = 'off' | 'all' | 'one';

const state = {
  queue: null as Queue | null,
  /** Index into queue.tracks of the current track. */
  index: -1,
  /** Play order: a permutation of track indexes. Identity unless shuffling. */
  order: [] as number[],
  shuffle: false,
  repeat: 'off' as Repeat,
};

let audio: HTMLAudioElement | null = null;
let root: HTMLElement | null = null;
/** The card that travels into the PiP window. Kept by reference because it leaves `root`. */
let pipCard: HTMLElement | null = null;
let pipWindow: Window | null = null;
/** While a seek slider is being dragged, timeupdate must not yank it back. */
let scrubbing = false;
let wired = false;

const MOBILE = '(max-width: 767px)';
const VOLUME_KEY = 'sh-player-volume';

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel);

/** Every element bound to `name`, in the page and in the PiP window alike. */
function binds<T extends Element = HTMLElement>(name: string): T[] {
  const sel = `[data-bind="${name}"]`;
  const found = root ? [...root.querySelectorAll<T>(sel)] : [];
  if (pipCard && root && !root.contains(pipCard)) found.push(...pipCard.querySelectorAll<T>(sel));
  return found;
}

/** m:ss, or h:mm:ss past an hour. */
function formatTime(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function current(): Track | null {
  if (!state.queue || state.index < 0) return null;
  return state.queue.tracks[state.index] ?? null;
}

function isPlaying(): boolean {
  return Boolean(audio && !audio.paused);
}

/** Prefer what the browser measured; fall back to the build-time value. */
function knownDuration(): number | null {
  if (audio && Number.isFinite(audio.duration) && audio.duration > 0) return audio.duration;
  return current()?.duration ?? null;
}

// ---------------------------------------------------------------------------
// Queue order
// ---------------------------------------------------------------------------

function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Rebuild the play order around the current track, so toggling shuffle never skips it. */
function rebuildOrder(): void {
  const all = state.queue ? state.queue.tracks.map((_, i) => i) : [];
  if (!state.shuffle || state.index < 0) {
    state.order = all;
    return;
  }
  state.order = [state.index, ...shuffled(all.filter((i) => i !== state.index))];
}

/** The track `delta` steps away in play order, or -1 at either end (unless repeating all). */
function neighbour(delta: number): number {
  const pos = state.order.indexOf(state.index);
  if (pos < 0) return -1;
  let next = pos + delta;
  if (next < 0 || next >= state.order.length) {
    if (state.repeat !== 'all') return -1;
    next = (next + state.order.length) % state.order.length;
  }
  return state.order[next];
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function setPlayingFlag(el: HTMLElement | null, on: boolean): void {
  if (!el) return;
  if (on) el.dataset.playing = '';
  else delete el.dataset.playing;
}

function renderTransport(): void {
  const playing = isPlaying();
  setPlayingFlag(root, playing);
  setPlayingFlag(pipCard, playing);
  const label = playing ? 'Pausar' : 'Reproducir';
  const toggles = [
    ...(root?.querySelectorAll('[data-action="toggle"]') ?? []),
    ...(pipCard?.querySelectorAll('[data-action="toggle"]') ?? []),
  ];
  new Set(toggles).forEach((b) => b.setAttribute('aria-label', label));

  root?.querySelectorAll('[data-action="shuffle"]').forEach((b) => {
    b.setAttribute('aria-pressed', String(state.shuffle));
  });
  root?.querySelectorAll<HTMLElement>('[data-action="repeat"]').forEach((b) => {
    b.dataset.repeat = state.repeat;
    b.setAttribute(
      'aria-label',
      state.repeat === 'one' ? 'Repetir: este tema' : state.repeat === 'all' ? 'Repetir: todo' : 'Repetir'
    );
  });
}

function renderProgress(): void {
  if (!audio) return;
  const duration = knownDuration();
  const pct = duration ? Math.min(audio.currentTime / duration, 1) * 100 : 0;

  if (!scrubbing) {
    binds<HTMLInputElement>('seek').forEach((input) => {
      input.value = String(Math.round(pct * 10));
      input.style.setProperty('--pct', `${pct}%`);
    });
    binds('current').forEach((el) => (el.textContent = formatTime(audio!.currentTime)));
  }
  binds('bar').forEach((el) => (el.style.width = `${pct}%`));
}

let lastCover = '';

/** Reflect the current track everywhere it is shown. */
function renderNowPlaying(): void {
  const track = current();
  const queue = state.queue;

  if (root) {
    if (queue) delete root.dataset.empty;
    else root.dataset.empty = '';
  }

  binds('title').forEach((el) => (el.textContent = track?.title ?? ''));
  binds('album-text').forEach((el) => (el.textContent = queue?.album ?? ''));
  binds<HTMLAnchorElement>('album').forEach((el) => {
    el.textContent = queue?.album ?? SITE.artist;
    el.href = queue ? `/${queue.slug}` : '/';
  });
  if (queue && queue.cover !== lastCover) {
    lastCover = queue.cover;
    binds<HTMLImageElement>('cover').forEach((img) => (img.src = queue.cover));
    binds<HTMLImageElement>('art').forEach((img) => (img.src = queue.art));
    void applyTint(queue.cover);
  }
  binds('duration').forEach((el) => (el.textContent = formatTime(knownDuration())));

  if (pipWindow && track) pipWindow.document.title = `${track.title} · ${SITE.artist}`;
}

let renderedQueue = '';

/** The queue list in the sheet. Rebuilt only when the order or current track changes. */
function renderQueue(): void {
  const list = binds<HTMLOListElement>('queue')[0];
  if (!list || !state.queue) return;

  const key = `${state.queue.slug}|${state.order.join(',')}`;
  if (key !== renderedQueue) {
    renderedQueue = key;
    list.replaceChildren(
      ...state.order.map((i, n) => {
        const t = state.queue!.tracks[i];
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.index = String(i);
        const num = document.createElement('span');
        num.className = 'shp-q-n';
        num.textContent = String(n + 1);
        const title = document.createElement('span');
        title.className = 'shp-q-title';
        title.textContent = t.title;
        const time = document.createElement('span');
        time.className = 'shp-q-time';
        time.textContent = t.duration === null ? '' : formatTime(t.duration);
        b.append(num, title, time);
        li.append(b);
        return li;
      })
    );
  }
  list.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
    b.setAttribute('aria-current', String(Number(b.dataset.index) === state.index));
  });
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
  if (isPlaying()) row.classList.add('playing');
}

function render(): void {
  renderTransport();
  renderNowPlaying();
  renderQueue();
  renderProgress();
  renderTrackList();
  renderMediaSession();
}

/**
 * Tint the mini-player and the sheet with the cover's average colour, darkened
 * so white text stays legible — the effect Spotify gets from its artwork.
 */
const tints = new Map<string, string>();
async function applyTint(src: string): Promise<void> {
  let tint = tints.get(src);
  if (!tint) {
    try {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      const k = 0.5;
      tint = `rgb(${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)})`;
      tints.set(src, tint);
    } catch {
      return;
    }
  }
  if (lastCover !== src) return;
  root?.style.setProperty('--shp-tint', tint);
  pipCard?.style.setProperty('--shp-bg', tint);
}

// ---------------------------------------------------------------------------
// Media Session: lock screen, notification shade, headset and keyboard keys
// ---------------------------------------------------------------------------

let sessionTrack = '';

function renderMediaSession(): void {
  if (!('mediaSession' in navigator)) return;
  const track = current();
  navigator.mediaSession.playbackState = track ? (isPlaying() ? 'playing' : 'paused') : 'none';
  if (!track || !state.queue) return;

  const key = `${state.queue.slug}|${state.index}`;
  if (key === sessionTrack) return;
  sessionTrack = key;
  const abs = (src: string) => new URL(src, location.href).href;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: SITE.artist,
    album: state.queue.album,
    artwork: [
      { src: abs(state.queue.cover), sizes: '30x30' },
      { src: abs(state.queue.art), sizes: '1920x1000', type: 'image/jpeg' },
    ],
  });
}

function updatePositionState(): void {
  if (!audio || !('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
  const duration = knownDuration();
  if (!duration) return;
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: audio.playbackRate,
      position: Math.min(audio.currentTime, duration),
    });
  } catch {
    /* some browsers reject a position a hair past the duration */
  }
}

function wireMediaSession(): void {
  if (!('mediaSession' in navigator)) return;
  const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
    ['play', () => resume()],
    ['pause', () => audio?.pause()],
    ['previoustrack', () => previous()],
    ['nexttrack', () => step(1)],
    ['seekto', (d) => d.seekTime !== undefined && seek(d.seekTime)],
    ['seekbackward', (d) => audio && seek(audio.currentTime - (d.seekOffset ?? 10))],
    ['seekforward', (d) => audio && seek(audio.currentTime + (d.seekOffset ?? 10))],
    // Chrome can open the PiP window by itself when the visitor switches tabs.
    ['enterpictureinpicture' as MediaSessionAction, () => void openPip()],
  ];
  for (const [action, handler] of handlers) {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      /* action not supported by this browser */
    }
  }
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------

function play(index: number): void {
  if (!audio || !state.queue) return;
  const track = state.queue.tracks[index];
  if (!track) return;

  if (state.index !== index || audio.src !== track.url) {
    state.index = index;
    audio.src = track.url;
  }
  void audio.play().catch(() => {
    /* autoplay refusal or a dead file — leave the UI in its paused state */
  });
  render();
}

function resume(): void {
  if (state.index >= 0) play(state.index);
}

function togglePlay(): void {
  if (!audio) return;
  if (audio.paused) resume();
  else audio.pause();
}

function step(delta: number): void {
  const next = neighbour(delta);
  if (next >= 0) play(next);
}

/** Like every music app: "previous" restarts the song unless it has barely begun. */
function previous(): void {
  if (audio && audio.currentTime > 3) {
    seek(0);
    return;
  }
  const prev = neighbour(-1);
  if (prev >= 0) play(prev);
  else seek(0);
}

function seek(seconds: number): void {
  const duration = knownDuration();
  if (!audio || !duration) return;
  audio.currentTime = Math.min(Math.max(seconds, 0), duration);
  renderProgress();
  updatePositionState();
}

/** Called when a row is clicked. Starts a queue, or toggles if it's the same track. */
function selectTrack(queue: Queue, index: number): void {
  const sameTrack =
    state.queue?.slug === queue.slug && state.index === index && audio?.src === queue.tracks[index].url;

  if (sameTrack) {
    togglePlay();
    return;
  }
  const newQueue = state.queue?.slug !== queue.slug;
  state.queue = queue;
  state.index = index;
  if (newQueue || state.shuffle) rebuildOrder();
  play(index);
}

function toggleShuffle(): void {
  state.shuffle = !state.shuffle;
  rebuildOrder();
  render();
}

function cycleRepeat(): void {
  state.repeat = state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
  render();
}

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------

function renderVolume(): void {
  if (!audio || !root) return;
  const level = audio.muted ? 0 : Math.round(audio.volume * 100);
  if (audio.muted || level === 0) root.dataset.muted = '';
  else delete root.dataset.muted;
  binds<HTMLInputElement>('volume').forEach((input) => {
    input.value = String(level);
    input.style.setProperty('--pct', `${level}%`);
  });
  root.querySelector('[data-action="mute"]')?.setAttribute('aria-label', audio.muted ? 'Activar sonido' : 'Silenciar');
}

function setVolume(level: number): void {
  if (!audio) return;
  audio.volume = Math.min(Math.max(level, 0), 1);
  audio.muted = audio.volume === 0;
  try {
    localStorage.setItem(VOLUME_KEY, String(audio.volume));
  } catch {
    /* private mode or blocked storage: the level just won't be remembered */
  }
}

function restoreVolume(): void {
  if (!audio) return;
  try {
    const saved = Number(localStorage.getItem(VOLUME_KEY));
    if (localStorage.getItem(VOLUME_KEY) !== null && Number.isFinite(saved)) audio.volume = saved;
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// "Now playing" sheet
// ---------------------------------------------------------------------------

function setExpanded(open: boolean): void {
  if (!root) return;
  if (open) root.dataset.expanded = '';
  else delete root.dataset.expanded;
  root.querySelector('.shp-sheet')?.setAttribute('aria-hidden', String(!open));
  root.querySelectorAll('[data-action="queue"]').forEach((b) => b.setAttribute('aria-pressed', String(open)));
  if (open) {
    root.querySelector('.shp-queue [aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }
}

/** Drag the sheet down to dismiss it, as on a native player. */
function wireSheetDrag(sheet: HTMLElement): void {
  const body = sheet.querySelector<HTMLElement>('.shp-sheet-body');
  let startY = 0;
  let dy = 0;
  let dragging = false;

  sheet.addEventListener(
    'touchstart',
    (e) => {
      if (!matchMedia(MOBILE).matches) return;
      if ((e.target as Element).closest('input')) return;
      if (body && body.scrollTop > 0 && body.contains(e.target as Node)) return;
      startY = e.touches[0].clientY;
      dy = 0;
      dragging = true;
    },
    { passive: true }
  );
  sheet.addEventListener(
    'touchmove',
    (e) => {
      if (!dragging) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      if (dy > 0) {
        sheet.classList.add('shp-dragging');
        sheet.style.transform = `translateY(${dy}px)`;
      }
    },
    { passive: true }
  );
  const end = () => {
    if (!dragging) return;
    dragging = false;
    sheet.classList.remove('shp-dragging');
    sheet.style.transform = '';
    if (dy > 120) setExpanded(false);
  };
  sheet.addEventListener('touchend', end);
  sheet.addEventListener('touchcancel', end);
}

// ---------------------------------------------------------------------------
// Picture-in-Picture (Document PiP: Chrome and Edge on desktop)
// ---------------------------------------------------------------------------

interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
  window: Window | null;
}

function pipApi(): DocumentPictureInPicture | null {
  return (window as unknown as { documentPictureInPicture?: DocumentPictureInPicture }).documentPictureInPicture ?? null;
}

/** Copy the page's stylesheets, minus the 16k-line theme the card doesn't use. */
function copyStyles(target: Document): void {
  for (const sheet of [...document.styleSheets]) {
    if (sheet.href?.includes('/assets/css/master.css')) continue;
    try {
      const style = target.createElement('style');
      style.textContent = [...sheet.cssRules].map((r) => r.cssText).join('\n');
      target.head.append(style);
    } catch {
      if (!sheet.href) continue;
      const link = target.createElement('link');
      link.rel = 'stylesheet';
      link.href = sheet.href;
      target.head.append(link);
    }
  }
  const base = target.createElement('style');
  base.textContent = 'html,body{margin:0;height:100%;background:#121212}';
  target.head.append(base);
}

async function openPip(): Promise<void> {
  const api = pipApi();
  if (!api || !pipCard || !root || pipWindow || !state.queue) return;

  const win = await api.requestWindow({ width: 320, height: 360 });
  pipWindow = win;
  copyStyles(win.document);
  pipCard.hidden = false;
  win.document.body.append(pipCard);
  root.dataset.pip = '';

  win.addEventListener('pagehide', () => {
    if (pipCard && root) {
      pipCard.hidden = true;
      root.append(pipCard);
      delete root.dataset.pip;
    }
    pipWindow = null;
  });
  render();
}

function togglePip(): void {
  if (pipWindow) pipWindow.close();
  else void openPip();
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

const actions: Record<string, () => void> = {
  toggle: togglePlay,
  prev: previous,
  next: () => step(1),
  shuffle: toggleShuffle,
  repeat: cycleRepeat,
  queue: () => setExpanded(!root?.hasAttribute('data-expanded')),
  expand: () => setExpanded(!root?.hasAttribute('data-expanded')),
  collapse: () => setExpanded(false),
  pip: togglePip,
  mute: () => {
    if (!audio) return;
    if (audio.muted || audio.volume === 0) {
      audio.muted = false;
      if (audio.volume === 0) setVolume(0.5);
    } else audio.muted = true;
  },
};

/** Controls and <audio> events. The nodes persist, so this runs exactly once. */
function wirePersistentPlayer(): void {
  if (wired) return;
  root = $<HTMLElement>('sh-player');
  audio = $<HTMLAudioElement>('#sh-audio');
  pipCard = root?.querySelector<HTMLElement>('.shp-pip') ?? null;
  if (!root || !audio) return;
  wired = true;

  // Listeners go on each control rather than on `root`, so the PiP card keeps
  // working after it has been moved into another document.
  root.querySelectorAll<HTMLElement>('[data-action]').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      actions[el.dataset.action!]?.();
    });
  });

  // On phones the whole mini-player opens the sheet, except its play button.
  root.querySelector('.shp-bar')?.addEventListener('click', (event) => {
    if (!matchMedia(MOBILE).matches) return;
    if ((event.target as Element).closest('[data-action]')) return;
    event.preventDefault();
    setExpanded(true);
  });

  root.querySelectorAll<HTMLInputElement>('[data-bind="seek"]').forEach((input) => {
    input.addEventListener('input', () => {
      scrubbing = true;
      const duration = knownDuration();
      const ratio = Number(input.value) / 1000;
      input.style.setProperty('--pct', `${ratio * 100}%`);
      binds('current').forEach((el) => (el.textContent = formatTime(duration ? ratio * duration : 0)));
    });
    input.addEventListener('change', () => {
      scrubbing = false;
      const duration = knownDuration();
      if (duration) seek((Number(input.value) / 1000) * duration);
    });
  });

  root.querySelector<HTMLInputElement>('[data-bind="volume"]')?.addEventListener('input', (event) => {
    setVolume(Number((event.target as HTMLInputElement).value) / 100);
  });

  root.querySelector('[data-bind="queue"]')?.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLElement>('button[data-index]');
    if (button) play(Number(button.dataset.index));
  });

  const sheet = root.querySelector<HTMLElement>('.shp-sheet');
  if (sheet) wireSheetDrag(sheet);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root?.hasAttribute('data-expanded')) setExpanded(false);
  });

  if (pipApi()) root.querySelectorAll<HTMLElement>('[data-action="pip"]').forEach((b) => (b.hidden = false));

  audio.addEventListener('timeupdate', renderProgress);
  audio.addEventListener('loadedmetadata', () => {
    renderNowPlaying();
    updatePositionState();
  });
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);
  audio.addEventListener('seeked', updatePositionState);
  audio.addEventListener('volumechange', renderVolume);
  audio.addEventListener('ended', () => {
    if (!audio) return;
    if (state.repeat === 'one') {
      audio.currentTime = 0;
      void audio.play().catch(() => {});
      return;
    }
    const next = neighbour(1);
    if (next >= 0) play(next);
    else render();
  });

  restoreVolume();
  renderVolume();
  wireMediaSession();
}

/** Bind the tracklist of whichever page just rendered. Fresh nodes each time. */
function bindPage(): void {
  wirePersistentPlayer();

  // A link inside the full-screen sheet just navigated; show the page it led to.
  if (matchMedia(MOBILE).matches) setExpanded(false);

  const list = $<HTMLElement>('[data-release]');
  if (!list) {
    render();
    return;
  }

  const payload = document.getElementById('sh-tracks');
  if (!payload?.textContent) return;

  const queue: Queue = {
    slug: list.dataset.release!,
    album: list.dataset.album ?? '',
    cover: list.dataset.cover!,
    art: list.dataset.art ?? list.dataset.cover!,
    tracks: JSON.parse(payload.textContent) as Track[],
  };

  list.querySelectorAll<HTMLElement>('.trak-item').forEach((row, index) => {
    row.querySelector('.play-pause-button')?.addEventListener('click', () => {
      selectTrack(queue, index);
    });
  });

  render();
}

document.addEventListener('astro:page-load', bindPage);
