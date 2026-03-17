

// import { useEffect, useMemo, useRef, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import {
//   // storage API
//   loadGlobals,
//   saveAll, saveAnswers,
//   loadAnswersLocal, saveAnswersLocal, saveAllLocal,
//   computeCompletion, type Completion,
//   getActiveSurveyId, setActiveSurveyId, pruneLocalToActive,
//   setStrictLocalMode, bootstrapActiveFromServer,
//   loadAnswersAsync, updateSurveyLocalOnly, saveSurveyLocal, nowIso, readSurvey, SurveyState
// } from '../storage'

// import { FormData, AnswerMap, Globals, EMPTY } from '../types'
// import FormFillerEmbed from './FormFillerEmbed'
// import { SURVEY_TABS } from '../constants'
// import { pickRootDir, saveSurveyToFolder } from '../utils/fs'
// import { loadTemplateForTab } from '../storage/formsLib'
// //import { dbg } from '../utils/debug'

// import { releaseLock } from '../storage/clientLock'; // <- új import

// import { buildSurveyBundle } from '../utils/exportBundle'
// import { shareOrDownloadZip, writeBundleToFolder } from '../utils/exportOut'
// import { sanitize, ensurePerms } from '../utils/fs' // ensurePerms nálad már van a saveSurveyToFolder-ban


// // ---------- Defenzív minimalista normalizálás ----------
// // - nem módosítjuk a name-et
// // - garantáljuk a meta.id meglétét
// // - elements tömb
// // - id alapján deduplikálunk (első előfordulás marad)
// function normalizeForms(fs: any[]): FormData[] {
//   const clean = (fs || [])
//     .filter(Boolean)
//     .map((f: any) => {
//       const next: any = { ...f }
//       next.meta = next.meta || {}
//       next.meta.id = String(next.meta.id || crypto.randomUUID())
//       if (!Array.isArray(next.elements)) next.elements = []
//       return next as FormData
//     })

//   const seen = new Set<string>()
//   const dedup: FormData[] = []
//   for (const f of clean) {
//     const fid = String(f.meta.id)
//     if (seen.has(fid)) continue
//     seen.add(fid)
//     dedup.push(f)
//   }
//   return dedup
// }

// // --- kis lebegő debug panel ---
// function DebugPane() {
//   const [lines, setLines] = useState<string[]>([])
//   useEffect(() => {
//     const onEvt = (e: Event) => {
//       const detail = (e as CustomEvent<string>).detail
//       setLines(prev => {
//         const next = [...prev, detail]
//         return next.slice(-40)
//       })
//     }
//     window.addEventListener('survey-debug', onEvt as EventListener)
//     return () => window.removeEventListener('survey-debug', onEvt as EventListener)
//   }, [])
//   return (
//     <div style={{
//       position:'fixed', bottom:10, right:10, width:420, maxHeight:240, overflow:'auto',
//       background:'rgba(0,0,0,0.75)', color:'#0f0', fontFamily:'monospace',
//       fontSize:12, padding:8, borderRadius:8, zIndex:99999
//     }}>
//       <div style={{fontWeight:'bold', color:'#fff', marginBottom:4}}>DEBUG LOG</div>
//       {lines.map((l,i)=> <div key={i} style={{whiteSpace:'pre-wrap'}}>{l}</div>)}
//     </div>
//   )
// }

// export default function Surveys(){
//   const nav = useNavigate()

//   // const empty = EMPTY;

//   const [forms, setForms] = useState<FormData[]>([])
//   const [active, setActive] = useState(0)
//   const [answersMap, setAnswersMap] = useState<Record<string, AnswerMap>>({})
//   const [globals, setGlobals] = useState<Globals>(EMPTY);
//   const [busy, setBusy] = useState(false)
//   const [activeAnswer, setActiveAnswer] = useState<AnswerMap>()
//   const saveTimer = useRef<number | null>(null)

//   const perFormSaveTimerRef = useRef<Record<string, number>>({});
//   const lastSavedHashRef = useRef<Record<string, string>>({});

//    const a4Refs = useRef<Record<string, HTMLDivElement | null>>({})
  


