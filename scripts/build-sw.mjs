import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
const directory = 'dist'
async function walk(root) {
  const entries = await readdir(root, { withFileTypes: true })
  const result = []
  for (const entry of entries) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) result.push(...(await walk(path)))
    else if (entry.name !== 'sw.js')
      result.push(path.slice(directory.length + 1))
  }
  return result.sort()
}
const files = await walk(directory)
const hash = createHash('sha256')
for (const file of files) hash.update(await readFile(join(directory, file)))
const version = hash.digest('hex').slice(0, 12)
const worker = `// Generated from the complete production build; do not edit dist/sw.js.
const CACHE = 'engineer-os-${version}';
const PREFIX = 'engineer-os-';
const FILES = ${JSON.stringify(files)};
const base = new URL('./', self.location.href);
const urlFor = path => new URL(path, base).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(urlFor))));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return;
  // Keep the app shell and its hashed assets from the same release until the user updates.
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(urlFor('index.html'))).then(response => response || fetch(request)));
    return;
  }
  // These are immutable same-origin build files. Vite varies module responses by Origin,
  // while install-time precache requests omit that header; use the canonical URL entry.
  event.respondWith(caches.open(CACHE).then(cache => cache.match(request.url, { ignoreVary: true })).then(response => response || fetch(request)));
});
`
await writeFile(join(directory, 'sw.js'), worker)
console.log('Offline precache:', files.length, 'files; version', version)
