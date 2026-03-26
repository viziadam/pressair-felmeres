

// import { useEffect, useMemo, useState, useRef } from 'react'
// import { useNavigate } from 'react-router-dom'
// import {
//   listSurveys, createSurvey, deleteSurvey,
//   setActiveSurveyId, loadGlobals, saveGlobals, refreshIndex, saveSurveyLocal, 
//   type SurveySummary
// } from '../storage'

// import { fetchLocks, acquireLock } from '../storage/clientLock';
// import { Globals, EMPTY } from '../types';

// export function genId(): string {
//   if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) { try { return (crypto as any).randomUUID(); } catch {} }
//   if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
//     const b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
//     const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
//     return `${h.substr(0,8)}-${h.substr(8,4)}-${h.substr(12,4)}-${h.substr(16,4)}-${h.substr(20)}`;
//   }
//   return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
// }

// // --- DESIGN RENDSZER ---
// const formDesign = {
//   card: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
//   btnSecondary: { backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
//   btnDanger: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
//   btnPrimary: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
//   btnOutlinePrimary: { backgroundColor: 'transparent', color: '#2563eb', border: '1px solid #2563eb', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
//   label: { display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px' },
//   input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: 'inherit', backgroundColor: '#fff', color: '#111827' },
//   fieldGroup: { marginBottom: '16px' },
// };

// export default function Start() {
//   const nav = useNavigate()
//   const [open, setOpen] = useState(true);
//   const [items, setItems] = useState<SurveySummary[]>([])
//   const [g, setG] = useState<Globals>(EMPTY)
//   const [locks, setLocks] = useState<Record<string, {id: string; owner: string; expiresAt: string}>>({});
//   const fileRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     let dead = false;
//     (async () => {
//       const idx = await refreshIndex();
//       if (dead) return;

//       (async () => {
//         const idx = await refreshIndex();
//         if (!dead) setItems(idx);
//         const m = await fetchLocks();
//         if (!dead) setLocks(m);
//       })();

//       for (const it of idx) {
//         try {
//           const r = await fetch(`/api/surveys/${encodeURIComponent(it.id)}`, { credentials: 'same-origin' });
//           if (!r.ok) continue;
//           const full = await r.json();
//           saveSurveyLocal(it.id, full);
//         } catch {}
//       }
//     })();
//     setG(loadGlobals() as Globals);
//     return () => { dead = true; };
//   }, []);

//   function refresh() { setItems(listSurveys()) }

//   async function onDelete(id: string) {
//     const ok = confirm('Biztosan törlöd az adott felmérést? A művelet nem vonható vissza.')
//     if (!ok) return
//     deleteSurvey(id)
//     refresh()
//   }

//   async function onWork(id: string) {
//     const locks = await fetchLocks();
//     const cur = locks[id];
//     if (cur && new Date(cur.expiresAt).getTime() > Date.now()) {
//       alert('Ezt a felmérést épp más szerkeszti. Próbáld később.');
//       return;
//     }
//     const owner = localStorage.getItem('__client_owner__') || (localStorage.setItem('__client_owner__', genId()), localStorage.getItem('__client_owner__')!);
//     try {
//       const rr = await fetch(`/api/surveys/${encodeURIComponent(id)}/lock`, {
//         method: 'POST', headers: { 'Content-Type':'application/json' }, credentials: 'same-origin', body: JSON.stringify({ owner, ttlSec: 60 })
//       });
//       if (rr.status === 423) { alert('Ezt a felmérést épp más szerkeszti. Próbáld később.'); return; }
//     } catch {}

//     setActiveSurveyId(id);
//     nav('/surveys');
//   }

//   function onNew() {
//     const name = g.companyName.trim()
//     if (!name) { alert('Adj meg legalább egy cégnév mezőt az új felmérés létrehozásához.'); return; }
//     const norm = (s: string) => s.trim().toLowerCase()
//     const exists = items.some(it => norm(it.companyName) === norm(name))
//     if (exists) { setOpen(true); alert('Ehhez a céghez már létezik felmérés. Szerkeszd a meglévőt vagy töröld ki a listából.'); return; }

