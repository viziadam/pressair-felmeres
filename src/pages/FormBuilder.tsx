

// import { useEffect, useMemo, useState, useRef } from 'react'
// import { v4 as uuid } from 'uuid'
// import type { AnswerMap, FormData, FormElement, Globals, FileItem } from '../types'
// import { loadGlobals } from '../storage'
// import { SURVEY_TABS } from '../constants'
// import A4Page from '../components/A4Page'
// import InlineInkCanvas from '../components/InlineInkCanvas'
// import FieldRow from '../components/FieldRow'
// import { loadTemplateForTab, saveTemplateForTab } from '../storage/formsLib'
// import { EMPTY } from '../types'

// import { MACHINE_TYPES, MachineType, DETAIL_TEMPLATES, MachineDetailElement, 
//          SimpleDetailInstance, SYSTEM_TEMPLATE, TANK_TEMPLATE, TitleElement, 
//          SystemSurveyElement, TankDetailElement, ModuleField, SYSTEM_SECTIONS, 
//          SystemSurveyInstance } from '../types'

// import { ImageUploaderWithInk, FileUploader } from '../components/FormComponents'
// import { formDesign } from './FormFillerEmbed' 

// const INK_KEY = (id: string) => `__ink__${id}`

// const INK_GLOBAL_CSS = `
//   .ink-box { position: relative; margin-top: 8px; width: 100%; min-height: 150px; box-sizing: border-box; }
//   .ink-box > div { width: 100% !important; max-width: 100% !important; min-width: 100% !important; resize: vertical !important; overflow: hidden !important; }
// `;

// function nextIndexForType(instances: any[] | undefined, t: MachineType) {
//   return 1 + (instances || []).filter(x => x.machineType === t).length;
// }

// const sortInstancesByType = (instances: any[]) => {
//   return [...(instances || [])].sort((a, b) => {
//     const idxA = MACHINE_TYPES.indexOf(a.machineType);
//     const idxB = MACHINE_TYPES.indexOf(b.machineType);
//     return (idxA > -1 ? idxA : 999) - (idxB > -1 ? idxB : 999);
//   });
// };

// export default function FormBuilder() {
//   const [selectedTab, setSelectedTab] = useState<string>(SURVEY_TABS[0])
//   const [form, setForm] = useState<FormData | null>(null)
//   const [answers] = useState<AnswerMap>({})
//   const [globals, setGlobals] = useState<Globals>(EMPTY);
//   const fileTplRef = useRef<HTMLInputElement>(null)

//   useEffect(() => { setGlobals(loadGlobals()) }, [])

//   useEffect(() => {
//     loadTemplateForTab(selectedTab).then((tpl) => {
//       if (tpl) setForm(structuredClone(tpl))
//       else setForm({ meta: { id: crypto.randomUUID(), name: selectedTab }, elements: [] })
//     })
//   }, [selectedTab])

//   const elements = useMemo(() => Array.isArray(form?.elements) ? (form!.elements as FormElement[]) : [], [form])

//   async function readAsText(f: File): Promise<string> {
//     return await new Promise((res, rej) => {
//       const r = new FileReader(); r.onload = () => res(String(r.result || '')); r.onerror = () => rej(r.error); r.readAsText(f, 'utf-8');
//     })
//   }

//   function sanitizeFileName(s: string){ return (s || 'template').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').slice(0, 120); }

//   async function exportCurrentTemplate(form: FormData | null) {
//     if (!form) { alert('Nincs sablon betöltve.'); return; }
//     const data = JSON.stringify(form, null, 2);
//     const suggestedName = sanitizeFileName(form.meta?.name || 'template') + '.json';
//     try {
//       if (typeof (window as any).showSaveFilePicker === 'function') {
//         const handle = await (window as any).showSaveFilePicker({ suggestedName, types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }], excludeAcceptAllOption: false });
//         const writable = await handle.createWritable();
//         await writable.write(new Blob([data], { type:'application/json' }));
//         await writable.close();
//         alert('Sablon exportálva.'); return;
//       }
//     } catch (err) { console.warn('showSaveFilePicker fallback:', err); }
//     const blob = new Blob([data], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a'); a.href = url; a.download = suggestedName;
//     document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
//   }

//   async function importTemplates(files: FileList | null) {
//     if (!files || files.length === 0) return;
//     try {
//       const f = files[0]; const raw = await readAsText(f);
//       const parsed = JSON.parse(raw); const tpl = Array.isArray(parsed) ? parsed[0] : parsed;
//       if (!tpl?.meta) tpl.meta = {}; tpl.meta.id = crypto.randomUUID(); tpl.meta.name = selectedTab;
//       setForm(tpl);
//       const ok = await saveTemplateForTab(selectedTab, tpl);
//       if (!ok) alert("Figyelem: A sablon megjelent, de nem sikerült elmenteni a szerverre!");
//     } catch (err) {
//       alert("Hiba történt a sablon beolvasásakor! Biztos, hogy jó JSON fájlt választottál?");
//     } finally {
//       if (fileTplRef.current) fileTplRef.current.value = '';
//     }
//   }

//   async function saveFormToServer() {
//     if (!form) return
//     const ok = await saveTemplateForTab(form?.meta?.name || "Rendszer", form)
//     if (ok) alert("Sablon elmentve a szerverre.")
//     else alert("Hiba: nem sikerült elmenteni a sablont a szerverre.")
//   }

//   function swap(i:number,j:number){ if(!form||i===j)return; const els=[...(form.elements||[])]; [els[i],els[j]]=[els[j],els[i]]; setForm({...form,elements:els}) }
//   function onDragStart(e:React.DragEvent, idx:number){ e.dataTransfer.setData('text/plain', String(idx)); e.dataTransfer.effectAllowed='move' }
//   function onDragOver(e:React.DragEvent){ e.preventDefault(); e.dataTransfer.dropEffect='move' }
//   function onDrop(e:React.DragEvent, destIdx:number){ e.preventDefault(); const src = Number(e.dataTransfer.getData('text/plain')); if(Number.isFinite(src)) swap(src, destIdx) }

//   function toggleInk(elId:string,on:boolean){
//     if(!form) return
//     const els = (form.elements||[]).map(el => el.id===elId ? ({...el, ink:{enabled:on}}) : el)
//     setForm({...form, elements: els})
//   }

//   function uid(){ let id=uuid(); while((form?.elements||[]).some((e:any)=>e.id===id)) id=uuid(); return id }
//   function addText(){ const id=uid(); const el:FormElement={id,type:'text',label:'Szöveg',grid:{i:id,x:0,y:(form?.elements||[]).length,w:12,h:1},ink:{enabled:false}} as any; setForm(prev=>prev?({...prev,elements:[...(prev.elements||[]),el]}):prev) }
//   function addComment(){ const id=uid(); const el:FormElement={id,type:'comment',label:'Megjegyzés',grid:{i:id,x:0,y:(form?.elements||[]).length,w:12,h:1},ink:{enabled:false}} as any; setForm(prev=>prev?({...prev,elements:[...(prev.elements||[]),el]}):prev) }
//   function addDropdown(){ const id=uid(); const el:FormElement={id,type:'dropdown',label:'Legördülő',grid:{i:id,x:0,y:(form?.elements||[]).length,w:12,h:1},ink:{enabled:false},options:['Opció 1','Opció 2']} as any; setForm(prev=>prev?({...prev,elements:[...(prev.elements||[]),el]}):prev) }
  
//   function addMachineSimpleModule() {
//     const id = uuid(); const t: MachineType = MACHINE_TYPES[0];
//     const inst = { id: uuid(), title: `${t} 1`, open: true, machineType: t, fields: [ { key:'manufacturer', label:'Gyártó' }, { key:'model', label:'Típus' } ] };
//     const el = { id, type:'module_machine_simple', label:'Gép (egyszerű) modul', grid:{ i:id, x:0, y:elements.length, w:12, h:1 }, ink:{ enabled:false }, instances:[inst] } as const;
//     setForm(prev => prev ? ({...prev, elements:[...(prev.elements||[]), el as any]}) : prev);
//   }
  
//   function addFile(){
//     const id = uuid(); const el = { id, type:'file', label:'Csatolmányok', grid:{i:id,x:0,y:elements.length,w:12,h:1}, ink:{enabled:false}, multiple:true } as const
//     setForm(prev => prev ? ({...prev, elements:[...prev.elements, el as any]}) : prev)
//   }
//   function addImages(){
//     const id = uid(); const el = { id, type: 'images', label: 'Képfeltöltés (kitöltéskor)', grid: { i:id, x:0, y:elements.length, w:12, h:1 }, ink: { enabled:false } } as const;
//     setForm(prev => prev ? ({...prev, elements:[...prev.elements, el as any]}) : prev);
//   }
//   function addSketch(){
//     const id = uuid(); const el = { id, type:'sketch', label:'Szabadkézi rajz', grid:{i:id,x:0,y:elements.length,w:12,h:1}, height:260 } as const
//     setForm(prev => prev ? ({...prev, elements:[...prev.elements, el as any]}) : prev)
//   }
//   function addTitle(){
//     const id = uid(); const el: TitleElement = { id, type: 'title', label: 'Új cím', grid: { i:id, x:0, y:(form?.elements||[]).length, w:12, h:1 }, showNote: false, note: '' };
//     setForm(prev => prev ? ({ ...prev, elements:[...(prev.elements||[]), el] }) : prev);
//   }
//   function addSystemSurveyModule() {
//     const id = uuid();
//     const fields: ModuleField[] = SYSTEM_SECTIONS.flatMap(sec => sec.fields.map(f => ({ key: `${sec.code}_${f.key}`, label: f.label })) );
//     const inst: SystemSurveyInstance = { id: uuid(), index: 0, open: true, fields };
//     const el: SystemSurveyElement = { id, type: 'module_system_survey', label: 'Rendszer (3.0–18.0) modul', grid: { i:id, x:0, y:elements.length, w:12, h:1 }, ink: { enabled:false }, instances: [inst] };
//     setForm(prev => prev ? ({ ...prev, elements:[...(prev.elements||[]), el] }) : prev);
//   }
//   function addTankDetailModule() {
//     const id = uuid(); const specs = TANK_TEMPLATE;
//     const inst: SimpleDetailInstance = { id: uuid(), title: 'Tartály 1', open: true, fields: specs.map(s => ({ key: s.key, label: s.label })) };
//     const el: TankDetailElement = { id, type: 'module_tank_detail', label: 'Tartály modul', grid: { i:id, x:0, y:elements.length, w:12, h:1 }, ink: { enabled:false }, instances: [inst] };
//     setForm(prev => prev ? ({ ...prev, elements:[...(prev.elements||[]), el] }) : prev);
//   }
//   function addNoteText(){
//     const id = uid(); const el: FormElement = { id, type:'note_text', label:'Megjegyzés', grid:{ i:id, x:0, y:(form?.elements||[]).length, w:12, h:1 } } as any;
//     setForm(prev=>prev?({...prev, elements:[...(prev.elements||[]), el]}):prev);
//   }
//   function addDropdownMulti(){
//     const id = uid(); const el: FormElement = { id, type:'dropdown_multi', label:'Többválasztós legördülő', grid:{ i:id, x:0, y:(form?.elements||[]).length, w:12, h:1 }, options:['Opció 1','Opció 2','Opció 3'] } as any;
//     setForm(prev=>prev?({...prev, elements:[...(prev.elements||[]), el]}):prev);
//   }
  
