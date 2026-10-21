#!/usr/bin/env node
// Mirrors the static game frontend into dist/ so the Tauri shell can embed it.
// The game has no build step — this is a plain copy of the assets that ship.
import { cp, rm, mkdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');

// Everything the browser loads at runtime. src-tauri deliberately stays out:
// Tauri walks frontendDist recursively and would otherwise embed its own target/.
const ENTRIES = ['index.html', 'assets', 'src', 'styles', 'vendor'];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const name of ENTRIES) {
  const from = join(root, name);
  await stat(from);
  await cp(from, join(out, name), { recursive: true });
}

console.log(`dist/ ready — ${ENTRIES.length} entries copied`);