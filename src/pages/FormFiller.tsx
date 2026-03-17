// import { useEffect, useMemo, useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { loadAll, save } from '../storage'
// import type { AnswerMap, FormData, FormElement, ModuleElement, ModuleInstance } from '../types'
// import { v4 as uuid } from 'uuid'
// import HandwritingPad from '../components/HandwritingPad'

// export default function FormFiller(){
//   const { id } = useParams()
//   const [form, setForm] = useState<FormData | null>(null)
//   const [answers, setAnswers] = useState<AnswerMap>({})

//   // kézírási panel állapot
//   const [inkFor, setInkFor] = useState<string | null>(null)
//   const [inkImages, setInkImages] = useState<Record<string, string>>({})

//   useEffect(()=>{
//     const f = loadAll().find(f => f.meta.id === id)
//     if (f) {
//       setForm(structuredClone(f))
//       setAnswers({})
//     } else {
//       setForm(null)
//     }
//   }, [id])

//   const grouped = useMemo(()=>{
//     if (!form) return []
//     return [...form.elements].sort((a,b)=> (a.grid.y - b.grid.y) || (a.grid.x - b.grid.x))
//   }, [form])

//   if (!form) return <div className="card">Nincs ilyen kérdőív.</div>

//   function setVal(key: string, value: any){
//     setAnswers(prev => ({ ...prev, [key]: value }))
//   }

//   function addModuleInstance(el: ModuleElement){
//     const base = el.type==='module_station'
//       ? [
//           { key:'name', label:'Állomás neve' },
//           { key:'location', label:'Helyszín' },
//           { key:'note', label:'Megjegyzés' }
//         ]
//       : [
//           { key:'model', label:'Kompresszor típus' },
//           { key:'power', label:'Névleges teljesítmény [kW]' },
//           { key:'note', label:'Megjegyzés' }
//         ]
//     const inst: ModuleInstance = { id: uuid(), title: (el.type==='module_station'?'Állomás':'Kompresszor')+' #' + (el.instances.length+1), open: true, fields: base.map(f=>({ ...f })) }
//     el.instances.push(inst)
//     setForm(structuredClone(form))
//   }

//   function removeModuleInstance(el: ModuleElement, instId: string){
//     el.instances = el.instances.filter(i => i.id !== instId)
//     setForm(structuredClone(form))
//   }

//   function toggleAccordion(el: ModuleElement, instId: string){
//     const inst = el.instances.find(i => i.id === instId)
//     if (inst) inst.open = !inst.open
//     setForm(structuredClone(form))
//   }

//   function setModuleField(el: ModuleElement, instId: string, key: string, value: string){
//     const inst = el.instances.find(i => i.id === instId)
//     if (!inst) return
//     const f = inst.fields.find(f => f.key === key)
//     if (f) f.value = value
//     setForm(structuredClone(form))
//   }

//   function submit(){
//     if (!form) return
//     const updated = { ...form, meta: { ...form.meta, status: 'done' as const } }
//     save(updated)
//     alert('Beküldve (demo). A Kérdőív választó oldalon a státusz frissült.')
//   }

//   // Toll panel megnyitás/mentés/bezárás
//   function openInk(fieldId: string){ setInkFor(fieldId) }
//   function onInkSave(dataUrl: string){
//     if (!inkFor) return
//     setInkImages(prev => ({ ...prev, [inkFor]: dataUrl }))
//     setInkFor(null)
//     // (opcionális) OCR ide jöhetne, és setVal(inkFor, recognizedText)
//   }
//   function onInkClose(){ setInkFor(null) }

//   return (
//     <div className="card">
//       <h2>{form.meta.name}</h2>
//       <p className="small">{form.meta.description}</p>

//       <div className="list">
//         {grouped.length === 0 && (
//           <div className="card">
//             <strong>Nincsenek mezők ebben a kérdőívben.</strong>
//             <p className="small">Menj a Szerkesztőbe és adj hozzá elemeket, majd mentsd a kérdőívet.</p>
//           </div>
//         )}

