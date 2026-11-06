// Mode hors ligne d'Outil Dys : les fichiers de l'outil sont gardés dans le navigateur.
// Stratégie « réseau d'abord » : quand internet est là, on prend toujours la version la plus récente (pas de vieille version coincée) ;
// sans internet, on sert la copie gardée. Les requêtes vers d'autres sites (Wiktionnaire, etc.) ne sont jamais interceptées.
// Si tu ajoutes un fichier à l'outil, ajoute-le dans CORE (sinon il est gardé après sa première utilisation).
const V = 'outil-dys-v2';
const CORE = [
  './',
  'index.html',
  'img/logo.svg',
  'img/icon-32.png',
  'img/icon-48.png',
  'img/apple-touch-icon.png',
  'manifest.webmanifest',
  'css/style.css',
  'img/humanix.png',
  'libs/pdf-lib.min.js',
  'js/data.js',
  'js/corrector.js',
  'js/citations.js',
  'js/bandeau.js',
  'js/humeur.js',
  'js/app.js',
  'js/tools.js',
  'js/report.js',
  'js/slides.js',
  'js/subjects.js',
  'js/revision.js',
  'js/dico.js',
  'js/dictation.js',
  'js/recherche.js',
  'js/survol.js',
  'js/extras.js',
  'js/maths.js',
  'js/espace.js',
  'js/repere.js',
  'js/geo.js',
  'js/sante.js',
  'img/icon-192.png',
  'img/icon-512.png',
  'js/conjug.js',
  'js/entrain.js',
  'js/memo.js',
  'js/orga.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('outil-dys-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin || u.pathname.endsWith('/api/status') || u.pathname.includes('/api/')) return;
  e.respondWith(fetch(r).then(res => { if (res && res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)).catch(() => {}); } return res; })
    .catch(() => caches.match(r).then(m => m || caches.match(r, { ignoreSearch: true })).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
