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
const SESSION_KEY = 'sh-player-session';

/**
 * Where a restored track should resume. Held here until the file's metadata
 * arrives, because until then the <audio> can't seek and reports 0.
 */
let restoreAt: number | null = null;

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

/** The playhead, including a restored position the <audio> hasn't seeked to yet. */
function position(): number {
  return restoreAt ?? audio?.currentTime ?? 0;
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
  const pct = duration ? Math.min(position() / duration, 1) * 100 : 0;

  if (!scrubbing) {
    binds<HTMLInputElement>('seek').forEach((input) => {
      input.value = String(Math.round(pct * 10));
      input.style.setProperty('--pct', `${pct}%`);
    });
    binds('current').forEach((el) => (el.textContent = formatTime(position())));
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

/** The hero's play card shows pause while its own release is playing. */
function renderPlayKey(): void {
  const key = $<HTMLElement>('[data-play-album]');
  const list = $<HTMLElement>('[data-release]');
  if (!key || !list) return;
  const queued = state.queue?.slug === list.dataset.release && state.index >= 0;
  const on = queued && isPlaying();
  key.classList.toggle('is-queued', queued);
  key.classList.toggle('is-playing', on);
  const album = list.dataset.album ?? '';
  key.setAttribute('aria-label', on ? `Pausar ${album}` : `Escuchar ${album}`);
}

function render(): void {
  renderTransport();
  renderNowPlaying();
  renderQueue();
  renderProgress();
  renderTrackList();
  renderPlayKey();
  renderMediaSession();
  saveSession();
}

/**
 * Tint the mini-player and the sheet with the cover's average colour, darkened
 * so white text stays legible — the effect Spotify gets from its artwork.
 */
const tints = new Map<string, string>();
async function tintOf(src: string): Promise<string | null> {
  let tint = tints.get(src);
  if (!tint) {
    try {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      const k = 0.5;
      tint = `rgb(${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)})`;
      tints.set(src, tint);
    } catch {
      return null;
    }
  }
  return tint;
}

async function applyTint(src: string): Promise<void> {
  const tint = await tintOf(src);
  if (!tint || lastCover !== src) return;
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
// Analytics: what gets listened to, pushed to GTM's dataLayer
// ---------------------------------------------------------------------------

/** What made a track start, so autoplay can be told apart from a chosen song. */
type Trigger = 'tracklist' | 'album' | 'queue' | 'next' | 'previous' | 'auto' | 'repeat' | 'resume';

/** Set when a track is loaded or restarted; the next `playing` event reports it. */
let pendingStart: Trigger | null = null;
/** The listen in progress, once its start has been reported. */
let listen: { trigger: Trigger; reported: Set<number> } | null = null;
/** Release of the last reported start. Module scope, so it spans navigations. */
let lastAlbum = '';
const MILESTONES = [25, 50, 75];

/**
 * Every push carries the full set of keys: GTM merges pushes into one data
 * model, so a key left out would keep the previous event's value.
 */
function pushAudioEvent(event: string, percent?: number): void {
  const track = current();
  const queue = state.queue;
  if (!track || !queue || !listen) return;
  const dataLayer = ((window as unknown as { dataLayer?: unknown[] }).dataLayer ??= []);
  dataLayer.push({
    event,
    audio_title: track.title,
    audio_album: queue.album,
    audio_album_slug: queue.slug,
    audio_track_number: state.index + 1,
    audio_duration: Math.round(knownDuration() ?? 0),
    audio_current_time: Math.round(audio?.currentTime ?? 0),
    audio_percent: percent,
    audio_trigger: listen.trigger,
  });
}

function reportStart(): void {
  if (!pendingStart || !state.queue) return;
  // A resumed track counts only the milestones still ahead of it.
  const duration = knownDuration();
  const pct = audio && duration ? (audio.currentTime / duration) * 100 : 0;
  listen = { trigger: pendingStart, reported: new Set(MILESTONES.filter((m) => pct >= m)) };
  pendingStart = null;
  if (state.queue.slug !== lastAlbum) {
    lastAlbum = state.queue.slug;
    pushAudioEvent('album_start');
  }
  pushAudioEvent('audio_start');
}

function reportProgress(): void {
  const duration = knownDuration();
  if (!audio || !listen || !duration) return;
  const pct = (audio.currentTime / duration) * 100;
  for (const m of MILESTONES) {
    if (pct >= m && !listen.reported.has(m)) {
      listen.reported.add(m);
      pushAudioEvent('audio_progress', m);
    }
  }
}

function reportComplete(): void {
  pushAudioEvent('audio_complete', 100);
  listen = null;
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------

function play(index: number, via: Trigger = 'resume'): void {
  if (!audio || !state.queue) return;
  const track = state.queue.tracks[index];
  if (!track) return;

  if (state.index !== index || audio.src !== track.url) {
    state.index = index;
    audio.src = track.url;
    restoreAt = null;
    pendingStart = via;
    listen = null;
  } else if (audio.ended) {
    pendingStart = via;
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
  if (next >= 0) play(next, delta > 0 ? 'next' : 'previous');
}

/** Like every music app: "previous" restarts the song unless it has barely begun. */
function previous(): void {
  if (audio && position() > 3) {
    seek(0);
    return;
  }
  const prev = neighbour(-1);
  if (prev >= 0) play(prev, 'previous');
  else seek(0);
}

function seek(seconds: number): void {
  const duration = knownDuration();
  if (!audio || !duration) return;
  const target = Math.min(Math.max(seconds, 0), duration);
  if (restoreAt !== null) restoreAt = target;
  else audio.currentTime = target;
  renderProgress();
  saveSession();
  updatePositionState();
}

/** Called when a row is clicked. Starts a queue, or toggles if it's the same track. */
function selectTrack(queue: Queue, index: number, via: Trigger = 'tracklist'): void {
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
  play(index, via);
}

/** The hero's PLAY key: start the album from the top, or pause/resume it if it's already queued. */
function playAlbum(queue: Queue): void {
  if (state.queue?.slug === queue.slug && state.index >= 0) {
    togglePlay();
    return;
  }
  const first = queue.tracks.findIndex((t) => t.duration !== null);
  if (first >= 0) selectTrack(queue, first, 'album');
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
// Session: the queue and playhead survive closing the tab
// ---------------------------------------------------------------------------

interface Session {
  queue: Queue;
  index: number;
  order: number[];
  shuffle: boolean;
  repeat: Repeat;
  time: number;
}

let lastSave = 0;

/** Snapshot the queue and playhead, so a later visit picks up where this one left off. */
function saveSession(): void {
  if (!audio) return;
  lastSave = Date.now();
  try {
    if (!state.queue || state.index < 0) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    const session: Session = {
      queue: state.queue,
      index: state.index,
      order: state.order,
      shuffle: state.shuffle,
      repeat: state.repeat,
      // A finished track comes back from the top, not parked on its last second.
      time: audio.ended ? 0 : position(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* private mode or blocked storage: the session just won't be remembered */
  }
}

/**
 * Put the last visit's track back in the player, paused at the same second.
 * It never autoplays: browsers would refuse anyway, and sound out of nowhere
 * on page load is the last thing a visitor wants.
 */
function restoreSession(): void {
  if (!audio) return;
  let session: Session;
  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
  } catch {
    return;
  }
  const tracks = session?.queue?.tracks;
  const track = Array.isArray(tracks) ? tracks[session.index] : undefined;
  if (!track?.url || track.duration === null) return;

  state.queue = session.queue;
  state.index = session.index;
  state.shuffle = session.shuffle === true;
  state.repeat = session.repeat === 'all' || session.repeat === 'one' ? session.repeat : 'off';
  const order = session.order;
  const valid =
    Array.isArray(order) && order.length === tracks.length && [...order].sort((a, b) => a - b).every((n, i) => n === i);
  if (valid) state.order = order;
  else rebuildOrder();

  const time = Number(session.time);
  restoreAt = Number.isFinite(time) && time > 0 && time < (track.duration ?? Infinity) - 1 ? time : null;
  audio.preload = 'metadata';
  audio.src = track.url;
  // Pressing play resumes this track: report it as a start, like any other.
  pendingStart = 'resume';
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
    if (button) play(Number(button.dataset.index), 'queue');
  });

  const sheet = root.querySelector<HTMLElement>('.shp-sheet');
  if (sheet) wireSheetDrag(sheet);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root?.hasAttribute('data-expanded')) setExpanded(false);
  });

  if (pipApi()) root.querySelectorAll<HTMLElement>('[data-action="pip"]').forEach((b) => (b.hidden = false));

  audio.addEventListener('timeupdate', () => {
    renderProgress();
    reportProgress();
    if (Date.now() - lastSave > 5000) saveSession();
  });
  audio.addEventListener('playing', reportStart);
  audio.addEventListener('loadedmetadata', () => {
    if (audio && restoreAt !== null) {
      audio.currentTime = restoreAt;
      restoreAt = null;
    }
    renderNowPlaying();
    updatePositionState();
  });
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);
  audio.addEventListener('seeked', () => {
    updatePositionState();
    saveSession();
  });
  audio.addEventListener('volumechange', renderVolume);
  audio.addEventListener('ended', () => {
    if (!audio) return;
    reportComplete();
    if (state.repeat === 'one') {
      pendingStart = 'repeat';
      audio.currentTime = 0;
      void audio.play().catch(() => {});
      return;
    }
    const next = neighbour(1);
    if (next >= 0) play(next, 'auto');
    else render();
  });

  // The last write has to land before the tab goes; timeupdate only saves every few seconds.
  window.addEventListener('pagehide', saveSession);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveSession();
  });

  restoreVolume();
  renderVolume();
  restoreSession();
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
  const key = $<HTMLElement>('[data-play-album]');
  if (key) {
    key.addEventListener('click', () => playAlbum(queue));
    // The same tint the mini-player will take on once this album plays.
    void tintOf(queue.cover).then((tint) => tint && key.style.setProperty('--shk-tint', tint));
  }

  render();
}

document.addEventListener('astro:page-load', bindPage);