//   // ITT VOLT A HIBA - Kijavítva = jelre
//   function addMachineDetailModule() {
//     const id = uuid(); 
//     const t: MachineType = MACHINE_TYPES[0]; // <-- JAVÍTVA
//     const inst = { id: uuid(), title: `${t} 1`, open: true, machineType: t, fields: (DETAIL_TEMPLATES[t] || []).map(s => ({ key: s.key, label: s.label })) };
//     const el: MachineDetailElement = { id, type:'module_machine_detail', label:'Gép (részletes) modul', grid:{ i:id, x:0, y:elements.length, w:12, h:1 }, ink:{ enabled:false }, instances:[inst] };
//     setForm(prev => prev ? ({...prev, elements:[...(prev.elements||[]), el]}) : prev);
//   }

//   const [activeId, setActiveId] = useState<string | null>(null)
//   const cardRef = useRef<HTMLDivElement>(null)
//   function setActive(elId: string) { setActiveId(elId) }
//   function deleteElement(elId: string) {
//     setForm(prev => { if (!prev) return prev; return { ...prev, elements: (prev.elements || []).filter((e:any) => e.id !== elId) } })
//     setActiveId(prev => (prev === elId ? null : prev))
//   }
//   function patchElement(elId: string, patch: Partial<FormElement & { hideLabel?: boolean; options?: string[] }>) {
//     setForm(prev => { if (!prev) return prev; return { ...prev, elements: (prev.elements || []).map((e:any) => e.id === elId ? ({ ...e, ...patch }) : e) } })
//   }
//   function setOptions(elId: string, opts: string[]) {
//     setForm(prev => { if (!prev) return prev; return { ...prev, elements: (prev.elements || []).map((e:any) => e.id === elId ? { ...e, options: opts } : e) } })
//   }

//   const activeEl = useMemo(() => elements.find(e => e.id === activeId), [elements, activeId])
//   const TrashIcon = (<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M9 3h6a1 1 0 0 1 1 1v1h4v2H4V5h4V4a1 1 0 0 1 1-1zm1 5h2v10h-2V8zm4 0h2v10h-2V8zM7 8h2v10H7V8z" fill="currentColor"/></svg>)

//   const panelVisible = Boolean(activeEl)
//   const panelStyle: React.CSSProperties = {
//     position: 'fixed', right: 16, top: 120, width: 320, maxWidth: '85vw', background: '#fff',
//     border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
//     padding: 12, zIndex: 1000, transform: panelVisible ? 'translateX(0)' : 'translateX(16px)',
//     opacity: panelVisible ? 1 : 0, pointerEvents: panelVisible ? 'auto' : 'none', transition: 'opacity 150ms ease, transform 150ms ease'
//   }

//   const pillStyle: React.CSSProperties = { display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 12, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }
//   const actionBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid #ef4444', background: '#fff', color: '#b91c1c', cursor: 'pointer' }
//   const fieldLabelStyle: React.CSSProperties = { fontSize: 12, color: '#6b7280', marginBottom: 4 }
//   const textInputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }
//   const smallBtn: React.CSSProperties = { padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }
//   const activeOutline: React.CSSProperties = { outline: '2px solid #2563eb', outlineOffset: 2, borderRadius: 8 }

//   return (
//     <div className="card" ref={cardRef} onClick={()=>setActiveId(null)}>
//       <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:8}}>
//         <label>
//           Felmérés
//           <select className="input" value={selectedTab} onChange={e=>setSelectedTab(e.target.value)}>
//             {SURVEY_TABS.map(tab => <option key={tab} value={tab}>{tab}</option>)}
//           </select>
//         </label>
//         <span style={{flex:1}} />
//         <button className="btn" onClick={addText}>+ Szöveg</button>
//         <button className="btn" onClick={addDropdown}>+ Legördülő</button>
//         <button className="btn" onClick={addComment}>+ Komment</button>
//         <button className="btn" onClick={addMachineSimpleModule}>+ Gép (egyszerű)</button>
//         <button className="btn" onClick={addMachineDetailModule}>+ Gép (részletes)</button>
//         <button className="btn" onClick={addFile}>+ Fájlfeltöltés</button>
//         <button className="btn" onClick={addImages}>+ Képfeltöltés</button>
//         <button className="btn" onClick={addSketch}>+ Szabadkézi rajz</button>
//         <button className="btn" onClick={addTitle}>+ Cím</button>
//         <button className="btn" onClick={addNoteText}>+ Szöveges megjegyzés</button>
//         <button className="btn" onClick={addDropdownMulti}>+ Többválasztós legördülő</button>
//         <button className="btn" onClick={addSystemSurveyModule}>+ Rendszer</button>
//         <button className="btn" onClick={addTankDetailModule}>+ Tartály</button>
//         <button className="btn success" onClick={saveFormToServer}>Mentés</button>
//       </div>

//       <div style={{ marginTop: 8 }}>
//         <button className="btn" onClick={() => fileTplRef.current?.click()}>Sablon importálása (.json)</button>
//         <input ref={fileTplRef} type="file" accept=".json,application/json" multiple style={{ display: 'none' }} onChange={(e) => { importTemplates(e.target.files); e.currentTarget.value = ''; }} />
//       </div>

//       <div style={{ marginTop: 8 }}>
//         <button className="btn" onClick={()=>exportCurrentTemplate(form)} title="Az aktuális sablon exportálása .json fájlba">Sablon exportálása (.json)</button>
//       </div>

//       <A4Page globals={globals} surveyName={selectedTab}>
//         <style>{INK_GLOBAL_CSS}</style>
//         <div className="list" onClick={(e)=>e.stopPropagation()}>
//           {elements.map((el: any, idx: number) => {
//             const inkEnabled = !!el?.ink?.enabled
//             const inkValue = undefined // preview
//             const dragProps = { draggable: true, onDragStart: (e: React.DragEvent) => onDragStart(e, idx), onDragOver, onDrop: (e: React.DragEvent) => onDrop(e, idx) }
//             const hideableTypes = new Set(['sketch','file','images']);
//             const shouldHideLabel = hideableTypes.has(el.type) && !!el.hideLabel;
//             const labelShown = shouldHideLabel ? '' : el.label;

//             const labelEditable = (
//               <span
//                 contentEditable suppressContentEditableWarning
//                 onBlur={(e)=>{
//                   const text = e.currentTarget.textContent || ''
//                   if (text.trim() && text !== el.label){ const els = (form!.elements||[]).slice(); els[idx] = { ...el, label: text }; setForm({ ...form!, elements: els }) } 
//                   else { e.currentTarget.textContent = el.label }
//                 }}
//               >{labelShown}</span>
//             ) as unknown as string

//             const onRowContextMenu = (e: React.MouseEvent) => {
//               e.preventDefault(); const choice = window.prompt('Művelet:\n1 = Komment BE/KI\n2 = Törlés', '1');
//               if (choice==='1') toggleInk(el.id, !el?.ink?.enabled)
//               if (choice==='2') setForm(prev => prev ? ({...prev, elements: (prev.elements||[]).filter((_x: any, i: number)=>i!==idx)}) : prev)
//             }

//             const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
//               <div key={el.id} onClick={(ev)=>{ ev.stopPropagation(); setActive(el.id) }} onContextMenu={onRowContextMenu} style={activeId === el.id ? activeOutline : undefined}>{children}</div>
//             )

//             if (el.type === 'text' || el.type === 'dropdown') {
//               return (
//                 <Wrapper>
//                   <FieldRow label={labelEditable} withHandle dragProps={dragProps} inkPanel={inkEnabled ? (
//                       <div className="ink-box">
//                         <button type="button" className="ink-clear-abs" onClick={()=>{ const els = (form!.elements || []).slice(); els[idx] = { ...els[idx], ink: { ...(els[idx].ink || {}), enabled: false } }; setForm({ ...form!, elements: els }); }}>×</button>
//                         <InlineInkCanvas value={inkValue} onChange={()=>{}} emitInitialRect={false} />
//                       </div>
//                     ) : undefined}>
//                     <div className="field-wrap">
//                       {el.type === 'text' && <input className="input" style={formDesign.input} placeholder={el.placeholder || ''} value={''} onChange={()=>{}} />}
//                       {el.type === 'dropdown' && (
//                         <select className="input" style={formDesign.input} value={''} onChange={()=>{}}>
//                           <option value="" disabled>Válassz...</option>
//                           {(el.options ?? []).map((o: string, i2: number) => <option key={i2} value={o}>{o}</option>)}
//                         </select>
//                       )}
//                       <button type="button" className="icon-inline" onClick={()=>toggleInk(el.id, !inkEnabled)} title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}>✎</button>
//                     </div>
//                   </FieldRow>
//                 </Wrapper>
//               )
//             }

