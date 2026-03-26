




// import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
// import { loadAll, loadGlobals } from '../storage'
// import { loadAnswersLocal, saveAnswersLocal, saveAllLocal } from '../storage'
// import type { AnswerMap, FormData, Globals, FileItem, ModuleInstance } from '../types'
// import { v4 as uuid } from 'uuid'
// import InlineInkCanvas from '../components/InlineInkCanvas'
// import A4Page from '../components/A4Page'
// import FieldRow from '../components/FieldRow'
// import { loadTemplateForTab } from '../storage/formsLib'

// import { MACHINE_TYPES, MachineType, DETAIL_TEMPLATES, SimpleDetailInstance, 
//          SYSTEM_TEMPLATE, TANK_TEMPLATE, SystemSurveyInstance, SystemSurveyElement, 
//          SYSTEM_SECTIONS, ModuleField } from '../types'
// import { EMPTY } from '../types'

// import { ImageUploaderWithInk, FileUploader } from '../components/FormComponents'

// const INK_KEY = (id: string) => `__ink__${id}`;
// const INK_TOGGLE = (id: string) => `__ink_enabled__${id}`;
// const RECT_KEY = (id:string)=> `${id}__rect`; 

// const supportsFieldSizing = typeof CSS !== 'undefined' && (CSS as any).supports?.('field-sizing', 'content');

// // --- EGYSÉGES DESIGN RENDSZER ---
// export const formDesign = {
//   card: {
//     backgroundColor: '#fff',
//     border: '1px solid #e5e7eb',
//     borderRadius: '8px',
//     padding: '16px',
//     marginBottom: '16px',
//     boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
//   },
//   cardHeader: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingBottom: '12px',
//     marginBottom: '16px',
//     borderBottom: '1px solid #e5e7eb'
//   },
//   cardTitle: { fontSize: '15px', fontWeight: 600, color: '#111827' },
//   cardTitleHighlight: { color: '#2563eb' },
//   addBtn: {
//     background: 'transparent', border: 'none', color: '#2563eb', fontSize: '14px',
//     fontWeight: 500, cursor: 'pointer', padding: '8px 0', display: 'inline-flex',
//     alignItems: 'center', gap: '4px', marginBottom: '8px'
//   },
//   btnSecondary: {
//     backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb',
//     padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
//   },
//   btnDanger: {
//     backgroundColor: '#ef4444', color: '#fff', border: 'none',
//     padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
//   },
//   fieldGroup: { marginBottom: '16px' },
//   label: {
//     display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280',
//     textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px'
//   },
//   input: {
//     width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
//     borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' as const,
//     fontFamily: 'inherit', backgroundColor: '#fff', color: '#111827'
//   },
//   systemHeaderBar: {
//     backgroundColor: '#f9fafb', padding: '10px 16px', margin: '-16px -16px 16px -16px',
//     borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid #e5e7eb',
//     display: 'flex', justifyContent: 'space-between', alignItems: 'center'
//   },
//   systemHeaderTitle: {
//     fontSize: '12px', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' as const, letterSpacing: '0.5px'
//   },
//   systemSubTitle: {
//     fontSize: '16px', fontWeight: 700, color: '#111827', borderLeft: '3px solid #2563eb',
//     paddingLeft: '10px', margin: '16px 0 20px 0', display: 'flex', alignItems: 'center'
//   }
// };

// const INK_GLOBAL_CSS = `
//   .ink-box { position: relative; margin-top: 8px; width: 100%; min-height: 150px; box-sizing: border-box; }
//   .ink-box > div { width: 100% !important; max-width: 100% !important; min-width: 100% !important; resize: vertical !important; overflow: hidden !important; }
// `;

// type Props = {
//   formId: string
//   onAnswersChange?: (answers: AnswerMap) => void
//   onFormChange?: (next: FormData) => void
//   initialForm?: FormData
//   activeAnswer: AnswerMap
//   globals: Globals
//   onRootRef?: (formId: string, el: HTMLDivElement | null) => void
// }

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

// const empty = EMPTY;

// export default function FormFillerEmbed({ formId, onAnswersChange, onFormChange, initialForm, activeAnswer, globals, onRootRef }: Props){
//   const [form, setForm] = useState<FormData | null>(null);
//   const [answers, setAnswers] = useState<AnswerMap>({});

//   const handleA4Ref = useCallback((node: HTMLDivElement | null) => { onRootRef?.(formId, node) }, [onRootRef, formId])

//   function setFormState(nextOrUpdater: FormData | ((prev: FormData) => FormData) | null){
//     setForm(prev => {
//       const next = typeof nextOrUpdater === 'function' ? (nextOrUpdater as (p: FormData) => FormData)(prev as FormData) : (nextOrUpdater as FormData | null);
//       if (next && onFormChange) onFormChange(next);
//       return next;
//     })
//   }

//   useEffect(() => {
//     if (!initialForm) return;
//     setForm(prev => {
//       if (!prev || prev.meta?.id !== initialForm.meta?.id) return structuredClone(initialForm);
//       return prev;
//     });
//   }, [initialForm?.meta?.id]);

//   useEffect(() => {
//     if (activeAnswer == null) return;
//     setAnswers(prev => {
//       const same = prev && Object.keys(prev).length === Object.keys(activeAnswer).length && Object.keys(prev).every(k => prev[k] === activeAnswer[k]);
//       return same ? prev : structuredClone(activeAnswer);
//     });
//   }, [activeAnswer]);

//   function updateAnswers(nextPartial: AnswerMap){
//     setAnswers(prev => {
//       const merged = { ...(prev || {}), ...(nextPartial || {}) };
//       try { 
//         saveAnswersLocal(formId, merged); 
//           } catch (e: any) {
//               if (e.name === 'QuotaExceededError') {
//               alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
//               } else {
//                 console.error('Helyi mentési hiba:', e);
//                 }
//             }
//       onAnswersChange?.(merged);
//       return merged;
//     });
//   }

//   const setVal = (key: string, value: any) => {
//     setAnswers(prev => {
//       const merged = { ...(prev || {}), [key]: value };
//       try { 
//         saveAnswersLocal(formId, merged); 
//           } catch (e: any) {
//               if (e.name === 'QuotaExceededError') {
//               alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
//               } else {
//                 console.error('Helyi mentési hiba:', e);
//                 }
//             }
//       onAnswersChange?.(merged);
//       return merged;
//     });
//   };

//   const setInk = (elId: string, dataUrl?: string) => {
//     const k = INK_KEY(elId); const next = { ...answers };
//     if (dataUrl) next[k] = dataUrl; else delete next[k];
//     updateAnswers(next);
//   }

//   const getInkRect = (baseKey: string) => answers[INK_KEY(RECT_KEY(baseKey))] as {w:number;h:number} | undefined;
//   const setInkRect = (baseKey: string, r: {w:number, h:number}) => {
//     const rKey = INK_KEY(RECT_KEY(baseKey));
//     const old = answers[rKey] as {w:number;h:number} | undefined;
//     if (!old || old.h !== r.h) setVal(rKey, r);
//   };

//   const elements = useMemo(()=>{
//     if (!form) return []
//     const arr = Array.isArray(form.elements) ? form.elements : []
//     return [...arr].sort((a:any,b:any)=> ((a?.grid?.y ?? 0) - (b?.grid?.y ?? 0)) || ((a?.grid?.x ?? 0) - (b?.grid?.x ?? 0)))
//   }, [form])

//   if (!form) return null

//   return (
//     <>
//       <style>{INK_GLOBAL_CSS}</style>
//       <A4Page globals={globals} surveyName={form.meta.name} ref={handleA4Ref}>
//         <div className="list">
//           {elements.length === 0 && <div className="small" style={{ padding: '8px 0' }}>Ehhez a felméréshez még nem adtunk mezőket.</div>}

//           {elements.map((el: any) => {
//             const userFlag  = answers[INK_TOGGLE(el.id)];
//             const formFlag  = el?.ink?.enabled;
//             const inkValue  = answers[INK_KEY(el.id)] as string | undefined;
//             const inkRect   = getInkRect(el.id);
//             const inkEnabled = Boolean(userFlag ?? formFlag ?? inkValue ?? inkRect);

//             if (el.type === 'text' || el.type === 'dropdown') {
//               const baseKey = el.id;
//               return (
//                 <FieldRow key={el.id} label={el.label} inkPanel={inkEnabled ? (
//                     <div className="ink-box">
//                       <button type="button" className="ink-clear-abs" title="Komment törlése" onClick={()=>{
//                           setAnswers(prev => {
//                             const merged = { ...prev, [INK_TOGGLE(el.id)]: false, [INK_KEY(el.id)]: undefined, [INK_KEY(RECT_KEY(el.id))]: undefined };
//                             try { 
//         saveAnswersLocal(formId, merged); 
//           } catch (e: any) {
//               if (e.name === 'QuotaExceededError') {
//               alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
//               } else {
//                 console.error('Helyi mentési hiba:', e);
//                 }
//             }
//                             onAnswersChange?.(merged); return merged;
//                           });
//                           const els = (form.elements || []).slice();
//                           const i = els.findIndex(e => e.id === el.id);
//                           if (i > -1) { els[i] = { ...els[i], ink: { ...(els[i].ink || {}), enabled: false } }; setFormState({ ...form, elements: els }); }
//                         }}>×</button>
//                       <InlineInkCanvas key={`${formId}:${el.id}`} value={inkValue} onChange={(data) => setInk(el.id, data)} initialRect={getInkRect(baseKey)} emitInitialRect={false} onRectChange={(r) => setInkRect(baseKey, r)} />
//                     </div>
//                   ) : undefined}>
//                   <div className="field-wrap">
//                     {el.type === 'text' && <input className="input" style={formDesign.input} placeholder={el.placeholder || ''} value={answers[el.id] ?? ''} onChange={(e) => setVal(el.id, e.target.value)} />}
//                     {el.type === 'dropdown' && (
//                       <select className="input" style={formDesign.input} value={answers[el.id] ?? ''} onChange={(e) => setVal(el.id, e.target.value)}>
//                         <option value="" disabled>Válassz...</option>
//                         {(el.options ?? []).map((o: string, idx: number) => <option key={idx} value={o}>{o}</option>)}
//                       </select>
//                     )}
//                     <button type="button" className="icon-inline" onClick={()=>{
//                         const next = !inkEnabled; setVal(INK_TOGGLE(el.id), next);
//                         const els = (form.elements || []).slice();
//                         const i = els.findIndex(e => e.id === el.id);
//                         if (i > -1) { els[i] = { ...els[i], ink: { ...(els[i].ink || {}), enabled: next } }; setFormState({ ...form, elements: els }); }
//                       }} title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}>✎</button>
//                   </div>
//                 </FieldRow>
//               )
//             }

//             if (el.type === 'comment') {
//               const noteKey = el.id; 
//               const inkEnabled = !!answers[INK_TOGGLE(noteKey)];
//               const textVal: string = (answers[`${noteKey}__text`] as string) ?? '';

//               return (
//                 <FieldRow key={el.id} label={el.label} className="stacked">
//                   {supportsFieldSizing ? (
//                     <textarea className="input" rows={1} style={{ ...formDesign.input, ...( { ['fieldSizing' as any]:'content' } as any), overflow:'hidden', resize:'none', whiteSpace:'pre-wrap' }} placeholder="Írd ide a megjegyzést…" value={textVal} onChange={(e)=> setVal(`${noteKey}__text`, e.target.value)} />
//                   ) : (
//                     <div className="input" contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning style={{ ...formDesign.input, whiteSpace:'pre-wrap', wordBreak:'break-word', outline:'none' }} onInput={(e)=> setVal(`${noteKey}__text`, e.currentTarget.textContent ?? '')}>{textVal}</div>
//                   )}
//                   <div className="small" style={{ color:'#6b7280', marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
//                     <span>Rajz/komment</span>
//                     <button type="button" className="icon-inline" title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'} onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
//                   </div>
//                   {inkEnabled && (
//                     <div className="ink-box">
//                       <button type="button" className="ink-clear-abs" title="Komment törlése" onClick={()=>{
//                           setAnswers(prev=>{
//                             const merged = { ...prev, [INK_TOGGLE(noteKey)]: false, [INK_KEY(noteKey)]: undefined, [INK_KEY(RECT_KEY(noteKey))]: undefined };
//                             try { 
//         saveAnswersLocal(formId, merged); 
//           } catch (e: any) {
//               if (e.name === 'QuotaExceededError') {
//               alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
//               } else {
//                 console.error('Helyi mentési hiba:', e);
//                 }
//             }
//                             onAnswersChange?.(merged); return merged;
//                           })
//                         }}>×</button>
//                       <InlineInkCanvas key={`${formId}:comment:${el.id}`} value={answers[INK_KEY(noteKey)] as string} onChange={(d)=> setVal(INK_KEY(noteKey), d)} initialRect={getInkRect(noteKey)} emitInitialRect={false} onRectChange={(r) => setInkRect(noteKey, r)} />
//                     </div>
//                   )}
//                 </FieldRow>
//               )
//             }

//             if (el.type === 'title') {
//               return (
//                 <div key={el.id} style={{padding:'6px 0'}}>
//                   <h3 style={{margin:0, fontSize:18, fontWeight:700}}>{el.label}</h3>
//                   {el.showNote && el.note && <div style={{ marginTop:2, color:'#6b7280', fontSize:12 }}>{el.note}</div>}
//                 </div>
//               );
//             }

//             if (el.type === 'note_text') {
//               const val: string = answers[el.id] ?? '';
//               return (
//                 <FieldRow key={el.id} label={el.label}>
//                   <div style={{ position: 'relative', width: '100%' }}>
//                     {(!val || val.length === 0) && <span style={{ position: 'absolute', left: 12, top: 10, pointerEvents: 'none', opacity: 0.5, font: 'inherit', fontSize: '14px' }}>Írd ide a megjegyzést…</span>}
//                     <div className="input" contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning style={{ ...formDesign.input, whiteSpace: 'pre-wrap', wordBreak: 'break-word', outline: 'none' }} onInput={(e)=> setVal(el.id, (e.currentTarget.textContent ?? ''))} onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); }}>{val}</div>
//                   </div>
//                 </FieldRow>
//               );
//             }

//             if (el.type === 'dropdown_multi') {
//               const selected: string[] = Array.isArray(answers[el.id]) ? answers[el.id] : [];
//               const isOpen = !!answers[`__open__${el.id}`];
//               const displayText = selected.length > 0 ? selected.join(', ') : 'Válassz…';

//               return (
//                 <FieldRow key={el.id} label={el.label} className="no-border">
//                   <div className="combo" style={{ position:'relative' }}>
//                     <button type="button" className="input combo-trigger" style={formDesign.input} onClick={() => setVal(`__open__${el.id}`, !isOpen)}>
//                       <span className={selected.length === 0 ? 'muted' : ''}>{displayText}</span>
//                       <span className="combo-caret">▾</span>
//                     </button>
//                     {isOpen && (
//                       <div className="combo-menu" role="listbox">
//                         <div className="combo-list">
//                           {(el.options || []).map((o: string, idx: number) => (
//                             <label key={idx} className={'combo-option' + (selected.includes(o) ? ' selected' : '')}>
//                               <input type="checkbox" checked={selected.includes(o)} onChange={() => setVal(el.id, selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o])} />
//                               <span className="combo-option-label">{o}</span>
//                             </label>
//                           ))}
//                         </div>
//                         <div className="combo-actions"><button type="button" className="btn" onClick={() => setVal(`__open__${el.id}`, false)}>Kész</button></div>
//                       </div>
//                     )}
//                   </div>
//                 </FieldRow>
//               );
//             }

//             if (el.type === 'images') {
//               return (
//                 <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
//                   <div style={{ display:'flex', flexDirection:'column', gap:8 }}><ImageUploaderWithInk value={answers[el.id] || []} onChange={(next)=> setVal(el.id, next)} /></div>
//                 </FieldRow>
//               );
//             }

