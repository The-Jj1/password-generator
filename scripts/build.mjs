import { mkdir, cp, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const entry of ['index.html', 'favicon.svg', 'robots.txt', 'src']) {
  await cp(new URL(entry, root), new URL(entry, dist), { recursive: true });
}
console.log('Static site built in dist/');
