// src/offline/assets/sw.js
// Offline PWA + célzott cache-stratégiák + outbox (POST/PUT/PATCH/DELETE sor)

// const APP_SHELL_CACHE = "app-shell-v1";
// const ASSET_CACHE     = "asset-v1";
// const TPL_CACHE       = "templates-v1";   // /api/templates/:tab  → cache-first (ritkán változik)
// const INDEX_CACHE     = "index-v1";       // /api/surveys/index   → network-first (fallback cache)
// const SURVEY_CACHE    = "survey-v1";      // /api/surveys/:id ... → network-first (fallback cache)
// const RUNTIME_CACHE   = "runtime-v1";     // egyéb GET-ekre (network-first)

// const OUTBOX_DB       = "offline-outbox-db";
// const OUTBOX_STORE    = "requests";

// // ============ INSTALL / ACTIVATE ============
// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches.open(APP_SHELL_CACHE).then((cache) =>
//       cache.addAll(["/"]).catch(()=>{}) // SPA fallback
//     )
//   );
//   self.skipWaiting();
// });
// self.addEventListener("activate", (event) => {
//   event.waitUntil(self.clients.claim());
// });

// // ============ SEGÉDFÜGGVÉNYEK ============
// function sameOrigin(url) { return url.origin === self.location.origin; }

// const re = {
//   templates: /^\/api\/templates\/[^\/]+$/i,
//   index:     /^\/api\/surveys\/index$/i,
//   surveyById:/^\/api\/surveys\/[^\/]+$/i,
//   formsAll:  /^\/api\/surveys\/[^\/]+\/forms$/i,
//   formOne:   /^\/api\/surveys\/[^\/]+\/forms\/[^\/]+$/i,
//   answersOne:/^\/api\/surveys\/[^\/]+\/answers\/[^\/]+$/i,
//   static:    /^\/(assets|static|favicon\.ico|manifest\.webmanifest|sw\.js)/i
// };

// async function cacheFirst(request, cacheName) {
//   const cache = await caches.open(cacheName);
//   const cached = await cache.match(request);
//   if (cached) return cached;
//   const net = await fetch(request);
//   cache.put(request, net.clone());
//   return net;
// }

// async function staleWhileRevalidate(request, cacheName) {
//   const cache = await caches.open(cacheName);
//   const cachedPromise = cache.match(request);
//   const netPromise = fetch(request).then(resp => { cache.put(request, resp.clone()); return resp; }).catch(()=>null);

//   const cached = await cachedPromise;
//   if (cached) { netPromise.catch(()=>{}); return cached; }
//   const net = await netPromise;
//   if (net) return net;
//   // végső fallback
//   return caches.match("/") || new Response("Offline", { status: 503 });
// }

// async function networkFirst(request, cacheName) {
//   try {
//     const net = await fetch(request);
//     const cache = await caches.open(cacheName);
//     cache.put(request, net.clone());
//     return net;
//   } catch {
//     const cached = await caches.match(request);
//     if (cached) return cached;
//     return caches.match("/") || new Response("Offline", { status: 503 });
//   }
// }

// // ===== IndexedDB helper az outboxhoz =====
// function idb() {
//   return new Promise((resolve, reject) => {
//     const open = indexedDB.open(OUTBOX_DB, 1);
//     open.onupgradeneeded = () => open.result.createObjectStore(OUTBOX_STORE, { keyPath: "id" });
//     open.onsuccess = () => resolve(open.result);
//     open.onerror = () => reject(open.error);
//   });
// }
// async function outboxPut(rec){ const db=await idb(); return new Promise((res,rej)=>{ const tx=db.transaction(OUTBOX_STORE,"readwrite"); tx.objectStore(OUTBOX_STORE).put(rec); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); });}
// async function outboxAll(){ const db=await idb(); return new Promise((res,rej)=>{ const tx=db.transaction(OUTBOX_STORE,"readonly"); const rq=tx.objectStore(OUTBOX_STORE).getAll(); rq.onsuccess=()=>res(rq.result||[]); rq.onerror=()=>rej(rq.error); });}
// async function outboxDelete(id){ const db=await idb(); return new Promise((res,rej)=>{ const tx=db.transaction(OUTBOX_STORE,"readwrite"); tx.objectStore(OUTBOX_STORE).delete(id); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); });}
// function uuid(){ return (crypto.randomUUID && crypto.randomUUID()) || ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)); }