//             if (el.type === 'file') {
//               return (
//                 <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
//                   <div style={{ display:'flex', flexDirection:'column', gap:8 }}><FileUploader value={answers[el.id] || []} onChange={(next)=>setVal(el.id, next)} /></div>
//                 </FieldRow>
//               );
//             }

//             if (el.type === 'sketch') {
//               const dataUrl: string | undefined = answers[el.id];
//               const baseKey = el.id;
//               return (
//                 <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
//                   <div className="ink-panel">
//                     {el.hideLabel && <div className="ink-title">{el.label}</div>}
//                     <div className="ink-body">
//                       <InlineInkCanvas key={`${formId}:${el.id}`} value={dataUrl} onChange={(d)=>setVal(el.id, d)} initialRect={getInkRect(baseKey)} emitInitialRect={false} onRectChange={(r)=> setInkRect(baseKey, r)} />
//                     </div>
//                   </div>
//                 </FieldRow>
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
//                         setFormState(prev=>prev?structuredClone(prev):prev);
//                       }}>+ Hozzáadás</button>
//                   </div>

//                   {sortInstancesByType(el.instances).map((inst: any) => {
//                     const noteKey = `ms_note_${inst.id}`;
//                     const inkEnabled = !!answers[INK_TOGGLE(noteKey)];
//                     const getFieldVal = (k:string) => (inst.fields||[]).find((x:any)=>x.key===k)?.value || '';

//                     return (
//                       <div key={inst.id} style={formDesign.card}>
//                         <div style={formDesign.cardHeader}>
//                           <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
//                           <div style={{ display:'flex', gap:8 }}>
//                             <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                             <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
//                           </div>
//                         </div>

//                         {inst.open && (
//                           <>
//                             <div style={formDesign.fieldGroup}>
//                               <label style={formDesign.label}>Gép típusa</label>
//                               <select className="input" style={formDesign.input} value={inst.machineType} onChange={(e)=>{
//                                   const newType = e.target.value as MachineType;
//                                   inst.machineType = newType; inst.title = `${newType} ${nextIndexForType((el.instances||[]).filter((x:any)=>x.id!==inst.id), newType)}`;
//                                   setFormState(prev=>prev?structuredClone(prev):prev);
//                                 }}>
//                                 {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                               </select>
//                             </div>
                            
//                             <div style={formDesign.fieldGroup}>
//                               <label style={formDesign.label}>Gyártó</label>
//                               <input className="input" style={formDesign.input} value={getFieldVal('manufacturer')} onChange={(e)=>{ const f = (inst.fields||[]).find((x:any)=>x.key==='manufacturer'); if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
//                             </div>

//                             <div style={formDesign.fieldGroup}>
//                               <label style={formDesign.label}>Típus</label>
//                               <input className="input" style={formDesign.input} value={getFieldVal('model')} onChange={(e)=>{ const f = (inst.fields||[]).find((x:any)=>x.key==='model'); if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
//                             </div>

//                             <div style={formDesign.fieldGroup}>
//                               <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
//                                 <label style={{...formDesign.label, marginBottom:0}}>Megjegyzés</label>
//                                 <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
//                               </div>
//                               {supportsFieldSizing ? (
//                                 <textarea className="input" rows={1} style={{ ...formDesign.input, ...( { ['fieldSizing' as any]:'content' } as any), overflow:'hidden', resize:'none', whiteSpace:'pre-wrap' }} placeholder="Írd ide a megjegyzést…" value={getFieldVal('__simple_note__')} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
//                               ) : (
//                                 <div className="input" contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning style={{ ...formDesign.input, whiteSpace:'pre-wrap', wordBreak:'break-word', outline:'none' }} onInput={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = (e.currentTarget.textContent ?? ''); setFormState(prev=>prev?structuredClone(prev):prev); }}>{getFieldVal('__simple_note__')}</div>
//                               )}
                              
//                               {inkEnabled && (
//                                 <div className="ink-box">
//                                   <button type="button" className="ink-clear-abs" onClick={()=>{ setAnswers(prev => { const merged = { ...prev, [INK_TOGGLE(noteKey)]: false, [INK_KEY(noteKey)]: undefined, [INK_KEY(RECT_KEY(noteKey))]: undefined }; 
//                                   try { 
//         saveAnswersLocal(formId, merged); 
//           } catch (e: any) {
//               if (e.name === 'QuotaExceededError') {
//               alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
//               } else {
//                 console.error('Helyi mentési hiba:', e);
//                 }
//             }
//                                   onAnswersChange?.(merged); return merged; }); }}>×</button>
//                                   <InlineInkCanvas key={`${formId}:msnote:${inst.id}`} value={answers[INK_KEY(noteKey)] as string} onChange={(data)=> setVal(INK_KEY(noteKey), data)} initialRect={getInkRect(noteKey)} emitInitialRect={false} onRectChange={(r) => setInkRect(noteKey, r)} />
//                                 </div>
//                               )}
//                             </div>
//                           </>
//                         )}
//                       </div>
//                     );
//                   })}
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
//                         setFormState(prev=>prev?structuredClone(prev):prev);
//                       }}>+ Hozzáadás</button>
//                   </div>

//                   {sortInstancesByType(el.instances).map((inst: any) => {
//                     const specs = DETAIL_TEMPLATES[inst.machineType] || [];
//                     if ((inst.fields?.length ?? 0) !== specs.length) { inst.fields = specs.map((s:any)=>({ key:s.key, label:s.label, value: (inst.fields||[]).find((f:any)=>f.key===s.key)?.value ?? '' })); }
//                     const noteKey = `md_note_${inst.id}`; const imgKey = `md_images_${inst.id}`;
//                     const inkEnabled = !!answers[INK_TOGGLE(noteKey)];

//                     return (
//                       <div key={inst.id} style={formDesign.card}>
//                         <div style={formDesign.cardHeader}>
//                           <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
//                           <div style={{ display:'flex', gap:8 }}>
//                             <button style={formDesign.btnSecondary} onClick={()=>{ inst.open=!inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                             <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
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
//                                   setFormState(prev=>prev?structuredClone(prev):prev);
//                                 }}>
//                                 {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                               </select>
//                             </div>

//                             {specs.map((spec:any)=>{
//                               const f = (inst.fields||[]).find((x:any)=>x.key===spec.key);
//                               return (
//                                 <div key={spec.key} style={formDesign.fieldGroup}>
//                                   <label style={formDesign.label}>{spec.label}</label>
//                                   <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//                                     {spec.input === 'select' ? (
//                                       <select className="input" value={f?.value || ''} onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} style={formDesign.input}>
//                                         <option value="" disabled>Válassz…</option>
//                                         {(spec.options||[]).map((opt:string)=> <option key={opt} value={opt}>{opt}</option>)}
//                                       </select>
//                                     ) : (
//                                       <input className="input" value={f?.value || ''} onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} style={formDesign.input} />
//                                     )}
//                                     {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
//                                   </div>
//                                 </div>
//                               );
//                             })}

//                             <div style={formDesign.fieldGroup}>
//                               <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
//                                 <label style={{...formDesign.label, marginBottom:0}}>Gépállapot általános leírása</label>
//                                 <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
//                               </div>
//                               <textarea className="input" rows={2} style={formDesign.input} placeholder="Írd ide a megjegyzést…" value={(inst.fields||[]).find((x:any)=>x.key==='__simple_note__')?.value || ''} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                              
//                               {inkEnabled && (
//                                 <div className="ink-box">
//                                   <button type="button" className="ink-clear-abs" onClick={()=>{ setAnswers(prev => { const merged = { ...prev, [INK_TOGGLE(noteKey)]: false, [INK_KEY(noteKey)]: undefined, [INK_KEY(RECT_KEY(noteKey))]: undefined }; 
//                                   try { 
//         saveAnswersLocal(formId, merged); 
//           } catch (e: any) {
//               if (e.name === 'QuotaExceededError') {
//               alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
//               } else {
//                 console.error('Helyi mentési hiba:', e);
//                 }
//             }
//                                   onAnswersChange?.(merged); return merged; }); }}>×</button>
//                                   <InlineInkCanvas key={`${formId}:mdnote:${inst.id}`} value={answers[INK_KEY(noteKey)] as string} onChange={(data)=> setVal(INK_KEY(noteKey), data)} initialRect={getInkRect(noteKey)} emitInitialRect={false} onRectChange={(r) => setInkRect(noteKey, r)} />
//                                 </div>
//                               )}
//                             </div>

//                             <div style={formDesign.fieldGroup}>
//                                <label style={formDesign.label}>Fotók helye</label>
//                                <ImageUploaderWithInk value={(answers[imgKey] as FileItem[]) || []} onChange={(next)=> setVal(imgKey, next)} />
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
//                       setFormState(prev => prev ? structuredClone(prev) : prev);
//                     }}>+ Rendszer hozzáadása</button>

//                   {(el.instances || []).map((inst) => {
//                     const noteKey  = `sys_note_${inst.id}`;
//                     const inkEnabled = !!answers[INK_TOGGLE(noteKey)];

//                     return (
//                       <div key={inst.id} style={formDesign.card}>
//                         <div style={formDesign.systemHeaderBar}>
//                           <div style={formDesign.systemHeaderTitle}>BLOKK: {inst.index === 0 ? 'ÁLTALÁNOS (3.0–18.0)' : `RENDSZER ${inst.index} (3.${inst.index}–18.${inst.index})`}</div>
//                           <div style={{ display:'flex', gap:8 }}>
//                             <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                             {inst.index !== 0 && <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter(x => x.id !== inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>}
//                           </div>
//                         </div>

//                         {inst.open && (
//                           <div>
//                             {SYSTEM_SECTIONS.map((sec) => {
//                               const secNo = `${sec.code}.${inst.index}`;
//                               return (
//                                 <div key={`${inst.id}:${sec.code}`}>
//                                   <div style={formDesign.systemSubTitle}>{secNo} {sec.title}</div>
//                                   {sec.fields.map((spec) => {
//                                     const specKey = `${sec.code}_${spec.key}`;
//                                     const mf = (inst.fields||[]).find(f => f.key === specKey);
//                                     const isInkNote = (sec.code === 3 && spec.key.startsWith('prob_')) || spec.key === 'note' || spec.key.startsWith('note_') || spec.key === 'other';
//                                     const fldKey = `sys_${inst.id}_${sec.code}_${spec.key}`;
//                                     const rowInkEnabled = !!answers[INK_TOGGLE(fldKey)];

//                                     return (
//                                       <div key={specKey} style={formDesign.fieldGroup}>
//                                         <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
//                                           <label style={{...formDesign.label, marginBottom:0}}>{spec.label}</label>
//                                           {isInkNote && <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=>{ setVal(INK_TOGGLE(fldKey), !rowInkEnabled); }}>✎</button>}
//                                         </div>
                                        
//                                         <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
//                                           {spec.input === 'text' && <input className="input" style={{ ...formDesign.input, flex: 1 }} value={answers[fldKey] ?? mf?.value ?? ''} onChange={(e) => { if (mf) mf.value = e.target.value; setVal(fldKey, e.target.value); }} />}
//                                           {spec.input === 'select' && (
//                                             <select className="input" style={formDesign.input} value={answers[fldKey] ?? mf?.value ?? ''} onChange={(e)=>{ if (mf) mf.value = e.target.value; setVal(fldKey, e.target.value); }}>
//                                               <option value="" disabled>Válassz…</option>
//                                               {(spec.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
//                                             </select>
//                                           )}
//                                           {spec.input === 'dropdown_multi' && (() => {
//                                               const selected: string[] = Array.isArray(answers[fldKey]) ? answers[fldKey] : [];
//                                               const isOpen = !!answers[`__open__${fldKey}`];
//                                               return (
//                                                 <div className="combo" style={{ position:'relative', width:'100%' }}>
//                                                   <button type="button" className="input combo-trigger" style={formDesign.input} onClick={() => setVal(`__open__${fldKey}`, !isOpen)}>
//                                                     <span className={selected.length === 0 ? 'muted' : ''}>{selected.length > 0 ? selected.join(', ') : 'Válassz…'}</span>
//                                                     <span className="combo-caret">▾</span>
//                                                   </button>
//                                                   {isOpen && (
//                                                     <div className="combo-menu" role="listbox">
//                                                       <div className="combo-list">
//                                                         {(spec.options||[]).map((o, idx) => (
//                                                           <label key={idx} className={'combo-option' + (selected.includes(o) ? ' selected' : '')}>
//                                                             <input type="checkbox" checked={selected.includes(o)} onChange={() => { const next = selected.includes(o) ? selected.filter(x=>x!==o) : [...selected, o]; if(mf) mf.value=next.join(', '); setVal(fldKey, next); }} />
//                                                             <span className="combo-option-label">{o}</span>
//                                                           </label>
//                                                         ))}
//                                                       </div>
//                                                       <div className="combo-actions"><button type="button" className="btn" onClick={()=>setVal(`__open__${fldKey}`, false)}>Kész</button></div>
//                                                     </div>
//                                                   )}
//                                                 </div>
//                                               );
//                                             })()
//                                           }
//                                           {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
//                                         </div>

//                                         {isInkNote && rowInkEnabled && (
//                                           <div className="ink-box">
//                                             <button type="button" className="ink-clear-abs" onClick={()=>{ setAnswers(prev => { const merged = { ...prev, [INK_TOGGLE(fldKey)]: false, [INK_KEY(fldKey)]: undefined, [INK_KEY(RECT_KEY(fldKey))]: undefined }; 
//                                             try { 
//         saveAnswersLocal(formId, merged); 
//           } catch (e: any) {
//               if (e.name === 'QuotaExceededError') {
//               alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
//               } else {
//                 console.error('Helyi mentési hiba:', e);
//                 }
//             }
//                                             onAnswersChange?.(merged); return merged; }); }}>×</button>
//                                             <InlineInkCanvas key={`${formId}:${fldKey}`} value={answers[INK_KEY(fldKey)] as string} onChange={(data) => setVal(INK_KEY(fldKey), data)} initialRect={getInkRect(fldKey)} emitInitialRect={false} onRectChange={(r) => setInkRect(fldKey, r)} />
//                                           </div>
//                                         )}
//                                       </div>
//                                     );
//                                   })}

//                                   {sec.photoKey && (
//                                     <div style={formDesign.fieldGroup}>
//                                       <label style={formDesign.label}>Fotók helye</label>
//                                       <ImageUploaderWithInk value={((answers[`${inst.id}:${sec.photoKey}`] as FileItem[]) ?? [])} onChange={(files: FileItem[]) => setVal(`${inst.id}:${sec.photoKey}`, files)} />
//                                     </div>
//                                   )}
//                                 </div>
//                               );
//                             })}
                            
//                             <div style={formDesign.fieldGroup}>
//                               <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
//                                 <label style={{...formDesign.label, marginBottom:0}}>Megjegyzés</label>
//                                 <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
//                               </div>
//                               <textarea className="input" rows={2} style={formDesign.input} placeholder="Írd ide a megjegyzést…" value={(inst.fields||[]).find((x:any)=>x.key==='__simple_note__')?.value || ''} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                              
//                               {inkEnabled && (
//                                 <div className="ink-box">
//                                   <button type="button" className="ink-clear-abs" onClick={()=>{ setAnswers(prev => { const merged = { ...prev, [INK_TOGGLE(noteKey)]: false, [INK_KEY(noteKey)]: undefined, [INK_KEY(RECT_KEY(noteKey))]: undefined }; 
//                                   try { 
//         saveAnswersLocal(formId, merged); 
//           } catch (e: any) {
//               if (e.name === 'QuotaExceededError') {
//               alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
//               } else {
//                 console.error('Helyi mentési hiba:', e);
//                 }
//             }
//                                   onAnswersChange?.(merged); return merged; }); }}>×</button>
//                                   <InlineInkCanvas key={`${formId}:sysnote:${inst.id}`} value={answers[INK_KEY(noteKey)] as string} onChange={(data)=> setVal(INK_KEY(noteKey), data)} initialRect={getInkRect(noteKey)} emitInitialRect={false} onRectChange={(r) => setInkRect(noteKey, r)} />
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })}
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
//                       setFormState(prev=>prev?structuredClone(prev):prev);
//                     }}>+ {titleBase} hozzáadása</button>