//     try {
//       const s = createSurvey(g)
//       nav('/surveys')
//     } catch (e: any) {
//       if (String(e?.message) === 'DUPLICATE_COMPANY_NAME') {
//         setOpen(true); alert('Ehhez a céghez már létezik felmérés. Szerkeszd a meglévőt vagy töröld ki a listából.')
//       } else { alert('Nem sikerült létrehozni a felmérést.') }
//     }
//   }

//   const grouped = useMemo(() => {
//     const map = new Map<string, SurveySummary[]>()
//     for (const it of items) {
//       const k = it.companyName || 'Névtelen cég'
//       if (!map.has(k)) map.set(k, [])
//       map.get(k)!.push(it)
//     }
//     return Array.from(map.entries()).map(([company, list]) => ({
//       company, list: list.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))
//     }))
//   }, [items])

//   function readAsText(file: File): Promise<string> {
//     return new Promise((res, rej) => {
//       const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsText(file, 'utf-8');
//     });
//   }

//   async function importSurveys(files: FileList | null) {
//     if (!files || files.length === 0) return;
//     let firstImportedId: string | null = null;
//     for (const f of Array.from(files)) {
//       try {
//         const raw = await readAsText(f); const parsed = JSON.parse(raw); const arr = Array.isArray(parsed) ? parsed : [parsed];
//         for (const s of arr) { if (!s.id) s.id = crypto.randomUUID(); saveSurveyLocal(s.id, s); if (!firstImportedId) firstImportedId = s.id; }
//       } catch {}
//     }
//     setItems(listSurveys());
//     if (firstImportedId) { setActiveSurveyId(firstImportedId); nav('/surveys'); }
//     if (fileRef.current) fileRef.current.value = '';
//   }

//   return (
//     <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
//       <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Kezdőlap</h1>

//       <div style={formDesign.card}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: open ? '16px' : '0' }}>
//           <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Elmentett felmérések</h2>
//           <button style={formDesign.btnSecondary} onClick={()=>setOpen(o=>!o)}>{open ? 'Visszacsuk' : 'Megnyitás'}</button>
//         </div>

//         {open && (
//           <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
//             {grouped.length === 0 && <div style={{ color: '#6b7280', fontStyle: 'italic', padding: '12px 0' }}>Nincs elmentett felmérés a rendszerben.</div>}

//             {grouped.map(group => (
//               <div key={group.company} style={{ marginBottom: '20px' }}>
//                 <div style={{ fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #e5e7eb' }}>
//                   {group.company}
//                 </div>
//                 {group.list.map(it => (
//                   <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '8px', backgroundColor: '#f9fafb' }}>
//                     <div>
//                       <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>#{it.id.slice(0,8)} <span style={{ color: '#6b7280', fontWeight: 400, marginLeft: '8px' }}>({it.formCount} űrlap)</span></div>
//                       <div style={{ fontSize: '12px', color: '#6b7280' }}>Módosítva: {new Date(it.updatedAt).toLocaleString('hu-HU')}</div>
//                     </div>
//                     <div style={{ display:'flex', gap: '8px' }}>
//                       <button style={formDesign.btnPrimary} onClick={()=>onWork(it.id)}>Szerkesztés</button>
//                       <button style={formDesign.btnDanger} onClick={()=>onDelete(it.id)}>Törlés</button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <div style={formDesign.card}>
//         <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Új felmérés – Globális adatok</h2>

