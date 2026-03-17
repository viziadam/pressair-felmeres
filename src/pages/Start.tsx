

//!

import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listSurveys, createSurvey, deleteSurvey,
  setActiveSurveyId, loadGlobals, saveGlobals, refreshIndex, saveSurveyLocal, 
  type SurveySummary
} from '../storage'

import { fetchLocks, acquireLock } from '../storage/clientLock'; // <- új import

import { Globals, EMPTY } from '../types';

// type Globals = {
//   companyName: string
//   site: string
//   phone: string
//   email: string
//   logoDataUrl?: string
// }


// const EMPTY: Globals = { companyName:'', site:'', phone:'', email:'' }

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

export default function Start() {
  const nav = useNavigate()
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState<SurveySummary[]>([])
  const [g, setG] = useState<Globals>(EMPTY)

  const [locks, setLocks] = useState<Record<string, {id: string; owner: string; expiresAt: string}>>({});

  const fileRef = useRef<HTMLInputElement>(null);

  // useEffect(() => {
  //   //console.log("Mounted the start component: ", listSurveys());
  //   let dead = false;
  //   (async () => {
  //   const idx = await refreshIndex();     // ← ez most tényleg a szervert hívja és visszaadja a kész listát
  //   if (!dead) setItems(idx);             // saját state-be írd
  // })();
  // return () => { dead = true; };
  //   setG(loadGlobals() as Globals)
  // }, [])

  // Start.tsx
useEffect(() => {
  let dead = false;

  (async () => {
    const idx = await refreshIndex();     // szerverről friss lista
    if (dead) return;

    // setItems(idx);

    (async () => {
    const idx = await refreshIndex();
    if (!dead) setItems(idx);
    const m = await fetchLocks();
    if (!dead) setLocks(m);
  })();

    // 2) Minden survey-t cache-eljünk le lokálba
    for (const it of idx) {
      try {
        const r = await fetch(`/api/surveys/${encodeURIComponent(it.id)}`, { credentials: 'same-origin' });
        if (!r.ok) continue;
        const full = await r.json();
        // IMPORTANT: tisztán lokális mentés, nincs POST
        saveSurveyLocal(it.id, full);
      } catch {}
    }
  })();

  setG(loadGlobals() as Globals);
  return () => { dead = true; };
}, []);


  function refresh() {
    setItems(listSurveys())
  }

  async function onDelete(id: string) {
    const ok = confirm('Biztosan törlöd az adott felmérést? A művelet nem vonható vissza.')
    if (!ok) return
    deleteSurvey(id)
    refresh()
  }

  function onEdit(id: string) {
    setActiveSurveyId(id)
    nav('/builder')
  }

  // function onWork(id: string) {
  //   setActiveSurveyId(id)
  //   nav('/surveys')
  // }

  async function onWork(id: string) {
//   try {
//     await acquireLock(id);         // ← itt próbálunk lockolni
//     setActiveSurveyId(id);
//     nav('/surveys');
//   } catch (e:any) {
//     alert(e?.message || 'A felmérés foglalt.');
//   }
// }
const locks = await fetchLocks();
  const cur = locks[id];
  if (cur && new Date(cur.expiresAt).getTime() > Date.now()) {
    alert('Ezt a felmérést épp más szerkeszti. Próbáld később.');
    return;
  }

  // 2) próbálj lockolni (owner legyen stabil böngésző-azonosító)
  const owner = localStorage.getItem('__client_owner__') || (localStorage.setItem('__client_owner__', genId()), localStorage.getItem('__client_owner__')!);
  try {
    const rr = await fetch(`/api/surveys/${encodeURIComponent(id)}/lock`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ owner, ttlSec: 60 })
    });
    if (rr.status === 423) {
      alert('Ezt a felmérést épp más szerkeszti. Próbáld később.');
      return;
    }
    // sikerült (vagy a szerver nem tud lockolni → rr.ok false/404 esetén is engedjük)
  } catch {
    // offline/hiba esetén engedjük (ahogy kértél)
  }

  setActiveSurveyId(id);
  nav('/surveys');
}

  function onNew() {
  const name = g.companyName.trim()
  if (!name) {
    alert('Adj meg legalább egy cégnév mezőt az új felmérés létrehozásához.')
    return
  }

  const norm = (s: string) => s.trim().toLowerCase()
  const exists = items.some(it => norm(it.companyName) === norm(name))

  if (exists) {
    setOpen(true) // nyissuk ki a listát, hogy lássa a meglévőt
    alert('Ehhez a céghez már létezik felmérés. Szerkeszd a meglévőt vagy töröld ki a listából.')
    return
  }

  try {
  const s = createSurvey(g)
  nav('/surveys')
} catch (e: any) {
  if (String(e?.message) === 'DUPLICATE_COMPANY_NAME') {
    setOpen(true)
    alert('Ehhez a céghez már létezik felmérés. Szerkeszd a meglévőt vagy töröld ki a listából.')
  } else {
    alert('Nem sikerült létrehozni a felmérést.')
  }
}
}

  function onSaveGlobals() {
  try {
    saveGlobals(g)
    alert('Globális adatok elmentve.')
  } catch (e: any) {
    if (String(e?.message) === 'DUPLICATE_COMPANY_NAME') {
      alert('Már létezik felmérés ezzel a cégnévvel. Szerkeszd a meglévőt vagy töröld ki, mielőtt átneveznéd.')
    } else {
      alert('Mentési hiba történt.')
    }
  }
}
  const grouped = useMemo(() => {
    const map = new Map<string, SurveySummary[]>()
    for (const it of items) {
      const k = it.companyName || 'Névtelen cég'
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(it)
    }
    return Array.from(map.entries()).map(([company, list]) => ({
      company, list: list.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))
    }))
  }, [items])

  // Start.tsx belsejébe – a többi kódod mellé