//                   {(el.instances || []).map((inst: SimpleDetailInstance) => {
//                     if ((inst.fields?.length ?? 0) !== specs.length) { inst.fields = specs.map(s=>({ key:s.key, label:s.label, value: '' })); }

//                     return (
//                       <div key={inst.id} style={formDesign.card}>
//                         <div style={formDesign.cardHeader}>
//                           <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
//                           <div style={{ display:'flex', gap:8 }}>
//                             <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                             <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances || []).filter((x:SimpleDetailInstance)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
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
//     </>
//   )
// }


// import { useEffect, useMemo, useState, useCallback } from 'react'
// import { loadAnswersLocal, saveAnswersLocal } from '../storage'
// import type { AnswerMap, FormData, Globals, FileItem } from '../types'
// import { v4 as uuid } from 'uuid'
// import A4Page from '../components/A4Page'
// import FieldRow from '../components/FieldRow'
// import ResizableInkBox from '../components/ResizableInkBox'

// import { MACHINE_TYPES, MachineType, DETAIL_TEMPLATES, SimpleDetailInstance, 
//          SYSTEM_TEMPLATE, TANK_TEMPLATE, SystemSurveyInstance, SystemSurveyElement, 
//          SYSTEM_SECTIONS, ModuleField, EMPTY } from '../types'

// import { ImageUploaderWithInk, FileUploader } from '../components/FormComponents'

// const INK_KEY = (id: string) => `__ink__${id}`;
// const INK_TOGGLE = (id: string) => `__ink_enabled__${id}`;
// const RECT_KEY = (id:string)=> `${id}__rect`; 

// const supportsFieldSizing = typeof CSS !== 'undefined' && (CSS as any).supports?.('field-sizing', 'content');

// export const formDesign = {
//   card: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
//   cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' },
//   cardTitle: { fontSize: '15px', fontWeight: 600, color: '#111827' },
//   cardTitleHighlight: { color: '#2563eb' },
//   addBtn: { background: 'transparent', border: 'none', color: '#2563eb', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '8px 0', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' },
//   btnSecondary: { backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
//   btnDanger: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
//   fieldGroup: { marginBottom: '16px' },
//   label: { display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px' },
//   input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: 'inherit', backgroundColor: '#fff', color: '#111827' },
//   systemHeaderBar: { backgroundColor: '#f9fafb', padding: '10px 16px', margin: '-16px -16px 16px -16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
//   systemHeaderTitle: { fontSize: '12px', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
//   systemSubTitle: { fontSize: '16px', fontWeight: 700, color: '#111827', borderLeft: '3px solid #2563eb', paddingLeft: '10px', margin: '16px 0 20px 0', display: 'flex', alignItems: 'center' }
// };

// type Props = {
//   formId: string
//   onAnswersChange?: (answers: AnswerMap) => void
//   onFormChange?: (next: FormData) => void
//   initialForm?: FormData
//   activeAnswer: AnswerMap
//   globals: Globals
//   onRootRef?: (formId: string, el: HTMLDivElement | null) => void
// }

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

// export default function FormFillerEmbed({ formId, onAnswersChange, onFormChange, initialForm, activeAnswer, globals, onRootRef }: Props){
//   const [form, setForm] = useState<FormData | null>(null);
//   const [answers, setAnswers] = useState<AnswerMap>({});

//   const handleA4Ref = useCallback((node: HTMLDivElement | null) => { onRootRef?.(formId, node) }, [onRootRef, formId])

//   function setFormState(nextOrUpdater: FormData | ((prev: FormData) => FormData) | null){
//     setForm(prev => {
//       const next = typeof nextOrUpdater === 'function' ? (nextOrUpdater as (p: FormData) => FormData)(prev as FormData) : (nextOrUpdater as FormData | null);
//       if (next && onFormChange) onFormChange(next);
//       return next;
//     })
//   }

//   useEffect(() => {
//     if (!initialForm) return;
//     setForm(prev => {
//       if (!prev || prev.meta?.id !== initialForm.meta?.id) return structuredClone(initialForm);
//       return prev;
//     });
//   }, [initialForm?.meta?.id]);

//   useEffect(() => {
//     if (activeAnswer == null) return;
//     setAnswers(prev => {
//       const same = prev && Object.keys(prev).length === Object.keys(activeAnswer).length && Object.keys(prev).every(k => prev[k] === activeAnswer[k]);
//       return same ? prev : structuredClone(activeAnswer);
//     });
//   }, [activeAnswer]);

//   function updateAnswers(nextPartial: AnswerMap){
//     setAnswers(prev => {
//       const merged = { ...(prev || {}), ...(nextPartial || {}) };
//       try { 
//         saveAnswersLocal(formId, merged); 
//       } catch (e: any) {
//         if (e.name === 'QuotaExceededError') {
//           alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
//         } else {
//           console.error('Helyi mentési hiba:', e);
//         }
//       }
//       onAnswersChange?.(merged);
//       return merged;
//     });
//   }

//   const setVal = (key: string, value: any) => {
//     setAnswers(prev => {
//       const merged = { ...(prev || {}), [key]: value };
//       try { 
//         saveAnswersLocal(formId, merged); 
//       } catch (e: any) {
//         if (e.name === 'QuotaExceededError') {
//           alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
//         } else {
//           console.error('Helyi mentési hiba:', e);
//         }
//       }
//       onAnswersChange?.(merged);
//       return merged;
//     });
//   };

//   const setInk = (elId: string, dataUrl?: string) => {
//     const k = INK_KEY(elId); const next = { ...answers };
//     if (dataUrl) next[k] = dataUrl; else delete next[k];
//     updateAnswers(next);
//   }

//   const getInkRect = (baseKey: string) => answers[INK_KEY(RECT_KEY(baseKey))] as {w:number;h:number} | undefined;
//   // const setInkRect = (baseKey: string, r: {w:number, h:number}) => {
//   //   const rKey = INK_KEY(RECT_KEY(baseKey));
//   //   const old = answers[rKey] as {w:number;h:number} | undefined;
//   //   if (!old || old.h !== r.h) setVal(rKey, r);
//   // };

//   const setInkRect = (baseKey: string, r: {w:number, h:number}) => {
//     const rKey = INK_KEY(RECT_KEY(baseKey));
//     const old = answers[rKey] as {w:number;h:number} | undefined;
//     // JAVÍTVA: Már a szélesség (width) változását is figyeli és menti!
//     if (!old || old.h !== r.h || old.w !== r.w) setVal(rKey, r);
//   };

//   // EGYSÉGES TÖRLÉS FUNKCIÓ A RESIZABLE INK BOXOKHOZ
//   const handleClearInk = (targetKey: string, elId?: string) => {
//     setAnswers(prev => {
//       const merged = { ...prev, [INK_TOGGLE(targetKey)]: false, [INK_KEY(targetKey)]: undefined, [INK_KEY(RECT_KEY(targetKey))]: undefined };
//       try { saveAnswersLocal(formId, merged); } catch (e: any) {
//         if (e.name === 'QuotaExceededError') alert('A böngésző tárhelye megtelt! Kérlek, mentsd a szerverre az eddigieket!');
//       }
//       onAnswersChange?.(merged); 
//       return merged;
//     });
//     // Ha ez egy fő űrlap elem (nem modul példány), kikapcsoljuk az ink.enabled flaget is a form definitionben
//     if (elId && form) {
//       const els = (form.elements || []).slice();
//       const i = els.findIndex(e => e.id === elId);
//       if (i > -1) { 
//         els[i] = { ...els[i], ink: { ...(els[i].ink || {}), enabled: false } }; 
//         setFormState({ ...form, elements: els }); 
//       }
//     }
//   };

//   const elements = useMemo(()=>{
//     if (!form) return []
//     const arr = Array.isArray(form.elements) ? form.elements : []
//     return [...arr].sort((a:any,b:any)=> ((a?.grid?.y ?? 0) - (b?.grid?.y ?? 0)) || ((a?.grid?.x ?? 0) - (b?.grid?.x ?? 0)))
//   }, [form])

//   if (!form) return null

//   return (
//     <A4Page globals={globals} surveyName={form.meta.name} ref={handleA4Ref}>
//       <div className="list">
//         {elements.length === 0 && <div className="small" style={{ padding: '8px 0' }}>Ehhez a felméréshez még nem adtunk mezőket.</div>}

//         {elements.map((el: any) => {
//           const userFlag  = answers[INK_TOGGLE(el.id)];
//           const formFlag  = el?.ink?.enabled;
//           const inkValue  = answers[INK_KEY(el.id)] as string | undefined;
//           const inkRect   = getInkRect(el.id);
//           const inkEnabled = Boolean(userFlag ?? formFlag ?? inkValue ?? inkRect);

//           if (el.type === 'text' || el.type === 'dropdown') {
//             const baseKey = el.id;
//             return (
//               <FieldRow key={el.id} label={el.label} inkPanel={inkEnabled ? (
//                   <ResizableInkBox 
//                     value={inkValue} 
//                     onChange={(data) => setInk(el.id, data)}
//                     onClear={() => handleClearInk(el.id, el.id)}
//                     initialRect={getInkRect(baseKey)} 
//                     onRectChange={(r) => setInkRect(baseKey, r)}
//                     emitInitialRect={false}
//                   />
//                 ) : undefined}>
//                 <div className="field-wrap">
//                   {el.type === 'text' && <input className="input" style={formDesign.input} placeholder={el.placeholder || ''} value={answers[el.id] ?? ''} onChange={(e) => setVal(el.id, e.target.value)} />}
//                   {el.type === 'dropdown' && (
//                     <select className="input" style={formDesign.input} value={answers[el.id] ?? ''} onChange={(e) => setVal(el.id, e.target.value)}>
//                       <option value="" disabled>Válassz...</option>
//                       {(el.options ?? []).map((o: string, idx: number) => <option key={idx} value={o}>{o}</option>)}
//                     </select>
//                   )}
//                   <button type="button" className="icon-inline" onClick={()=>{
//                       const next = !inkEnabled; setVal(INK_TOGGLE(el.id), next);
//                       const els = (form.elements || []).slice();
//                       const i = els.findIndex(e => e.id === el.id);
//                       if (i > -1) { els[i] = { ...els[i], ink: { ...(els[i].ink || {}), enabled: next } }; setFormState({ ...form, elements: els }); }
//                     }} title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}>✎</button>
//                 </div>
//               </FieldRow>
//             )
//           }

//           if (el.type === 'comment') {
//             const noteKey = el.id; 
//             const inkEnabled = !!answers[INK_TOGGLE(noteKey)];
//             const textVal: string = (answers[`${noteKey}__text`] as string) ?? '';

//             return (
//               <FieldRow key={el.id} label={el.label} className="stacked">
//                 {supportsFieldSizing ? (
//                   <textarea className="input" rows={1} style={{ ...formDesign.input, ...( { ['fieldSizing' as any]:'content' } as any), overflow:'hidden', resize:'none', whiteSpace:'pre-wrap' }} placeholder="Írd ide a megjegyzést…" value={textVal} onChange={(e)=> setVal(`${noteKey}__text`, e.target.value)} />
//                 ) : (
//                   <div className="input" contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning style={{ ...formDesign.input, whiteSpace:'pre-wrap', wordBreak:'break-word', outline:'none' }} onInput={(e)=> setVal(`${noteKey}__text`, e.currentTarget.textContent ?? '')}>{textVal}</div>
//                 )}
//                 <div className="small" style={{ color:'#6b7280', marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
//                   <span>Rajz/komment</span>
//                   <button type="button" className="icon-inline" title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'} onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
//                 </div>
//                 {inkEnabled && (
//                   <ResizableInkBox 
//                     value={answers[INK_KEY(noteKey)] as string} 
//                     onChange={(d)=> setVal(INK_KEY(noteKey), d)}
//                     onClear={() => handleClearInk(noteKey)}
//                     initialRect={getInkRect(noteKey)} 
//                     onRectChange={(r) => setInkRect(noteKey, r)}
//                     emitInitialRect={false}
//                   />
//                 )}
//               </FieldRow>
//             )
//           }

//           if (el.type === 'title') {
//             return (
//               <div key={el.id} style={{padding:'6px 0'}}>
//                 <h3 style={{margin:0, fontSize:18, fontWeight:700}}>{el.label}</h3>
//                 {el.showNote && el.note && <div style={{ marginTop:2, color:'#6b7280', fontSize:12 }}>{el.note}</div>}
//               </div>
//             );
//           }

//           if (el.type === 'note_text') {
//             const val: string = answers[el.id] ?? '';
//             return (
//               <FieldRow key={el.id} label={el.label}>
//                 <div style={{ position: 'relative', width: '100%' }}>
//                   {(!val || val.length === 0) && <span style={{ position: 'absolute', left: 12, top: 10, pointerEvents: 'none', opacity: 0.5, font: 'inherit', fontSize: '14px' }}>Írd ide a megjegyzést…</span>}
//                   <div className="input" contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning style={{ ...formDesign.input, whiteSpace: 'pre-wrap', wordBreak: 'break-word', outline: 'none' }} onInput={(e)=> setVal(el.id, (e.currentTarget.textContent ?? ''))} onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); }}>{val}</div>
//                 </div>
//               </FieldRow>
//             );
//           }

//           if (el.type === 'dropdown_multi') {
//             const selected: string[] = Array.isArray(answers[el.id]) ? answers[el.id] : [];
//             const isOpen = !!answers[`__open__${el.id}`];
//             const displayText = selected.length > 0 ? selected.join(', ') : 'Válassz…';

//             return (
//               <FieldRow key={el.id} label={el.label} className="no-border">
//                 <div className="combo" style={{ position:'relative' }}>
//                   <button type="button" className="input combo-trigger" style={formDesign.input} onClick={() => setVal(`__open__${el.id}`, !isOpen)}>
//                     <span className={selected.length === 0 ? 'muted' : ''}>{displayText}</span>
//                     <span className="combo-caret">▾</span>
//                   </button>
//                   {isOpen && (
//                     <div className="combo-menu" role="listbox">
//                       <div className="combo-list">
//                         {(el.options || []).map((o: string, idx: number) => (
//                           <label key={idx} className={'combo-option' + (selected.includes(o) ? ' selected' : '')}>
//                             <input type="checkbox" checked={selected.includes(o)} onChange={() => setVal(el.id, selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o])} />
//                             <span className="combo-option-label">{o}</span>
//                           </label>
//                         ))}
//                       </div>
//                       <div className="combo-actions"><button type="button" className="btn" onClick={() => setVal(`__open__${el.id}`, false)}>Kész</button></div>
//                     </div>
//                   )}
//                 </div>
//               </FieldRow>
//             );
//           }

//           if (el.type === 'images') {
//             return (
//               <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
//                 <div style={{ display:'flex', flexDirection:'column', gap:8 }}><ImageUploaderWithInk value={answers[el.id] || []} onChange={(next)=> setVal(el.id, next)} /></div>
//               </FieldRow>
//             );
//           }

//           if (el.type === 'file') {
//             return (
//               <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
//                 <div style={{ display:'flex', flexDirection:'column', gap:8 }}><FileUploader value={answers[el.id] || []} onChange={(next)=>setVal(el.id, next)} /></div>
//               </FieldRow>
//             );
//           }

//           if (el.type === 'sketch') {
//             const dataUrl: string | undefined = answers[el.id];
//             const baseKey = el.id;
            
//             return (
//               <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
//                 {el.hideLabel && <div className="ink-title" style={{fontWeight:600, marginBottom:8}}>{el.label}</div>}
//                 <ResizableInkBox 
//                   value={dataUrl} 
//                   onChange={(d)=>setVal(el.id, d)}
//                   onClear={() => {
//                      setVal(el.id, undefined);
//                      // A mentett méretet is töröljük a helyes kulcs alól!
//                      setVal(INK_KEY(RECT_KEY(baseKey)), undefined);
//                   }}
//                   // VISSZAKAPTA AZ EREDETI KULCSOT: Most már be fogja tölteni a 160px-es méretet!
//                   initialRect={getInkRect(baseKey)} 
//                   onRectChange={(r) => setInkRect(baseKey, r)}
//                   emitInitialRect={false}
//                 />
//               </FieldRow>
//             )
//           }

