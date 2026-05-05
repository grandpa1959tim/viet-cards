// VietCards Service Worker — minimal, only caches own-origin assets.
// Cross-origin fetches (Google Sheets, Anthropic API, etc.) are passed through directly.
const CACHE='vietcards-v3';
const ASSETS=['./','./index.html'];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){return c.addAll(ASSETS);})
  );
  self.skipWaiting();
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k!==CACHE)return caches.delete(k);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch',function(e){
  // CRITICAL: only handle same-origin GET requests. Let cross-origin
  // fetches (Google Sheets, Anthropic API, etc.) pass through to the network.
  var url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return;
  if(e.request.method!=='GET')return;
  // Network-first for same-origin (so updates to index.html are picked up).
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy=res.clone();
      caches.open(CACHE).then(function(c){c.put(e.request,copy);});
      return res;
    }).catch(function(){
      return caches.match(e.request);
    })
  );
});