// --- IMPORT HANDLER (JSON → localStorage → aktív + /surveys)
  function readAsText(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = rej;
      r.readAsText(file, 'utf-8');
    });
  }

  async function importSurveys(files: FileList | null) {
    if (!files || files.length === 0) return;

    let firstImportedId: string | null = null;

    for (const f of Array.from(files)) {
      try {
        const raw = await readAsText(f);
        const parsed = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed : [parsed];

        for (const s of arr) {
          // minimális normalizálás: legyen id
          if (!s.id) s.id = crypto.randomUUID();
          // lokális mentés (index frissül, mint a saveSurvey-ben)
          saveSurveyLocal(s.id, s);
          if (!firstImportedId) firstImportedId = s.id;
        }
      } catch {
        // csendben tovább — cél az egyszerű, “mint a szerver” élmény
      }
    }

    // UI frissítés
    setItems(listSurveys());

    // első importáltat megnyitjuk munkára
    if (firstImportedId) {
      setActiveSurveyId(firstImportedId);
      nav('/surveys');
    }

    // ugyanazt a fájlt újra lehessen kiválasztani
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="page">
      <h1>Kezdőlap</h1>

      <div className="card">
        <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
          <strong>Elmentett felmérések</strong>
          <button className="btn" onClick={()=>setOpen(o=>!o)}>{open ? 'Bezár' : 'Megnyit'}</button>
        </div>

        {open && (
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              marginTop: 10,
              maxHeight: 260,
              overflowY: 'auto',
              padding: 8
            }}
          >
            {grouped.length === 0 && <div className="muted">Nincs elmentett felmérés.</div>}

            {grouped.map(group => (
              <div key={group.company} style={{marginBottom:12}}>
                <div style={{fontWeight:600, marginBottom:6}}>{group.company}</div>
                {group.list.map(it => (
                  <div
                    key={it.id}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'8px 10px', border:'1px solid #eee', borderRadius:8, marginBottom:6
                    }}
                  >
                    <div>
                      <div style={{fontWeight:500}}>#{it.id.slice(0,8)} • űrlapok: {it.formCount}</div>
                      <div className="small muted">Módosítva: {new Date(it.updatedAt).toLocaleString()}</div>
                    </div>
                    <div style={{display:'flex', gap:8}}>
                      <button className="btn" onClick={()=>onWork(it.id)}>Szerkesztés</button>
                      {/* <button className="btn" onClick={()=>onEdit(it.id)}>Szerkesztés</button> */}
                      <button className="btn danger" onClick={()=>onDelete(it.id)}>Törlés</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <strong>Új felmérés – globális adatok</strong>

        {/* / Új felmérés – globális adatok blokkban: a mezők kibővítése */}
<div className="grid" style={{marginTop:10}}>
  <div>
    <label>Cégnév</label>
    <input className="input" value={g.companyName}
      onChange={e=>setG({...g, companyName:e.target.value})} />
  </div>
  <div>
    <label>Telephely címe</label>
    <input className="input" value={g.site}
      onChange={e=>setG({...g, site:e.target.value})} />
  </div>
  <div>
    <label>Kapcsolattartó neve</label>
    <input className="input" value={g.contactName}
      onChange={e=>setG({...g, contactName:e.target.value})} />
  </div>
  <div>
    <label>Kapcsolattartó beosztása</label>
    <input className="input" value={g.contactTitle}
      onChange={e=>setG({...g, contactTitle:e.target.value})} />
  </div>
  <div>
    <label>Telefonszám</label>
    <input className="input" value={g.phone}
      onChange={e=>setG({...g, phone:e.target.value})} />
  </div>
  <div>
    <label>Email cím</label>
    <input className="input" value={g.email}
      onChange={e=>setG({...g, email:e.target.value})} />
  </div>
  <div>
    <label>Dátum</label>
    <input type="date" className="input" value={g.date}
      onChange={e=>setG({...g, date:e.target.value})} />
  </div>
  <div>
    <label>Felmérést végző személy neve</label>
    <input className="input" value={g.inspectorName}
      onChange={e=>setG({...g, inspectorName:e.target.value})} />
  </div>
</div>

        <div className="toolbar" style={{marginTop:10}}>
          <button className="btn" onClick={()=>setG(EMPTY)}>Űrlap ürítése</button>
          {/* <button className="btn" onClick={onSaveGlobals}>Globális adatok mentése</button> */}
          <button
              className="btn"
              onClick={() => fileRef.current?.click()}
            >
            Survey-k importálása (.json)
          </button>
          <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
              importSurveys(e.target.files);
              // hogy ugyanazzal a fájllal újra lehessen importálni:
              e.currentTarget.value = '';
              }}
            />
          <button className="btn success" onClick={onNew}>Új felmérés (→ Munka)</button>
        </div>
      </div>
    </div>
  )
}