// useEffect(() => {
//   let cancelled = false

//   ;(async () => {
//     setStrictLocalMode(true)
//     //await bootstrapActiveFromServer() // csak lokál bootstrap, nem bántja a többit

//     const activeId = getActiveSurveyId()
//     let fs: FormData[] = []
//     let answersFromServerOrLocal: Record<string, AnswerMap> = {}
//     let globalsFrom: Globals | null = null

//     // 1) Van-e lokálisan mentett survey és benne formok?
//     let localSurvey: any = null
//     try {
//       const raw = activeId ? localStorage.getItem(`surveys/${activeId}`) : null
//       localSurvey = raw ? JSON.parse(raw) : null
//     } catch {}

//     const hasLocalForms =
//       Array.isArray(localSurvey?.forms) && localSurvey.forms.length > 0
    
//     if (hasLocalForms) {
//       // Local-first: minden a lokálból
//       fs = localSurvey.forms as FormData[]
//       answersFromServerOrLocal = (localSurvey.answers || {}) as Record<string, AnswerMap>
//       globalsFrom = (localSurvey.globals || null) as Globals | null
//       //dbg('FORMS SOURCE: LOCAL (existing cached survey)', { count: fs.length })
//     } else {
//       // 2) nincs lokál → próbáld a teljes survey-t a szerverről
//       let serverSurvey: any = null
//       try {
//         if (activeId) {
//           const r = await fetch(`/api/surveys/${encodeURIComponent(activeId)}`, { credentials: 'same-origin' })
//           if (r.ok) serverSurvey = await r.json()
//         }
//       } catch {}

//       if (serverSurvey) {
//         fs = (serverSurvey.forms || []) as FormData[]
//         answersFromServerOrLocal = (serverSurvey.answers || {}) as Record<string, AnswerMap>
//         globalsFrom = (serverSurvey.globals || null) as Globals | null
//         console.log('globals: ', globalsFrom);
//         //dbg('FORMS SOURCE: SERVER', { count: fs.length })
//       } else {
//         // 3) végső fallback: templates (új felmérés)
//         const seeded: FormData[] = []
//         for (const tab of SURVEY_TABS) {
//           const tpl = await loadTemplateForTab(tab)
//           if (tpl) {
//             const fixed = structuredClone(tpl)
//             fixed.meta = { id: fixed.meta?.id || crypto.randomUUID(), name: tab }
//             seeded.push(fixed)
//           } else {
//             seeded.push({ meta: { id: crypto.randomUUID(), name: tab }, elements: [] } as any)
//           }
//         }
//         fs = seeded
//         answersFromServerOrLocal = {}
//         //dbg('FORMS SOURCE: TEMPLATES', { count: fs.length })
//       }
//     }

//     if (cancelled) return



// // 4) Normalizálás
// const cleanFs = normalizeForms(fs)

// // 5) Egyetlen lokális mentés: forms + answers + globals
// {
//   const id = getActiveSurveyId()
//   if (id) {
//     // kiinduló current (ha nincs, védett default)
//     const cur = readSurvey(id) ?? {
//       id,
//       globals: EMPTY, 
//       // { companyName:'', site:'', phone:'', email:'', logoDataUrl: undefined },
//       forms: [],
//       answers: {},
//       files: {},
//       snapshots: [],
//       updatedAt: nowIso(),
//     }

//     // összeállítjuk az egyben mentendő survey-t
//     const next: SurveyState = {
//       ...cur,
//       forms: cleanFs,
//       answers: (answersFromServerOrLocal || {}),     // teljes answersMap
//       globals: (globalsFrom ?? cur.globals),         // ha jött szerverről, az nyer
//       updatedAt: nowIso(),
//     }

//     // CSAK lokális mentés + index update, szerver nélkül
//     saveSurveyLocal(id, next)
//   }
// }

// // 6) Állapotok beállítása (már a lokálba mentett forrásból)
// setForms(cleanFs)
// setAnswersMap(answersFromServerOrLocal || {})
// setGlobals(globalsFrom ?? loadGlobals()) // most már lokálban is ott lesz

