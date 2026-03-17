// // src/clientLock.ts
// const CLIENT_ID = (() => {
//   try {
//     const k = 'client_id';
//     const v = localStorage.getItem(k);
//     if (v) return v;
//     const id = crypto.randomUUID();
//     localStorage.setItem(k, id);
//     return id;
//   } catch {
//     return Math.random().toString(36).slice(2);
//   }
// })();

// function withTimeout<T>(p: Promise<T>, ms = 1500): Promise<T> {
//   return new Promise((resolve, reject) => {
//     const t = setTimeout(() => reject(new Error('timeout')), ms);
//     p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
//   });
// }

// export async function acquireLock(surveyId: string) {
//   // OFFLINE → fail-open
//   if (typeof navigator !== 'undefined' && navigator.onLine === false) {
//     return { offline: true };
//   }
//   try {
//     const r = await withTimeout(fetch(`/api/surveys/${encodeURIComponent(surveyId)}/lock`, {
//       method: 'POST',
//       headers: { 'X-Client-Id': CLIENT_ID, 'Cache-Control': 'no-store' },
//       credentials: 'same-origin',
//     }));
//     if (r.status === 423) {
//       const body = await r.json().catch(() => ({}));
//       const until = body?.expiresAt ? ` (lejár: ${new Date(body.expiresAt).toLocaleTimeString()})` : '';
//       throw new Error('A felmérés már foglalt.' + until);
//     }
//     // hálózati válasz OK → mehet
//     if (!r.ok) throw new Error('lock fetch failed');
//     return r.json().catch(() => ({}));
//   } catch {
//     // timeout / hálózati hiba → fail-open
//     return { offline: true };
//   }
// }

// export async function releaseLock(surveyId: string) {
//   // Ha offline, ne próbálkozzunk – nem kell outbox-ba se kerüljön.
//   if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
//   try {
//     await withTimeout(fetch(`/api/surveys/${encodeURIComponent(surveyId)}/lock`, {
//       method: 'DELETE',
//       headers: { 'X-Client-Id': CLIENT_ID, 'Cache-Control': 'no-store' },
//       credentials: 'same-origin',
//     }), 1500);
//   } catch {
//     // lenyeljük – ne zavarja a usert
//   }
// }

// export async function fetchLocks(): Promise<Record<string, { lockedBy: string; expiresAt: string }>> {
//   // offline → jelentsünk üreset (ne tiltsunk tévesen)
//   if (typeof navigator !== 'undefined' && navigator.onLine === false) return {};
//   try {
//     const r = await withTimeout(fetch('/api/surveys/locks', {
//       headers: { 'Cache-Control': 'no-store' },
//       credentials: 'same-origin',
//     }), 1500);
//     if (!r.ok) return {};
//     return (await r.json()) || {};
//   } catch {
//     return {};
//   }
// }

// clientLock.ts
const CID_KEY = 'client_id';
function getClientId(): string {
  let id = localStorage.getItem(CID_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(CID_KEY, id); }
  return id;
}

export async function acquireLock(surveyId: string) {
  const r = await fetch(`/api/surveys/${encodeURIComponent(surveyId)}/lock`, {
    method: 'POST',
    headers: { 'X-Client-Id': getClientId() },
    credentials: 'same-origin'
  });
  if (r.status === 423) {
    const j = await r.json().catch(()=>({}));
    throw new Error('Foglalt: ' + (j?.lockedBy || 'ismeretlen kliens'));
  }
  if (!r.ok) throw new Error('Lock hiba ('+r.status+')');
}

export async function releaseLock(surveyId: string) {
  await fetch(`/api/surveys/${encodeURIComponent(surveyId)}/lock`, {
    method: 'DELETE',
    headers: { 'X-Client-Id': getClientId() },
    credentials: 'same-origin'
  }).catch(()=>{});
}

function withTimeout<T>(p: Promise<T>, ms = 1500): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

// Safe UUID v4 (browser + régi környezet kompatibilis)
export function genId(): string {
  // modern
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
    try { return (crypto as any).randomUUID(); } catch {}
  }
  // web crypto
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
    return `${h.substr(0,8)}-${h.substr(8,4)}-${h.substr(12,4)}-${h.substr(16,4)}-${h.substr(20)}`;
  }
  // legvégső fallback
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export async function fetchLocks(): Promise<Record<string, { id: string; owner: string; expiresAt: string }>> {
  try {
    const r = await fetch('/api/surveys/locks', { credentials: 'same-origin' });
    if (!r.ok) return {};         // ha 404, itt üres lesz → nem tiltjuk a nyitást
    return await r.json();
  } catch {
    return {};                    // offline/hiba esetén NE blokkoljunk
  }
}