//         {grouped.map((el: FormElement) => (
//           <div key={el.id} className="card">
//             <strong>{el.label}</strong>
//             <div style={{marginTop:10}}>
//               {el.type==='text' && (
//                 <>
//                   <div style={{display:'flex', gap:8}}>
//                     <input className="input" placeholder={(el as any).placeholder||''}
//                       value={answers[el.id]||''} onChange={e=>setVal(el.id, e.target.value)} />
//                     <button className="btn" onClick={() => openInk(el.id)}>Toll</button>
//                   </div>
//                   {inkImages[el.id] && (
//                     <div className="small">
//                       Mentett kézírás:
//                       <div><img src={inkImages[el.id]} alt="ink" style={{maxWidth:'100%', background:'#fff', borderRadius:8, marginTop:6}}/></div>
//                     </div>
//                   )}
//                 </>
//               )}
//               {el.type==='comment' && (
//                 <>
//                   <div style={{display:'flex', gap:8}}>
//                     <textarea className="input" rows={4} placeholder={(el as any).placeholder||''}
//                       value={answers[el.id]||''} onChange={e=>setVal(el.id, e.target.value)} />
//                     <button className="btn" onClick={() => openInk(el.id)}>Toll</button>
//                   </div>
//                   {inkImages[el.id] && (
//                     <div className="small">
//                       Mentett kézírás:
//                       <div><img src={inkImages[el.id]} alt="ink" style={{maxWidth:'100%', background:'#fff', borderRadius:8, marginTop:6}}/></div>
//                     </div>
//                   )}
//                 </>
//               )}
//               {el.type==='dropdown' && (
//                 <select className="input" value={answers[el.id]||''} onChange={e=>setVal(el.id, e.target.value)}>
//                   <option value="" disabled>Válassz...</option>
//                   {(el as any).options.map((o:string, idx:number)=>(<option key={idx} value={o}>{o}</option>))}
//                 </select>
//               )}
//               {(el.type==='module_station' || el.type==='module_compressor') && (
//                 <div>
//                   <div className="toolbar" style={{marginBottom:8}}>
//                     <button className="btn" onClick={()=>addModuleInstance(el)}>+ {el.type==='module_station'?'Állomás':'Kompresszor'} hozzáadása</button>
//                   </div>
//                   <div className="list">
//                     {el.instances.map(inst => (
//                       <div key={inst.id} className={'accordion ' + (inst.open?'open':'')}>
//                         <h4 style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
//                           <span>{inst.title}</span>
//                           <span>
//                             <button className="btn" onClick={()=>toggleAccordion(el, inst.id)}>{inst.open?'Bezár':'Kinyit'}</button>
//                             <button className="btn danger" onClick={()=>removeModuleInstance(el, inst.id)}>Törlés</button>
//                           </span>
//                         </h4>
//                         <div className="content">
//                           <div className="kv">
//                             {inst.fields.map(f => (
//                               <div key={f.key}>
//                                 <label>{f.label}</label>
//                                 <input className="input" value={f.value||''} onChange={e=>setModuleField(el, inst.id, f.key, e.target.value)} />
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="footer">
//         <button className="btn success" onClick={submit}>Beküldés (demo)</button>
//       </div>

//       {/* Kézírási panel overlay */}
//       {inkFor && (
//         <HandwritingPad
//           initialImage={inkImages[inkFor]}
//           onClose={onInkClose}
//           onSave={onInkSave}
//         />
//       )}

//       <p className="small">Megjegyzés: a kézírási képek jelenleg csak a kliensen látszanak (demo). Ha kell, elmentjük storage/DB-be és/vagy futtatunk OCR-t.</p>
//     </div>
//   )
// }


// import { useEffect, useMemo, useRef, useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { loadAll, save } from '../storage'
// import type { AnswerMap, FormData, FormElement, ModuleElement, ModuleInstance } from '../types'
// import { v4 as uuid } from 'uuid'
// import HandwritingPad from '../components/HandwritingPad'

// export default function FormFiller(){
//   const { id } = useParams()
//   const [form, setForm] = useState<FormData | null>(null)
//   const [answers, setAnswers] = useState<AnswerMap>({})

//   // kézírás panel állapot
//   const [inkFor, setInkFor] = useState<string | null>(null)
//   const [inkImages, setInkImages] = useState<Record<string, string>>({}) // komment képek
//   const [mode, setMode] = useState<'comment' | 'paste' | null>(null)