//             if (el.type === 'comment') {
//               return (
//                 <Wrapper>
//                   <FieldRow label={labelEditable} withHandle dragProps={dragProps}>
//                     <div className="ink-wrapper" style={{width:'100%'}}>
//                       <button type="button" className="ink-clear" title="Tartalom törlése">×</button>
//                       <InlineInkCanvas value={undefined} onChange={()=>{}} />
//                     </div>
//                   </FieldRow>
//                 </Wrapper>
//               )
//             }

//             if (el.type === 'file') {
//               return (
//                 <Wrapper>
//                   <FieldRow label={labelEditable} withHandle dragProps={dragProps}>
//                     <div className="uploader-preview disabled" style={{width:'100%'}}>
//                       <div className="hint small">Fájl feltöltés a kitöltéskor érhető el.</div>
//                       <div style={{display:'flex', flexWrap:'wrap', gap:8}}><div className="file-chip ghost small">minta_dokumentum.pdf</div></div>
//                     </div>
//                   </FieldRow>
//                 </Wrapper>
//               );
//             }

//             if (el.type === 'images') {
//               return (
//                 <Wrapper>
//                   <FieldRow label={labelEditable} withHandle dragProps={dragProps}>
//                     <div className="uploader-preview disabled" style={{width:'100%'}}>
//                       <div className="hint small">Képfeltöltés a kitöltéskor érhető el.</div>
//                       <div className="image-grid">
//                         <div className="image-tile ghost"><div className="resize-box" style={{minHeight:140}} /></div>
//                         <div className="image-tile ghost"><div className="resize-box" style={{minHeight:100}} /></div>
//                       </div>
//                     </div>
//                   </FieldRow>
//                 </Wrapper>
//               );
//             }

//             if (el.type === 'sketch') {
//               return (
//                 <Wrapper>
//                   <FieldRow label={labelEditable} withHandle dragProps={dragProps}>
//                     <div className="ink-wrapper" style={{width:'100%'}}>
//                       <button type="button" className="ink-clear">×</button>
//                       <InlineInkCanvas value={undefined} onChange={()=>{}} />
//                     </div>
//                   </FieldRow>
//                 </Wrapper>
//               )
//             }

//             if (el.type === 'title') {
//               return (
//                 <Wrapper>
//                   <div {...dragProps} style={{padding:'6px 0', display:'flex', alignItems:'center'}}>
//                     <h3 contentEditable suppressContentEditableWarning onBlur={(e)=>{ const text = (e.currentTarget.textContent||'').trim(); if (text && text !== el.label){ const els = (form!.elements||[]).slice(); els[idx] = { ...el, label: text }; setForm({ ...form!, elements: els }); } else { e.currentTarget.textContent = el.label; } }} style={{margin:0, fontSize:18, fontWeight:700, width:'100%'}}>
//                       {el.label}
//                     </h3>
//                   </div>
//                   {el.showNote && el.note && <div style={{ marginTop:2, color:'#6b7280', fontSize:12 }}>{el.note}</div>}
//                 </Wrapper>
//               );
//             }

//             if (el.type === 'note_text') {
//               return (
//                 <Wrapper>
//                   <FieldRow label={labelEditable} withHandle dragProps={dragProps}>
//                     <div className="field-wrap" style={{width:'100%'}}>
//                       <div className="input" style={{ width:'100%', minHeight:36, lineHeight:'20px', whiteSpace:'pre-wrap', opacity:0.5 }}>(Kitöltéskor gépelhető megjegyzés)</div>
//                     </div>
//                   </FieldRow>
//                 </Wrapper>
//               )
//             }

//             if (el.type === 'dropdown_multi') {
//               return (
//                 <Wrapper>
//                   <FieldRow label={labelEditable} withHandle dragProps={dragProps}>
//                     <div className="field-wrap" style={{width:'100%'}}><div className="hint small" style={{opacity:0.7}}>Több válasz kiválasztható lesz a kitöltéskor.</div></div>
//                   </FieldRow>
//                 </Wrapper>
//               )
//             }

//             if (el.type === 'module_machine_simple') {
//               return (
//                 <div key={el.id} style={{ width:'100%' }}>
//                   <div style={{ display:'flex', gap:8, marginBottom:16, alignItems: 'center' }}>
//                     <select id={`add-select-${el.id}`} className="input" style={{...formDesign.input, width: '200px', padding: '6px 12px'}} defaultValue={MACHINE_TYPES[0]}>
//                       {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                     </select>
//                     <button className="btn" style={formDesign.btnSecondary} onClick={()=>{
//                         const sel = document.getElementById(`add-select-${el.id}`) as HTMLSelectElement;
//                         const t: MachineType = (sel?.value as MachineType) || MACHINE_TYPES[0];
//                         const inst = { id: uuid(), title: `${t} ${nextIndexForType(el.instances, t)}`, open: true, machineType: t, fields: [ { key:'manufacturer', label:'Gyártó' }, { key:'model', label:'Típus' } ] };
//                         el.instances = [ ...(el.instances||[]), inst ];
//                         setForm(prev => prev ? structuredClone(prev) : prev);
//                       }}>+ Hozzáadás</button>
//                   </div>

//                   {sortInstancesByType(el.instances).map((inst: any) => (
//                     <div key={inst.id} style={formDesign.card}>
//                       <div style={formDesign.cardHeader}>
//                         <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
//                         <div style={{ display:'flex', gap:8 }}>
//                           <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setForm(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                           <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setForm(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
//                         </div>
//                       </div>

//                       {inst.open && (
//                         <>
//                           <div style={formDesign.fieldGroup}>
//                             <label style={formDesign.label}>Gép típusa</label>
//                             <select className="input" style={formDesign.input} value={inst.machineType} onChange={(e)=>{
//                                 const newType = e.target.value as MachineType;
//                                 inst.machineType = newType; inst.title = `${newType} ${nextIndexForType((el.instances||[]).filter((x:any)=>x.id!==inst.id), newType)}`;
//                                 setForm(prev => prev ? structuredClone(prev) : prev);
//                               }}>
//                               {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                             </select>
//                           </div>
                          
//                           {['manufacturer','model'].map((k) => (
//                             <div key={k} style={formDesign.fieldGroup}>
//                               <label style={formDesign.label}>{k==='manufacturer'?'gyártó':'típus'}</label>
//                               <input className="input" style={formDesign.input} value={''} onChange={()=>{}} />
//                             </div>
//                           ))}
//                         </>
//                       )}

//                       <div style={formDesign.fieldGroup}>
//                         <label style={formDesign.label}>Megjegyzés</label>
//                         <div className="ink-wrapper" style={{width:'100%'}}>
//                           <button type="button" className="ink-clear">×</button>
//                           <InlineInkCanvas value={undefined} onChange={()=>{}} emitInitialRect={false} />
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               );
//             }

//             if (el.type === 'module_machine_detail') {
//               return (
//                 <div key={el.id} style={{ width:'100%' }}>
//                   <div style={{ display:'flex', gap:8, marginBottom:16, alignItems: 'center' }}>
//                     <select id={`add-select-${el.id}`} className="input" style={{...formDesign.input, width: '200px', padding: '6px 12px'}} defaultValue={MACHINE_TYPES[0]}>
//                       {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                     </select>
//                     <button className="btn" style={formDesign.btnSecondary} onClick={()=>{
//                         const sel = document.getElementById(`add-select-${el.id}`) as HTMLSelectElement;
//                         const t: MachineType = (sel?.value as MachineType) || MACHINE_TYPES[0];
//                         const specs = DETAIL_TEMPLATES[t] || [];
//                         el.instances = [...(el.instances||[]), { id:uuid(), title:`${t} ${nextIndexForType(el.instances, t)}`, open:true, machineType:t, fields: specs.map(s=>({key:s.key,label:s.label, value: ''})) }];
//                         setForm(prev=>prev?structuredClone(prev):prev);
//                       }}>+ Hozzáadás</button>
//                   </div>

//                   {sortInstancesByType(el.instances).map((inst: any) => {
//                     const specs = DETAIL_TEMPLATES[inst.machineType] || [];
//                     if ((inst.fields?.length ?? 0) !== specs.length) { inst.fields = specs.map((s:any)=>({ key:s.key, label:s.label, value: (inst.fields||[]).find((f:any)=>f.key===s.key)?.value ?? '' })); }

//                     return (
//                       <div key={inst.id} style={formDesign.card}>
//                         <div style={formDesign.cardHeader}>
//                           <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
//                           <div style={{ display:'flex', gap:8 }}>
//                             <button style={formDesign.btnSecondary} onClick={()=>{ inst.open=!inst.open; setForm(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                             <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setForm(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
//                           </div>
//                         </div>

//                         {inst.open && (
//                           <>
//                             <div style={formDesign.fieldGroup}>
//                               <label style={formDesign.label}>Gép típusa</label>
//                               <select className="input" style={formDesign.input} value={inst.machineType} onChange={(e)=>{
//                                   const newType = e.target.value as MachineType;
//                                   inst.machineType = newType; inst.title = `${newType} ${nextIndexForType(el.instances?.filter((x:any)=>x.id!==inst.id), newType)}`;
//                                   inst.fields = (DETAIL_TEMPLATES[newType] || []).map((s:any)=>({ key:s.key, label:s.label }));
//                                   setForm(prev=>prev?structuredClone(prev):prev);
//                                 }}>
//                                 {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                               </select>
//                             </div>

//                             {specs.map((spec:any)=>{
//                               return (
//                                 <div key={spec.key} style={formDesign.fieldGroup}>
//                                   <label style={formDesign.label}>{spec.label}</label>
//                                   <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//                                     {spec.input === 'select' ? (
//                                       <select className="input" value={''} onChange={()=>{}} style={formDesign.input}>
//                                         <option value="" disabled>Válassz…</option>
//                                         {(spec.options||[]).map((opt:string)=> <option key={opt} value={opt}>{opt}</option>)}
//                                       </select>
//                                     ) : (
//                                       <input className="input" value={''} onChange={()=>{}} style={formDesign.input} />
//                                     )}
//                                     {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
//                                   </div>
//                                 </div>
//                               );
//                             })}