//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
//           <div>
//             <label style={formDesign.label}>Cégnév</label>
//             <input style={formDesign.input} value={g.companyName} onChange={e=>setG({...g, companyName:e.target.value})} placeholder="Kovács Kft." />
//           </div>
//           <div>
//             <label style={formDesign.label}>Telephely címe</label>
//             <input style={formDesign.input} value={g.site} onChange={e=>setG({...g, site:e.target.value})} placeholder="Budapest, Ipari park 1." />
//           </div>
//           <div>
//             <label style={formDesign.label}>Kapcsolattartó neve</label>
//             <input style={formDesign.input} value={g.contactName} onChange={e=>setG({...g, contactName:e.target.value})} placeholder="Kovács István" />
//           </div>
//           <div>
//             <label style={formDesign.label}>Kapcsolattartó beosztása</label>
//             <input style={formDesign.input} value={g.contactTitle} onChange={e=>setG({...g, contactTitle:e.target.value})} placeholder="Üzemvezető" />
//           </div>
//           <div>
//             <label style={formDesign.label}>Telefonszám</label>
//             <input style={formDesign.input} value={g.phone} onChange={e=>setG({...g, phone:e.target.value})} placeholder="+36 30 123 4567" />
//           </div>
//           <div>
//             <label style={formDesign.label}>Email cím</label>
//             <input style={formDesign.input} type="email" value={g.email} onChange={e=>setG({...g, email:e.target.value})} placeholder="kovacs@kft.hu" />
//           </div>
//           <div>
//             <label style={formDesign.label}>Dátum</label>
//             <input type="date" style={formDesign.input} value={g.date} onChange={e=>setG({...g, date:e.target.value})} />
//           </div>
//           <div>
//             <label style={formDesign.label}>Felmérést végző személy neve</label>
//             <input style={formDesign.input} value={g.inspectorName} onChange={e=>setG({...g, inspectorName:e.target.value})} placeholder="Saját neved" />
//           </div>
//         </div>

//         <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
//           <button style={formDesign.btnSecondary} onClick={()=>setG(EMPTY)}>Űrlap ürítése</button>
          
//           <button style={formDesign.btnOutlinePrimary} onClick={() => fileRef.current?.click()}>Survey importálása (.json)</button>
//           <input ref={fileRef} type="file" accept=".json,application/json" multiple style={{ display: 'none' }} onChange={(e) => { importSurveys(e.target.files); e.currentTarget.value = ''; }} />
          
//           <div style={{ flex: 1 }}></div>
//           <button style={{...formDesign.btnPrimary, backgroundColor: '#10b981'}} onClick={onNew}>Új felmérés indítása</button>
//         </div>
//       </div>
//     </div>
//   )
// }

// import { useEffect, useMemo, useState, useRef } from 'react'
// import { useNavigate } from 'react-router-dom'
// import {
//   listSurveys, createSurvey, deleteSurvey,
//   setActiveSurveyId, refreshIndex, saveSurveyLocal, 
//   saveAll,
//   type SurveySummary
// } from '../storage'

// import { fetchLocks } from '../storage/clientLock';
// import { Globals, EMPTY } from '../types';

// export function genId(): string {
//   if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) { try { return (crypto as any).randomUUID(); } catch {} }
//   if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
//     const b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
//     const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
//     return `${h.substr(0,8)}-${h.substr(8,4)}-${h.substr(12,4)}-${h.substr(16,4)}-${h.substr(20)}`;
//   }
//   return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
// }

// // --- DESIGN RENDSZER ---
// const formDesign = {
//   card: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
//   btnSecondary: { backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
//   btnDanger: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
//   btnPrimary: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
//   btnOutlinePrimary: { backgroundColor: 'transparent', color: '#2563eb', border: '1px solid #2563eb', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
//   label: { display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px' },
//   input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: 'inherit', backgroundColor: '#fff', color: '#111827' },
//   fieldGroup: { marginBottom: '16px' },
// };

// export default function Start() {
//   const nav = useNavigate()
//   const [open, setOpen] = useState(true);
//   const [items, setItems] = useState<SurveySummary[]>([])
//   const [g, setG] = useState<Globals>(EMPTY)
//   const [locks, setLocks] = useState<Record<string, {id: string; owner: string; expiresAt: string}>>({});
//   const fileRef = useRef<HTMLInputElement>(null);