//           if (el.type === 'module_machine_simple') {
//             return (
//               <div key={el.id} style={{ width:'100%' }}>
//                 <div style={{ display:'flex', gap:8, marginBottom:16, alignItems: 'center' }}>
//                   <select id={`add-select-${el.id}`} className="input" style={{...formDesign.input, width: '200px', padding: '6px 12px'}} defaultValue={MACHINE_TYPES[0]}>
//                     {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                   </select>
//                   <button className="btn" style={formDesign.btnSecondary} onClick={()=>{
//                       const sel = document.getElementById(`add-select-${el.id}`) as HTMLSelectElement;
//                       const t: MachineType = (sel?.value as MachineType) || MACHINE_TYPES[0];
//                       const inst = { id: uuid(), title: `${t} ${nextIndexForType(el.instances, t)}`, open: true, machineType: t, fields: [ { key:'manufacturer', label:'Gyártó' }, { key:'model', label:'Típus' } ] };
//                       el.instances = [ ...(el.instances||[]), inst ];
//                       setFormState(prev=>prev?structuredClone(prev):prev);
//                     }}>+ Hozzáadás</button>
//                 </div>

//                 {sortInstancesByType(el.instances).map((inst: any) => {
//                   const noteKey = `ms_note_${inst.id}`;
//                   const inkEnabled = !!answers[INK_TOGGLE(noteKey)];
//                   const getFieldVal = (k:string) => (inst.fields||[]).find((x:any)=>x.key===k)?.value || '';

//                   return (
//                     <div key={inst.id} style={formDesign.card}>
//                       <div style={formDesign.cardHeader}>
//                         <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
//                         <div style={{ display:'flex', gap:8 }}>
//                           <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                           <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
//                         </div>
//                       </div>

//                       {inst.open && (
//                         <>
//                           <div style={formDesign.fieldGroup}>
//                             <label style={formDesign.label}>Gép típusa</label>
//                             <select className="input" style={formDesign.input} value={inst.machineType} onChange={(e)=>{
//                                 const newType = e.target.value as MachineType;
//                                 inst.machineType = newType; inst.title = `${newType} ${nextIndexForType((el.instances||[]).filter((x:any)=>x.id!==inst.id), newType)}`;
//                                 setFormState(prev=>prev?structuredClone(prev):prev);
//                               }}>
//                               {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                             </select>
//                           </div>
                          
//                           <div style={formDesign.fieldGroup}>
//                             <label style={formDesign.label}>Gyártó</label>
//                             <input className="input" style={formDesign.input} value={getFieldVal('manufacturer')} onChange={(e)=>{ const f = (inst.fields||[]).find((x:any)=>x.key==='manufacturer'); if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
//                           </div>

//                           <div style={formDesign.fieldGroup}>
//                             <label style={formDesign.label}>Típus</label>
//                             <input className="input" style={formDesign.input} value={getFieldVal('model')} onChange={(e)=>{ const f = (inst.fields||[]).find((x:any)=>x.key==='model'); if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
//                           </div>

//                           <div style={formDesign.fieldGroup}>
//                             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
//                               <label style={{...formDesign.label, marginBottom:0}}>Megjegyzés</label>
//                               <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
//                             </div>
//                             {supportsFieldSizing ? (
//                               <textarea className="input" rows={1} style={{ ...formDesign.input, ...( { ['fieldSizing' as any]:'content' } as any), overflow:'hidden', resize:'none', whiteSpace:'pre-wrap' }} placeholder="Írd ide a megjegyzést…" value={getFieldVal('__simple_note__')} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
//                             ) : (
//                               <div className="input" contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning style={{ ...formDesign.input, whiteSpace:'pre-wrap', wordBreak:'break-word', outline:'none' }} onInput={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = (e.currentTarget.textContent ?? ''); setFormState(prev=>prev?structuredClone(prev):prev); }}>{getFieldVal('__simple_note__')}</div>
//                             )}
                            
//                             {inkEnabled && (
//                               <ResizableInkBox 
//                                 value={answers[INK_KEY(noteKey)] as string} 
//                                 onChange={(data)=> setVal(INK_KEY(noteKey), data)}
//                                 onClear={() => handleClearInk(noteKey)}
//                                 initialRect={getInkRect(noteKey)} 
//                                 onRectChange={(r) => setInkRect(noteKey, r)}
//                                 emitInitialRect={false}
//                               />
//                             )}
//                           </div>
//                         </>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             );
//           }

//           if (el.type === 'module_machine_detail') {
//             return (
//               <div key={el.id} style={{ width:'100%' }}>
//                 <div style={{ display:'flex', gap:8, marginBottom:16, alignItems: 'center' }}>
//                   <select id={`add-select-${el.id}`} className="input" style={{...formDesign.input, width: '200px', padding: '6px 12px'}} defaultValue={MACHINE_TYPES[0]}>
//                     {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                   </select>
//                   <button className="btn" style={formDesign.btnSecondary} onClick={()=>{
//                       const sel = document.getElementById(`add-select-${el.id}`) as HTMLSelectElement;
//                       const t: MachineType = (sel?.value as MachineType) || MACHINE_TYPES[0];
//                       const specs = DETAIL_TEMPLATES[t] || [];
//                       el.instances = [...(el.instances||[]), { id:uuid(), title:`${t} ${nextIndexForType(el.instances, t)}`, open:true, machineType:t, fields: specs.map(s=>({key:s.key,label:s.label, value: ''})) }];
//                       setFormState(prev=>prev?structuredClone(prev):prev);
//                     }}>+ Hozzáadás</button>
//                 </div>

//                 {sortInstancesByType(el.instances).map((inst: any) => {
//                   const specs = DETAIL_TEMPLATES[inst.machineType] || [];
//                   if ((inst.fields?.length ?? 0) !== specs.length) { inst.fields = specs.map((s:any)=>({ key:s.key, label:s.label, value: (inst.fields||[]).find((f:any)=>f.key===s.key)?.value ?? '' })); }
//                   const noteKey = `md_note_${inst.id}`; const imgKey = `md_images_${inst.id}`;
//                   const inkEnabled = !!answers[INK_TOGGLE(noteKey)];

//                   return (
//                     <div key={inst.id} style={formDesign.card}>
//                       <div style={formDesign.cardHeader}>
//                         <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
//                         <div style={{ display:'flex', gap:8 }}>
//                           <button style={formDesign.btnSecondary} onClick={()=>{ inst.open=!inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                           <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
//                         </div>
//                       </div>

//                       {inst.open && (
//                         <>
//                           <div style={formDesign.fieldGroup}>
//                             <label style={formDesign.label}>Gép típusa</label>
//                             <select className="input" style={formDesign.input} value={inst.machineType} onChange={(e)=>{
//                                 const newType = e.target.value as MachineType;
//                                 inst.machineType = newType; inst.title = `${newType} ${nextIndexForType(el.instances?.filter((x:any)=>x.id!==inst.id), newType)}`;
//                                 inst.fields = (DETAIL_TEMPLATES[newType] || []).map((s:any)=>({ key:s.key, label:s.label }));
//                                 setFormState(prev=>prev?structuredClone(prev):prev);
//                               }}>
//                               {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                             </select>
//                           </div>

//                           {specs.map((spec:any)=>{
//                             const f = (inst.fields||[]).find((x:any)=>x.key===spec.key);
//                             return (
//                               <div key={spec.key} style={formDesign.fieldGroup}>
//                                 <label style={formDesign.label}>{spec.label}</label>
//                                 <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//                                   {spec.input === 'select' ? (
//                                     <select className="input" value={f?.value || ''} onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} style={formDesign.input}>
//                                       <option value="" disabled>Válassz…</option>
//                                       {(spec.options||[]).map((opt:string)=> <option key={opt} value={opt}>{opt}</option>)}
//                                     </select>
//                                   ) : (
//                                     <input className="input" value={f?.value || ''} onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} style={formDesign.input} />
//                                   )}
//                                   {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
//                                 </div>
//                               </div>
//                             );
//                           })}

//                           <div style={formDesign.fieldGroup}>
//                             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
//                               <label style={{...formDesign.label, marginBottom:0}}>Gépállapot általános leírása</label>
//                               <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
//                             </div>
//                             <textarea className="input" rows={2} style={formDesign.input} placeholder="Írd ide a megjegyzést…" value={(inst.fields||[]).find((x:any)=>x.key==='__simple_note__')?.value || ''} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                            
//                             {inkEnabled && (
//                               <ResizableInkBox 
//                                 value={answers[INK_KEY(noteKey)] as string} 
//                                 onChange={(data)=> setVal(INK_KEY(noteKey), data)}
//                                 onClear={() => handleClearInk(noteKey)}
//                                 initialRect={getInkRect(noteKey)} 
//                                 onRectChange={(r) => setInkRect(noteKey, r)}
//                                 emitInitialRect={false}
//                               />
//                             )}
//                           </div>

//                           <div style={formDesign.fieldGroup}>
//                              <label style={formDesign.label}>Fotók helye</label>
//                              <ImageUploaderWithInk value={(answers[imgKey] as FileItem[]) || []} onChange={(next)=> setVal(imgKey, next)} />
//                           </div>
//                         </>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             );
//           }

//           if (el.type === 'module_system_survey') {
//             const nextIndex = (instances?: SystemSurveyInstance[]) => 1 + Math.max(0, ...((instances||[]).map(i => i.index)));

//             return (
//               <div key={el.id} style={{ width:'100%' }}>
//                 <button className="btn" style={{...formDesign.addBtn, marginBottom: '16px'}} onClick={()=>{
//                     const idx = nextIndex(el.instances);
//                     const fields: ModuleField[] = SYSTEM_SECTIONS.flatMap(sec => sec.fields.map(f => ({ key: `${sec.code}_${f.key}`, label: f.label })) );
//                     el.instances = [ ...(el.instances || []), { id: uuid(), index: idx, open: true, fields } ];
//                     setFormState(prev => prev ? structuredClone(prev) : prev);
//                   }}>+ Rendszer hozzáadása</button>

//                 {(el.instances || []).map((inst: any) => {
//                   const noteKey  = `sys_note_${inst.id}`;
//                   const inkEnabled = !!answers[INK_TOGGLE(noteKey)];

//                   return (
//                     <div key={inst.id} style={formDesign.card}>
//                       <div style={formDesign.systemHeaderBar}>
//                         <div style={formDesign.systemHeaderTitle}>BLOKK: {inst.index === 0 ? 'ÁLTALÁNOS (3.0–18.0)' : `RENDSZER ${inst.index} (3.${inst.index}–18.${inst.index})`}</div>
//                         <div style={{ display:'flex', gap:8 }}>
//                           <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                           {inst.index !== 0 && <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any) => x.id !== inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>}
//                         </div>
//                       </div>

//                       {inst.open && (
//                         <div>
//                           {SYSTEM_SECTIONS.map((sec) => {
//                             const secNo = `${sec.code}.${inst.index}`;
//                             return (
//                               <div key={`${inst.id}:${sec.code}`}>
//                                 <div style={formDesign.systemSubTitle}>{secNo} {sec.title}</div>
//                                 {sec.fields.map((spec) => {
//                                   const specKey = `${sec.code}_${spec.key}`;
//                                   const mf = (inst.fields||[]).find((f:any) => f.key === specKey);
//                                   const isInkNote = (sec.code === 3 && spec.key.startsWith('prob_')) || spec.key === 'note' || spec.key.startsWith('note_') || spec.key === 'other';
//                                   const fldKey = `sys_${inst.id}_${sec.code}_${spec.key}`;
//                                   const rowInkEnabled = !!answers[INK_TOGGLE(fldKey)];

//                                   return (
//                                     <div key={specKey} style={formDesign.fieldGroup}>
//                                       <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
//                                         <label style={{...formDesign.label, marginBottom:0}}>{spec.label}</label>
//                                         {isInkNote && <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=>{ setVal(INK_TOGGLE(fldKey), !rowInkEnabled); }}>✎</button>}
//                                       </div>
                                      
//                                       <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
//                                         {spec.input === 'text' && <input className="input" style={{ ...formDesign.input, flex: 1 }} value={answers[fldKey] ?? mf?.value ?? ''} onChange={(e) => { if (mf) mf.value = e.target.value; setVal(fldKey, e.target.value); }} />}
//                                         {spec.input === 'select' && (
//                                           <select className="input" style={formDesign.input} value={answers[fldKey] ?? mf?.value ?? ''} onChange={(e)=>{ if (mf) mf.value = e.target.value; setVal(fldKey, e.target.value); }}>
//                                             <option value="" disabled>Válassz…</option>
//                                             {(spec.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
//                                           </select>
//                                         )}
//                                         {spec.input === 'dropdown_multi' && (() => {
//                                             const selected: string[] = Array.isArray(answers[fldKey]) ? answers[fldKey] : [];
//                                             const isOpen = !!answers[`__open__${fldKey}`];
//                                             return (
//                                               <div className="combo" style={{ position:'relative', width:'100%' }}>
//                                                 <button type="button" className="input combo-trigger" style={formDesign.input} onClick={() => setVal(`__open__${fldKey}`, !isOpen)}>
//                                                   <span className={selected.length === 0 ? 'muted' : ''}>{selected.length > 0 ? selected.join(', ') : 'Válassz…'}</span>
//                                                   <span className="combo-caret">▾</span>
//                                                 </button>
//                                                 {isOpen && (
//                                                   <div className="combo-menu" role="listbox">
//                                                     <div className="combo-list">
//                                                       {(spec.options||[]).map((o, idx) => (
//                                                         <label key={idx} className={'combo-option' + (selected.includes(o) ? ' selected' : '')}>
//                                                           <input type="checkbox" checked={selected.includes(o)} onChange={() => { const next = selected.includes(o) ? selected.filter(x=>x!==o) : [...selected, o]; if(mf) mf.value=next.join(', '); setVal(fldKey, next); }} />
//                                                           <span className="combo-option-label">{o}</span>
//                                                         </label>
//                                                       ))}
//                                                     </div>
//                                                     <div className="combo-actions"><button type="button" className="btn" onClick={()=>setVal(`__open__${fldKey}`, false)}>Kész</button></div>
//                                                   </div>
//                                                 )}
//                                               </div>
//                                             );
//                                           })()
//                                         }
//                                         {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
//                                       </div>

//                                       {isInkNote && rowInkEnabled && (
//                                         <ResizableInkBox 
//                                           value={answers[INK_KEY(fldKey)] as string} 
//                                           onChange={(data) => setVal(INK_KEY(fldKey), data)}
//                                           onClear={() => handleClearInk(fldKey)}
//                                           initialRect={getInkRect(fldKey)} 
//                                           onRectChange={(r) => setInkRect(fldKey, r)}
//                                           emitInitialRect={false}
//                                         />
//                                       )}
//                                     </div>
//                                   );
//                                 })}

//                                 {sec.photoKey && (
//                                   <div style={formDesign.fieldGroup}>
//                                     <label style={formDesign.label}>Fotók helye</label>
//                                     <ImageUploaderWithInk value={((answers[`${inst.id}:${sec.photoKey}`] as FileItem[]) ?? [])} onChange={(files: FileItem[]) => setVal(`${inst.id}:${sec.photoKey}`, files)} />
//                                   </div>
//                                 )}
//                               </div>
//                             );
//                           })}
                          
//                           <div style={formDesign.fieldGroup}>
//                             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
//                               <label style={{...formDesign.label, marginBottom:0}}>Megjegyzés</label>
//                               <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
//                             </div>
//                             <textarea className="input" rows={2} style={formDesign.input} placeholder="Írd ide a megjegyzést…" value={(inst.fields||[]).find((x:any)=>x.key==='__simple_note__')?.value || ''} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                            
//                             {inkEnabled && (
//                               <ResizableInkBox 
//                                 value={answers[INK_KEY(noteKey)] as string} 
//                                 onChange={(data)=> setVal(INK_KEY(noteKey), data)}
//                                 onClear={() => handleClearInk(noteKey)}
//                                 initialRect={getInkRect(noteKey)} 
//                                 onRectChange={(r) => setInkRect(noteKey, r)}
//                                 emitInitialRect={false}
//                               />
//                             )}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             );
//           }

