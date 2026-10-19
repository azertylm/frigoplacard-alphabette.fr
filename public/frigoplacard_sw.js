/**
 * frigoplacard_sw.js — service worker minimal de Frigo-Placard.
 *
 * Stratégie conservatrice : uniquement l'app-shell (pages) en cache, pour le
 * mode hors-ligne. Aucune requête vers le hub ou vers l'IA n'est interceptée :
 * elles passent toujours par le réseau réel.
 */
const VERSION = 'frigoplacard-v1';
const RACINE = ['/', '/manifest.json', '/frigoplacard-icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(RACINE)).then(() => self.skipWaiting()));
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
        if (reponse.ok && (requete.destination === 'document' || url.pathname.startsWith('/assets/'))) {
          const copie = reponse.clone();
          caches.open(VERSION).then((c) => c.put(requete, copie));
        }
        return reponse;
      })
      .catch(() => caches.match(requete).then((hit) => hit ?? caches.match('/'))),
  );
});