//   // 1. Golyóálló, tiszta inicializálás (Nincs agresszív háttérletöltés!)
//   useEffect(() => {
//     let dead = false;
    
//     async function init() {
//       try {
//         // Csak a listát (indexet) kérjük le, hogy tudjuk, mik léteznek
//         const idx = await refreshIndex();
//         if (!dead) setItems(idx);

//         // Lekérjük a zárolásokat
//         const m = await fetchLocks();
//         if (!dead) setLocks(m);
//       } catch (e) {
//         console.error("Hiba az inicializáláskor:", e);
//       }
//     }

//     init();
    
//     // Minden alkalommal tiszta lappal (üres űrlappal) indul a kezdőlap
//     setG(EMPTY);
    
//     return () => { dead = true; };
//   }, []);

//   function refresh() { setItems(listSurveys()) }

//   async function onDelete(id: string) {
//     const ok = confirm('Biztosan törlöd az adott felmérést? A művelet nem vonható vissza.')
//     if (!ok) return
//     deleteSurvey(id)
//     refresh()
//   }

//   async function onWork(id: string) {
//     const locks = await fetchLocks();
//     const cur = locks[id];
//     if (cur && new Date(cur.expiresAt).getTime() > Date.now()) {
//       alert('Ezt a felmérést épp más szerkeszti. Próbáld később.');
//       return;
//     }
//     const owner = localStorage.getItem('__client_owner__') || (localStorage.setItem('__client_owner__', genId()), localStorage.getItem('__client_owner__')!);
//     try {
//       const rr = await fetch(`/api/surveys/${encodeURIComponent(id)}/lock`, {
//         method: 'POST', headers: { 'Content-Type':'application/json' }, credentials: 'same-origin', body: JSON.stringify({ owner, ttlSec: 60 })
//       });
//       if (rr.status === 423) { alert('Ezt a felmérést épp más szerkeszti. Próbáld később.'); return; }
//     } catch {}

//     setActiveSurveyId(id);
//     nav('/surveys');
//   }

//   function onNew() {
//     const name = g.companyName.trim()
//     if (!name) { alert('Adj meg legalább egy cégnév mezőt az új felmérés létrehozásához.'); return; }
//     const norm = (s: string) => s.trim().toLowerCase()
//     const exists = items.some(it => norm(it.companyName) === norm(name))
//     if (exists) { setOpen(true); alert('Ehhez a céghez már létezik felmérés. Szerkeszd a meglévőt vagy töröld ki a listából.'); return; }

//     try {
//       // 2. Létrehozás és azonnali ürítés
//       createSurvey(g)
//       setG(EMPTY) // Kiürítjük a memóriát, hogy véletlenül se ragadjon be
//       nav('/surveys')
//     } catch (e: any) {
//       if (String(e?.message) === 'DUPLICATE_COMPANY_NAME') {
//         setOpen(true); alert('Ehhez a céghez már létezik felmérés. Szerkeszd a meglévőt vagy töröld ki a listából.')
//       } else { alert('Nem sikerült létrehozni a felmérést.') }
//     }
//   }

//   const grouped = useMemo(() => {
//     const map = new Map<string, SurveySummary[]>()
//     for (const it of items) {
//       const k = it.companyName || 'Névtelen cég'
//       if (!map.has(k)) map.set(k, [])
//       map.get(k)!.push(it)
//     }
//     return Array.from(map.entries()).map(([company, list]) => ({
//       company, list: list.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))
//     }))
//   }, [items])

//   function readAsText(file: File): Promise<string> {
//     return new Promise((res, rej) => {
//       const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsText(file, 'utf-8');
//     });
//   }