// // 7) aktív form answers állapot
// const activeIdx = Number.isFinite(active) ? active : 0
// const activeFormId = cleanFs[activeIdx]?.meta.id || cleanFs[0]?.meta.id
// const activeAns = activeFormId ? (answersFromServerOrLocal?.[activeFormId] || {}) : {}
// setActiveAnswer(activeAns)

//     // dbg('INIT ACTIVE ANSWERS (LOCAL ONLY)', 
//     //   {
//     //   formId: activeFormId,
//     //   keys: activeFormId ? Object.keys(activeAns || {}).length : 0
//     // })
//   })()

//   return () => { cancelled = true }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [])

//   // státusz pöttyök
//   const statuses = useMemo(() => {
//     const s: Record<string, Completion> = {}
//     forms.forEach(f => {
//       if (!f || !f.meta?.id) return
//       const fid = String(f.meta.id)
//       const ans = answersMap[fid] || {}
//       s[fid] = computeCompletion(f, ans)
//     })
//     return s
//   }, [forms, answersMap])

//   const activeForm = forms[active] || null

  

// useEffect(() => {
//   if (!activeForm?.meta?.id) return
//   const fid = String(activeForm.meta.id)

//   // 1) Előnyben a memória (answersMap)
//   console.log('answersMap: ', answersMap);
//   const mem = answersMap[fid]
//   if (mem && Object.keys(mem).length > 0) {
//     setActiveAnswer(mem)
//     // dbg('TAB SWITCH → FROM MEMORY', {
//     //   formId: fid, name: activeForm.meta.name, keys: Object.keys(mem).length
//     // })
//     return
//   }

//   // 2) Ha a memóriában nincs semmi → localStorage
//   const local = loadAnswersLocal(fid) || {}
//   // setActiveAnswer(local)
//   setActiveAnswer(structuredClone(local))
//   // dbg('TAB SWITCH → FROM LOCAL STORAGE', {
//   //   formId: fid, name: activeForm.meta.name, keys: Object.keys(local).length
//   // })
// }, [activeForm?.meta?.id])

//   function scheduleSnapshotSave() {
//     if (saveTimer.current) window.clearTimeout(saveTimer.current)
//     saveTimer.current = window.setTimeout(() => {
//       saveTimer.current = null
//     }, 100) as unknown as number
//   }

//   // űrlap STRUKTÚRA változás → LOCAL
//   function onFormChange(next: FormData) {
//     setForms(prev => {
//       const updated = prev.map(f => f.meta.id === next.meta.id ? next : f)
//       saveAllLocal(updated)
//       // dbg('SAVE FORM STRUCTURE: LOCAL', {
//       //   formId: next.meta.id, name: next.meta.name, elements: (next.elements||[]).length
//       // })
//       scheduleSnapshotSave()
//       return updated
//     })
//   }


//   function onAnswersChange(formId: string, ansPartial: AnswerMap){
//   setAnswersMap(prev => {
//     const old = prev[formId] || {};
//     const partial = ansPartial || {};

//     // 1) Gyors változásdetektálás: ha a partial semmit nem változtatna, ne tegyünk semmit
//     const changed = Object.keys(partial).some(k => old[k] !== partial[k]);
//     if (!changed) return prev;

//     // const merged = { ...old, ...partial };
//     // const next = { ...prev, [formId]: merged };

//     const merged = { ...old, ...(ansPartial || {}) };
//     const stable = structuredClone(merged);           // ← új, független példány
//     const next = { ...prev, [formId]: stable };
//     saveAnswersLocal(formId, stable);

//     // 2) Debounce + duplikált mentésvédelem formId szinten
//     if (perFormSaveTimerRef.current[formId]) {
//       window.clearTimeout(perFormSaveTimerRef.current[formId]);
//     }
//     perFormSaveTimerRef.current[formId] = window.setTimeout(() => {
//       // JSON-hash (igen, nagy lehet a dataURL miatt, de csak a debounce után fut)
//       const json = JSON.stringify(merged);
//       if (lastSavedHashRef.current[formId] === json) {
//         return; // pontosan ugyanaz már el lett mentve – nincs új mentés/log
//       }
//       lastSavedHashRef.current[formId] = json;