// // ============ FETCH KEZELŐ ============
// self.addEventListener("fetch", (event) => {
//   const req = event.request;
//   const url = new URL(req.url);
//   if (!sameOrigin(url)) return;

//   // Statikus assetek (ikonok, /assets, /static stb.) → cache-first
//   if (req.method === "GET" && re.static.test(url.pathname)) {
//     event.respondWith(cacheFirst(req, ASSET_CACHE));
//     return;
//   }

//   // API GET végpontok célzottan:
//   if (req.method === "GET" && url.pathname.startsWith("/api/")) {
//     // 1) /api/templates/:tab  → cache-first (ritkán változik, offline fontos)
//     if (re.templates.test(url.pathname)) {
//       event.respondWith(cacheFirst(req, TPL_CACHE));
//       return;
//     }

//     // 2) /api/surveys/index   → network-first (de offline fallback cache-ből)
//     if (re.index.test(url.pathname)) {
//       event.respondWith(networkFirst(req, INDEX_CACHE));
//       return;
//     }

//     // 3) /api/surveys/:id és rokon végpontok (forms, answers) → network-first (offline fallback)
//     if (re.surveyById.test(url.pathname) || re.formsAll.test(url.pathname) || re.formOne.test(url.pathname) || re.answersOne.test(url.pathname)) {
//       event.respondWith(networkFirst(req, SURVEY_CACHE));
//       return;
//     }

//     // Egyéb API GET → network-first alapértelmezés
//     event.respondWith(networkFirst(req, RUNTIME_CACHE));
//     return;
//   }

//   // Nem-API GET (SPA route-ok) → stale-while-revalidate az index.html-re és társaira
//   if (req.method === "GET") {
//     event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
//     return;
//   }

//   // Író műveletek (POST/PUT/PATCH/DELETE): outbox sor
//   if (["POST","PUT","PATCH","DELETE"].includes(req.method.toUpperCase())) {
//     event.respondWith(handleWrite(req));
//     return;
//   }
// });

// // ============ ÍRÓ MŰVELETEK: OUTBOX ============
// async function handleWrite(request) {
//   try {
//     // élő kísérlet
//     return await fetch(request.clone());
//   } catch {
//     // offline: sorba tesszük
//     const rc = request.clone();
//     const bodyBlob = await rc.blob();
//     const headers = {};
//     for (const [k, v] of rc.headers.entries()) headers[k] = v;

//     const rec = {
//       id: uuid(),
//       url: rc.url,
//       method: rc.method,
//       headers,
//       bodyType: bodyBlob.type || "application/json",
//       body: await blobToArrayBuffer(bodyBlob),
//       timestamp: Date.now()
//     };
//     await outboxPut(rec);

//     // Optimista válasz (a meglévő front logika nem akad el)
//     return new Response(JSON.stringify({ queued: true, id: rec.id }), {
//       status: 202,
//       headers: { "Content-Type": "application/json" }
//     });
//   }
// }

// function blobToArrayBuffer(blob) {
//   return new Promise((res, rej) => {
//     const fr = new FileReader();
//     fr.onload = () => res(fr.result);
//     fr.onerror = rej;
//     fr.readAsArrayBuffer(blob);
//   });
// }

// async function replayOutbox() {
//   const items = await outboxAll();
//   for (const it of items) {
//     try {
//       const hdrs = new Headers(it.headers || {});
//       // idempotencia előkészítése a szerverhez
//       if (!hdrs.has("X-Request-Id")) hdrs.set("X-Request-Id", it.id);