//   // async function importSurveys(files: FileList | null) {
//   //   if (!files || files.length === 0) return;
//   //   let firstImportedId: string | null = null;
//   //   for (const f of Array.from(files)) {
//   //     try {
//   //       const raw = await readAsText(f); const parsed = JSON.parse(raw); const arr = Array.isArray(parsed) ? parsed : [parsed];
//   //       for (const s of arr) { if (!s.id) s.id = crypto.randomUUID(); saveSurveyLocal(s.id, s); if (!firstImportedId) firstImportedId = s.id; }
//   //     } catch {}
//   //   }
//   //   setItems(listSurveys());
//   //   if (firstImportedId) { setActiveSurveyId(firstImportedId); nav('/surveys'); }
//   //   if (fileRef.current) fileRef.current.value = '';
//   // }

//   async function importSurveys(files: FileList | null) {
//     if (!files || files.length === 0) return;
//     let firstImportedId: string | null = null;
    
//     // Figyelmeztetjük a felhasználót, hogy ne zárja be, mert tölt a szerverre is
//     alert("Importálás és szerverre mentés indult! Kérlek, várj...");
    
//     for (const f of Array.from(files)) {
//       try {
//         const raw = await readAsText(f); 
//         const parsed = JSON.parse(raw); 
//         const arr = Array.isArray(parsed) ? parsed : [parsed];
        
//         for (const s of arr) { 
//           if (!s.id) s.id = crypto.randomUUID(); 
          
//           // 1. Mentjük a helyi telefonba (offline)
//           saveSurveyLocal(s.id, s); 
//           if (!firstImportedId) firstImportedId = s.id; 
          
//           // 2. AZONNAL MENTJÜK A SZERVERRE IS!
//           // Kihasználjuk a korábban tökéletesített saveAll függvényt
//           setActiveSurveyId(s.id); // Trükk: a saveAll az aktív id-t használja
//           try {
//             await saveAll(s.forms || [], s.answers || {}, s.globals || EMPTY);
//           } catch (serverErr) {
//             console.error("Szerver hiba importálásnál (de lokálisan mentve lett):", serverErr);
//           }
//         }
//       } catch (err) {
//         console.error("Hibás JSON fájl:", err);
//       }
//     }
    
//     // Visszaállítjuk a normál állapotot
//     setItems(listSurveys());
//     if (firstImportedId) { 
//       setActiveSurveyId(firstImportedId); 
//       nav('/surveys'); 
//     } else {
//       setActiveSurveyId(null);
//     }
//     if (fileRef.current) fileRef.current.value = '';
    
//     alert("Az importálás kész! A fájlok a szerverre is felkerültek.");
//   }

//   return (
//     <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
//       <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Kezdőlap</h1>

//       <div style={formDesign.card}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: open ? '16px' : '0' }}>
//           <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Elmentett felmérések</h2>
//           <button style={formDesign.btnSecondary} onClick={()=>setOpen(o=>!o)}>{open ? 'Visszacsuk' : 'Megnyitás'}</button>
//         </div>

//         {open && (
//           <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
//             {grouped.length === 0 && <div style={{ color: '#6b7280', fontStyle: 'italic', padding: '12px 0' }}>Nincs elmentett felmérés a rendszerben.</div>}

//             {grouped.map(group => (
//               <div key={group.company} style={{ marginBottom: '20px' }}>
//                 <div style={{ fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #e5e7eb' }}>
//                   {group.company}
//                 </div>
//                 {group.list.map(it => (
//                   <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '8px', backgroundColor: '#f9fafb' }}>
//                     <div>
//                       <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>#{it.id.slice(0,8)} <span style={{ color: '#6b7280', fontWeight: 400, marginLeft: '8px' }}>({it.formCount} űrlap)</span></div>
//                       <div style={{ fontSize: '12px', color: '#6b7280' }}>Módosítva: {new Date(it.updatedAt).toLocaleString('hu-HU')}</div>
//                     </div>
//                     <div style={{ display:'flex', gap: '8px' }}>
//                       <button style={formDesign.btnPrimary} onClick={()=>onWork(it.id)}>Szerkesztés</button>
//                       <button style={formDesign.btnDanger} onClick={()=>onDelete(it.id)}>Törlés</button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <div style={formDesign.card}>
//         <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Új felmérés – Globális adatok</h2>