//       saveAnswersLocal(formId, merged);
//       // dbg('SAVE ANSWERS: LOCAL (MERGED)', { formId, keys: Object.keys(merged||{}).length });
//       perFormSaveTimerRef.current[formId] = 0 as any;
//     }, 150) as unknown as number;

//     return next;
//   });
// }

//   function onEdit(){
//     if (!activeForm) return
//     const pwd = window.prompt('Add meg az admin jelszót:')
//     if (pwd === 'admin') nav('/builder?edit=' + activeForm.meta.id)
//     else if (pwd !== null) alert('Hibás jelszó.')
//   }

//   function colorClass(c: any){
//     return c === 'done' ? 'done' : c === 'progress' ? 'progress' : 'empty'
//   }

//   async function finishToFolder(){
//     if (!globals.companyName.trim()) {
//       alert('Előbb add meg a cég nevét a kezdő oldalon.')
//       nav('/')
//       return
//     }
//     try {
//       const root = await pickRootDir()

// if (!activeForm) {
//   alert('Nincs aktív űrlap.')
//   return
// }

// const fid = String(activeForm.meta.id)
// const onlyThisForm = [activeForm]
// const onlyThisAnswersMap = { [fid]: answersMap[fid] || {} }

// // csak az aktív form DOM gyökerét adjuk át
// const onlyThisDom: Record<string, HTMLDivElement | null> = {
//   [fid]: a4Refs.current[fid] || null
// }

// // MINDIG csak az aktív formot exportáljuk → a fájlnév = activeForm.meta.name.pdf
// await saveSurveyToFolder(root, globals, onlyThisForm, onlyThisAnswersMap, onlyThisDom, 'visual')

// alert(`Elmentve: ${activeForm.meta.name}.pdf`)
//       // dbg('EXPORT PDF → done')
//     } catch (e) {
//       console.error(e)
//       alert('Mentési hiba.')
//       // dbg('EXPORT PDF → error', { error: String(e) })
//     }
//   }

// //   // SZERVER MENTÉS (ÖSSZES) – lokál marad a forrás
//   async function saveAllToServer() {
//     try {
//       setBusy(true)
      
//       await saveAll(forms)
//       // dbg('SAVE ALL FORMS: SERVER', { forms: forms.length })

//       // for (const f of forms) {
//       //   const fid = String(f.meta.id)
//       //   const ans = answersMap[fid]
//       //   if (ans && Object.keys(ans).length > 0) {
//       //     await saveAnswers(fid, ans)
//       //     dbg('SAVE ANSWERS: SERVER', { formId: fid, name: f.meta.name, keys: Object.keys(ans).length })
//       //   } else {
//       //     dbg('SKIP SAVE ANSWERS: empty', { formId: fid, name: f.meta.name })
//       //   }
//       // }
//       alert('Mentve a szerverre.')
//     } catch (e) {
//       console.error(e)
//       alert('Szerver mentési hiba.')
//       // dbg('SAVE SERVER → error', { error: String(e) })
//     } finally {
//       setBusy(false)
//     }
//   }

// // async function finishToFolder() {
// //   if (!globals.companyName.trim()) {
// //     alert('Előbb add meg a cég nevét a kezdő oldalon.')
// //     nav('/')
// //     return
// //   }

// //   try {
// //     setBusy(true)

// //     // 1) DOM map összerakása (MINDEN form)
// //     const domById: Record<string, HTMLDivElement | null> = {}
// //     for (const f of forms) {
// //       const fid = String(f.meta.id)
// //       domById[fid] = a4Refs.current[fid] || null
// //     }

// //     // 2) Bundle elkészítése memóriában (PDF-ek + survey.json)
// //     const bundle = await buildSurveyBundle(globals, forms, answersMap, domById, 'visual')

// //     // 3) Kimenet: ha van Directory Picker -> mappába írás, különben ZIP
// //     const canPickFolder = typeof (window as any).showDirectoryPicker === 'function'