//   // fókusz a beillesztés után
//   const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

//   useEffect(()=>{
//     const f = loadAll().find(f => f.meta.id === id)
//     if (f) {
//       setForm(structuredClone(f))
//       setAnswers({})
//     } else {
//       setForm(null)
//     }
//   }, [id])

//   const grouped = useMemo(()=>{
//     if (!form) return []
//     return [...form.elements].sort((a,b)=> (a.grid.y - b.grid.y) || (a.grid.x - b.grid.x))
//   }, [form])

//   if (!form) return <div className="card">Nincs ilyen kérdőív.</div>

//   function setVal(key: string, value: any){
//     setAnswers(prev => ({ ...prev, [key]: value }))
//   }

//   function addModuleInstance(el: ModuleElement){
//     const base = el.type==='module_station'
//       ? [
//           { key:'name', label:'Állomás neve' },
//           { key:'location', label:'Helyszín' },
//           { key:'note', label:'Megjegyzés' }
//         ]
//       : [
//           { key:'model', label:'Kompresszor típus' },
//           { key:'power', label:'Névleges teljesítmény [kW]' },
//           { key:'note', label:'Megjegyzés' }
//         ]
//     const inst: ModuleInstance = { id: uuid(), title: (el.type==='module_station'?'Állomás':'Kompresszor')+' #' + (el.instances.length+1), open: true, fields: base.map(f=>({ ...f })) }
//     el.instances.push(inst)
//     setForm(structuredClone(form))
//   }

//   function removeModuleInstance(el: ModuleElement, instId: string){
//     el.instances = el.instances.filter(i => i.id !== instId)
//     setForm(structuredClone(form))
//   }

//   function toggleAccordion(el: ModuleElement, instId: string){
//     const inst = el.instances.find(i => i.id === instId)
//     if (inst) inst.open = !inst.open
//     setForm(structuredClone(form))
//   }

//   function setModuleField(el: ModuleElement, instId: string, key: string, value: string){
//     const inst = el.instances.find(i => i.id === instId)
//     if (!inst) return
//     const f = inst.fields.find(f => f.key === key)
//     if (f) f.value = value
//     setForm(structuredClone(form))
//   }

//   function submit(){
//     if (!form) return
//     const updated = { ...form, meta: { ...form.meta, status: 'done' as const } }
//     save(updated)
//     alert('Beküldve (demo). A Kérdőív választó oldalon a státusz frissült.')
//   }

//   // Toll panel kezelése
//   function openInk(fieldId: string, m: 'comment' | 'paste'){
//     setMode(m)
//     setInkFor(fieldId)
//   }
//   function onSaveComment(dataUrl: string){
//     if (!inkFor) return
//     setInkImages(prev => ({ ...prev, [inkFor]: dataUrl }))
//     setInkFor(null)
//     setMode(null)
//   }
//   function onPasteText(text: string){
//     if (!inkFor) return
//     const normalized = text.replace(/\s+/g, ' ').trim()
//     setVal(inkFor, normalized)
//     setInkFor(null)
//     setMode(null)
//     // fókusz vissza a mezőre
//     requestAnimationFrame(()=> inputRefs.current[inkFor!]?.focus())
//   }
//   function onInkClose(){
//     setInkFor(null)
//     setMode(null)
//   }

//   return (
//     <div className="card">
//       <h2>{form.meta.name}</h2>
//       <p className="small">{form.meta.description}</p>

//       <div className="list">
//         {grouped.length === 0 && (
//           <div className="card">
//             <strong>Nincsenek mezők ebben a kérdőívben.</strong>
//             <p className="small">Menj a Szerkesztőbe és adj hozzá elemeket, majd mentsd a kérdőívet.</p>
//           </div>
//         )}

