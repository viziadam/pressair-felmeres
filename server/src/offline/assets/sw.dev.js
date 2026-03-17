// sw.dev.js  (FEJLESZTŐI SERVICE WORKER)
// Cél: DEV módban is legyen offline az API-kra és az outbox működjön,
// de SOHA ne cache-eljük a Vite dev asseteket és az index.html-t,
// hogy ne keveredjen a bundle és ne dőljön el a Router.

const INDEX_CACHE   = "dev-index-v1";
const SURVEY_CACHE  = "dev-survey-v1";
const RUNTIME_CACHE = "dev-runtime-v1";

const OUTBOX_DB     = "offline-outbox-db";
const OUTBOX_STORE  = "requests";

self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });

function sameOrigin(u){ return u.origin === self.location.origin; }

const re = {
  // Vite dev saját pathjai – ezeket SOHA ne cache-eld!
  vite: /^\/(@vite|@react-refresh|src\/|node_modules\/|__vite_ping)/i,
  // SPA navigáció – dev-ben mindig hálózatról kérjük
  html: (req,url) => req.mode === "navigate" || (req.destination === "document" && url.pathname === "/"),
  // API végpontok
  index:     /^\/api\/surveys\/index$/i,
  surveyById:/^\/api\/surveys\/[^\/]+$/i,
  formsAll:  /^\/api\/surveys\/[^\/]+\/forms$/i,
  formOne:   /^\/api\/surveys\/[^\/]+\/forms\/[^\/]+$/i,
  answersOne:/^\/api\/surveys\/[^\/]+\/answers\/[^\/]+$/i,
};

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (!sameOrigin(url)) return;

  // 1) Navigáció és HTML: DEV-BEN MINDIG HÁLÓZATRÓL
  if (re.html(req,url)) {
    event.respondWith(fetch(req));
    return;
  }

  // 2) Vite dev assetek: SOHA ne cache-eld (mindig hálózat)
  if (re.vite.test(url.pathname)) {
    event.respondWith(fetch(req));
    return;
  }

  // 3) API GET: network-first + cache fallback (offline támogatás)
  if (req.method === "GET" && url.pathname.startsWith("/api/")) {
    const cacheName =
      re.index.test(url.pathname) || re.surveyById.test(url.pathname) ||
      re.formsAll.test(url.pathname) || re.formOne.test(url.pathname) || re.answersOne.test(url.pathname)
        ? SURVEY_CACHE : INDEX_CACHE;

    event.respondWith(networkFirst(req, cacheName));
    return;
  }

  // 4) Egyéb GET: network-first (képek stb. kerülhetnek cache-be)
  if (req.method === "GET") {
    event.respondWith(networkFirst(req, RUNTIME_CACHE));
    return;
  }

  // 5) Író műveletek (POST/PUT/PATCH/DELETE): outbox sor
  if (["POST","PUT","PATCH","DELETE"].includes(req.method.toUpperCase())) {
    event.respondWith(handleWrite(req));
    return;
  }
});

async function networkFirst(request, cacheName) {
  try {
    const net = await fetch(request, { cache: "no-store" }); // dev: ne támaszkodjunk böngésző HTTP cache-re sem
    const cache = await caches.open(cacheName);
    cache.put(request, net.clone());
    return net;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response("Offline (DEV)", { status: 503 });
  }
}

// ===== IndexedDB outbox =====
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
function uuid(){ return (crypto.randomUUID && crypto.randomUUID()) || ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)); }

async function handleWrite(request) {
  try {
    return await fetch(request.clone());
  } catch {
    const rc = request.clone();
    const bodyBlob = await rc.blob();
    const headers = {};
    for (const [k,v] of rc.headers.entries()) headers[k]=v;
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
      status: 202, headers: { "Content-Type": "application/json" }
    });
  }
}
function blobToArrayBuffer(blob){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsArrayBuffer(blob); });}
async function replayOutbox() {
  const items = await outboxAll();
  for (const it of items) {
    try {
      const hdrs = new Headers(it.headers || {});
      if (!hdrs.has("X-Request-Id")) hdrs.set("X-Request-Id", it.id);
      const resp = await fetch(it.url, {
        method: it.method,
        headers: hdrs,
        body: it.method==="GET"||it.method==="HEAD" ? undefined : new Blob([it.body], { type: it.bodyType })
      });
      if (resp.ok) await outboxDelete(it.id);
    } catch {}
  }
}
self.addEventListener("message", (e) => { if (e.data === "replay-outbox") replayOutbox(); });
setInterval(()=>{ replayOutbox(); }, 60*1000);