//           if (el.type === 'module_system_detail' || el.type === 'module_tank_detail') {
//             const specs = el.type === 'module_system_detail' ? SYSTEM_TEMPLATE : TANK_TEMPLATE;
//             const titleBase = el.type === 'module_system_detail' ? 'Rendszer' : 'Tartály';

//             return (
//               <div key={el.id} style={{ width:'100%' }}>
//                 <button className="btn" style={{...formDesign.addBtn, marginBottom: '16px'}} onClick={()=>{
//                     const inst: SimpleDetailInstance = { id: uuid(), title: `${titleBase} ${1 + ((el.instances || []).length || 0)}`, open: true, fields: specs.map(s => ({ key:s.key, label:s.label })) };
//                     el.instances = [ ...(el.instances || []), inst ];
//                     setFormState(prev=>prev?structuredClone(prev):prev);
//                   }}>+ {titleBase} hozzáadása</button>

//                 {(el.instances || []).map((inst: SimpleDetailInstance) => {
//                   if ((inst.fields?.length ?? 0) !== specs.length) { inst.fields = specs.map(s=>({ key:s.key, label:s.label, value: '' })); }

//                   return (
//                     <div key={inst.id} style={formDesign.card}>
//                       <div style={formDesign.cardHeader}>
//                         <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
//                         <div style={{ display:'flex', gap:8 }}>
//                           <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                           <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances || []).filter((x:SimpleDetailInstance)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
//                         </div>
//                       </div>

//                       {inst.open && (
//                         <>
//                           {specs.map(spec => (
//                             <div key={spec.key} style={formDesign.fieldGroup}>
//                               <label style={formDesign.label}>{spec.label}</label>
//                               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//                                 {spec.input === 'select' ? (
//                                   <select className="input" style={formDesign.input} value={''} onChange={()=>{}}>
//                                     <option value="" disabled>Válassz…</option>
//                                     {(spec.options||[]).map((opt:string)=> <option key={opt} value={opt}>{opt}</option>)}
//                                   </select>
//                                 ) : (
//                                   <input className="input" style={formDesign.input} value={''} onChange={()=>{}} />
//                                 )}
//                                 {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
//                               </div>
//                             </div>
//                           ))}
//                         </>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             );
//           }

//           return null
//         })}
//       </div>
//     </A4Page>
//   )
// }

// import { useEffect, useMemo, useState, useCallback } from 'react'
// import { loadAnswersLocal, saveAnswersLocal } from '../storage'
// import type { AnswerMap, FormData, Globals, FileItem } from '../types'
// import { v4 as uuid } from 'uuid'
// import A4Page from '../components/A4Page'
// import FieldRow from '../components/FieldRow'
// import ResizableInkBox from '../components/ResizableInkBox'

// import { MACHINE_TYPES, MachineType, DETAIL_TEMPLATES, SimpleDetailInstance, 
//          SYSTEM_TEMPLATE, TANK_TEMPLATE, SystemSurveyInstance, SystemSurveyElement, 
//          SYSTEM_SECTIONS, ModuleField, EMPTY } from '../types'

// import { ImageUploaderWithInk, FileUploader } from '../components/FormComponents'

// const INK_KEY = (id: string) => `__ink__${id}`;
// const INK_TOGGLE = (id: string) => `__ink_enabled__${id}`;
// const RECT_KEY = (id:string)=> `${id}__rect`; 

// const supportsFieldSizing = typeof CSS !== 'undefined' && (CSS as any).supports?.('field-sizing', 'content');

// export const formDesign = {
//   card: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
//   cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' },
//   cardTitle: { fontSize: '15px', fontWeight: 600, color: '#111827' },
//   cardTitleHighlight: { color: '#2563eb' },
//   addBtn: { background: 'transparent', border: 'none', color: '#2563eb', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '8px 0', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' },
//   btnSecondary: { backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
//   btnDanger: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
//   fieldGroup: { marginBottom: '16px' },
//   label: { display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px' },
//   input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: 'inherit', backgroundColor: '#fff', color: '#111827' },
//   systemHeaderBar: { backgroundColor: '#f9fafb', padding: '10px 16px', margin: '-16px -16px 16px -16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
//   systemHeaderTitle: { fontSize: '12px', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
//   systemSubTitle: { fontSize: '16px', fontWeight: 700, color: '#111827', borderLeft: '3px solid #2563eb', paddingLeft: '10px', margin: '16px 0 20px 0', display: 'flex', alignItems: 'center' }
// };

// type Props = {
//   formId: string
//   onAnswersChange?: (answers: AnswerMap) => void
//   onFormChange?: (next: FormData) => void
//   initialForm?: FormData
//   activeAnswer: AnswerMap
//   globals: Globals
//   onRootRef?: (formId: string, el: HTMLDivElement | null) => void
// }

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

// export default function FormFillerEmbed({ formId, onAnswersChange, onFormChange, initialForm, activeAnswer, globals, onRootRef }: Props){
//   const [form, setForm] = useState<FormData | null>(null);
//   const [answers, setAnswers] = useState<AnswerMap>({});

//   const handleA4Ref = useCallback((node: HTMLDivElement | null) => { onRootRef?.(formId, node) }, [onRootRef, formId])

//   function setFormState(nextOrUpdater: FormData | ((prev: FormData) => FormData) | null){
//     setForm(prev => {
//       const next = typeof nextOrUpdater === 'function' ? (nextOrUpdater as (p: FormData) => FormData)(prev as FormData) : (nextOrUpdater as FormData | null);
//       if (next && onFormChange) onFormChange(next);
//       return next;
//     })
//   }

//   useEffect(() => {
//     if (!initialForm) return;
//     setForm(prev => {
//       if (!prev || prev.meta?.id !== initialForm.meta?.id) return structuredClone(initialForm);
//       return prev;
//     });
//   }, [initialForm?.meta?.id]);

//   useEffect(() => {
//     if (activeAnswer == null) return;
//     setAnswers(prev => {
//       const same = prev && Object.keys(prev).length === Object.keys(activeAnswer).length && Object.keys(prev).every(k => prev[k] === activeAnswer[k]);
//       return same ? prev : structuredClone(activeAnswer);
//     });
//   }, [activeAnswer]);

//   function updateAnswers(nextPartial: AnswerMap){
//     setAnswers(prev => {
//       const merged = { ...(prev || {}), ...(nextPartial || {}) };
//       try { 
//         saveAnswersLocal(formId, merged); 
//       } catch (e: any) {
//         if (e.name === 'QuotaExceededError') {
//           alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
//         } else {
//           console.error('Helyi mentési hiba:', e);
//         }
//       }
//       onAnswersChange?.(merged);
//       return merged;
//     });
//   }

//   const setVal = (key: string, value: any) => {
//     setAnswers(prev => {
//       const merged = { ...(prev || {}), [key]: value };
//       try { 
//         saveAnswersLocal(formId, merged); 
//       } catch (e: any) {
//         if (e.name === 'QuotaExceededError') {
//           alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
//         } else {
//           console.error('Helyi mentési hiba:', e);
//         }
//       }
//       onAnswersChange?.(merged);
//       return merged;
//     });
//   };

//   const setInk = (elId: string, dataUrl?: string) => {
//     const k = INK_KEY(elId); const next = { ...answers };
//     if (dataUrl) next[k] = dataUrl; else delete next[k];
//     updateAnswers(next);
//   }

//   const getInkRect = (baseKey: string) => answers[INK_KEY(RECT_KEY(baseKey))] as {w:number;h:number} | undefined;
  
//   const setInkRect = (baseKey: string, r: {w:number, h:number}) => {
//     const rKey = INK_KEY(RECT_KEY(baseKey));
//     const old = answers[rKey] as {w:number;h:number} | undefined;
//     if (!old || old.h !== r.h || old.w !== r.w) setVal(rKey, r);
//   };

//   const handleClearInk = (targetKey: string, elId?: string) => {
//     setAnswers(prev => {
//       const merged = { ...prev, [INK_TOGGLE(targetKey)]: false, [INK_KEY(targetKey)]: undefined, [INK_KEY(RECT_KEY(targetKey))]: undefined };
//       try { saveAnswersLocal(formId, merged); } catch (e: any) {
//         if (e.name === 'QuotaExceededError') alert('A böngésző tárhelye megtelt! Kérlek, mentsd a szerverre az eddigieket!');
//       }
//       onAnswersChange?.(merged); 
//       return merged;
//     });
//     if (elId && form) {
//       const els = (form.elements || []).slice();
//       const i = els.findIndex(e => e.id === elId);
//       if (i > -1) { 
//         els[i] = { ...els[i], ink: { ...(els[i].ink || {}), enabled: false } }; 
//         setFormState({ ...form, elements: els }); 
//       }
//     }
//   };

//   const elements = useMemo(()=>{
//     if (!form) return []
//     const arr = Array.isArray(form.elements) ? form.elements : []
//     return [...arr].sort((a:any,b:any)=> ((a?.grid?.y ?? 0) - (b?.grid?.y ?? 0)) || ((a?.grid?.x ?? 0) - (b?.grid?.x ?? 0)))
//   }, [form])

//   if (!form) return null

//   return (
//     <A4Page globals={globals} surveyName={form.meta.name} ref={handleA4Ref}>
//       <div className="list">
//         {elements.length === 0 && <div className="small" style={{ padding: '8px 0' }}>Ehhez a felméréshez még nem adtunk mezőket.</div>}

//         {elements.map((el: any) => {
//           const userFlag  = answers[INK_TOGGLE(el.id)];
//           const formFlag  = el?.ink?.enabled;
//           const inkValue  = answers[INK_KEY(el.id)] as string | undefined;
//           const inkRect   = getInkRect(el.id);
//           const inkEnabled = Boolean(userFlag ?? formFlag ?? inkValue ?? inkRect);

//           if (el.type === 'text' || el.type === 'dropdown') {
//             const baseKey = el.id;
//             return (
//               <FieldRow key={el.id} label={el.label} inkPanel={inkEnabled ? (
//                   <ResizableInkBox 
//                     value={inkValue} 
//                     onChange={(data) => setInk(el.id, data)}
//                     onClear={() => handleClearInk(el.id, el.id)}
//                     initialRect={getInkRect(baseKey)} 
//                     onRectChange={(r) => setInkRect(baseKey, r)}
//                     emitInitialRect={false}
//                   />
//                 ) : undefined}>
//                 <div className="field-wrap">
//                   {el.type === 'text' && <input className="input" style={formDesign.input} placeholder={el.placeholder || ''} value={answers[el.id] ?? ''} onChange={(e) => setVal(el.id, e.target.value)} />}
//                   {el.type === 'dropdown' && (
//                     <select className="input" style={formDesign.input} value={answers[el.id] ?? ''} onChange={(e) => setVal(el.id, e.target.value)}>
//                       <option value="" disabled>Válassz...</option>
//                       {(el.options ?? []).map((o: string, idx: number) => <option key={idx} value={o}>{o}</option>)}
//                     </select>
//                   )}
//                   <button type="button" className="icon-inline" onClick={()=>{
//                       const next = !inkEnabled; setVal(INK_TOGGLE(el.id), next);
//                       const els = (form.elements || []).slice();
//                       const i = els.findIndex(e => e.id === el.id);
//                       if (i > -1) { els[i] = { ...els[i], ink: { ...(els[i].ink || {}), enabled: next } }; setFormState({ ...form, elements: els }); }
//                     }} title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}>✎</button>
//                 </div>
//               </FieldRow>
//             )
//           }

//           if (el.type === 'comment') {
//             const noteKey = el.id; 
//             const inkEnabled = !!answers[INK_TOGGLE(noteKey)];
//             const textVal: string = (answers[`${noteKey}__text`] as string) ?? '';

//             return (
//               <FieldRow key={el.id} label={el.label} className="stacked">
//                 {supportsFieldSizing ? (
//                   <textarea className="input" rows={1} style={{ ...formDesign.input, ...( { ['fieldSizing' as any]:'content' } as any), overflow:'hidden', resize:'none', whiteSpace:'pre-wrap' }} placeholder="Írd ide a megjegyzést…" value={textVal} onChange={(e)=> setVal(`${noteKey}__text`, e.target.value)} />
//                 ) : (
//                   <div className="input" contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning style={{ ...formDesign.input, whiteSpace:'pre-wrap', wordBreak:'break-word', outline:'none' }} onInput={(e)=> setVal(`${noteKey}__text`, e.currentTarget.textContent ?? '')}>{textVal}</div>
//                 )}
//                 <div className="small" style={{ color:'#6b7280', marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
//                   <span>Rajz/komment</span>
//                   <button type="button" className="icon-inline" title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'} onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
//                 </div>
//                 {inkEnabled && (
//                   <ResizableInkBox 
//                     value={answers[INK_KEY(noteKey)] as string} 
//                     onChange={(d)=> setVal(INK_KEY(noteKey), d)}
//                     onClear={() => handleClearInk(noteKey)}
//                     initialRect={getInkRect(noteKey)} 
//                     onRectChange={(r) => setInkRect(noteKey, r)}
//                     emitInitialRect={false}
//                   />
//                 )}
//               </FieldRow>
//             )
//           }

//           if (el.type === 'title') {
//             return (
//               <div key={el.id} style={{padding:'6px 0'}}>
//                 <h3 style={{margin:0, fontSize:18, fontWeight:700}}>{el.label}</h3>
//                 {el.showNote && el.note && <div style={{ marginTop:2, color:'#6b7280', fontSize:12 }}>{el.note}</div>}
//               </div>
//             );
//           }

//           if (el.type === 'note_text') {
//             const val: string = answers[el.id] ?? '';
//             return (
//               <FieldRow key={el.id} label={el.label}>
//                 <div style={{ position: 'relative', width: '100%' }}>
//                   {(!val || val.length === 0) && <span style={{ position: 'absolute', left: 12, top: 10, pointerEvents: 'none', opacity: 0.5, font: 'inherit', fontSize: '14px' }}>Írd ide a megjegyzést…</span>}
//                   <div className="input" contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning style={{ ...formDesign.input, whiteSpace: 'pre-wrap', wordBreak: 'break-word', outline: 'none' }} onInput={(e)=> setVal(el.id, (e.currentTarget.textContent ?? ''))} onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); }}>{val}</div>
//                 </div>
//               </FieldRow>
//             );
//           }

//           if (el.type === 'dropdown_multi') {
//             const selected: string[] = Array.isArray(answers[el.id]) ? answers[el.id] : [];
//             const isOpen = !!answers[`__open__${el.id}`];
//             const displayText = selected.length > 0 ? selected.join(', ') : 'Válassz…';

//             return (
//               <FieldRow key={el.id} label={el.label} className="no-border">
//                 <div className="combo" style={{ position:'relative' }}>
//                   <button type="button" className="input combo-trigger" style={formDesign.input} onClick={() => setVal(`__open__${el.id}`, !isOpen)}>
//                     <span className={selected.length === 0 ? 'muted' : ''}>{displayText}</span>
//                     <span className="combo-caret">▾</span>
//                   </button>
//                   {isOpen && (
//                     <div className="combo-menu" role="listbox">
//                       <div className="combo-list">
//                         {(el.options || []).map((o: string, idx: number) => (
//                           <label key={idx} className={'combo-option' + (selected.includes(o) ? ' selected' : '')}>
//                             <input type="checkbox" checked={selected.includes(o)} onChange={() => setVal(el.id, selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o])} />
//                             <span className="combo-option-label">{o}</span>
//                           </label>
//                         ))}
//                       </div>
//                       <div className="combo-actions"><button type="button" className="btn" onClick={() => setVal(`__open__${el.id}`, false)}>Kész</button></div>
//                     </div>
//                   )}
//                 </div>
//               </FieldRow>
//             );
//           }

