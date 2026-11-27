// Remove the previous build's hashed assets so the repo root doesn't collect old files.
import { rmSync } from 'node:fs';
rmSync(new URL('../../assets', import.meta.url), { recursive: true, force: true });