//                             <div style={formDesign.fieldGroup}>
//                               <label style={formDesign.label}>Gépállapot általános leírása</label>
//                               <textarea className="input" rows={1} style={{...formDesign.input, resize: 'none'}} disabled placeholder="(Kitöltéskor gépelhető megjegyzés)" />
//                             </div>
//                             <div style={formDesign.fieldGroup}>
//                                <label style={formDesign.label}>Fotók helye</label>
//                                <div className="hint small" style={{opacity:0.7}}>(Képfeltöltés kitöltéskor)</div>
//                             </div>
//                           </>
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               );
//             }

//             if (el.type === 'module_system_survey') {
//               const nextIndex = (instances?: SystemSurveyInstance[]) => 1 + Math.max(0, ...((instances||[]).map(i => i.index)));

//               return (
//                 <div key={el.id} style={{ width:'100%' }}>
//                   <button className="btn" style={{...formDesign.addBtn, marginBottom: '16px'}} onClick={()=>{
//                       const idx = nextIndex(el.instances);
//                       const fields: ModuleField[] = SYSTEM_SECTIONS.flatMap(sec => sec.fields.map(f => ({ key: `${sec.code}_${f.key}`, label: f.label })) );
//                       el.instances = [ ...(el.instances || []), { id: uuid(), index: idx, open: true, fields } ];
//                       setForm(prev => prev ? structuredClone(prev) : prev);
//                     }}>+ Rendszer hozzáadása</button>

//                   {(el.instances || []).map((inst: any) => (
//                     <div key={inst.id} style={formDesign.card}>
//                       <div style={formDesign.systemHeaderBar}>
//                         <div style={formDesign.systemHeaderTitle}>BLOKK: {inst.index === 0 ? 'ÁLTALÁNOS (3.0–18.0)' : `RENDSZER ${inst.index} (3.${inst.index}–18.${inst.index})`}</div>
//                         <div style={{ display:'flex', gap:8 }}>
//                           <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setForm(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                           {inst.index !== 0 && <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any) => x.id !== inst.id); setForm(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>}
//                         </div>
//                       </div>

//                       {inst.open && (
//                         <div>
//                           {SYSTEM_SECTIONS.map((sec) => {
//                             const secNo = `${sec.code}.${inst.index}`;
//                             return (
//                               <div key={`${inst.id}:${sec.code}`}>
//                                 <div style={formDesign.systemSubTitle}>{secNo} {sec.title}</div>
//                                 {sec.fields.map((spec) => (
//                                   <div key={`${sec.code}_${spec.key}`} style={formDesign.fieldGroup}>
//                                     <label style={formDesign.label}>{spec.label}</label>
//                                     <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
//                                       {spec.input === 'text' && <input className="input" style={formDesign.input} value={''} onChange={()=>{}} />}
//                                       {spec.input === 'select' && (
//                                         <select className="input" style={formDesign.input} value={''} onChange={()=>{}}>
//                                           <option value="" disabled>Válassz…</option>
//                                           {(spec.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
//                                         </select>
//                                       )}
//                                       {spec.input === 'dropdown_multi' && (
//                                         <select className="input" style={formDesign.input} value={''} onChange={()=>{}}><option value="" disabled>Többválasztós (kitöltéskor)…</option></select>
//                                       )}
//                                       {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
//                                     </div>
//                                   </div>
//                                 ))}
//                                 {sec.photoKey && (
//                                   <div style={formDesign.fieldGroup}>
//                                     <label style={formDesign.label}>Fotók helye</label>
//                                     <div className="hint small" style={{opacity:0.7}}>(Képfeltöltés kitöltéskor)</div>
//                                   </div>
//                                 )}
//                               </div>
//                             );
//                           })}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               );
//             }

//             if (el.type === 'module_system_detail' || el.type === 'module_tank_detail') {
//               const specs = el.type === 'module_system_detail' ? SYSTEM_TEMPLATE : TANK_TEMPLATE;
//               const titleBase = el.type === 'module_system_detail' ? 'Rendszer' : 'Tartály';

//               return (
//                 <div key={el.id} style={{ width:'100%' }}>
//                   <button className="btn" style={{...formDesign.addBtn, marginBottom: '16px'}} onClick={()=>{
//                       const inst: SimpleDetailInstance = { id: uuid(), title: `${titleBase} ${1 + ((el.instances || []).length || 0)}`, open: true, fields: specs.map(s => ({ key:s.key, label:s.label })) };
//                       el.instances = [ ...(el.instances || []), inst ];
//                       setForm(prev=>prev?structuredClone(prev):prev);
//                     }}>+ {titleBase} hozzáadása</button>

//                   {(el.instances || []).map((inst: SimpleDetailInstance) => {
//                     if ((inst.fields?.length ?? 0) !== specs.length) { inst.fields = specs.map(s=>({ key:s.key, label:s.label, value: '' })); }

//                     return (
//                       <div key={inst.id} style={formDesign.card}>
//                         <div style={formDesign.cardHeader}>
//                           <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
//                           <div style={{ display:'flex', gap:8 }}>
//                             <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setForm(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                             <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances || []).filter((x:SimpleDetailInstance)=>x.id!==inst.id); setForm(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
//                           </div>
//                         </div>

//                         {inst.open && (
//                           <>
//                             {specs.map(spec => (
//                               <div key={spec.key} style={formDesign.fieldGroup}>
//                                 <label style={formDesign.label}>{spec.label}</label>
//                                 <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//                                   {spec.input === 'select' ? (
//                                     <select className="input" style={formDesign.input} value={''} onChange={()=>{}}>
//                                       <option value="" disabled>Válassz…</option>
//                                       {(spec.options||[]).map((opt:string)=> <option key={opt} value={opt}>{opt}</option>)}
//                                     </select>
//                                   ) : (
//                                     <input className="input" style={formDesign.input} value={''} onChange={()=>{}} />
//                                   )}
//                                   {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
//                                 </div>
//                               </div>
//                             ))}
//                           </>
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               );
//             }

//             return null
//           })}
//         </div>
//       </A4Page>

//       {/* === Jobb oldali szerkesztő panel === */}
//       <div style={panelStyle} onClick={(e)=>e.stopPropagation()}>
//         {activeEl ? (
//           <>
//             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
//               <div style={{fontWeight:600}}>{activeEl.label || 'Elem'}</div>
//               <button onClick={()=>setActiveId(null)} title="Panel bezárása" style={{border:'1px solid #e5e7eb', background:'#fff', borderRadius:6, width:24, height:24, lineHeight:'22px', textAlign:'center', cursor:'pointer'}}>×</button>
//             </div>
//             <div style={{marginBottom:12}}><span style={pillStyle}>{activeEl.type}</span></div>

//             <div style={{display:'flex', gap:8, marginBottom:12}}>
//               <button onClick={()=>deleteElement(activeEl.id)} title="Elem törlése" style={actionBtnStyle}>
//                 {TrashIcon}<span>Törlés</span>
//               </button>
//             </div>

//             {(activeEl.type === 'text') && (
//               <div style={{marginTop:8}}>
//                 <div style={fieldLabelStyle}>Címke (bal oldali label)</div>
//                 <input style={textInputStyle} value={activeEl.label || ''} onChange={(e)=>patchElement(activeEl.id, { label: e.target.value })} placeholder="Címke..." />
//               </div>
//             )}

//             {activeEl?.type === 'title' && (
//               <div className="prop-section">
//                 <label className="row" style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'}}>
//                   <input type="checkbox" checked={!!(activeEl as TitleElement).showNote} onChange={(e)=>{ const els = (form!.elements || []).slice(); const i = els.findIndex(x => x.id === activeEl.id); if (i > -1) { els[i] = { ...(els[i] as TitleElement), showNote: e.target.checked }; setForm({ ...form!, elements: els }); } }} />
//                   <span style={{fontSize:'13px'}}>Megjegyzés megjelenítése a cím alatt</span>
//                 </label>
//                 <textarea className="input" placeholder="Megjegyzés szövege…" value={(activeEl as TitleElement).note || ''} onChange={(e)=>{ const els = (form!.elements || []).slice(); const i = els.findIndex(x => x.id === activeEl.id); if (i > -1) { els[i] = { ...(els[i] as TitleElement), note: e.target.value }; setForm({ ...form!, elements: els }); } }} rows={3} style={{ width:'100%', resize:'vertical' }} />
//               </div>
//             )}

//             {(activeEl.type === 'dropdown' || activeEl.type === 'dropdown_multi') && (
//               <div style={{marginTop:8}}>
//                 <div style={fieldLabelStyle}>Címke</div>
//                 <input style={{...textInputStyle, marginBottom:12}} value={activeEl.label || ''} onChange={(e)=>patchElement(activeEl.id, { label: e.target.value })} placeholder="Címke..." />

//                 <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
//                   <div style={fieldLabelStyle}>Opciók</div>
//                   <button style={smallBtn} onClick={()=>{ const next = [ ...(activeEl.options || []), '' ]; setOptions(activeEl.id, next); }}>+ Opció</button>
//                 </div>

//                 <div style={{display:'flex', flexDirection:'column', gap:6}}>
//                   {(activeEl.options || []).map((opt: string, i: number) => (
//                     <div key={i} style={{display:'flex', gap:6, alignItems:'center'}}>
//                       <input style={{...textInputStyle, flex:1}} value={opt} placeholder={`Opció #${i+1}`} onChange={(e)=>{ const next = [ ...(activeEl.options || []) ]; next[i] = e.target.value; setOptions(activeEl.id, next); }} />
//                       <button style={smallBtn} title="Fel" onClick={()=>{ if (i===0) return; const next = [ ...(activeEl.options || []) ]; [next[i-1], next[i]] = [next[i], next[i-1]]; setOptions(activeEl.id, next); }}>↑</button>
//                       <button style={smallBtn} title="Le" onClick={()=>{ const next = [ ...(activeEl.options || []) ]; if (i>=next.length-1) return; [next[i], next[i+1]] = [next[i+1], next[i]]; setOptions(activeEl.id, next); }}>↓</button>
//                       <button style={{...smallBtn, borderColor:'#ef4444', color:'#b91c1c'}} title="Törlés" onClick={()=>{ const next = (activeEl.options || []).filter((_x: string, j: number)=> j!==i); setOptions(activeEl.id, next); }}>×</button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {(activeEl.type === 'note_text') && (
//               <div style={{marginTop:8}}>
//                 <div style={fieldLabelStyle}>Címke</div>
//                 <input style={textInputStyle} value={activeEl.label || ''} onChange={(e)=>patchElement(activeEl.id, { label: e.target.value })} placeholder="Megjegyzés..." />
//               </div>
//             )}

