// Stamp the service worker with a build id so installed apps pick up the new version.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const sw = new URL('sw.js', root);
const assets = readdirSync(new URL('assets/', root)).map(f => `assets/${f}`);
const version = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
let src = readFileSync(sw, 'utf8')
  .replace('__BUILD__', version)
  .replace('__ASSETS__', JSON.stringify(assets));
writeFileSync(sw, src);
console.log(`sw.js stamped ${version} with ${assets.length} assets`);