//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
//           <div>
//             <label style={formDesign.label}>Cégnév</label>
//             <input style={formDesign.input} value={g.companyName} onChange={e=>setG({...g, companyName:e.target.value})} placeholder="Kovács Kft." />
//           </div>
//           <div>
//             <label style={formDesign.label}>Telephely címe</label>
//             <input style={formDesign.input} value={g.site} onChange={e=>setG({...g, site:e.target.value})} placeholder="Budapest, Ipari park 1." />
//           </div>
//           <div>
//             <label style={formDesign.label}>Kapcsolattartó neve</label>
//             <input style={formDesign.input} value={g.contactName} onChange={e=>setG({...g, contactName:e.target.value})} placeholder="Kovács István" />
//           </div>
//           <div>
//             <label style={formDesign.label}>Kapcsolattartó beosztása</label>
//             <input style={formDesign.input} value={g.contactTitle} onChange={e=>setG({...g, contactTitle:e.target.value})} placeholder="Üzemvezető" />
//           </div>
//           <div>
//             <label style={formDesign.label}>Telefonszám</label>
//             <input style={formDesign.input} value={g.phone} onChange={e=>setG({...g, phone:e.target.value})} placeholder="+36 30 123 4567" />
//           </div>
//           <div>
//             <label style={formDesign.label}>Email cím</label>
//             <input style={formDesign.input} type="email" value={g.email} onChange={e=>setG({...g, email:e.target.value})} placeholder="kovacs@kft.hu" />
//           </div>
//           <div>
//             <label style={formDesign.label}>Dátum</label>
//             <input type="date" style={formDesign.input} value={g.date} onChange={e=>setG({...g, date:e.target.value})} />
//           </div>
//           <div>
//             <label style={formDesign.label}>Felmérést végző személy neve</label>
//             <input style={formDesign.input} value={g.inspectorName} onChange={e=>setG({...g, inspectorName:e.target.value})} placeholder="Saját neved" />
//           </div>
//         </div>

//         <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
//           <button style={formDesign.btnSecondary} onClick={()=>setG(EMPTY)}>Űrlap ürítése</button>
          
//           <button style={formDesign.btnOutlinePrimary} onClick={() => fileRef.current?.click()}>Survey importálása (.json)</button>
//           <input ref={fileRef} type="file" accept=".json,application/json" multiple style={{ display: 'none' }} onChange={(e) => { importSurveys(e.target.files); e.currentTarget.value = ''; }} />
          
//           <div style={{ flex: 1 }}></div>
//           <button style={{...formDesign.btnPrimary, backgroundColor: '#10b981'}} onClick={onNew}>Új felmérés indítása</button>
//         </div>
//       </div>
//     </div>
//   )
// }

import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listSurveys, createSurvey, deleteSurvey,
  setActiveSurveyId, refreshIndex, saveSurveyLocal, 
  saveAll,
  type SurveySummary
} from '../storage'

import { fetchLocks } from '../storage/clientLock';
import { Globals, EMPTY } from '../types';

export function genId(): string {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) { try { return (crypto as any).randomUUID(); } catch {} }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
    return `${h.substr(0,8)}-${h.substr(8,4)}-${h.substr(12,4)}-${h.substr(16,4)}-${h.substr(20)}`;
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