//             {(activeEl.type === 'sketch' || activeEl.type === 'file' || activeEl.type === 'images') && (
//               <div style={{marginTop:8}}>
//                 <div style={fieldLabelStyle}>Címke</div>
//                 <input style={{...textInputStyle, marginBottom:10}} value={activeEl.label || ''} onChange={(e)=>patchElement(activeEl.id, { label: e.target.value })} placeholder="Címke..." />
//                 <label style={{display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer'}}>
//                   <input type="checkbox" checked={!!activeEl.hideLabel} onChange={(e)=>patchElement(activeEl.id, { hideLabel: e.target.checked })} />
//                   <span>Cím nélkül jelenjen meg</span>
//                 </label>
//               </div>
//             )}
//           </>
//         ) : (
//           <div className="small" style={{color:'#6b7280'}}>Válassz ki egy elemet a szerkesztéshez.</div>
//         )}
//       </div>
//     </div>
//   )
// }

import { useEffect, useMemo, useState, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import type { AnswerMap, FormData, FormElement, Globals, FileItem } from '../types'
import { loadGlobals } from '../storage'
import { SURVEY_TABS } from '../constants'
import A4Page from '../components/A4Page'
import FieldRow from '../components/FieldRow'
import { loadTemplateForTab, saveTemplateForTab } from '../storage/formsLib'
import { EMPTY } from '../types'
import ResizableInkBox from '../components/ResizableInkBox'

import { MACHINE_TYPES, MachineType, DETAIL_TEMPLATES, MachineDetailElement, 
         SimpleDetailInstance, SYSTEM_TEMPLATE, TANK_TEMPLATE, TitleElement, 
         SystemSurveyElement, TankDetailElement, ModuleField, SYSTEM_SECTIONS, 
         SystemSurveyInstance } from '../types'

import { ImageUploaderWithInk, FileUploader } from '../components/FormComponents'
import { formDesign } from './FormFillerEmbed' 

function nextIndexForType(instances: any[] | undefined, t: MachineType) {
  return 1 + (instances || []).filter(x => x.machineType === t).length;
}

const sortInstancesByType = (instances: any[]) => {
  return [...(instances || [])].sort((a, b) => {
    const idxA = MACHINE_TYPES.indexOf(a.machineType);
    const idxB = MACHINE_TYPES.indexOf(b.machineType);
    return (idxA > -1 ? idxA : 999) - (idxB > -1 ? idxB : 999);
  });
};

export default function FormBuilder() {
  const [selectedTab, setSelectedTab] = useState<string>(SURVEY_TABS[0])
  const [form, setForm] = useState<FormData | null>(null)
  const [globals, setGlobals] = useState<Globals>(EMPTY);
  const fileTplRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setGlobals(loadGlobals()) }, [])

  useEffect(() => {
    loadTemplateForTab(selectedTab).then((tpl) => {
      if (tpl) setForm(structuredClone(tpl))
      else setForm({ meta: { id: crypto.randomUUID(), name: selectedTab }, elements: [] })
    })
  }, [selectedTab])

  const elements = useMemo(() => Array.isArray(form?.elements) ? (form!.elements as FormElement[]) : [], [form])

  async function readAsText(f: File): Promise<string> {
    return await new Promise((res, rej) => {
      const r = new FileReader(); r.onload = () => res(String(r.result || '')); r.onerror = () => rej(r.error); r.readAsText(f, 'utf-8');
    })
  }

  function sanitizeFileName(s: string){ return (s || 'template').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').slice(0, 120); }

  async function exportCurrentTemplate(form: FormData | null) {
    if (!form) { alert('Nincs sablon betöltve.'); return; }
    const data = JSON.stringify(form, null, 2);
    const suggestedName = sanitizeFileName(form.meta?.name || 'template') + '.json';
    try {
      if (typeof (window as any).showSaveFilePicker === 'function') {
        const handle = await (window as any).showSaveFilePicker({ suggestedName, types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }], excludeAcceptAllOption: false });
        const writable = await handle.createWritable();
        await writable.write(new Blob([data], { type:'application/json' }));
        await writable.close();
        alert('Sablon exportálva.'); return;
      }
    } catch (err) { console.warn('showSaveFilePicker fallback:', err); }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = suggestedName;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  async function importTemplates(files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      const f = files[0]; const raw = await readAsText(f);
      const parsed = JSON.parse(raw); const tpl = Array.isArray(parsed) ? parsed[0] : parsed;
      if (!tpl?.meta) tpl.meta = {}; tpl.meta.id = crypto.randomUUID(); tpl.meta.name = selectedTab;
      setForm(tpl);
      const ok = await saveTemplateForTab(selectedTab, tpl);
      if (!ok) alert("Figyelem: A sablon megjelent, de nem sikerült elmenteni a szerverre!");
    } catch (err) {
      alert("Hiba történt a sablon beolvasásakor! Biztos, hogy jó JSON fájlt választottál?");
    } finally {
      if (fileTplRef.current) fileTplRef.current.value = '';
    }
  }

  async function saveFormToServer() {
    if (!form) return
    const ok = await saveTemplateForTab(form?.meta?.name || "Rendszer", form)
    if (ok) alert("Sablon elmentve a szerverre.")
    else alert("Hiba: nem sikerült elmenteni a sablont a szerverre.")
  }

  function swap(i:number,j:number){ if(!form||i===j)return; const els=[...(form.elements||[])]; [els[i],els[j]]=[els[j],els[i]]; setForm({...form,elements:els}) }
  function onDragStart(e:React.DragEvent, idx:number){ e.dataTransfer.setData('text/plain', String(idx)); e.dataTransfer.effectAllowed='move' }
  function onDragOver(e:React.DragEvent){ e.preventDefault(); e.dataTransfer.dropEffect='move' }
  function onDrop(e:React.DragEvent, destIdx:number){ e.preventDefault(); const src = Number(e.dataTransfer.getData('text/plain')); if(Number.isFinite(src)) swap(src, destIdx) }

  function toggleInk(elId:string,on:boolean){
    if(!form) return
    const els = (form.elements||[]).map(el => el.id===elId ? ({...el, ink:{enabled:on}}) : el)
    setForm({...form, elements: els})
  }

  // Törlés a Builder oldalon (fő form elemeknél)
  const handleClearInkBuilder = (elId: string) => {
    if(!form) return;
    const els = (form.elements || []).slice();
    const i = els.findIndex(e => e.id === elId);
    if (i > -1) { 
      els[i] = { ...els[i], ink: { ...(els[i].ink || {}), enabled: false } }; 
      setForm({...form, elements: els});
    }
  };

  function uid(){ let id=uuid(); while((form?.elements||[]).some((e:any)=>e.id===id)) id=uuid(); return id }
  function addText(){ const id=uid(); const el:FormElement={id,type:'text',label:'Szöveg',grid:{i:id,x:0,y:(form?.elements||[]).length,w:12,h:1},ink:{enabled:false}} as any; setForm(prev=>prev?({...prev,elements:[...(prev.elements||[]),el]}):prev) }
  function addComment(){ const id=uid(); const el:FormElement={id,type:'comment',label:'Megjegyzés',grid:{i:id,x:0,y:(form?.elements||[]).length,w:12,h:1},ink:{enabled:false}} as any; setForm(prev=>prev?({...prev,elements:[...(prev.elements||[]),el]}):prev) }
  function addDropdown(){ const id=uid(); const el:FormElement={id,type:'dropdown',label:'Legördülő',grid:{i:id,x:0,y:(form?.elements||[]).length,w:12,h:1},ink:{enabled:false},options:['Opció 1','Opció 2']} as any; setForm(prev=>prev?({...prev,elements:[...(prev.elements||[]),el]}):prev) }
  
  function addMachineSimpleModule() {
    const id = uuid(); const t: MachineType = MACHINE_TYPES[0];
    const inst = { id: uuid(), title: `${t} 1`, open: true, machineType: t, fields: [ { key:'manufacturer', label:'Gyártó' }, { key:'model', label:'Típus' } ] };
    const el = { id, type:'module_machine_simple', label:'Gép (egyszerű) modul', grid:{ i:id, x:0, y:elements.length, w:12, h:1 }, ink:{ enabled:false }, instances:[inst] } as const;
    setForm(prev => prev ? ({...prev, elements:[...(prev.elements||[]), el as any]}) : prev);
  }
  
  function addFile(){
    const id = uuid(); const el = { id, type:'file', label:'Csatolmányok', grid:{i:id,x:0,y:elements.length,w:12,h:1}, ink:{enabled:false}, multiple:true } as const
    setForm(prev => prev ? ({...prev, elements:[...prev.elements, el as any]}) : prev)
  }
  function addImages(){
    const id = uid(); const el = { id, type: 'images', label: 'Képfeltöltés (kitöltéskor)', grid: { i:id, x:0, y:elements.length, w:12, h:1 }, ink: { enabled:false } } as const;
    setForm(prev => prev ? ({...prev, elements:[...prev.elements, el as any]}) : prev);
  }
  function addSketch(){
    const id = uuid(); const el = { id, type:'sketch', label:'Szabadkézi rajz', grid:{i:id,x:0,y:elements.length,w:12,h:1}, height:260 } as const
    setForm(prev => prev ? ({...prev, elements:[...prev.elements, el as any]}) : prev)
  }
  function addTitle(){
    const id = uid(); const el: TitleElement = { id, type: 'title', label: 'Új cím', grid: { i:id, x:0, y:(form?.elements||[]).length, w:12, h:1 }, showNote: false, note: '' };
    setForm(prev => prev ? ({ ...prev, elements:[...(prev.elements||[]), el] }) : prev);
  }
  function addSystemSurveyModule() {
    const id = uuid();
    const fields: ModuleField[] = SYSTEM_SECTIONS.flatMap(sec => sec.fields.map(f => ({ key: `${sec.code}_${f.key}`, label: f.label })) );
    const inst: SystemSurveyInstance = { id: uuid(), index: 0, open: true, fields };
    const el: SystemSurveyElement = { id, type: 'module_system_survey', label: 'Rendszer (3.0–18.0) modul', grid: { i:id, x:0, y:elements.length, w:12, h:1 }, ink: { enabled:false }, instances: [inst] };
    setForm(prev => prev ? ({ ...prev, elements:[...(prev.elements||[]), el] }) : prev);
  }
  function addTankDetailModule() {
    const id = uuid(); const specs = TANK_TEMPLATE;
    const inst: SimpleDetailInstance = { id: uuid(), title: 'Tartály 1', open: true, fields: specs.map(s => ({ key: s.key, label: s.label })) };
    const el: TankDetailElement = { id, type: 'module_tank_detail', label: 'Tartály modul', grid: { i:id, x:0, y:elements.length, w:12, h:1 }, ink: { enabled:false }, instances: [inst] };
    setForm(prev => prev ? ({ ...prev, elements:[...(prev.elements||[]), el] }) : prev);
  }
  function addNoteText(){
    const id = uid(); const el: FormElement = { id, type:'note_text', label:'Megjegyzés', grid:{ i:id, x:0, y:(form?.elements||[]).length, w:12, h:1 } } as any;
    setForm(prev=>prev?({...prev, elements:[...(prev.elements||[]), el]}):prev);
  }
  function addDropdownMulti(){
    const id = uid(); const el: FormElement = { id, type:'dropdown_multi', label:'Többválasztós legördülő', grid:{ i:id, x:0, y:(form?.elements||[]).length, w:12, h:1 }, options:['Opció 1','Opció 2','Opció 3'] } as any;
    setForm(prev=>prev?({...prev, elements:[...(prev.elements||[]), el]}):prev);
  }
  
  function addMachineDetailModule() {
    const id = uuid(); 
    const t: MachineType = MACHINE_TYPES[0];
    const inst = { id: uuid(), title: `${t} 1`, open: true, machineType: t, fields: (DETAIL_TEMPLATES[t] || []).map(s => ({ key: s.key, label: s.label })) };
    const el: MachineDetailElement = { id, type:'module_machine_detail', label:'Gép (részletes) modul', grid:{ i:id, x:0, y:elements.length, w:12, h:1 }, ink:{ enabled:false }, instances:[inst] };
    setForm(prev => prev ? ({...prev, elements:[...(prev.elements||[]), el]}) : prev);
  }

  const [activeId, setActiveId] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  function setActive(elId: string) { setActiveId(elId) }
  function deleteElement(elId: string) {
    setForm(prev => { if (!prev) return prev; return { ...prev, elements: (prev.elements || []).filter((e:any) => e.id !== elId) } })
    setActiveId(prev => (prev === elId ? null : prev))
  }
  function patchElement(elId: string, patch: Partial<FormElement & { hideLabel?: boolean; options?: string[] }>) {
    setForm(prev => { if (!prev) return prev; return { ...prev, elements: (prev.elements || []).map((e:any) => e.id === elId ? ({ ...e, ...patch }) : e) } })
  }
  function setOptions(elId: string, opts: string[]) {
    setForm(prev => { if (!prev) return prev; return { ...prev, elements: (prev.elements || []).map((e:any) => e.id === elId ? { ...e, options: opts } : e) } })
  }

  const activeEl = useMemo(() => elements.find(e => e.id === activeId), [elements, activeId])
  const TrashIcon = (<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M9 3h6a1 1 0 0 1 1 1v1h4v2H4V5h4V4a1 1 0 0 1 1-1zm1 5h2v10h-2V8zm4 0h2v10h-2V8zM7 8h2v10H7V8z" fill="currentColor"/></svg>)

  const panelVisible = Boolean(activeEl)
  const panelStyle: React.CSSProperties = {
    position: 'fixed', right: 16, top: 120, width: 320, maxWidth: '85vw', background: '#fff',
    border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    padding: 12, zIndex: 1000, transform: panelVisible ? 'translateX(0)' : 'translateX(16px)',
    opacity: panelVisible ? 1 : 0, pointerEvents: panelVisible ? 'auto' : 'none', transition: 'opacity 150ms ease, transform 150ms ease'
  }

  const pillStyle: React.CSSProperties = { display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 12, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }
  const actionBtnStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid #ef4444', background: '#fff', color: '#b91c1c', cursor: 'pointer' }
  const fieldLabelStyle: React.CSSProperties = { fontSize: 12, color: '#6b7280', marginBottom: 4 }
  const textInputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }
  const smallBtn: React.CSSProperties = { padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }
  const activeOutline: React.CSSProperties = { outline: '2px solid #2563eb', outlineOffset: 2, borderRadius: 8 }

  return (
    <div className="card" ref={cardRef} onClick={()=>setActiveId(null)}>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:8}}>
        <label>
          Felmérés
          <select className="input" value={selectedTab} onChange={e=>setSelectedTab(e.target.value)}>
            {SURVEY_TABS.map(tab => <option key={tab} value={tab}>{tab}</option>)}
          </select>
        </label>
        <span style={{flex:1}} />
        <button className="btn" onClick={addText}>+ Szöveg</button>
        <button className="btn" onClick={addDropdown}>+ Legördülő</button>
        <button className="btn" onClick={addComment}>+ Komment</button>
        <button className="btn" onClick={addMachineSimpleModule}>+ Gép (egyszerű)</button>
        <button className="btn" onClick={addMachineDetailModule}>+ Gép (részletes)</button>
        <button className="btn" onClick={addFile}>+ Fájlfeltöltés</button>
        <button className="btn" onClick={addImages}>+ Képfeltöltés</button>
        <button className="btn" onClick={addSketch}>+ Szabadkézi rajz</button>
        <button className="btn" onClick={addTitle}>+ Cím</button>
        <button className="btn" onClick={addNoteText}>+ Szöveges megjegyzés</button>
        <button className="btn" onClick={addDropdownMulti}>+ Többválasztós legördülő</button>
        <button className="btn" onClick={addSystemSurveyModule}>+ Rendszer</button>
        <button className="btn" onClick={addTankDetailModule}>+ Tartály</button>
        <button className="btn success" onClick={saveFormToServer}>Mentés</button>
      </div>

      <div style={{ marginTop: 8 }}>
        <button className="btn" onClick={() => fileTplRef.current?.click()}>Sablon importálása (.json)</button>
        <input ref={fileTplRef} type="file" accept=".json,application/json" multiple style={{ display: 'none' }} onChange={(e) => { importTemplates(e.target.files); e.currentTarget.value = ''; }} />
      </div>

      <div style={{ marginTop: 8 }}>
        <button className="btn" onClick={()=>exportCurrentTemplate(form)} title="Az aktuális sablon exportálása .json fájlba">Sablon exportálása (.json)</button>
      </div>

      <A4Page globals={globals} surveyName={selectedTab}>
        <div className="list" onClick={(e)=>e.stopPropagation()}>
          {elements.map((el: any, idx: number) => {
            const inkEnabled = !!el?.ink?.enabled
            const dragProps = { draggable: true, onDragStart: (e: React.DragEvent) => onDragStart(e, idx), onDragOver, onDrop: (e: React.DragEvent) => onDrop(e, idx) }
            const hideableTypes = new Set(['sketch','file','images']);
            const shouldHideLabel = hideableTypes.has(el.type) && !!el.hideLabel;
            const labelShown = shouldHideLabel ? '' : el.label;

            const labelEditable = (
              <span
                contentEditable suppressContentEditableWarning
                onBlur={(e)=>{
                  const text = e.currentTarget.textContent || ''
                  if (text.trim() && text !== el.label){ const els = (form!.elements||[]).slice(); els[idx] = { ...el, label: text }; setForm({ ...form!, elements: els }) } 
                  else { e.currentTarget.textContent = el.label }
                }}
              >{labelShown}</span>
            ) as unknown as string

            const onRowContextMenu = (e: React.MouseEvent) => {
              e.preventDefault(); const choice = window.prompt('Művelet:\n1 = Komment BE/KI\n2 = Törlés', '1');
              if (choice==='1') toggleInk(el.id, !el?.ink?.enabled)
              if (choice==='2') setForm(prev => prev ? ({...prev, elements: (prev.elements||[]).filter((_x: any, i: number)=>i!==idx)}) : prev)
            }

            const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
              <div key={el.id} onClick={(ev)=>{ ev.stopPropagation(); setActive(el.id) }} onContextMenu={onRowContextMenu} style={activeId === el.id ? activeOutline : undefined}>{children}</div>
            )

            if (el.type === 'text' || el.type === 'dropdown') {
              return (
                <Wrapper>
                  <FieldRow label={labelEditable} withHandle dragProps={dragProps} inkPanel={inkEnabled ? (
                      <ResizableInkBox 
                        onChange={()=>{}} 
                        onClear={() => handleClearInkBuilder(el.id)} 
                        emitInitialRect={false}
                      />
                    ) : undefined}>
                    <div className="field-wrap">
                      {el.type === 'text' && <input className="input" style={formDesign.input} placeholder={el.placeholder || ''} value={''} onChange={()=>{}} />}
                      {el.type === 'dropdown' && (
                        <select className="input" style={formDesign.input} value={''} onChange={()=>{}}>
                          <option value="" disabled>Válassz...</option>
                          {(el.options ?? []).map((o: string, i2: number) => <option key={i2} value={o}>{o}</option>)}
                        </select>
                      )}
                      <button type="button" className="icon-inline" onClick={()=>toggleInk(el.id, !inkEnabled)} title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}>✎</button>
                    </div>
                  </FieldRow>
                </Wrapper>
              )
            }

            if (el.type === 'comment') {
              return (
                <Wrapper>
                  <FieldRow label={labelEditable} withHandle dragProps={dragProps}>
                    <ResizableInkBox onChange={()=>{}} onClear={() => handleClearInkBuilder(el.id)} emitInitialRect={false} />
                  </FieldRow>
                </Wrapper>
              )
            }

            if (el.type === 'file') {
              return (
                <Wrapper>
                  <FieldRow label={labelEditable} withHandle dragProps={dragProps}>
                    <div className="uploader-preview disabled" style={{width:'100%'}}>
                      <div className="hint small">Fájl feltöltés a kitöltéskor érhető el.</div>
                      <div style={{display:'flex', flexWrap:'wrap', gap:8}}><div className="file-chip ghost small">minta_dokumentum.pdf</div></div>
                    </div>
                  </FieldRow>
                </Wrapper>
              );
            }

            if (el.type === 'images') {
              return (
                <Wrapper>
                  <FieldRow label={labelEditable} withHandle dragProps={dragProps}>
                    <div className="uploader-preview disabled" style={{width:'100%'}}>
                      <div className="hint small">Képfeltöltés a kitöltéskor érhető el.</div>
                      <div className="image-grid">
                        <div className="image-tile ghost"><div className="resize-box" style={{minHeight:140}} /></div>
                        <div className="image-tile ghost"><div className="resize-box" style={{minHeight:100}} /></div>
                      </div>
                    </div>
                  </FieldRow>
                </Wrapper>
              );
            }

            if (el.type === 'sketch') {
              return (
                <Wrapper>
                  <FieldRow label={labelEditable} withHandle dragProps={dragProps}>
                    <ResizableInkBox onChange={()=>{}} onClear={()=>{}} emitInitialRect={false} 
                    // minHeight={260} 
                    />
                  </FieldRow>
                </Wrapper>
              )
            }

            if (el.type === 'title') {
              return (
                <Wrapper>
                  <div {...dragProps} style={{padding:'6px 0', display:'flex', alignItems:'center'}}>
                    <h3 contentEditable suppressContentEditableWarning onBlur={(e)=>{ const text = (e.currentTarget.textContent||'').trim(); if (text && text !== el.label){ const els = (form!.elements||[]).slice(); els[idx] = { ...el, label: text }; setForm({ ...form!, elements: els }); } else { e.currentTarget.textContent = el.label; } }} style={{margin:0, fontSize:18, fontWeight:700, width:'100%'}}>
                      {el.label}
                    </h3>
                  </div>
                  {el.showNote && el.note && <div style={{ marginTop:2, color:'#6b7280', fontSize:12 }}>{el.note}</div>}
                </Wrapper>
              );
            }

            if (el.type === 'note_text') {
              return (
                <Wrapper>
                  <FieldRow label={labelEditable} withHandle dragProps={dragProps}>
                    <div className="field-wrap" style={{width:'100%'}}>
                      <div className="input" style={{ width:'100%', minHeight:36, lineHeight:'20px', whiteSpace:'pre-wrap', opacity:0.5 }}>(Kitöltéskor gépelhető megjegyzés)</div>
                    </div>
                  </FieldRow>
                </Wrapper>
              )
            }

            if (el.type === 'dropdown_multi') {
              return (
                <Wrapper>
                  <FieldRow label={labelEditable} withHandle dragProps={dragProps}>
                    <div className="field-wrap" style={{width:'100%'}}><div className="hint small" style={{opacity:0.7}}>Több válasz kiválasztható lesz a kitöltéskor.</div></div>
                  </FieldRow>
                </Wrapper>
              )
            }

            if (el.type === 'module_machine_simple') {
              return (
                <div key={el.id} style={{ width:'100%' }}>
                  <div style={{ display:'flex', gap:8, marginBottom:16, alignItems: 'center' }}>
                    <select id={`add-select-${el.id}`} className="input" style={{...formDesign.input, width: '200px', padding: '6px 12px'}} defaultValue={MACHINE_TYPES[0]}>
                      {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button className="btn" style={formDesign.btnSecondary} onClick={()=>{
                        const sel = document.getElementById(`add-select-${el.id}`) as HTMLSelectElement;
                        const t: MachineType = (sel?.value as MachineType) || MACHINE_TYPES[0];
                        const inst = { id: uuid(), title: `${t} ${nextIndexForType(el.instances, t)}`, open: true, machineType: t, fields: [ { key:'manufacturer', label:'Gyártó' }, { key:'model', label:'Típus' } ] };
                        el.instances = [ ...(el.instances||[]), inst ];
                        setForm(prev => prev ? structuredClone(prev) : prev);
                      }}>+ Hozzáadás</button>
                  </div>

                  {sortInstancesByType(el.instances).map((inst: any) => (
                    <div key={inst.id} style={formDesign.card}>
                      <div style={formDesign.cardHeader}>
                        <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setForm(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
                          <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setForm(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
                        </div>
                      </div>

                      {inst.open && (
                        <>
                          <div style={formDesign.fieldGroup}>
                            <label style={formDesign.label}>Gép típusa</label>
                            <select className="input" style={formDesign.input} value={inst.machineType} onChange={(e)=>{
                                const newType = e.target.value as MachineType;
                                inst.machineType = newType; inst.title = `${newType} ${nextIndexForType((el.instances||[]).filter((x:any)=>x.id!==inst.id), newType)}`;
                                setForm(prev => prev ? structuredClone(prev) : prev);
                              }}>
                              {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          
                          {['manufacturer','model'].map((k) => (
                            <div key={k} style={formDesign.fieldGroup}>
                              <label style={formDesign.label}>{k==='manufacturer'?'gyártó':'típus'}</label>
                              <input className="input" style={formDesign.input} value={''} onChange={()=>{}} />
                            </div>
                          ))}
                        </>
                      )}

                      <div style={formDesign.fieldGroup}>
                        <label style={formDesign.label}>Megjegyzés</label>
                        <ResizableInkBox onChange={()=>{}} onClear={()=>{}} emitInitialRect={false} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            if (el.type === 'module_machine_detail') {
              return (
                <div key={el.id} style={{ width:'100%' }}>
                  <div style={{ display:'flex', gap:8, marginBottom:16, alignItems: 'center' }}>
                    <select id={`add-select-${el.id}`} className="input" style={{...formDesign.input, width: '200px', padding: '6px 12px'}} defaultValue={MACHINE_TYPES[0]}>
                      {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button className="btn" style={formDesign.btnSecondary} onClick={()=>{
                        const sel = document.getElementById(`add-select-${el.id}`) as HTMLSelectElement;
                        const t: MachineType = (sel?.value as MachineType) || MACHINE_TYPES[0];
                        const specs = DETAIL_TEMPLATES[t] || [];
                        el.instances = [...(el.instances||[]), { id:uuid(), title:`${t} ${nextIndexForType(el.instances, t)}`, open:true, machineType:t, fields: specs.map(s=>({key:s.key,label:s.label, value: ''})) }];
                        setForm(prev=>prev?structuredClone(prev):prev);
                      }}>+ Hozzáadás</button>
                  </div>

                  {sortInstancesByType(el.instances).map((inst: any) => {
                    const specs = DETAIL_TEMPLATES[inst.machineType] || [];
                    if ((inst.fields?.length ?? 0) !== specs.length) { inst.fields = specs.map((s:any)=>({ key:s.key, label:s.label, value: (inst.fields||[]).find((f:any)=>f.key===s.key)?.value ?? '' })); }

                    return (
                      <div key={inst.id} style={formDesign.card}>
                        <div style={formDesign.cardHeader}>
                          <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
                          <div style={{ display:'flex', gap:8 }}>
                            <button style={formDesign.btnSecondary} onClick={()=>{ inst.open=!inst.open; setForm(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
                            <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setForm(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
                          </div>
                        </div>

                        {inst.open && (
                          <>
                            <div style={formDesign.fieldGroup}>
                              <label style={formDesign.label}>Gép típusa</label>
                              <select className="input" style={formDesign.input} value={inst.machineType} onChange={(e)=>{
                                  const newType = e.target.value as MachineType;
                                  inst.machineType = newType; inst.title = `${newType} ${nextIndexForType(el.instances?.filter((x:any)=>x.id!==inst.id), newType)}`;
                                  inst.fields = (DETAIL_TEMPLATES[newType] || []).map((s:any)=>({ key:s.key, label:s.label }));
                                  setForm(prev=>prev?structuredClone(prev):prev);
                                }}>
                                {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>

                            {specs.map((spec:any)=>{
                              return (
                                <div key={spec.key} style={formDesign.fieldGroup}>
                                  <label style={formDesign.label}>{spec.label}</label>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {spec.input === 'select' ? (
                                      <select className="input" value={''} onChange={()=>{}} style={formDesign.input}>
                                        <option value="" disabled>Válassz…</option>
                                        {(spec.options||[]).map((opt:string)=> <option key={opt} value={opt}>{opt}</option>)}
                                      </select>
                                    ) : (
                                      <input className="input" value={''} onChange={()=>{}} style={formDesign.input} />
                                    )}
                                    {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
                                  </div>
                                </div>
                              );
                            })}

                            <div style={formDesign.fieldGroup}>
                              <label style={formDesign.label}>Gépállapot általános leírása</label>
                              <textarea className="input" rows={1} style={{...formDesign.input, resize: 'none'}} disabled placeholder="(Kitöltéskor gépelhető megjegyzés)" />
                            </div>
                            <div style={formDesign.fieldGroup}>
                               <label style={formDesign.label}>Fotók helye</label>
                               <div className="hint small" style={{opacity:0.7}}>(Képfeltöltés kitöltéskor)</div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            }

            if (el.type === 'module_system_survey') {
              const nextIndex = (instances?: SystemSurveyInstance[]) => 1 + Math.max(0, ...((instances||[]).map(i => i.index)));

              return (
                <div key={el.id} style={{ width:'100%' }}>
                  <button className="btn" style={{...formDesign.addBtn, marginBottom: '16px'}} onClick={()=>{
                      const idx = nextIndex(el.instances);
                      const fields: ModuleField[] = SYSTEM_SECTIONS.flatMap(sec => sec.fields.map(f => ({ key: `${sec.code}_${f.key}`, label: f.label })) );
                      el.instances = [ ...(el.instances || []), { id: uuid(), index: idx, open: true, fields } ];
                      setForm(prev => prev ? structuredClone(prev) : prev);
                    }}>+ Rendszer hozzáadása</button>

                  {(el.instances || []).map((inst: any) => (
                    <div key={inst.id} style={formDesign.card}>
                      <div style={formDesign.systemHeaderBar}>
                        <div style={formDesign.systemHeaderTitle}>BLOKK: {inst.index === 0 ? 'ÁLTALÁNOS (3.0–18.0)' : `RENDSZER ${inst.index} (3.${inst.index}–18.${inst.index})`}</div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setForm(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
                          {inst.index !== 0 && <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any) => x.id !== inst.id); setForm(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>}
                        </div>
                      </div>

                      {inst.open && (
                        <div>
                          {SYSTEM_SECTIONS.map((sec) => {
                            const secNo = `${sec.code}.${inst.index}`;
                            return (
                              <div key={`${inst.id}:${sec.code}`}>
                                <div style={formDesign.systemSubTitle}>{secNo} {sec.title}</div>
                                {sec.fields.map((spec) => (
                                  <div key={`${sec.code}_${spec.key}`} style={formDesign.fieldGroup}>
                                    <label style={formDesign.label}>{spec.label}</label>
                                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                                      {spec.input === 'text' && <input className="input" style={formDesign.input} value={''} onChange={()=>{}} />}
                                      {spec.input === 'select' && (
                                        <select className="input" style={formDesign.input} value={''} onChange={()=>{}}>
                                          <option value="" disabled>Válassz…</option>
                                          {(spec.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                      )}
                                      {spec.input === 'dropdown_multi' && (
                                        <select className="input" style={formDesign.input} value={''} onChange={()=>{}}><option value="" disabled>Többválasztós (kitöltéskor)…</option></select>
                                      )}
                                      {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
                                    </div>
                                  </div>
                                ))}
                                {sec.photoKey && (
                                  <div style={formDesign.fieldGroup}>
                                    <label style={formDesign.label}>Fotók helye</label>
                                    <div className="hint small" style={{opacity:0.7}}>(Képfeltöltés kitöltéskor)</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            }

            if (el.type === 'module_system_detail' || el.type === 'module_tank_detail') {
              const specs = el.type === 'module_system_detail' ? SYSTEM_TEMPLATE : TANK_TEMPLATE;
              const titleBase = el.type === 'module_system_detail' ? 'Rendszer' : 'Tartály';

              return (
                <div key={el.id} style={{ width:'100%' }}>
                  <button className="btn" style={{...formDesign.addBtn, marginBottom: '16px'}} onClick={()=>{
                      const inst: SimpleDetailInstance = { id: uuid(), title: `${titleBase} ${1 + ((el.instances || []).length || 0)}`, open: true, fields: specs.map(s => ({ key:s.key, label:s.label })) };
                      el.instances = [ ...(el.instances || []), inst ];
                      setForm(prev=>prev?structuredClone(prev):prev);
                    }}>+ {titleBase} hozzáadása</button>

                  {(el.instances || []).map((inst: SimpleDetailInstance) => {
                    if ((inst.fields?.length ?? 0) !== specs.length) { inst.fields = specs.map(s=>({ key:s.key, label:s.label, value: '' })); }

                    return (
                      <div key={inst.id} style={formDesign.card}>
                        <div style={formDesign.cardHeader}>
                          <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
                          <div style={{ display:'flex', gap:8 }}>
                            <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setForm(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
                            <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances || []).filter((x:SimpleDetailInstance)=>x.id!==inst.id); setForm(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
                          </div>
                        </div>

                        {inst.open && (
                          <>
                            {specs.map(spec => (
                              <div key={spec.key} style={formDesign.fieldGroup}>
                                <label style={formDesign.label}>{spec.label}</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  {spec.input === 'select' ? (
                                    <select className="input" style={formDesign.input} value={''} onChange={()=>{}}>
                                      <option value="" disabled>Válassz…</option>
                                      {(spec.options||[]).map((opt:string)=> <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                  ) : (
                                    <input className="input" style={formDesign.input} value={''} onChange={()=>{}} />
                                  )}
                                  {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            }

            return null
          })}
        </div>
      </A4Page>

      {/* === Jobb oldali szerkesztő panel === */}
      <div style={panelStyle} onClick={(e)=>e.stopPropagation()}>
        {activeEl ? (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <div style={{fontWeight:600}}>{activeEl.label || 'Elem'}</div>
              <button onClick={()=>setActiveId(null)} title="Panel bezárása" style={{border:'1px solid #e5e7eb', background:'#fff', borderRadius:6, width:24, height:24, lineHeight:'22px', textAlign:'center', cursor:'pointer'}}>×</button>
            </div>
            <div style={{marginBottom:12}}><span style={pillStyle}>{activeEl.type}</span></div>

            <div style={{display:'flex', gap:8, marginBottom:12}}>
              <button onClick={()=>deleteElement(activeEl.id)} title="Elem törlése" style={actionBtnStyle}>
                {TrashIcon}<span>Törlés</span>
              </button>
            </div>

            {(activeEl.type === 'text') && (
              <div style={{marginTop:8}}>
                <div style={fieldLabelStyle}>Címke (bal oldali label)</div>
                <input style={textInputStyle} value={activeEl.label || ''} onChange={(e)=>patchElement(activeEl.id, { label: e.target.value })} placeholder="Címke..." />
              </div>
            )}

            {activeEl?.type === 'title' && (
              <div className="prop-section">
                <label className="row" style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'}}>
                  <input type="checkbox" checked={!!(activeEl as TitleElement).showNote} onChange={(e)=>{ const els = (form!.elements || []).slice(); const i = els.findIndex(x => x.id === activeEl.id); if (i > -1) { els[i] = { ...(els[i] as TitleElement), showNote: e.target.checked }; setForm({ ...form!, elements: els }); } }} />
                  <span style={{fontSize:'13px'}}>Megjegyzés megjelenítése a cím alatt</span>
                </label>
                <textarea className="input" placeholder="Megjegyzés szövege…" value={(activeEl as TitleElement).note || ''} onChange={(e)=>{ const els = (form!.elements || []).slice(); const i = els.findIndex(x => x.id === activeEl.id); if (i > -1) { els[i] = { ...(els[i] as TitleElement), note: e.target.value }; setForm({ ...form!, elements: els }); } }} rows={3} style={{ width:'100%', resize:'vertical' }} />
              </div>
            )}

            {(activeEl.type === 'dropdown' || activeEl.type === 'dropdown_multi') && (
              <div style={{marginTop:8}}>
                <div style={fieldLabelStyle}>Címke</div>
                <input style={{...textInputStyle, marginBottom:12}} value={activeEl.label || ''} onChange={(e)=>patchElement(activeEl.id, { label: e.target.value })} placeholder="Címke..." />

                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                  <div style={fieldLabelStyle}>Opciók</div>
                  <button style={smallBtn} onClick={()=>{ const next = [ ...(activeEl.options || []), '' ]; setOptions(activeEl.id, next); }}>+ Opció</button>
                </div>

                <div style={{display:'flex', flexDirection:'column', gap:6}}>
                  {(activeEl.options || []).map((opt: string, i: number) => (
                    <div key={i} style={{display:'flex', gap:6, alignItems:'center'}}>
                      <input style={{...textInputStyle, flex:1}} value={opt} placeholder={`Opció #${i+1}`} onChange={(e)=>{ const next = [ ...(activeEl.options || []) ]; next[i] = e.target.value; setOptions(activeEl.id, next); }} />
                      <button style={smallBtn} title="Fel" onClick={()=>{ if (i===0) return; const next = [ ...(activeEl.options || []) ]; [next[i-1], next[i]] = [next[i], next[i-1]]; setOptions(activeEl.id, next); }}>↑</button>
                      <button style={smallBtn} title="Le" onClick={()=>{ const next = [ ...(activeEl.options || []) ]; if (i>=next.length-1) return; [next[i], next[i+1]] = [next[i+1], next[i]]; setOptions(activeEl.id, next); }}>↓</button>
                      <button style={{...smallBtn, borderColor:'#ef4444', color:'#b91c1c'}} title="Törlés" onClick={()=>{ const next = (activeEl.options || []).filter((_x: string, j: number)=> j!==i); setOptions(activeEl.id, next); }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeEl.type === 'note_text') && (
              <div style={{marginTop:8}}>
                <div style={fieldLabelStyle}>Címke</div>
                <input style={textInputStyle} value={activeEl.label || ''} onChange={(e)=>patchElement(activeEl.id, { label: e.target.value })} placeholder="Megjegyzés..." />
              </div>
            )}

            {(activeEl.type === 'sketch' || activeEl.type === 'file' || activeEl.type === 'images') && (
              <div style={{marginTop:8}}>
                <div style={fieldLabelStyle}>Címke</div>
                <input style={{...textInputStyle, marginBottom:10}} value={activeEl.label || ''} onChange={(e)=>patchElement(activeEl.id, { label: e.target.value })} placeholder="Címke..." />
                <label style={{display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer'}}>
                  <input type="checkbox" checked={!!activeEl.hideLabel} onChange={(e)=>patchElement(activeEl.id, { hideLabel: e.target.checked })} />
                  <span>Cím nélkül jelenjen meg</span>
                </label>
              </div>
            )}
          </>
        ) : (
          <div className="small" style={{color:'#6b7280'}}>Válassz ki egy elemet a szerkesztéshez.</div>
        )}
      </div>
    </div>
  )
}