// //     if (canPickFolder) {
// //       const root = await pickRootDir()
// //       await ensurePerms(root, 'readwrite')

// //       const folderName = sanitize(globals.companyName || 'Ismeretlen')
// //       const companyDir = await root.getDirectoryHandle(folderName, { create: true })

// //       await writeBundleToFolder(companyDir, bundle)

// //       alert(`Elmentve mappába: ${folderName} (${Object.keys(bundle).length - 1} PDF + survey.json)`)
// //     } else {
// //       const zipName = `${sanitize(globals.companyName)}_survey_export.zip`
// //       await shareOrDownloadZip(bundle, zipName)
// //       alert(`Export kész: ${zipName}`)
// //     }
// //   } catch (e) {
// //     console.error(e)
// //     alert('Mentési hiba.')
// //   } finally {
// //     setBusy(false)
// //   }
// // }

//   // Kilépés: CSAK lokális takarítás (szervert nem bántjuk)
//   function exitToHome() {
//     if (saveTimer.current) {
//       window.clearTimeout(saveTimer.current)
//       saveTimer.current = null
//     }
//     const id = getActiveSurveyId()
//     if (id) {
//       releaseLock(id); // unmountkor is oldjuk
//       try { localStorage.removeItem(`surveys/${id}`) } catch {}
//       // dbg('EXIT → cleared LOCAL survey', { id })
//       console.log('EXIT → cleared LOCAL survey', { id })
//     }
    
//     try { pruneLocalToActive() } catch {}
//     setActiveSurveyId(null)
//     nav('/')
//   }

//   const activeFormId = activeForm?.meta.id

//   const handleRootRef = (formId: string, el: HTMLDivElement | null) => { // +++
//     a4Refs.current[formId] = el
//   }

// //   return (
// //     <>
// //       {/* <DebugPane /> */}

// //       <div className="topbar">
// //         <div className="tabs">
// //           {forms.map((f, i) => (
// //             <button key={f.meta.id}
// //               className={'tab ' + (i===active ? 'active' : '')}
// //               onClick={()=>setActive(i)}>
// //               <span className={'dot ' + colorClass((statuses[f.meta.id]))}></span>
// //               <span>{f.meta.name}</span>
// //             </button>
// //           ))}
// //         </div>
// //         <div style={{display:'flex', gap:8}}>
// //           <button className="btn" onClick={onEdit}>Szerkesztés</button>
// //           <button className="btn" onClick={saveAllToServer} disabled={busy}>
// //             {busy ? 'Mentés…' : 'Mentés (szerverre)'}
// //           </button>
// //           <button className="btn success" onClick={finishToFolder} disabled={busy}>
// //             {busy ? 'Mentés…' : 'Befejezés (PDF)'}
// //           </button>
// //           <button className="btn danger" onClick={exitToHome}>Kilépés</button>
// //         </div>
// //       </div>

// //       {(!activeFormId || activeAnswer == null) ? (
// //         <div className="small">Nincs aktív felmérés.</div>
// //       ) : (
// //         <FormFillerEmbed
// //           key={activeFormId}
// //           formId={activeFormId}
// //           initialForm={activeForm!}
// //           onAnswersChange={(ans)=> onAnswersChange(activeFormId, ans)}
// //           onFormChange={onFormChange}
// //           activeAnswer={activeAnswer!}
// //           globals={globals}
// //           onRootRef={handleRootRef}
// //         />
// //       )}
// //     </>
// //   )
// // }

// return (
//   <>
//     {/* <DebugPane /> */}

//     <div className="topbar">
//       {/* 1. sor: akciógombok */}
//       <div className="topbar-actions">
//         <button className="btn" onClick={saveAllToServer} disabled={busy}>
//           {busy ? 'Mentés…' : 'Mentés (szerverre)'}
//         </button>
//         <button className="btn success" onClick={finishToFolder} disabled={busy}>
//           {busy ? 'Mentés…' : 'Befejezés (PDF)'}
//         </button>
//         <button className="btn danger" onClick={exitToHome}>Kilépés</button>
//       </div>