//           if (el.type === 'images') {
//             return (
//               <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
//                 <div style={{ display:'flex', flexDirection:'column', gap:8 }}><ImageUploaderWithInk value={answers[el.id] || []} onChange={(next)=> setVal(el.id, next)} /></div>
//               </FieldRow>
//             );
//           }

//           if (el.type === 'file') {
//             return (
//               <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
//                 <div style={{ display:'flex', flexDirection:'column', gap:8 }}><FileUploader value={answers[el.id] || []} onChange={(next)=>setVal(el.id, next)} /></div>
//               </FieldRow>
//             );
//           }

//           // === A SKETCH BLOKK: ITT VAN A JAVÍTÁS ===
//           if (el.type === 'sketch') {
//             const dataUrl: string | undefined = answers[el.id];
//             const baseKey = el.id;
            
//             // GOLYÓÁLLÓ OLVASÁS: Megnézzük az összes létező kulcsot, amibe valaha belementhetted a méretet
//             const savedRect = answers[INK_KEY(RECT_KEY(baseKey))] || answers[`${baseKey}__rect`];
            
//             return (
//               <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
//                 {el.hideLabel && <div className="ink-title" style={{fontWeight:600, marginBottom:8}}>{el.label}</div>}
//                 <ResizableInkBox 
//                   value={dataUrl} 
//                   onChange={(d)=>setVal(el.id, d)}
//                   onClear={() => {
//                      setVal(el.id, undefined);
//                      setVal(INK_KEY(RECT_KEY(baseKey)), undefined);
//                      setVal(`${baseKey}__rect`, undefined); // Lepucoljuk a régi és új kulcsot is
//                   }}
//                   initialRect={savedRect} 
//                   onRectChange={(r) => {
//                      setInkRect(baseKey, r); // Mentés az alap kulcsba
//                      setVal(`${baseKey}__rect`, r); // Dupla mentés a biztonság kedvéért
//                   }}
//                   emitInitialRect={false}
//                   minHeight={el.height || 260} // EZ HIÁNYZOTT, EMÍGY ESETT ÖSSZE 150-RE!
//                 />
//               </FieldRow>
//             )
//           }

//           if (el.type === 'module_machine_simple') {
//             return (
//               <div key={el.id} style={{ width:'100%' }}>
//                 <div style={{ display:'flex', gap:8, marginBottom:16, alignItems: 'center' }}>
//                   <select id={`add-select-${el.id}`} className="input" style={{...formDesign.input, width: '200px', padding: '6px 12px'}} defaultValue={MACHINE_TYPES[0]}>
//                     {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                   </select>
//                   <button className="btn" style={formDesign.btnSecondary} onClick={()=>{
//                       const sel = document.getElementById(`add-select-${el.id}`) as HTMLSelectElement;
//                       const t: MachineType = (sel?.value as MachineType) || MACHINE_TYPES[0];
//                       const inst = { id: uuid(), title: `${t} ${nextIndexForType(el.instances, t)}`, open: true, machineType: t, fields: [ { key:'manufacturer', label:'Gyártó' }, { key:'model', label:'Típus' } ] };
//                       el.instances = [ ...(el.instances||[]), inst ];
//                       setFormState(prev=>prev?structuredClone(prev):prev);
//                     }}>+ Hozzáadás</button>
//                 </div>

//                 {sortInstancesByType(el.instances).map((inst: any) => {
//                   const noteKey = `ms_note_${inst.id}`;
//                   const inkEnabled = !!answers[INK_TOGGLE(noteKey)];
//                   const getFieldVal = (k:string) => (inst.fields||[]).find((x:any)=>x.key===k)?.value || '';

//                   return (
//                     <div key={inst.id} style={formDesign.card}>
//                       <div style={formDesign.cardHeader}>
//                         <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
//                         <div style={{ display:'flex', gap:8 }}>
//                           <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                           <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
//                         </div>
//                       </div>

//                       {inst.open && (
//                         <>
//                           <div style={formDesign.fieldGroup}>
//                             <label style={formDesign.label}>Gép típusa</label>
//                             <select className="input" style={formDesign.input} value={inst.machineType} onChange={(e)=>{
//                                 const newType = e.target.value as MachineType;
//                                 inst.machineType = newType; inst.title = `${newType} ${nextIndexForType((el.instances||[]).filter((x:any)=>x.id!==inst.id), newType)}`;
//                                 setFormState(prev=>prev?structuredClone(prev):prev);
//                               }}>
//                               {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                             </select>
//                           </div>
                          
//                           <div style={formDesign.fieldGroup}>
//                             <label style={formDesign.label}>Gyártó</label>
//                             <input className="input" style={formDesign.input} value={getFieldVal('manufacturer')} onChange={(e)=>{ const f = (inst.fields||[]).find((x:any)=>x.key==='manufacturer'); if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
//                           </div>

//                           <div style={formDesign.fieldGroup}>
//                             <label style={formDesign.label}>Típus</label>
//                             <input className="input" style={formDesign.input} value={getFieldVal('model')} onChange={(e)=>{ const f = (inst.fields||[]).find((x:any)=>x.key==='model'); if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
//                           </div>

//                           <div style={formDesign.fieldGroup}>
//                             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
//                               <label style={{...formDesign.label, marginBottom:0}}>Megjegyzés</label>
//                               <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
//                             </div>
//                             {supportsFieldSizing ? (
//                               <textarea className="input" rows={1} style={{ ...formDesign.input, ...( { ['fieldSizing' as any]:'content' } as any), overflow:'hidden', resize:'none', whiteSpace:'pre-wrap' }} placeholder="Írd ide a megjegyzést…" value={getFieldVal('__simple_note__')} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
//                             ) : (
//                               <div className="input" contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning style={{ ...formDesign.input, whiteSpace:'pre-wrap', wordBreak:'break-word', outline:'none' }} onInput={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = (e.currentTarget.textContent ?? ''); setFormState(prev=>prev?structuredClone(prev):prev); }}>{getFieldVal('__simple_note__')}</div>
//                             )}
                            
//                             {inkEnabled && (
//                               <ResizableInkBox 
//                                 value={answers[INK_KEY(noteKey)] as string} 
//                                 onChange={(data)=> setVal(INK_KEY(noteKey), data)}
//                                 onClear={() => handleClearInk(noteKey)}
//                                 initialRect={getInkRect(noteKey)} 
//                                 onRectChange={(r) => setInkRect(noteKey, r)}
//                                 emitInitialRect={false}
//                               />
//                             )}
//                           </div>
//                         </>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             );
//           }

//           if (el.type === 'module_machine_detail') {
//             return (
//               <div key={el.id} style={{ width:'100%' }}>
//                 <div style={{ display:'flex', gap:8, marginBottom:16, alignItems: 'center' }}>
//                   <select id={`add-select-${el.id}`} className="input" style={{...formDesign.input, width: '200px', padding: '6px 12px'}} defaultValue={MACHINE_TYPES[0]}>
//                     {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                   </select>
//                   <button className="btn" style={formDesign.btnSecondary} onClick={()=>{
//                       const sel = document.getElementById(`add-select-${el.id}`) as HTMLSelectElement;
//                       const t: MachineType = (sel?.value as MachineType) || MACHINE_TYPES[0];
//                       const specs = DETAIL_TEMPLATES[t] || [];
//                       el.instances = [...(el.instances||[]), { id:uuid(), title:`${t} ${nextIndexForType(el.instances, t)}`, open:true, machineType:t, fields: specs.map(s=>({key:s.key,label:s.label, value: ''})) }];
//                       setFormState(prev=>prev?structuredClone(prev):prev);
//                     }}>+ Hozzáadás</button>
//                 </div>

//                 {sortInstancesByType(el.instances).map((inst: any) => {
//                   const specs = DETAIL_TEMPLATES[inst.machineType] || [];
//                   if ((inst.fields?.length ?? 0) !== specs.length) { inst.fields = specs.map((s:any)=>({ key:s.key, label:s.label, value: (inst.fields||[]).find((f:any)=>f.key===s.key)?.value ?? '' })); }
//                   const noteKey = `md_note_${inst.id}`; const imgKey = `md_images_${inst.id}`;
//                   const inkEnabled = !!answers[INK_TOGGLE(noteKey)];

//                   return (
//                     <div key={inst.id} style={formDesign.card}>
//                       <div style={formDesign.cardHeader}>
//                         <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
//                         <div style={{ display:'flex', gap:8 }}>
//                           <button style={formDesign.btnSecondary} onClick={()=>{ inst.open=!inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                           <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
//                         </div>
//                       </div>

//                       {inst.open && (
//                         <>
//                           <div style={formDesign.fieldGroup}>
//                             <label style={formDesign.label}>Gép típusa</label>
//                             <select className="input" style={formDesign.input} value={inst.machineType} onChange={(e)=>{
//                                 const newType = e.target.value as MachineType;
//                                 inst.machineType = newType; inst.title = `${newType} ${nextIndexForType(el.instances?.filter((x:any)=>x.id!==inst.id), newType)}`;
//                                 inst.fields = (DETAIL_TEMPLATES[newType] || []).map((s:any)=>({ key:s.key, label:s.label }));
//                                 setFormState(prev=>prev?structuredClone(prev):prev);
//                               }}>
//                               {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//                             </select>
//                           </div>

//                           {specs.map((spec:any)=>{
//                             const f = (inst.fields||[]).find((x:any)=>x.key===spec.key);
//                             return (
//                               <div key={spec.key} style={formDesign.fieldGroup}>
//                                 <label style={formDesign.label}>{spec.label}</label>
//                                 <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//                                   {spec.input === 'select' ? (
//                                     <select className="input" value={f?.value || ''} onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} style={formDesign.input}>
//                                       <option value="" disabled>Válassz…</option>
//                                       {(spec.options||[]).map((opt:string)=> <option key={opt} value={opt}>{opt}</option>)}
//                                     </select>
//                                   ) : (
//                                     <input className="input" value={f?.value || ''} onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} style={formDesign.input} />
//                                   )}
//                                   {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
//                                 </div>
//                               </div>
//                             );
//                           })}

//                           <div style={formDesign.fieldGroup}>
//                             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
//                               <label style={{...formDesign.label, marginBottom:0}}>Gépállapot általános leírása</label>
//                               <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
//                             </div>
//                             <textarea className="input" rows={2} style={formDesign.input} placeholder="Írd ide a megjegyzést…" value={(inst.fields||[]).find((x:any)=>x.key==='__simple_note__')?.value || ''} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                            
//                             {inkEnabled && (
//                               <ResizableInkBox 
//                                 value={answers[INK_KEY(noteKey)] as string} 
//                                 onChange={(data)=> setVal(INK_KEY(noteKey), data)}
//                                 onClear={() => handleClearInk(noteKey)}
//                                 initialRect={getInkRect(noteKey)} 
//                                 onRectChange={(r) => setInkRect(noteKey, r)}
//                                 emitInitialRect={false}
//                               />
//                             )}
//                           </div>

//                           <div style={formDesign.fieldGroup}>
//                              <label style={formDesign.label}>Fotók helye</label>
//                              <ImageUploaderWithInk value={(answers[imgKey] as FileItem[]) || []} onChange={(next)=> setVal(imgKey, next)} />
//                           </div>
//                         </>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             );
//           }

//           if (el.type === 'module_system_survey') {
//             const nextIndex = (instances?: SystemSurveyInstance[]) => 1 + Math.max(0, ...((instances||[]).map(i => i.index)));

//             return (
//               <div key={el.id} style={{ width:'100%' }}>
//                 <button className="btn" style={{...formDesign.addBtn, marginBottom: '16px'}} onClick={()=>{
//                     const idx = nextIndex(el.instances);
//                     const fields: ModuleField[] = SYSTEM_SECTIONS.flatMap(sec => sec.fields.map(f => ({ key: `${sec.code}_${f.key}`, label: f.label })) );
//                     el.instances = [ ...(el.instances || []), { id: uuid(), index: idx, open: true, fields } ];
//                     setFormState(prev => prev ? structuredClone(prev) : prev);
//                   }}>+ Rendszer hozzáadása</button>

//                 {(el.instances || []).map((inst: any) => {
//                   const noteKey  = `sys_note_${inst.id}`;
//                   const inkEnabled = !!answers[INK_TOGGLE(noteKey)];

//                   return (
//                     <div key={inst.id} style={formDesign.card}>
//                       <div style={formDesign.systemHeaderBar}>
//                         <div style={formDesign.systemHeaderTitle}>BLOKK: {inst.index === 0 ? 'ÁLTALÁNOS (3.0–18.0)' : `RENDSZER ${inst.index} (3.${inst.index}–18.${inst.index})`}</div>
//                         <div style={{ display:'flex', gap:8 }}>
//                           <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                           {inst.index !== 0 && <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any) => x.id !== inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>}
//                         </div>
//                       </div>

//                       {inst.open && (
//                         <div>
//                           {SYSTEM_SECTIONS.map((sec) => {
//                             const secNo = `${sec.code}.${inst.index}`;
//                             return (
//                               <div key={`${inst.id}:${sec.code}`}>
//                                 <div style={formDesign.systemSubTitle}>{secNo} {sec.title}</div>
//                                 {sec.fields.map((spec) => {
//                                   const specKey = `${sec.code}_${spec.key}`;
//                                   const mf = (inst.fields||[]).find((f:any) => f.key === specKey);
//                                   const isInkNote = (sec.code === 3 && spec.key.startsWith('prob_')) || spec.key === 'note' || spec.key.startsWith('note_') || spec.key === 'other';
//                                   const fldKey = `sys_${inst.id}_${sec.code}_${spec.key}`;
//                                   const rowInkEnabled = !!answers[INK_TOGGLE(fldKey)];

//                                   return (
//                                     <div key={specKey} style={formDesign.fieldGroup}>
//                                       <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
//                                         <label style={{...formDesign.label, marginBottom:0}}>{spec.label}</label>
//                                         {isInkNote && <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=>{ setVal(INK_TOGGLE(fldKey), !rowInkEnabled); }}>✎</button>}
//                                       </div>
                                      
//                                       <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
//                                         {spec.input === 'text' && <input className="input" style={{ ...formDesign.input, flex: 1 }} value={answers[fldKey] ?? mf?.value ?? ''} onChange={(e) => { if (mf) mf.value = e.target.value; setVal(fldKey, e.target.value); }} />}
//                                         {spec.input === 'select' && (
//                                           <select className="input" style={formDesign.input} value={answers[fldKey] ?? mf?.value ?? ''} onChange={(e)=>{ if (mf) mf.value = e.target.value; setVal(fldKey, e.target.value); }}>
//                                             <option value="" disabled>Válassz…</option>
//                                             {(spec.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
//                                           </select>
//                                         )}
//                                         {spec.input === 'dropdown_multi' && (() => {
//                                             const selected: string[] = Array.isArray(answers[fldKey]) ? answers[fldKey] : [];
//                                             const isOpen = !!answers[`__open__${fldKey}`];
//                                             return (
//                                               <div className="combo" style={{ position:'relative', width:'100%' }}>
//                                                 <button type="button" className="input combo-trigger" style={formDesign.input} onClick={() => setVal(`__open__${fldKey}`, !isOpen)}>
//                                                   <span className={selected.length === 0 ? 'muted' : ''}>{selected.length > 0 ? selected.join(', ') : 'Válassz…'}</span>
//                                                   <span className="combo-caret">▾</span>
//                                                 </button>
//                                                 {isOpen && (
//                                                   <div className="combo-menu" role="listbox">
//                                                     <div className="combo-list">
//                                                       {(spec.options||[]).map((o, idx) => (
//                                                         <label key={idx} className={'combo-option' + (selected.includes(o) ? ' selected' : '')}>
//                                                           <input type="checkbox" checked={selected.includes(o)} onChange={() => { const next = selected.includes(o) ? selected.filter(x=>x!==o) : [...selected, o]; if(mf) mf.value=next.join(', '); setVal(fldKey, next); }} />
//                                                           <span className="combo-option-label">{o}</span>
//                                                         </label>
//                                                       ))}
//                                                     </div>
//                                                     <div className="combo-actions"><button type="button" className="btn" onClick={()=>setVal(`__open__${fldKey}`, false)}>Kész</button></div>
//                                                   </div>
//                                                 )}
//                                               </div>
//                                             );
//                                           })()
//                                         }
//                                         {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
//                                       </div>

