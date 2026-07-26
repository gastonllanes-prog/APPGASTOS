// Caja · service worker mínimo (shell cache-first, red para datos)
const CACHE='caja-v0.3';
const SHELL=['./app.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  // Nunca cachear Supabase ni CDNs de datos: siempre red
  if(u.hostname.endsWith('supabase.co')||u.hostname.includes('jsdelivr')){return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