//       const resp = await fetch(it.url, {
//         method: it.method,
//         headers: hdrs,
//         body: it.method === "GET" || it.method === "HEAD" ? undefined : new Blob([it.body], { type: it.bodyType })
//       });
//       if (resp.ok) await outboxDelete(it.id);
//       // ha nem ok, marad a sorban
//     } catch {
//       // marad a sorban
//     }
//   }
// }

// // Online jelzés / időzítés
// self.addEventListener("message", (e) => {
//   if (e.data === "replay-outbox") replayOutbox();
// });
// setInterval(() => { replayOutbox(); }, 60 * 1000);

const APP_SHELL_CACHE = "app-shell-v2";
const ASSET_CACHE     = "asset-v1";
const TPL_CACHE       = "templates-v1";   // /api/templates/:tab  → cache-first
const INDEX_CACHE     = "index-v1";       // /api/surveys/index   → network-first (fallback cache)
const SURVEY_CACHE    = "survey-v1";      // /api/surveys/:id...  → network-first (fallback cache)
const RUNTIME_CACHE   = "runtime-v1";     // egyéb GET-ekre (network-first)

const OUTBOX_DB       = "offline-outbox-db";
const OUTBOX_STORE    = "requests";

const APP_SHELL = [
  "/",               // fontos: SPA root
  "/index.html",     // navigate → mindig ezt adjuk
  "/manifest.webmanifest",
  "/favicon.ico",
];

// ========= Install / Activate =========
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // töröljük a régi app-shell cache-eket, ha voltak
    const keep = new Set([APP_SHELL_CACHE, ASSET_CACHE, TPL_CACHE, INDEX_CACHE, SURVEY_CACHE, RUNTIME_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !keep.has(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// ========= Segédfüggvények =========
function sameOrigin(url) { return url.origin === self.location.origin; }

const re = {
  templates: /^\/api\/templates\/[^\/]+$/i,
  index:     /^\/api\/surveys\/index$/i,
  surveyById:/^\/api\/surveys\/[^\/]+$/i,
  formsAll:  /^\/api\/surveys\/[^\/]+\/forms$/i,
  formOne:   /^\/api\/surveys\/[^\/]+\/forms\/[^\/]+$/i,
  answersOne:/^\/api\/surveys\/[^\/]+\/answers\/[^\/]+$/i,
  static:    /^\/(assets|static|favicon\.ico|manifest\.webmanifest|sw\.js)/i
};

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const net = await fetch(request);
  cache.put(request, net.clone());
  return net;
}

async function networkFirst(request, cacheName) {
  try {
    const net = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, net.clone());
    return net;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // végső fallback: app shell
    return caches.match("/index.html") || new Response("Offline", { status: 503 });
  }
}

// SPA navigáció: mindig index.html (cache-first + háttérben frissítés)
async function appShellNavigate() {
  // stale-while-revalidate az index.html-re
  const req = new Request("/index.html", { cache: "reload" });
  const cache = await caches.open(APP_SHELL_CACHE);
  const cached = await cache.match(req);
  const netPromise = fetch(req).then(r => { cache.put(req, r.clone()); return r; }).catch(()=>null);
  if (cached) { netPromise.catch(()=>{}); return cached; }
  const net = await netPromise;
  return net || new Response("Offline", { status: 503 });
}

// ===== IndexedDB helper az outboxhoz =====
function idb() {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(OUTBOX_DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(OUTBOX_STORE, { keyPath: "id" });
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}
async function outboxPut(rec){ const db=await idb(); return new Promise((res,rej)=>{ const tx=db.transaction(OUTBOX_STORE,"readwrite"); tx.objectStore(OUTBOX_STORE).put(rec); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); });}
async function outboxAll(){ const db=await idb(); return new Promise((res,rej)=>{ const tx=db.transaction(OUTBOX_STORE,"readonly"); const rq=tx.objectStore(OUTBOX_STORE).getAll(); rq.onsuccess=()=>res(rq.result||[]); rq.onerror=()=>rej(rq.error); });}
async function outboxDelete(id){ const db=await idb(); return new Promise((res,rej)=>{ const tx=db.transaction(OUTBOX_STORE,"readwrite"); tx.objectStore(OUTBOX_STORE).delete(id); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); });}
function uuid(){
  if (self.crypto && typeof self.crypto.randomUUID === "function") return self.crypto.randomUUID();
  const rnd = (len)=>crypto.getRandomValues(new Uint8Array(len));
  const b = rnd(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = [...b].map(x=>x.toString(16).padStart(2,"0"));
  return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
}

function blobToArrayBuffer(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsArrayBuffer(blob);
  });
}

