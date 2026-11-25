// TDD-lite checks for the best-cooking-game entry (run: node test-entry.mjs).
// One test per kit requirement: entrypoint exists + stdlib-only, deterministic
// output (two runs, same bytes), dossier formed, no network references in
// game/, index.html under 1 MiB, LICENSE MIT, owner wallet, README badges.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync, readFileSync, readdirSync, statSync, mkdtempSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const WALLET = '9uZU5o532aL4A384m9w9ThQ7jzrsjDsuhATbtz5P8chQ';
const REPO = 'makefun-best-cooking-game-20261125-0137';
const OWNER = 'muhamadyusufseptian6-lab';
const SLUG = 'best-cooking-game-20261125-0137';

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function runMainIn(dir, outDir) {
  execFileSync(process.execPath, ['main.ts'], {
    cwd: dir,
    env: { ...process.env, MAKEFUN_OUTPUT_DIR: outDir },
    stdio: 'pipe',
  });
}

// Minimal valid PNG (solid colour) built with the stdlib only, as a test
// fixture for the determinism check. Never shipped in the entry.
function makePng(width, height) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0;
    for (let x = 0; x < width; x++) {
      const o = y * (1 + width * 3) + 1 + x * 3;
      raw[o] = 0x2b; raw[o + 1] = 0x1a; raw[o + 2] = 0x2e;
    }
  }
  const idat = deflateSync(raw);
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// CRC-32 (PNG chunk checksums), stdlib-only.
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = 0xffffffff;
  for (const byte of buf) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

test('entrypoint main.ts exists and imports only node: stdlib + vendor lib', () => {
  const src = readFileSync(join(here, 'main.ts'), 'utf8');
  assert.match(src, /from '\.\/vendor\/makefun-game\.ts'/);
  for (const m of src.matchAll(/from '([^']+)'/g)) {
    assert.ok(
      m[1].startsWith('node:') || m[1].startsWith('./'),
      `non-stdlib import: ${m[1]}`,
    );
  }
});

test('game/index.html exists, under 1 MiB, and loads only local files', () => {
  const p = join(here, 'game', 'index.html');
  assert.ok(existsSync(p), 'game/index.html missing');
  assert.ok(statSync(p).size < 1024 * 1024, 'index.html over 1 MiB');
  const html = readFileSync(p, 'utf8');
  assert.doesNotMatch(html, /https?:\/\//, 'network URL in index.html');
  assert.doesNotMatch(html, /src="\/\//, 'protocol-relative URL in index.html');
});

test('no network references anywhere under game/', () => {
  for (const f of walk(join(here, 'game'))) {
    const text = readFileSync(f, 'utf8');
    assert.doesNotMatch(text, /https?:\/\/[^"'\s)]/, `${f} has a network URL`);
    assert.doesNotMatch(text, /fetch\s*\(/, `${f} calls fetch`);
    assert.doesNotMatch(text, /XMLHttpRequest/, `${f} uses XHR`);
  }
});

test('main.ts is deterministic: two runs write identical dossier bytes', () => {
  // buildDossier refuses an entry with no screenshots (the cover is
  // required), and the real screenshots come later from the browser. So the
  // determinism check stages a temp COPY of the entry with a generated
  // valid-PNG fixture in its screenshots/ — the fixture lives only in /tmp
  // and never enters the entry itself.
  const stage = mkdtempSync(join(tmpdir(), 'cook-stage-'));
  const a = mkdtempSync(join(tmpdir(), 'cook-a-'));
  const b = mkdtempSync(join(tmpdir(), 'cook-b-'));
  try {
    execFileSync('cp', ['-r', `${here}/.`, stage], { stdio: 'pipe' });
    writeFileSync(join(stage, 'screenshots', '1-cover.png'), makePng(1280, 720));
    runMainIn(stage, a);
    runMainIn(stage, b);
    const da = readFileSync(join(a, 'dossier.json'));
    const db = readFileSync(join(b, 'dossier.json'));
    assert.ok(da.equals(db), 'dossier.json differs between runs');
    assert.ok(existsSync(join(a, 'game', 'index.html')), 'output game/ missing');
    assert.ok(existsSync(join(a, 'screenshots', '1-cover.png')), 'output screenshots/ missing');
  } finally {
    rmSync(stage, { recursive: true, force: true });
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  }
});

test('LICENSE starts with the MIT SPDX identifier', () => {
  const lic = readFileSync(join(here, 'LICENSE'), 'utf8');
  assert.ok(lic.startsWith('SPDX-License-Identifier: MIT'), 'LICENSE header wrong');
});

test('.makefun/owner.json holds only the public wallet', () => {
  const owner = JSON.parse(readFileSync(join(here, '.makefun', 'owner.json'), 'utf8'));
  assert.deepEqual(Object.keys(owner), ['wallet']);
  assert.equal(owner.wallet, WALLET);
});

test('README carries the three live make.fun badges as links, repo name exact', () => {
  const readme = readFileSync(join(here, 'README.md'), 'utf8');
  assert.ok(readme.includes(`https://make.fun/badge/${SLUG}.svg`), 'competition badge missing');
  assert.ok(
    readme.includes(`https://make.fun/badge/${SLUG}/${OWNER}/${REPO}/rank.svg`),
    'rank badge missing or repo name wrong',
  );
  assert.ok(
    readme.includes(`https://make.fun/badge/${SLUG}/${OWNER}/${REPO}/reward.svg`),
    'reward badge missing or repo name wrong',
  );
  assert.doesNotMatch(readme, /\{owner\}|\{repo\}/, 'template placeholder left in README');
  assert.ok(readme.includes('515temp1'), 'referral footer missing');
});

test('game source is split into named modules, one job each', () => {
  const src = readdirSync(join(here, 'game', 'src')).filter((f) => f.endsWith('.js'));
  assert.ok(src.length >= 4, `expected >=4 source modules, got ${src.length}`);
  for (const f of ['main.js', 'recipes.js', 'orders.js', 'render.js']) {
    assert.ok(src.includes(f), `missing game/src/${f}`);
  }
});