//         {grouped.map((el: FormElement) => (
//           <div key={el.id} className="card">
//             <strong>{el.label}</strong>
//             <div style={{marginTop:10}}>
//               {el.type==='text' && (
//                 <>
//                   <div style={{display:'flex', gap:8, alignItems:'stretch', flexWrap:'wrap'}}>
//                     <input
//                       className="input"
//                       placeholder={(el as any).placeholder||''}
//                       value={answers[el.id]||''}
//                       onChange={e=>setVal(el.id, e.target.value)}
//                       ref={elId => (inputRefs.current[el.id] = elId)}
//                       style={{flex: '1 1 260px'}}
//                     />
//                     <div style={{display:'flex', gap:8}}>
//                       <button className="btn" onClick={() => openInk(el.id, 'comment')}>Komment (toll)</button>
//                       <button className="btn" onClick={() => openInk(el.id, 'paste')}>Beilleszt (toll/OCR)</button>
//                     </div>
//                   </div>
//                   {inkImages[el.id] && (
//                     <div className="small">
//                       Mentett kézírás (kommentként):
//                       <div><img src={inkImages[el.id]} alt="ink" style={{maxWidth:'100%', background:'#fff', borderRadius:8, marginTop:6}}/></div>
//                     </div>
//                   )}
//                 </>
//               )}

//               {el.type==='comment' && (
//                 <textarea
//                   className="input"
//                   rows={4}
//                   placeholder={(el as any).placeholder||''}
//                   value={answers[el.id]||''}
//                   onChange={e=>setVal(el.id, e.target.value)}
//                 />
//               )}

//               {el.type==='dropdown' && (
//                 <select className="input" value={answers[el.id]||''} onChange={e=>setVal(el.id, e.target.value)}>
//                   <option value="" disabled>Válassz...</option>
//                   {(el as any).options.map((o:string, idx:number)=>(<option key={idx} value={o}>{o}</option>))}
//                 </select>
//               )}

//               {(el.type==='module_station' || el.type==='module_compressor') && (
//                 <div>
//                   <div className="toolbar" style={{marginBottom:8}}>
//                     <button className="btn" onClick={()=>addModuleInstance(el)}>+ {el.type==='module_station'?'Állomás':'Kompresszor'} hozzáadása</button>
//                   </div>
//                   <div className="list">
//                     {el.instances.map(inst => (
//                       <div key={inst.id} className={'accordion ' + (inst.open?'open':'')}>
//                         <h4 style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
//                           <span>{inst.title}</span>
//                           <span>
//                             <button className="btn" onClick={()=>toggleAccordion(el, inst.id)}>{inst.open?'Bezár':'Kinyit'}</button>
//                             <button className="btn danger" onClick={()=>removeModuleInstance(el, inst.id)}>Törlés</button>
//                           </span>
//                         </h4>
//                         <div className="content">
//                           <div className="kv">
//                             {inst.fields.map(f => (
//                               <div key={f.key}>
//                                 <label>{f.label}</label>
//                                 <input className="input" value={f.value||''} onChange={e=>setModuleField(el, inst.id, f.key, e.target.value)} />
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="footer">
//         <button className="btn success" onClick={submit}>Beküldés (demo)</button>
//       </div>

//       {/* Kézírási panel overlay */}
//       {inkFor && (
//         <HandwritingPad
//           initialImage={mode === 'comment' ? inkImages[inkFor] : undefined}
//           onClose={onInkClose}
//           onSaveComment={onSaveComment}
//           onPasteText={onPasteText}
//           lang="eng+hun"
//         />
//       )}

//       <p className="small">
//         „Komment (toll)” a rajzot képként csatolja. „Beilleszt (toll/OCR)” a rajzból felismert szöveget írja a mezőbe — a mező szerkeszthető marad.
//       </p>
//     </div>
//   )
// }


import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  setActiveSurveyId,
  loadSurvey,
  loadAnswers,
  saveAnswers,
} from '../storage'

type AnyForm = any
type AnswerMap = Record<string, any>