//       {/* 2. sor: tabok egyetlen sorban, egyforma szélességgel */}
//       <div className="tabs tabs--single-row">
//         {forms.map((f, i) => (
//           <button
//             key={f.meta.id}
//             className={'tab ' + (i === active ? 'active' : '')}
//             onClick={() => setActive(i)}
//           >
//             <span className={'dot ' + colorClass((statuses[f.meta.id]))}></span>
//             <span className="tab-label">{f.meta.name}</span>
//           </button>
//         ))}
//       </div>
//     </div>

//     {(!activeFormId || activeAnswer == null) ? (
//       <div className="small">Nincs aktív felmérés.</div>
//     ) : (
//       <FormFillerEmbed
//         key={activeFormId}
//         formId={activeFormId}
//         initialForm={activeForm!}
//         onAnswersChange={(ans)=> onAnswersChange(activeFormId, ans)}
//         onFormChange={onFormChange}
//         activeAnswer={activeAnswer!}
//         globals={globals}
//         onRootRef={handleRootRef}
//       />
//     )}
//   </>
// )
// }

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  loadGlobals,
  saveAll, saveAnswers,
  loadAnswersLocal, saveAnswersLocal, saveAllLocal,
  computeCompletion, type Completion,
  getActiveSurveyId, setActiveSurveyId, pruneLocalToActive,
  setStrictLocalMode, bootstrapActiveFromServer,
  loadAnswersAsync, updateSurveyLocalOnly, saveSurveyLocal, nowIso, readSurvey, SurveyState
} from '../storage'

import { FormData, AnswerMap, Globals, EMPTY } from '../types'
import FormFillerEmbed from './FormFillerEmbed'
import { SURVEY_TABS } from '../constants'
import { pickRootDir, saveSurveyToFolder } from '../utils/fs'
import { loadTemplateForTab } from '../storage/formsLib'
import { releaseLock } from '../storage/clientLock';
import { buildSurveyBundle } from '../utils/exportBundle'
import { shareOrDownloadZip, writeBundleToFolder } from '../utils/exportOut'
import { sanitize, ensurePerms } from '../utils/fs'