const formDesign = {
  card: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  btnSecondary: { backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  btnDanger: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  btnPrimary: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  btnOutlinePrimary: { backgroundColor: 'transparent', color: '#2563eb', border: '1px solid #2563eb', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  label: { display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: 'inherit', backgroundColor: '#fff', color: '#111827' },
  fieldGroup: { marginBottom: '16px' },
};

export default function Start() {
  const nav = useNavigate()
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState<SurveySummary[]>([])
  const [g, setG] = useState<Globals>(EMPTY)
  const [locks, setLocks] = useState<Record<string, {id: string; owner: string; expiresAt: string}>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let dead = false;
    async function init() {
      try {
        const idx = await refreshIndex();
        if (!dead) setItems(idx);
        const m = await fetchLocks();
        if (!dead) setLocks(m);
      } catch (e) {
        console.error("Hiba az inicializáláskor:", e);
      }
    }
    init();
    setG(EMPTY);
    return () => { dead = true; };
  }, []);

  function refresh() { setItems(listSurveys()) }

  // A törlés megvárja, míg a szerveren ÉS lokálisan is lefut!
  async function onDelete(id: string) {
    const ok = confirm('Biztosan törlöd az adott felmérést? A művelet nem vonható vissza.')
    if (!ok) return
    await deleteSurvey(id)
    refresh()
  }

  async function onWork(id: string) {
    const locks = await fetchLocks();
    const cur = locks[id];
    if (cur && new Date(cur.expiresAt).getTime() > Date.now()) {
      alert('Ezt a felmérést épp más szerkeszti. Próbáld később.');
      return;
    }
    const owner = localStorage.getItem('__client_owner__') || (localStorage.setItem('__client_owner__', genId()), localStorage.getItem('__client_owner__')!);
    try {
      const rr = await fetch(`/api/surveys/${encodeURIComponent(id)}/lock`, {
        method: 'POST', headers: { 'Content-Type':'application/json' }, credentials: 'same-origin', body: JSON.stringify({ owner, ttlSec: 60 })
      });
      if (rr.status === 423) { alert('Ezt a felmérést épp más szerkeszti. Próbáld később.'); return; }
    } catch {}

    setActiveSurveyId(id);
    nav('/surveys');
  }

  function onNew() {
    const name = g.companyName.trim()
    if (!name) { alert('Adj meg legalább egy cégnév mezőt az új felmérés létrehozásához.'); return; }
    try {
      createSurvey(g)
      setG(EMPTY)
      nav('/surveys')
    } catch (e: any) {
      alert('Nem sikerült létrehozni a felmérést.')
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

  function readAsText(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsText(file, 'utf-8');
    });
  }

  async function importSurveys(files: FileList | null) {
    if (!files || files.length === 0) return;
    let firstImportedId: string | null = null;
    
    alert("Importálás és szerverre mentés indult! Kérlek, várj...");
    
    for (const f of Array.from(files)) {
      try {
        const raw = await readAsText(f); 
        const parsed = JSON.parse(raw); 
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        
        for (const s of arr) { 
          if (!s.id) s.id = crypto.randomUUID(); 
          saveSurveyLocal(s.id, s); 
          if (!firstImportedId) firstImportedId = s.id; 
          
          setActiveSurveyId(s.id); 
          try {
            await saveAll(s.forms || [], s.answers || {}, s.globals || EMPTY);
          } catch (serverErr) {
            console.error("Szerver hiba importálásnál:", serverErr);
          }
        }
      } catch (err) {
        console.error("Hibás JSON fájl:", err);
      }
    }
    
    setItems(listSurveys());
    if (firstImportedId) { 
      setActiveSurveyId(firstImportedId); 
      nav('/surveys'); 
    } else {
      setActiveSurveyId(null);
    }
    if (fileRef.current) fileRef.current.value = '';
    
    alert("Az importálás kész! A fájlok a szerverre is felkerültek.");
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Kezdőlap</h1>

      <div style={formDesign.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: open ? '16px' : '0' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Elmentett felmérések</h2>
          <button style={formDesign.btnSecondary} onClick={()=>setOpen(o=>!o)}>{open ? 'Visszacsuk' : 'Megnyitás'}</button>
        </div>

        {open && (
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
            {grouped.length === 0 && <div style={{ color: '#6b7280', fontStyle: 'italic', padding: '12px 0' }}>Nincs elmentett felmérés a rendszerben.</div>}

            {grouped.map(group => (
              <div key={group.company} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '10px', paddingBottom: '4px', borderBottom: '1px solid #e5e7eb' }}>
                  {group.company}
                </div>
                {group.list.map(it => {
                  const d = new Date(it.updatedAt);
                  const dateStr = `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}_${String(d.getDate()).padStart(2, '0')}`;
                  
                  // HA HIÁNYZIK A NÉV, KIÍRJA, HOGY ISMERETLEN
                  const creatorName = (it.inspectorName && it.inspectorName.trim() !== '') ? it.inspectorName : 'Ismeretlen_felmero';
                  const formattedCreator = creatorName.trim().replace(/\s+/g, '_');
                  const displayName = `${formattedCreator}_${dateStr}`;

                  return (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '8px', backgroundColor: '#f9fafb' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                          {displayName} <span style={{ color: '#6b7280', fontWeight: 400, marginLeft: '8px' }}>({it.formCount} űrlap)</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '12px' }}>
                          <span>📅 {d.toLocaleString('hu-HU')}</span>
                          {it.site && <span>📍 {it.site}</span>}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap: '8px' }}>
                        <button style={formDesign.btnPrimary} onClick={()=>onWork(it.id)}>Szerkesztés</button>
                        <button style={formDesign.btnDanger} onClick={()=>onDelete(it.id)}>Törlés</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={formDesign.card}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Új felmérés – Globális adatok</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={formDesign.label}>Cégnév</label>
            <input style={formDesign.input} value={g.companyName} onChange={e=>setG({...g, companyName:e.target.value})} placeholder="Kovács Kft." />
          </div>
          <div>
            <label style={formDesign.label}>Telephely címe</label>
            <input style={formDesign.input} value={g.site} onChange={e=>setG({...g, site:e.target.value})} placeholder="Budapest, Ipari park 1." />
          </div>
          <div>
            <label style={formDesign.label}>Kapcsolattartó neve</label>
            <input style={formDesign.input} value={g.contactName} onChange={e=>setG({...g, contactName:e.target.value})} placeholder="Kovács István" />
          </div>
          <div>
            <label style={formDesign.label}>Kapcsolattartó beosztása</label>
            <input style={formDesign.input} value={g.contactTitle} onChange={e=>setG({...g, contactTitle:e.target.value})} placeholder="Üzemvezető" />
          </div>
          <div>
            <label style={formDesign.label}>Telefonszám</label>
            <input style={formDesign.input} value={g.phone} onChange={e=>setG({...g, phone:e.target.value})} placeholder="+36 30 123 4567" />
          </div>
          <div>
            <label style={formDesign.label}>Email cím</label>
            <input style={formDesign.input} type="email" value={g.email} onChange={e=>setG({...g, email:e.target.value})} placeholder="kovacs@kft.hu" />
          </div>
          <div>
            <label style={formDesign.label}>Dátum</label>
            <input type="date" style={formDesign.input} value={g.date} onChange={e=>setG({...g, date:e.target.value})} />
          </div>
          <div>
            <label style={formDesign.label}>Felmérést végző személy neve</label>
            <input style={formDesign.input} value={g.inspectorName} onChange={e=>setG({...g, inspectorName:e.target.value})} placeholder="Saját neved" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
          <button style={formDesign.btnSecondary} onClick={()=>setG(EMPTY)}>Űrlap ürítése</button>
          
          <button style={formDesign.btnOutlinePrimary} onClick={() => fileRef.current?.click()}>Survey importálása (.json)</button>
          <input ref={fileRef} type="file" accept=".json,application/json" multiple style={{ display: 'none' }} onChange={(e) => { importSurveys(e.target.files); e.currentTarget.value = ''; }} />
          
          <div style={{ flex: 1 }}></div>
          <button style={{...formDesign.btnPrimary, backgroundColor: '#10b981'}} onClick={onNew}>Új felmérés indítása</button>
        </div>
      </div>
    </div>
  )
}