export default function FormFiller() {
  const nav = useNavigate()
  const { id } = useParams<{ id: string }>() // surveyId
  const [surveyLoaded, setSurveyLoaded] = useState(false)
  const [forms, setForms] = useState<AnyForm[]>([])
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [dirty, setDirty] = useState(false)

  // betöltés: felmérés + első űrlap kiválasztása
  useEffect(() => {
    if (!id) return
    setActiveSurveyId(id)
    const s = loadSurvey(id)
    const all: AnyForm[] = Array.isArray(s?.forms) ? s!.forms : []
    setForms(all)

    // alapértelmezett űrlap kiválasztása
    const firstId = all.length ? String(all[0]?.meta?.id ?? '') : null
    setSelectedFormId(firstId)

    setSurveyLoaded(true)
  }, [id])

  // adott űrlap válaszainak betöltése
  useEffect(() => {
    if (!selectedFormId) { setAnswers({}); return }
    // új felmérésnél üres, meglévőnél betöltjük:
    const a = loadAnswers(selectedFormId) || {}
    setAnswers(a)
    setDirty(false)
  }, [selectedFormId])

  const selectedForm = useMemo(() => {
    if (!selectedFormId) return null
    return forms.find(f => String(f?.meta?.id ?? '') === String(selectedFormId)) ?? null
  }, [forms, selectedFormId])

  function handleChange(fieldId: string, value: any) {
    const next = { ...answers, [fieldId]: value }
    setAnswers(next)
    setDirty(true)
  }

  function onSave() {
    if (!selectedForm) return
    const fid = String(selectedForm.meta?.id ?? '')
    saveAnswers(fid, answers)
    setDirty(false)
    alert('Válaszok elmentve.')
  }

  function onExit() {
    if (dirty) {
      const ok = confirm('Biztosan kilépsz? Győződj meg róla, hogy elmentetted a módosításokat!')
      if (!ok) return
    }
    nav('/')
  }

  // Alap UI – űrlap választó, mezők renderelése, mentés/kilépés
  return (
    <div className="page">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1>Űrlap kitöltése</h1>
        <div className="toolbar" style={{ gap: 8 }}>
          <button className="btn success" onClick={onSave}>Mentés</button>
          <button className="btn" onClick={onExit}>Kilépés</button>
        </div>
      </div>

      {!surveyLoaded && <div className="card">Betöltés…</div>}

      {surveyLoaded && forms.length === 0 && (
        <div className="card">Ehhez a felméréshez még nincs űrlap. Menj a Szerkesztőbe, és adj hozzá egyet.</div>
      )}

      {surveyLoaded && forms.length > 0 && (
        <div className="card">
          <div className="row" style={{ gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label>Űrlap:</label>
            <select
              className="input"
              value={selectedFormId ?? ''}
              onChange={(e) => setSelectedFormId(e.target.value || null)}
            >
              {forms.map((f) => {
                const fid = String(f?.meta?.id ?? '')
                const name = f?.meta?.name ?? 'Névtelen űrlap'
                return <option key={fid} value={fid}>{name}</option>
              })}
            </select>
          </div>

          {!selectedForm && <div className="muted">Nincs kiválasztott űrlap.</div>}

          {selectedForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Ha van fields tömb, megpróbáljuk automatikusan kirajzolni */}
              {Array.isArray(selectedForm.fields) && selectedForm.fields.length > 0 ? (
                <>
                  {selectedForm.fields.map((fld: any, idx: number) => {
                    const fid = String(fld?.id ?? idx)
                    const type = String(fld?.type ?? 'text')
                    const label = fld?.label ?? `Mező #${idx + 1}`
                    const placeholder = fld?.placeholder ?? ''
                    const value = answers[fid] ?? (type === 'checkbox' ? false : '')

                    return (
                      <div key={fid} style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{label}</label>
                        {type === 'textarea' && (
                          <textarea
                            className="input"
                            rows={4}
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => handleChange(fid, e.target.value)}
                          />
                        )}
                        {type === 'number' && (
                          <input
                            className="input"
                            type="number"
                            placeholder={placeholder}
                            value={String(value)}
                            onChange={(e) => handleChange(fid, e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        )}
                        {type === 'checkbox' && (
                          <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => handleChange(fid, e.target.checked)}
                          />
                        )}
                        {type !== 'textarea' && type !== 'number' && type !== 'checkbox' && (
                          <input
                            className="input"
                            type="text"
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => handleChange(fid, e.target.value)}
                          />
                        )}
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className="muted">
                  Ehhez az űrlaphoz nem találtam <code>fields</code> tömböt. A válaszmezők itt nem generálhatók automatikusan.
                  A szerkesztőben (JSON mód) hozhatsz létre mezőket.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