// --- DESIGN RENDSZER (Ide is beemelve) ---
const formDesign = {
  card: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  btnSecondary: { backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', padding: '8px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  btnDanger: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  btnSuccess: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  btnPrimary: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
};

function normalizeForms(fs: any[]): FormData[] {
  const clean = (fs || []).filter(Boolean).map((f: any) => {
      const next: any = { ...f }
      next.meta = next.meta || {}
      next.meta.id = String(next.meta.id || crypto.randomUUID())
      if (!Array.isArray(next.elements)) next.elements = []
      return next as FormData
    })
  const seen = new Set<string>()
  const dedup: FormData[] = []
  for (const f of clean) {
    const fid = String(f.meta.id)
    if (seen.has(fid)) continue
    seen.add(fid)
    dedup.push(f)
  }
  return dedup
}

export default function Surveys(){
  const nav = useNavigate()
  const [forms, setForms] = useState<FormData[]>([])
  const [active, setActive] = useState(0)
  const [answersMap, setAnswersMap] = useState<Record<string, AnswerMap>>({})
  const [globals, setGlobals] = useState<Globals>(EMPTY);
  const [busy, setBusy] = useState(false)
  const [activeAnswer, setActiveAnswer] = useState<AnswerMap>()
  const saveTimer = useRef<number | null>(null)
  const perFormSaveTimerRef = useRef<Record<string, number>>({});
  const lastSavedHashRef = useRef<Record<string, string>>({});
  const a4Refs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStrictLocalMode(true)
      const activeId = getActiveSurveyId()
      let fs: FormData[] = []
      let answersFromServerOrLocal: Record<string, AnswerMap> = {}
      let globalsFrom: Globals | null = null

      let localSurvey: any = null
      try {
        const raw = activeId ? localStorage.getItem(`surveys/${activeId}`) : null
        localSurvey = raw ? JSON.parse(raw) : null
      } catch {}

      const hasLocalForms = Array.isArray(localSurvey?.forms) && localSurvey.forms.length > 0
      
      if (hasLocalForms) {
        fs = localSurvey.forms as FormData[]
        answersFromServerOrLocal = (localSurvey.answers || {}) as Record<string, AnswerMap>
        globalsFrom = (localSurvey.globals || null) as Globals | null
      } else {
        let serverSurvey: any = null
        try {
          if (activeId) {
            const r = await fetch(`/api/surveys/${encodeURIComponent(activeId)}`, { credentials: 'same-origin' })
            if (r.ok) serverSurvey = await r.json()
          }
        } catch {}

        if (serverSurvey) {
          fs = (serverSurvey.forms || []) as FormData[]
          answersFromServerOrLocal = (serverSurvey.answers || {}) as Record<string, AnswerMap>
          globalsFrom = (serverSurvey.globals || null) as Globals | null
        } else {
          const seeded: FormData[] = []
          for (const tab of SURVEY_TABS) {
            const tpl = await loadTemplateForTab(tab)
            if (tpl) {
              const fixed = structuredClone(tpl)
              fixed.meta = { id: fixed.meta?.id || crypto.randomUUID(), name: tab }
              seeded.push(fixed)
            } else {
              seeded.push({ meta: { id: crypto.randomUUID(), name: tab }, elements: [] } as any)
            }
          }
          fs = seeded
          answersFromServerOrLocal = {}
        }
      }

      if (cancelled) return

      const cleanFs = normalizeForms(fs)

      {
        const id = getActiveSurveyId()
        if (id) {
          const cur = readSurvey(id) ?? { id, globals: EMPTY, forms: [], answers: {}, files: {}, snapshots: [], updatedAt: nowIso() }
          const next: SurveyState = { ...cur, forms: cleanFs, answers: (answersFromServerOrLocal || {}), globals: (globalsFrom ?? cur.globals), updatedAt: nowIso() }
          saveSurveyLocal(id, next)
        }
      }

      setForms(cleanFs)
      setAnswersMap(answersFromServerOrLocal || {})
      setGlobals(globalsFrom ?? loadGlobals())

      const activeIdx = Number.isFinite(active) ? active : 0
      const activeFormId = cleanFs[activeIdx]?.meta.id || cleanFs[0]?.meta.id
      const activeAns = activeFormId ? (answersFromServerOrLocal?.[activeFormId] || {}) : {}
      setActiveAnswer(activeAns)
    })()
    return () => { cancelled = true }
  }, [])

  const statuses = useMemo(() => {
    const s: Record<string, Completion> = {}
    forms.forEach(f => {
      if (!f || !f.meta?.id) return
      const fid = String(f.meta.id)
      const ans = answersMap[fid] || {}
      s[fid] = computeCompletion(f, ans)
    })
    return s
  }, [forms, answersMap])

  const activeForm = forms[active] || null

  useEffect(() => {
    if (!activeForm?.meta?.id) return
    const fid = String(activeForm.meta.id)
    const mem = answersMap[fid]
    if (mem && Object.keys(mem).length > 0) { setActiveAnswer(mem); return; }
    const local = loadAnswersLocal(fid) || {}
    setActiveAnswer(structuredClone(local))
  }, [activeForm?.meta?.id])

  function scheduleSnapshotSave() {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => { saveTimer.current = null }, 100) as unknown as number
  }

  function onFormChange(next: FormData) {
    setForms(prev => {
      const updated = prev.map(f => f.meta.id === next.meta.id ? next : f)
      saveAllLocal(updated)
      scheduleSnapshotSave()
      return updated
    })
  }

  function onAnswersChange(formId: string, ansPartial: AnswerMap){
    setAnswersMap(prev => {
      const old = prev[formId] || {};
      const partial = ansPartial || {};
      const changed = Object.keys(partial).some(k => old[k] !== partial[k]);
      if (!changed) return prev;

      const merged = { ...old, ...(ansPartial || {}) };
      const stable = structuredClone(merged);
      const next = { ...prev, [formId]: stable };
      saveAnswersLocal(formId, stable);

      if (perFormSaveTimerRef.current[formId]) window.clearTimeout(perFormSaveTimerRef.current[formId]);
      perFormSaveTimerRef.current[formId] = window.setTimeout(() => {
        const json = JSON.stringify(merged);
        if (lastSavedHashRef.current[formId] === json) return;
        lastSavedHashRef.current[formId] = json;
        saveAnswersLocal(formId, merged);
        perFormSaveTimerRef.current[formId] = 0 as any;
      }, 150) as unknown as number;

      return next;
    });
  }

  function colorClass(c: any){
    return c === 'done' ? 'done' : c === 'progress' ? 'progress' : 'empty'
  }

  async function finishToFolder(){
    if (!globals.companyName.trim()) { alert('Előbb add meg a cég nevét a kezdő oldalon.'); nav('/'); return; }
    try {
      const root = await pickRootDir()
      if (!activeForm) { alert('Nincs aktív űrlap.'); return; }
      const fid = String(activeForm.meta.id)
      const onlyThisForm = [activeForm]
      const onlyThisAnswersMap = { [fid]: answersMap[fid] || {} }
      const onlyThisDom: Record<string, HTMLDivElement | null> = { [fid]: a4Refs.current[fid] || null }
      await saveSurveyToFolder(root, globals, onlyThisForm, onlyThisAnswersMap, onlyThisDom, 'visual')
      alert(`Elmentve: ${activeForm.meta.name}.pdf`)
    } catch (e) {
      console.error(e); alert('Mentési hiba.')
    }
  }

  async function saveAllToServer() {
    try {
      setBusy(true)
      await saveAll(forms)
      alert('Mentve a szerverre.')
    } catch (e) {
      console.error(e); alert('Szerver mentési hiba.')
    } finally {
      setBusy(false)
    }
  }

  function exitToHome() {
    if (saveTimer.current) { window.clearTimeout(saveTimer.current); saveTimer.current = null; }
    const id = getActiveSurveyId()
    if (id) {
      releaseLock(id);
      try { localStorage.removeItem(`surveys/${id}`) } catch {}
    }
    try { pruneLocalToActive() } catch {}
    setActiveSurveyId(null)
    nav('/')
  }

  const activeFormId = activeForm?.meta.id
  const handleRootRef = (formId: string, el: HTMLDivElement | null) => { a4Refs.current[formId] = el }

  return (
    <>
      <div style={{ ...formDesign.card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>Felmérések</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={formDesign.btnSecondary} onClick={saveAllToServer} disabled={busy}>{busy ? 'Mentés…' : 'Mentés (szerverre)'}</button>
            <button style={formDesign.btnSuccess} onClick={finishToFolder} disabled={busy}>{busy ? 'Mentés…' : 'Befejezés (PDF)'}</button>
            <button style={formDesign.btnDanger} onClick={exitToHome}>Kilépés</button>
          </div>
        </div>

        {/* Letisztult tab sáv */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #f3f4f6', overflowX: 'auto', paddingBottom: '2px' }}>
          {forms.map((f, i) => {
            const isActive = i === active;
            const statusColor = statuses[f.meta.id] === 'done' ? '#10b981' : statuses[f.meta.id] === 'progress' ? '#f59e0b' : '#d1d5db';
            
            return (
              <button
                key={f.meta.id}
                onClick={() => setActive(i)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px',
                  fontSize: '14px', fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#2563eb' : '#6b7280',
                  borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                  marginBottom: '-4px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColor }} />
                {f.meta.name}
              </button>
            )
          })}
        </div>
      </div>

      {(!activeFormId || activeAnswer == null) ? (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>Nincs aktív felmérés.</div>
      ) : (
        <FormFillerEmbed
          key={activeFormId}
          formId={activeFormId}
          initialForm={activeForm!}
          onAnswersChange={(ans)=> onAnswersChange(activeFormId, ans)}
          onFormChange={onFormChange}
          activeAnswer={activeAnswer!}
          globals={globals}
          onRootRef={handleRootRef}
        />
      )}
    </>
  )
}