// =========== Fetch handler ===========
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (!sameOrigin(url)) return;

  // 0) SPA navigáció → mindig index.html app-shell
  if (req.mode === "navigate" && req.method === "GET") {
    event.respondWith(appShellNavigate());
    return;
  }

  // 1) Statikus assetek → cache-first
  if (req.method === "GET" && re.static.test(url.pathname)) {
    event.respondWith(cacheFirst(req, ASSET_CACHE));
    return;
  }

  // 2) API GET-ek célzottan
  if (req.method === "GET" && url.pathname.startsWith("/api/")) {
    if (re.templates.test(url.pathname)) {
      event.respondWith(cacheFirst(req, TPL_CACHE));
      return;
    }
    if (re.index.test(url.pathname)) {
      event.respondWith(networkFirst(req, INDEX_CACHE));
      return;
    }
    if (re.surveyById.test(url.pathname) || re.formsAll.test(url.pathname) || re.formOne.test(url.pathname) || re.answersOne.test(url.pathname)) {
      event.respondWith(networkFirst(req, SURVEY_CACHE));
      return;
    }
    event.respondWith(networkFirst(req, RUNTIME_CACHE));
    return;
  }

  // 3) Egyéb GET → network-first
  if (req.method === "GET") {
    event.respondWith(networkFirst(req, RUNTIME_CACHE));
    return;
  }

  // 4) Író műveletek (POST/PUT/PATCH/DELETE): outbox
  if (["POST","PUT","PATCH","DELETE"].includes(req.method.toUpperCase())) {
    event.respondWith(handleWrite(req));
    return;
  }
});

// ============ ÍRÓ MŰVELETEK: OUTBOX ============
async function handleWrite(request) {
  try {
    return await fetch(request.clone());
  } catch {
    const rc = request.clone();
    const bodyBlob = await rc.blob();
    const headers = {};
    for (const [k, v] of rc.headers.entries()) headers[k] = v;

    const rec = {
      id: uuid(),
      url: rc.url,
      method: rc.method,
      headers,
      bodyType: bodyBlob.type || "application/json",
      body: await blobToArrayBuffer(bodyBlob),
      timestamp: Date.now()
    };
    await outboxPut(rec);

    return new Response(JSON.stringify({ queued: true, id: rec.id }), {
      status: 202,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function replayOutbox() {
  const items = await outboxAll();
  for (const it of items) {
    try {
      const hdrs = new Headers(it.headers || {});
      if (!hdrs.has("X-Request-Id")) hdrs.set("X-Request-Id", it.id);

      const resp = await fetch(it.url, {
        method: it.method,
        headers: hdrs,
        body: it.method === "GET" || it.method === "HEAD" ? undefined : new Blob([it.body], { type: it.bodyType })
      });
      if (resp.ok) await outboxDelete(it.id);
    } catch {
      // marad a sorban
    }
  }
}

self.addEventListener("message", (e) => {
  if (e.data === "replay-outbox") replayOutbox();
});
setInterval(() => { replayOutbox(); }, 60 * 1000);