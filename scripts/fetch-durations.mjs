/**
 * Resolve every track's duration once, so the pages can render durations
 * statically instead of shipping 125 hidden <audio preload="metadata">
 * elements that each hit DigitalOcean on page load.
 *
 *   node scripts/fetch-durations.mjs <releases.json>
 *
 * Reads the JSON on argv[2], writes it back with `duration` (seconds, rounded)
 * filled in on each track. Tracks that cannot be probed keep `duration: null`,
 * and the template falls back to measuring them in the browser.
 *
 * ffprobe streams over HTTP range requests, so this only pulls each file's
 * header rather than the whole MP3.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const CONCURRENCY = 8;

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/fetch-durations.mjs <releases.json>');
  process.exit(1);
}

const releases = JSON.parse(readFileSync(file, 'utf8'));

async function probe(url) {
  try {
    const { stdout } = await run(
      'ffprobe',
      [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        '-rw_timeout', '30000000',
        url,
      ],
      { timeout: 60_000 }
    );
    const seconds = Number.parseFloat(stdout.trim());
    return Number.isFinite(seconds) ? Math.round(seconds) : null;
  } catch {
    return null;
  }
}

/** Flatten to a work queue so concurrency spans releases, not just within one. */
const jobs = [];
for (const release of releases) {
  for (const track of release.tracks) {
    if (track.url) jobs.push({ release, track });
  }
}

let done = 0;
let failed = 0;

async function worker() {
  for (;;) {
    const job = jobs.shift();
    if (!job) return;
    job.track.duration = await probe(job.track.url);
    done += 1;
    if (job.track.duration === null) {
      failed += 1;
      console.error(`  ! could not probe ${job.track.url}`);
    }
    if (done % 20 === 0) console.error(`  … ${done} probed`);
  }
}

const total = jobs.length;
console.error(`probing ${total} tracks with ${CONCURRENCY} workers…`);
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

writeFileSync(file, JSON.stringify(releases, null, 2) + '\n');
console.error(`done: ${total - failed}/${total} resolved${failed ? `, ${failed} failed` : ''}`);