//                                       {isInkNote && rowInkEnabled && (
//                                         <ResizableInkBox 
//                                           value={answers[INK_KEY(fldKey)] as string} 
//                                           onChange={(data) => setVal(INK_KEY(fldKey), data)}
//                                           onClear={() => handleClearInk(fldKey)}
//                                           initialRect={getInkRect(fldKey)} 
//                                           onRectChange={(r) => setInkRect(fldKey, r)}
//                                           emitInitialRect={false}
//                                         />
//                                       )}
//                                     </div>
//                                   );
//                                 })}

//                                 {sec.photoKey && (
//                                   <div style={formDesign.fieldGroup}>
//                                     <label style={formDesign.label}>Fotók helye</label>
//                                     <ImageUploaderWithInk value={((answers[`${inst.id}:${sec.photoKey}`] as FileItem[]) ?? [])} onChange={(files: FileItem[]) => setVal(`${inst.id}:${sec.photoKey}`, files)} />
//                                   </div>
//                                 )}
//                               </div>
//                             );
//                           })}
                          
//                           <div style={formDesign.fieldGroup}>
//                             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
//                               <label style={{...formDesign.label, marginBottom:0}}>Megjegyzés</label>
//                               <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
//                             </div>
//                             <textarea className="input" rows={2} style={formDesign.input} placeholder="Írd ide a megjegyzést…" value={(inst.fields||[]).find((x:any)=>x.key==='__simple_note__')?.value || ''} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                            
//                             {inkEnabled && (
//                               <ResizableInkBox 
//                                 value={answers[INK_KEY(noteKey)] as string} 
//                                 onChange={(data)=> setVal(INK_KEY(noteKey), data)}
//                                 onClear={() => handleClearInk(noteKey)}
//                                 initialRect={getInkRect(noteKey)} 
//                                 onRectChange={(r) => setInkRect(noteKey, r)}
//                                 emitInitialRect={false}
//                               />
//                             )}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             );
//           }

//           if (el.type === 'module_system_detail' || el.type === 'module_tank_detail') {
//             const specs = el.type === 'module_system_detail' ? SYSTEM_TEMPLATE : TANK_TEMPLATE;
//             const titleBase = el.type === 'module_system_detail' ? 'Rendszer' : 'Tartály';

//             return (
//               <div key={el.id} style={{ width:'100%' }}>
//                 <button className="btn" style={{...formDesign.addBtn, marginBottom: '16px'}} onClick={()=>{
//                     const inst: SimpleDetailInstance = { id: uuid(), title: `${titleBase} ${1 + ((el.instances || []).length || 0)}`, open: true, fields: specs.map(s => ({ key:s.key, label:s.label })) };
//                     el.instances = [ ...(el.instances || []), inst ];
//                     setFormState(prev=>prev?structuredClone(prev):prev);
//                   }}>+ {titleBase} hozzáadása</button>

//                 {(el.instances || []).map((inst: SimpleDetailInstance) => {
//                   if ((inst.fields?.length ?? 0) !== specs.length) { inst.fields = specs.map(s=>({ key:s.key, label:s.label, value: '' })); }

//                   return (
//                     <div key={inst.id} style={formDesign.card}>
//                       <div style={formDesign.cardHeader}>
//                         <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
//                         <div style={{ display:'flex', gap:8 }}>
//                           <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                           <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances || []).filter((x:SimpleDetailInstance)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
//                         </div>
//                       </div>

//                       {inst.open && (
//                         <>
//                           {specs.map(spec => (
//                             <div key={spec.key} style={formDesign.fieldGroup}>
//                               <label style={formDesign.label}>{spec.label}</label>
//                               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//                                 {spec.input === 'select' ? (
//                                   <select className="input" style={formDesign.input} value={''} onChange={()=>{}}>
//                                     <option value="" disabled>Válassz…</option>
//                                     {(spec.options||[]).map((opt:string)=> <option key={opt} value={opt}>{opt}</option>)}
//                                   </select>
//                                 ) : (
//                                   <input className="input" style={formDesign.input} value={''} onChange={()=>{}} />
//                                 )}
//                                 {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
//                               </div>
//                             </div>
//                           ))}
//                         </>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             );
//           }

//           return null
//         })}
//       </div>
//     </A4Page>
//   )
// }

import { useEffect, useMemo, useState, useCallback } from 'react'
import { loadAnswersLocal, saveAnswersLocal } from '../storage'
import type { AnswerMap, FormData, Globals, FileItem } from '../types'
import { v4 as uuid } from 'uuid'
import A4Page from '../components/A4Page'
import FieldRow from '../components/FieldRow'
import ResizableInkBox from '../components/ResizableInkBox'

import { MACHINE_TYPES, MachineType, DETAIL_TEMPLATES, SimpleDetailInstance, 
         SYSTEM_TEMPLATE, TANK_TEMPLATE, SystemSurveyInstance, SystemSurveyElement, 
         SYSTEM_SECTIONS, ModuleField, EMPTY } from '../types'

import { ImageUploaderWithInk, FileUploader } from '../components/FormComponents'

const INK_KEY = (id: string) => `__ink__${id}`;
const INK_TOGGLE = (id: string) => `__ink_enabled__${id}`;
const RECT_KEY = (id:string)=> `${id}__rect`; 

const supportsFieldSizing = typeof CSS !== 'undefined' && (CSS as any).supports?.('field-sizing', 'content');

