import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Downloads only the explicit static asset URLs in the provenance manifest.
// No SDK configuration, tokens, cookies, or business API endpoints are used.
const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await fs.readFile(option('--manifest', path.join(project, 'spec/source-manifest.json')), 'utf8'));
const directory = path.resolve(option('--source-dir', path.join(project, '.cache/sources')));
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const source of manifest.sources) {
  const target = path.resolve(directory, source.cachePath);
  if (!target.startsWith(directory + path.sep)) throw new Error(`Invalid cache path: ${source.cachePath}`);
  if (!source.url) {
    console.log(`${source.id}: user-supplied input; place the original file at ${target}`);
    continue;
  }
  const url = new URL(source.url);
  if (url.protocol !== 'https:') throw new Error(`Only HTTPS assets are supported: ${source.id}`);
  try {
    const cached = await fs.readFile(target);
    if (sha256(cached) === source.sha256) { console.log(`${source.id}: hash-verified cache`); continue; }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const response = await fetch(url, { method: 'GET', credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`${source.id}: static asset returned HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (sha256(bytes) !== source.sha256) throw new Error(`${source.id}: source hash changed; review the new release and update provenance explicitly`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes);
  console.log(`${source.id}: downloaded and hash verified (${bytes.length} bytes)`);
}
