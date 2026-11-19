/**
 * frigoplacard_sw.js — service worker minimal de Frigo-Placard.
 *
 * Stratégie conservatrice : uniquement l'app-shell (pages) en cache, pour le
 * mode hors-ligne. Aucune requête vers le hub ou vers l'IA n'est interceptée :
 * elles passent toujours par le réseau réel.
 */
const VERSION = 'frigoplacard-v2';
const RACINE = ['./', './manifest.json', './frigoplacard-icon.svg'];

// Fichiers construits (JS, CSS) cités par la page : mis en cache dès l'installation.
// Sans cela, la première visite n'en garde aucun et la page reste blanche hors ligne.
async function precacherActifs(cache) {
  const page = await cache.match('./');
  if (!page) return;
  const html = await page.text();
  const actifs = [...new Set([...html.matchAll(/(?:src|href)="(\.?\/?assets\/[^"]+)"/g)].map((m) => m[1]))];
  await Promise.all(actifs.map((a) => cache.add(a).catch(() => undefined)));
  // Morceaux chargés à la demande (écrans « lazy ») : listés par Vite dans __vite__mapDeps du script principal.
  for (const a of actifs.filter((x) => x.endsWith('.js'))) {
    const script = await cache.match(a);
    if (!script) continue;
    const js = await script.text();
    const debut = js.indexOf('__vite__mapDeps');
    const liste = debut < 0 ? null : js.slice(debut).match(/\[([^\]]*)\]/);
    if (!liste) continue;
    const base = new URL(a, self.location.href);
    const morceaux = [...liste[1].matchAll(/"([^"]+\.(?:js|css))"/g)].map((m) => new URL(m[1], base).href);
    await Promise.all(morceaux.map((m) => cache.add(m).catch(() => undefined)));
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(RACINE).then(() => precacherActifs(c))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const requete = event.request;
  if (requete.method !== 'GET') return;
  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return; // hub, IA, fonts : réseau direct

  // Pages et actifs : réseau d'abord, cache en secours (hors-ligne).
  event.respondWith(
    fetch(requete)
      .then((reponse) => {
        if (reponse.ok && (requete.destination === 'document' || url.pathname.includes('/assets/'))) {
          const copie = reponse.clone();
          caches.open(VERSION).then((c) => c.put(requete, copie));
        }
        return reponse;
      })
      // Hors ligne : la page d'accueil en secours seulement pour une page, jamais à la place d'un script.
      .catch(() => caches.match(requete).then((hit) => hit ?? (requete.mode === 'navigate' ? caches.match('./') : Response.error()))),
  );
});