export const formDesign = {
  card: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' },
  cardTitle: { fontSize: '15px', fontWeight: 600, color: '#111827' },
  cardTitleHighlight: { color: '#2563eb' },
  addBtn: { background: 'transparent', border: 'none', color: '#2563eb', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '8px 0', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' },
  btnSecondary: { backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  btnDanger: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  fieldGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: 'inherit', backgroundColor: '#fff', color: '#111827' },
  systemHeaderBar: { backgroundColor: '#f9fafb', padding: '10px 16px', margin: '-16px -16px 16px -16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  systemHeaderTitle: { fontSize: '12px', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  systemSubTitle: { fontSize: '16px', fontWeight: 700, color: '#111827', borderLeft: '3px solid #2563eb', paddingLeft: '10px', margin: '16px 0 20px 0', display: 'flex', alignItems: 'center' }
};

type Props = {
  formId: string
  onAnswersChange?: (answers: AnswerMap) => void
  onFormChange?: (next: FormData) => void
  initialForm?: FormData
  activeAnswer: AnswerMap
  globals: Globals
  onRootRef?: (formId: string, el: HTMLDivElement | null) => void
}

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

export default function FormFillerEmbed({ formId, onAnswersChange, onFormChange, initialForm, activeAnswer, globals, onRootRef }: Props){
  const [form, setForm] = useState<FormData | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});

  const handleA4Ref = useCallback((node: HTMLDivElement | null) => { onRootRef?.(formId, node) }, [onRootRef, formId])

  function setFormState(nextOrUpdater: FormData | ((prev: FormData) => FormData) | null){
    setForm(prev => {
      const next = typeof nextOrUpdater === 'function' ? (nextOrUpdater as (p: FormData) => FormData)(prev as FormData) : (nextOrUpdater as FormData | null);
      if (next && onFormChange) onFormChange(next);
      return next;
    })
  }

  useEffect(() => {
    if (!initialForm) return;
    setForm(prev => {
      if (!prev || prev.meta?.id !== initialForm.meta?.id) return structuredClone(initialForm);
      return prev;
    });
  }, [initialForm?.meta?.id]);

  useEffect(() => {
    if (activeAnswer == null) return;
    setAnswers(prev => {
      const same = prev && Object.keys(prev).length === Object.keys(activeAnswer).length && Object.keys(prev).every(k => prev[k] === activeAnswer[k]);
      return same ? prev : structuredClone(activeAnswer);
    });
  }, [activeAnswer]);

  function updateAnswers(nextPartial: AnswerMap){
    setAnswers(prev => {
      const merged = { ...(prev || {}), ...(nextPartial || {}) };
      try { 
        saveAnswersLocal(formId, merged); 
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
          alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
        } else {
          console.error('Helyi mentési hiba:', e);
        }
      }
      onAnswersChange?.(merged);
      return merged;
    });
  }

  const setVal = (key: string, value: any) => {
    setAnswers(prev => {
      const merged = { ...(prev || {}), [key]: value };
      try { 
        saveAnswersLocal(formId, merged); 
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
          alert('A böngésző tárhelye megtelt! Túl sok/nagy képet töltöttél fel. Kérlek, mentsd a szerverre az eddigieket!');
        } else {
          console.error('Helyi mentési hiba:', e);
        }
      }
      onAnswersChange?.(merged);
      return merged;
    });
  };

  const setInk = (elId: string, dataUrl?: string) => {
    const k = INK_KEY(elId); const next = { ...answers };
    if (dataUrl) next[k] = dataUrl; else delete next[k];
    updateAnswers(next);
  }

  const getInkRect = (baseKey: string) => answers[INK_KEY(RECT_KEY(baseKey))] as {w:number;h:number} | undefined;
  
  const setInkRect = (baseKey: string, r: {w:number, h:number}) => {
    const rKey = INK_KEY(RECT_KEY(baseKey));
    const old = answers[rKey] as {w:number;h:number} | undefined;
    if (!old || old.h !== r.h || old.w !== r.w) setVal(rKey, r);
  };

  const handleClearInk = (targetKey: string, elId?: string) => {
    setAnswers(prev => {
      const merged = { ...prev, [INK_TOGGLE(targetKey)]: false, [INK_KEY(targetKey)]: undefined, [INK_KEY(RECT_KEY(targetKey))]: undefined };
      try { saveAnswersLocal(formId, merged); } catch (e: any) {
        if (e.name === 'QuotaExceededError') alert('A böngésző tárhelye megtelt! Kérlek, mentsd a szerverre az eddigieket!');
      }
      onAnswersChange?.(merged); 
      return merged;
    });
    if (elId && form) {
      const els = (form.elements || []).slice();
      const i = els.findIndex(e => e.id === elId);
      if (i > -1) { 
        els[i] = { ...els[i], ink: { ...(els[i].ink || {}), enabled: false } }; 
        setFormState({ ...form, elements: els }); 
      }
    }
  };

  const elements = useMemo(()=>{
    if (!form) return []
    const arr = Array.isArray(form.elements) ? form.elements : []
    return [...arr].sort((a:any,b:any)=> ((a?.grid?.y ?? 0) - (b?.grid?.y ?? 0)) || ((a?.grid?.x ?? 0) - (b?.grid?.x ?? 0)))
  }, [form])

  if (!form) return null

  return (
    <A4Page globals={globals} surveyName={form.meta.name} ref={handleA4Ref}>
      <div className="list">
        {elements.length === 0 && <div className="small" style={{ padding: '8px 0' }}>Ehhez a felméréshez még nem adtunk mezőket.</div>}

        {elements.map((el: any) => {
          const userFlag  = answers[INK_TOGGLE(el.id)];
          const formFlag  = el?.ink?.enabled;
          const inkValue  = answers[INK_KEY(el.id)] as string | undefined;
          const inkRect   = getInkRect(el.id);
          const inkEnabled = Boolean(userFlag ?? formFlag ?? inkValue ?? inkRect);

          if (el.type === 'text' || el.type === 'dropdown') {
            const baseKey = el.id;
            return (
              <FieldRow key={el.id} label={el.label} inkPanel={inkEnabled ? (
                  <ResizableInkBox 
                    value={inkValue} 
                    onChange={(data) => setInk(el.id, data)}
                    onClear={() => handleClearInk(el.id, el.id)}
                    initialRect={getInkRect(baseKey)} 
                    onRectChange={(r) => setInkRect(baseKey, r)}
                    emitInitialRect={false}
                  />
                ) : undefined}>
                <div className="field-wrap">
                  {el.type === 'text' && <input className="input" style={formDesign.input} placeholder={el.placeholder || ''} value={answers[el.id] ?? ''} onChange={(e) => setVal(el.id, e.target.value)} />}
                  {el.type === 'dropdown' && (
                    <select className="input" style={formDesign.input} value={answers[el.id] ?? ''} onChange={(e) => setVal(el.id, e.target.value)}>
                      <option value="" disabled>Válassz...</option>
                      {(el.options ?? []).map((o: string, idx: number) => <option key={idx} value={o}>{o}</option>)}
                    </select>
                  )}
                  <button type="button" className="icon-inline" onClick={()=>{
                      const next = !inkEnabled; setVal(INK_TOGGLE(el.id), next);
                      const els = (form.elements || []).slice();
                      const i = els.findIndex(e => e.id === el.id);
                      if (i > -1) { els[i] = { ...els[i], ink: { ...(els[i].ink || {}), enabled: next } }; setFormState({ ...form, elements: els }); }
                    }} title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}>✎</button>
                </div>
              </FieldRow>
            )
          }

          if (el.type === 'comment') {
            const noteKey = el.id; 
            const inkEnabled = !!answers[INK_TOGGLE(noteKey)];
            const textVal: string = (answers[`${noteKey}__text`] as string) ?? '';

            return (
              <FieldRow key={el.id} label={el.label} className="stacked">
                {supportsFieldSizing ? (
                  <textarea className="input" rows={1} style={{ ...formDesign.input, ...( { ['fieldSizing' as any]:'content' } as any), overflow:'hidden', resize:'none', whiteSpace:'pre-wrap' }} placeholder="Írd ide a megjegyzést…" value={textVal} onChange={(e)=> setVal(`${noteKey}__text`, e.target.value)} />
                ) : (
                  <div className="input" contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning style={{ ...formDesign.input, whiteSpace:'pre-wrap', wordBreak:'break-word', outline:'none' }} onInput={(e)=> setVal(`${noteKey}__text`, e.currentTarget.textContent ?? '')}>{textVal}</div>
                )}
                <div className="small" style={{ color:'#6b7280', marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
                  <span>Rajz/komment</span>
                  <button type="button" className="icon-inline" title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'} onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
                </div>
                {inkEnabled && (
                  <ResizableInkBox 
                    value={answers[INK_KEY(noteKey)] as string} 
                    onChange={(d)=> setVal(INK_KEY(noteKey), d)}
                    onClear={() => handleClearInk(noteKey)}
                    initialRect={getInkRect(noteKey)} 
                    onRectChange={(r) => setInkRect(noteKey, r)}
                    emitInitialRect={false}
                  />
                )}
              </FieldRow>
            )
          }

          if (el.type === 'title') {
            return (
              <div key={el.id} style={{padding:'6px 0'}}>
                <h3 style={{margin:0, fontSize:18, fontWeight:700}}>{el.label}</h3>
                {el.showNote && el.note && <div style={{ marginTop:2, color:'#6b7280', fontSize:12 }}>{el.note}</div>}
              </div>
            );
          }

          if (el.type === 'note_text') {
            const val: string = answers[el.id] ?? '';
            return (
              <FieldRow key={el.id} label={el.label}>
                <div style={{ position: 'relative', width: '100%' }}>
                  {(!val || val.length === 0) && <span style={{ position: 'absolute', left: 12, top: 10, pointerEvents: 'none', opacity: 0.5, font: 'inherit', fontSize: '14px' }}>Írd ide a megjegyzést…</span>}
                  <div className="input" contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning style={{ ...formDesign.input, whiteSpace: 'pre-wrap', wordBreak: 'break-word', outline: 'none' }} onInput={(e)=> setVal(el.id, (e.currentTarget.textContent ?? ''))} onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); }}>{val}</div>
                </div>
              </FieldRow>
            );
          }

          if (el.type === 'dropdown_multi') {
            const selected: string[] = Array.isArray(answers[el.id]) ? answers[el.id] : [];
            const isOpen = !!answers[`__open__${el.id}`];
            const displayText = selected.length > 0 ? selected.join(', ') : 'Válassz…';

            return (
              <FieldRow key={el.id} label={el.label} className="no-border">
                <div className="combo" style={{ position:'relative' }}>
                  <button type="button" className="input combo-trigger" style={formDesign.input} onClick={() => setVal(`__open__${el.id}`, !isOpen)}>
                    <span className={selected.length === 0 ? 'muted' : ''}>{displayText}</span>
                    <span className="combo-caret">▾</span>
                  </button>
                  {isOpen && (
                    <div className="combo-menu" role="listbox">
                      <div className="combo-list">
                        {(el.options || []).map((o: string, idx: number) => (
                          <label key={idx} className={'combo-option' + (selected.includes(o) ? ' selected' : '')}>
                            <input type="checkbox" checked={selected.includes(o)} onChange={() => setVal(el.id, selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o])} />
                            <span className="combo-option-label">{o}</span>
                          </label>
                        ))}
                      </div>
                      <div className="combo-actions"><button type="button" className="btn" onClick={() => setVal(`__open__${el.id}`, false)}>Kész</button></div>
                    </div>
                  )}
                </div>
              </FieldRow>
            );
          }

          if (el.type === 'images') {
            return (
              <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}><ImageUploaderWithInk value={answers[el.id] || []} onChange={(next)=> setVal(el.id, next)} /></div>
              </FieldRow>
            );
          }

          if (el.type === 'file') {
            return (
              <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}><FileUploader value={answers[el.id] || []} onChange={(next)=>setVal(el.id, next)} /></div>
              </FieldRow>
            );
          }

          if (el.type === 'sketch') {
            const dataUrl: string | undefined = answers[el.id];
            const baseKey = el.id;
            const savedRect = answers[INK_KEY(RECT_KEY(baseKey))] || answers[`${baseKey}__rect`];
            
            return (
              <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
                {el.hideLabel && <div className="ink-title" style={{fontWeight:600, marginBottom:8}}>{el.label}</div>}
                <ResizableInkBox 
                  value={dataUrl} 
                  onChange={(d)=>setVal(el.id, d)}
                  onClear={() => {
                     setVal(el.id, undefined);
                     setVal(INK_KEY(RECT_KEY(baseKey)), undefined);
                     setVal(`${baseKey}__rect`, undefined); 
                  }}
                  initialRect={savedRect} 
                  onRectChange={(r) => {
                     setInkRect(baseKey, r); 
                     setVal(`${baseKey}__rect`, r); 
                  }}
                  emitInitialRect={false}
                  minHeight={el.height || 260} 
                />
              </FieldRow>
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
                      setFormState(prev=>prev?structuredClone(prev):prev);
                    }}>+ Hozzáadás</button>
                </div>

                {sortInstancesByType(el.instances).map((inst: any) => {
                  const noteKey = `ms_note_${inst.id}`;
                  const inkEnabled = !!answers[INK_TOGGLE(noteKey)];
                  const getFieldVal = (k:string) => (inst.fields||[]).find((x:any)=>x.key===k)?.value || '';

                  return (
                    // ---> PDF JAVÍTÁS: className="module-instance" hozzáadva <---
                    <div key={inst.id} className="module-instance" style={formDesign.card}>
                      <div style={formDesign.cardHeader}>
                        <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
                          <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
                        </div>
                      </div>

                      {inst.open && (
                        <>
                          {/* ---> PDF JAVÍTÁS: className="form-row" hozzáadva <--- */}
                          <div className="form-row" style={formDesign.fieldGroup}>
                            <label style={formDesign.label}>Gép típusa</label>
                            <select className="input" style={formDesign.input} value={inst.machineType} onChange={(e)=>{
                                const newType = e.target.value as MachineType;
                                inst.machineType = newType; inst.title = `${newType} ${nextIndexForType((el.instances||[]).filter((x:any)=>x.id!==inst.id), newType)}`;
                                setFormState(prev=>prev?structuredClone(prev):prev);
                              }}>
                              {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          
                          <div className="form-row" style={formDesign.fieldGroup}>
                            <label style={formDesign.label}>Gyártó</label>
                            <input className="input" style={formDesign.input} value={getFieldVal('manufacturer')} onChange={(e)=>{ const f = (inst.fields||[]).find((x:any)=>x.key==='manufacturer'); if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                          </div>

                          <div className="form-row" style={formDesign.fieldGroup}>
                            <label style={formDesign.label}>Típus</label>
                            <input className="input" style={formDesign.input} value={getFieldVal('model')} onChange={(e)=>{ const f = (inst.fields||[]).find((x:any)=>x.key==='model'); if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                          </div>

                          <div className="form-row stacked" style={formDesign.fieldGroup}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                              <label style={{...formDesign.label, marginBottom:0}}>Megjegyzés</label>
                              <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
                            </div>
                            {supportsFieldSizing ? (
                              <textarea className="input" rows={1} style={{ ...formDesign.input, ...( { ['fieldSizing' as any]:'content' } as any), overflow:'hidden', resize:'none', whiteSpace:'pre-wrap' }} placeholder="Írd ide a megjegyzést…" value={getFieldVal('__simple_note__')} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                            ) : (
                              <div className="input" contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning style={{ ...formDesign.input, whiteSpace:'pre-wrap', wordBreak:'break-word', outline:'none' }} onInput={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = (e.currentTarget.textContent ?? ''); setFormState(prev=>prev?structuredClone(prev):prev); }}>{getFieldVal('__simple_note__')}</div>
                            )}
                            
                            {inkEnabled && (
                              <ResizableInkBox 
                                value={answers[INK_KEY(noteKey)] as string} 
                                onChange={(data)=> setVal(INK_KEY(noteKey), data)}
                                onClear={() => handleClearInk(noteKey)}
                                initialRect={getInkRect(noteKey)} 
                                onRectChange={(r) => setInkRect(noteKey, r)}
                                emitInitialRect={false}
                              />
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
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
                      setFormState(prev=>prev?structuredClone(prev):prev);
                    }}>+ Hozzáadás</button>
                </div>

                {sortInstancesByType(el.instances).map((inst: any) => {
                  const specs = DETAIL_TEMPLATES[inst.machineType] || [];
                  if ((inst.fields?.length ?? 0) !== specs.length) { inst.fields = specs.map((s:any)=>({ key:s.key, label:s.label, value: (inst.fields||[]).find((f:any)=>f.key===s.key)?.value ?? '' })); }
                  const noteKey = `md_note_${inst.id}`; const imgKey = `md_images_${inst.id}`;
                  const inkEnabled = !!answers[INK_TOGGLE(noteKey)];

                  return (
                    <div key={inst.id} className="module-instance" style={formDesign.card}>
                      <div style={formDesign.cardHeader}>
                        <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button style={formDesign.btnSecondary} onClick={()=>{ inst.open=!inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
                          <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
                        </div>
                      </div>

                      {inst.open && (
                        <>
                          <div className="form-row" style={formDesign.fieldGroup}>
                            <label style={formDesign.label}>Gép típusa</label>
                            <select className="input" style={formDesign.input} value={inst.machineType} onChange={(e)=>{
                                const newType = e.target.value as MachineType;
                                inst.machineType = newType; inst.title = `${newType} ${nextIndexForType(el.instances?.filter((x:any)=>x.id!==inst.id), newType)}`;
                                inst.fields = (DETAIL_TEMPLATES[newType] || []).map((s:any)=>({ key:s.key, label:s.label }));
                                setFormState(prev=>prev?structuredClone(prev):prev);
                              }}>
                              {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>

                          {specs.map((spec:any)=>{
                            const f = (inst.fields||[]).find((x:any)=>x.key===spec.key);
                            return (
                              <div key={spec.key} className="form-row" style={formDesign.fieldGroup}>
                                <label style={formDesign.label}>{spec.label}</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  {spec.input === 'select' ? (
                                    <select className="input" value={f?.value || ''} onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} style={formDesign.input}>
                                      <option value="" disabled>Válassz…</option>
                                      {(spec.options||[]).map((opt:string)=> <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                  ) : (
                                    <input className="input" value={f?.value || ''} onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} style={formDesign.input} />
                                  )}
                                  {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
                                </div>
                              </div>
                            );
                          })}

                          <div className="form-row stacked" style={formDesign.fieldGroup}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                              <label style={{...formDesign.label, marginBottom:0}}>Gépállapot általános leírása</label>
                              <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
                            </div>
                            <textarea className="input" rows={2} style={formDesign.input} placeholder="Írd ide a megjegyzést…" value={(inst.fields||[]).find((x:any)=>x.key==='__simple_note__')?.value || ''} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                            
                            {inkEnabled && (
                              <ResizableInkBox 
                                value={answers[INK_KEY(noteKey)] as string} 
                                onChange={(data)=> setVal(INK_KEY(noteKey), data)}
                                onClear={() => handleClearInk(noteKey)}
                                initialRect={getInkRect(noteKey)} 
                                onRectChange={(r) => setInkRect(noteKey, r)}
                                emitInitialRect={false}
                              />
                            )}
                          </div>

                          <div className="form-row stacked" style={formDesign.fieldGroup}>
                            <label style={formDesign.label}>Fotók helye</label>
                            <ImageUploaderWithInk value={((answers[imgKey] as FileItem[]) ?? [])} onChange={(next: FileItem[]) => setVal(imgKey, next)} />
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
                    setFormState(prev => prev ? structuredClone(prev) : prev);
                  }}>+ Rendszer hozzáadása</button>

                {(el.instances || []).map((inst: any) => {
                  const noteKey  = `sys_note_${inst.id}`;
                  const inkEnabled = !!answers[INK_TOGGLE(noteKey)];

                  return (
                    <div key={inst.id} className="module-instance" style={formDesign.card}>
                      <div style={formDesign.systemHeaderBar}>
                        <div style={formDesign.systemHeaderTitle}>BLOKK: {inst.index === 0 ? 'ÁLTALÁNOS (3.0–18.0)' : `RENDSZER ${inst.index} (3.${inst.index}–18.${inst.index})`}</div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
                          {inst.index !== 0 && <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any) => x.id !== inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>}
                        </div>
                      </div>

                      {inst.open && (
                        <div>
                          {SYSTEM_SECTIONS.map((sec) => {
                            const secNo = `${sec.code}.${inst.index}`;
                            return (
                              <div key={`${inst.id}:${sec.code}`} className="module-section">
                                <div style={formDesign.systemSubTitle}>{secNo} {sec.title}</div>
                                {sec.fields.map((spec) => {
                                  const specKey = `${sec.code}_${spec.key}`;
                                  const mf = (inst.fields||[]).find((f:any) => f.key === specKey);
                                  const isInkNote = (sec.code === 3 && spec.key.startsWith('prob_')) || spec.key === 'note' || spec.key.startsWith('note_') || spec.key === 'other';
                                  const fldKey = `sys_${inst.id}_${sec.code}_${spec.key}`;
                                  const rowInkEnabled = !!answers[INK_TOGGLE(fldKey)];

                                  return (
                                    <div key={specKey} className="form-row" style={formDesign.fieldGroup}>
                                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                                        <label style={{...formDesign.label, marginBottom:0}}>{spec.label}</label>
                                        {isInkNote && <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=>{ setVal(INK_TOGGLE(fldKey), !rowInkEnabled); }}>✎</button>}
                                      </div>
                                      
                                      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                                        {spec.input === 'text' && <input className="input" style={{ ...formDesign.input, flex: 1 }} value={answers[fldKey] ?? mf?.value ?? ''} onChange={(e) => { if (mf) mf.value = e.target.value; setVal(fldKey, e.target.value); }} />}
                                        {spec.input === 'select' && (
                                          <select className="input" style={formDesign.input} value={answers[fldKey] ?? mf?.value ?? ''} onChange={(e)=>{ if (mf) mf.value = e.target.value; setVal(fldKey, e.target.value); }}>
                                            <option value="" disabled>Válassz…</option>
                                            {(spec.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
                                          </select>
                                        )}
                                        {spec.input === 'dropdown_multi' && (() => {
                                            const selected: string[] = Array.isArray(answers[fldKey]) ? answers[fldKey] : [];
                                            const isOpen = !!answers[`__open__${fldKey}`];
                                            return (
                                              <div className="combo" style={{ position:'relative', width:'100%' }}>
                                                <button type="button" className="input combo-trigger" style={formDesign.input} onClick={() => setVal(`__open__${fldKey}`, !isOpen)}>
                                                  <span className={selected.length === 0 ? 'muted' : ''}>{selected.length > 0 ? selected.join(', ') : 'Válassz…'}</span>
                                                  <span className="combo-caret">▾</span>
                                                </button>
                                                {isOpen && (
                                                  <div className="combo-menu" role="listbox">
                                                    <div className="combo-list">
                                                      {(spec.options||[]).map((o, idx) => (
                                                        <label key={idx} className={'combo-option' + (selected.includes(o) ? ' selected' : '')}>
                                                          <input type="checkbox" checked={selected.includes(o)} onChange={() => { const next = selected.includes(o) ? selected.filter(x=>x!==o) : [...selected, o]; if(mf) mf.value=next.join(', '); setVal(fldKey, next); }} />
                                                          <span className="combo-option-label">{o}</span>
                                                        </label>
                                                      ))}
                                                    </div>
                                                    <div className="combo-actions"><button type="button" className="btn" onClick={()=>setVal(`__open__${fldKey}`, false)}>Kész</button></div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })()
                                        }
                                        {spec.unit && <span style={{ color:'#6b7280', fontSize:'13px', whiteSpace:'nowrap' }}>{spec.unit}</span>}
                                      </div>

                                      {isInkNote && rowInkEnabled && (
                                        <ResizableInkBox 
                                          value={answers[INK_KEY(fldKey)] as string} 
                                          onChange={(data) => setVal(INK_KEY(fldKey), data)}
                                          onClear={() => handleClearInk(fldKey)}
                                          initialRect={getInkRect(fldKey)} 
                                          onRectChange={(r) => setInkRect(fldKey, r)}
                                          emitInitialRect={false}
                                        />
                                      )}
                                    </div>
                                  );
                                })}

                                {sec.photoKey && (
                                  <div className="form-row stacked" style={formDesign.fieldGroup}>
                                    <label style={formDesign.label}>Fotók helye</label>
                                    <ImageUploaderWithInk value={((answers[`${inst.id}:${sec.photoKey}`] as FileItem[]) ?? [])} onChange={(files: FileItem[]) => setVal(`${inst.id}:${sec.photoKey}`, files)} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          <div className="form-row stacked" style={formDesign.fieldGroup}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                              <label style={{...formDesign.label, marginBottom:0}}>Megjegyzés</label>
                              <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
                            </div>
                            <textarea className="input" rows={2} style={formDesign.input} placeholder="Írd ide a megjegyzést…" value={(inst.fields||[]).find((x:any)=>x.key==='__simple_note__')?.value || ''} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                            
                            {inkEnabled && (
                              <ResizableInkBox 
                                value={answers[INK_KEY(noteKey)] as string} 
                                onChange={(data)=> setVal(INK_KEY(noteKey), data)}
                                onClear={() => handleClearInk(noteKey)}
                                initialRect={getInkRect(noteKey)} 
                                onRectChange={(r) => setInkRect(noteKey, r)}
                                emitInitialRect={false}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                    setFormState(prev=>prev?structuredClone(prev):prev);
                  }}>+ {titleBase} hozzáadása</button>

                {(el.instances || []).map((inst: SimpleDetailInstance) => {
                  if ((inst.fields?.length ?? 0) !== specs.length) { inst.fields = specs.map(s=>({ key:s.key, label:s.label, value: '' })); }

                  return (
                    <div key={inst.id} className="module-instance" style={formDesign.card}>
                      <div style={formDesign.cardHeader}>
                        <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
                        <div style={{ display:'flex', gap:8 }}>
                          <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
                          <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances || []).filter((x:SimpleDetailInstance)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
                        </div>
                      </div>

                      {inst.open && (
                        <>
                          {specs.map(spec => (
                            <div key={spec.key} className="form-row" style={formDesign.fieldGroup}>
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
  )
}