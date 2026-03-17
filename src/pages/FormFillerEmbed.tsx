



// import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
// import { loadAll, loadGlobals } from '../storage'
// import { loadAnswersLocal, saveAnswersLocal, saveAllLocal } from '../storage' // ← lokális segédek
// import type { AnswerMap, FormData, Globals, FileItem, ModuleInstance } from '../types'
// import { v4 as uuid } from 'uuid'
// import InlineInkCanvas from '../components/InlineInkCanvas'
// import A4Page from '../components/A4Page'
// import FieldRow from '../components/FieldRow'
// import { loadTemplateForTab } from '../storage/formsLib'

// import { MACHINE_TYPES, MachineType, DETAIL_TEMPLATES, SimpleDetailInstance, 
//         SYSTEM_TEMPLATE, TANK_TEMPLATE, SystemSurveyInstance, SystemSurveyElement, 
//         SYSTEM_SECTIONS, ModuleField } from '../types'
// import { EMPTY } from '../types'

// import { ImageUploaderWithInk, FileUploader } from '../components/FormComponents'


// const INK_KEY = (id: string) => `__ink__${id}`;
// const INK_TOGGLE = (id: string) => `__ink_enabled__${id}`;
// const RECT_KEY = (id:string)=> `${id}__rect`; // {x,y,w,h}

// const supportsFieldSizing = typeof CSS !== 'undefined' && (CSS as any).supports?.('field-sizing', 'content');


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
// const getField = (inst: any, key: string) => (inst.fields || []).find((f: any) => f.key === key);



// const empty = EMPTY;

// export default function FormFillerEmbed({ formId, onAnswersChange, onFormChange, initialForm, activeAnswer, globals, onRootRef }: Props){
//   const [form, setForm] = useState<FormData | null>(null);
//   const [answers, setAnswers] = useState<AnswerMap>({});
//   // const [globals, setGlobals] = useState<Globals>(EMPTY);

//   const handleA4Ref = useCallback(
//     (node: HTMLDivElement | null) => {
//       onRootRef?.(formId, node)
//     },
//     [onRootRef, formId]
//   )


//   const supportsFieldSizing = typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content');

//   const imgDebounceRef = useRef<number | null>(null);
//   // wrapper: ha a form változik (szerkezet), szóljunk a szülőnek
//   function setFormState(nextOrUpdater: FormData | ((prev: FormData) => FormData) | null){
//     setForm(prev => {
//       const next = typeof nextOrUpdater === 'function'
//         ? (nextOrUpdater as (p: FormData) => FormData)(prev as FormData)
//         : (nextOrUpdater as FormData | null);
//       if (next && onFormChange) onFormChange(next);
//       return next;
//     })
//   }

//   // initial load / prop change
//   useEffect(() => {
//   if (!initialForm) return;
//   setForm(prev => {
//     // csak akkor klónozz, ha új az id vagy megváltozott a referencia
//     if (!prev || prev.meta?.id !== initialForm.meta?.id) {
//       return structuredClone(initialForm);
//     }
//     return prev;
//   });
// }, [initialForm?.meta?.id]);

// useEffect(() => {
//   if (activeAnswer == null) return;
//   setAnswers(prev => {
//     // ha ugyanaz az objektum (referencia + kulcsok), ne írjuk felül feleslegesen
//     const same =
//       prev &&
//       Object.keys(prev).length === Object.keys(activeAnswer).length &&
//       Object.keys(prev).every(k => prev[k] === activeAnswer[k]);
//     return same ? prev : structuredClone(activeAnswer);
//   });
// }, [activeAnswer]);

//   function updateAnswers(nextPartial: AnswerMap){
//   setAnswers(prev => {
//     const merged = { ...(prev || {}), ...(nextPartial || {}) };
//     // Lokális mentés és callback csak miután megvan a merged:
//     // saveAnswersLocal(formId, merged);
//     onAnswersChange?.(merged);
//     return merged;
//   });
// }

//   // const setVal = (key: string, value: any) => updateAnswers({ ...answers, [key]: value })

// //   const setVal = (key: string, value: any) => {
// //   setAnswers(prev => {
// //     const merged = { ...(prev || {}), [key]: value };
// //     // lokális persist ugyanitt, hogy ne vesszen el semmi
// //     try { saveAnswersLocal(formId, merged); } catch {}
// //     onAnswersChange?.(merged);
// //     return merged;
// //   });
// // };

// const setVal = (key: string, value: any) => {
//   setAnswers(prev => {
//     const merged = { ...(prev || {}), [key]: value };
//     onAnswersChange?.(merged); // csak a parentnek szólunk
//     return merged;
//   });
// };

//   const setInk = (elId: string, dataUrl?: string) => {
//     const k = INK_KEY(elId)
//     const next = { ...answers }
//     if (dataUrl) next[k] = dataUrl
//     else delete next[k]
//     updateAnswers(next)
//   }
//   const toggleInk = (elId: string) => {
//     const k = INK_TOGGLE(elId)
//     const next = { ...answers, [k]: !answers[k] }
//     updateAnswers(next)
//   }

//   const elements = useMemo(()=>{
//     if (!form) return []
//     const arr = Array.isArray(form.elements) ? form.elements : []
//     return [...arr].sort((a:any,b:any)=> ((a?.grid?.y ?? 0) - (b?.grid?.y ?? 0)) || ((a?.grid?.x ?? 0) - (b?.grid?.x ?? 0)))
//   }, [form])

//   if (!form) return null



//   return (
//     <A4Page globals={globals} surveyName={form.meta.name} ref={handleA4Ref}>
//       <div className="list">
//         {elements.length === 0 && (
//           <div className="small" style={{ padding: '8px 0' }}>
//             Ehhez a felméréshez még nem adtunk mezőket.
//           </div>
//         )}

//         {elements.map((el: any) => {
//           const userWantsInk = !!answers[INK_TOGGLE(el.id)]
//           //const inkEnabled = userWantsInk || !!el?.ink?.enabled
//           const inkValue = answers[INK_KEY(el.id)] as string | undefined
//           //const inkRect  = answers[RECT_KEY(INK_KEY(el.id))] as {w:number;h:number} | undefined;

//           //const inkData   = answers[INK_KEY(el.id)] as string | undefined;
//           const inkRect   = answers[INK_KEY(RECT_KEY(el.id))] as { w:number; h:number } | undefined; // egységesítsd ide!
//           const userFlag  = answers[INK_TOGGLE(el.id)];
//           const formFlag  = el?.ink?.enabled;

//           // Ha bármely jel arra utal, hogy használjuk (flag-ek, mentett kép, vagy már van méret), akkor maradjon.
//           const inkEnabled = Boolean(userFlag ?? formFlag ?? inkValue ?? inkRect);
// if (el.type === 'text' || el.type === 'dropdown') {
//   const autoWidthCh = Math.min(String(answers[el.id] ?? '').length + 2, 80)
//   const inputStyle = { flex: 1, width: `min(100%, ${autoWidthCh}ch)` }
//   const rect =  answers[INK_KEY(RECT_KEY(el.id))] as {w:number;h:number} | undefined;

//   return (
//     <FieldRow
//       key={el.id}
//       label={el.label}
//       inkPanel={inkEnabled ? (
//         <div className="ink-box">
//           <button
//   type="button"
//   className="ink-clear-abs"
//   title="Komment törlése"


// onClick={()=>{
//   // answers oldal: 1 batch
//   setAnswers(prev => {
//     const merged = {
//       ...(prev || {}),
//       [INK_TOGGLE(el.id)]: false,
//       [INK_KEY(el.id)]: undefined,
//       [RECT_KEY(el.id)]: undefined,
//     };
//     onAnswersChange?.(merged); // parent értesítés egyszer
//     return merged;
//   });

//   // form struktúra frissítés (immutábilisan) 1x
//   const els = (form.elements || []).slice();
//   const i = els.findIndex(e => e.id === el.id);
//   if (i > -1) {
//     els[i] = { ...els[i], ink: { ...(els[i].ink || {}), enabled: false } };
//     setFormState({ ...form, elements: els });
//   }
// }}

// >×</button>
//           <InlineInkCanvas
//             key={`${formId}:${el.id}`}   
//             value={inkValue}
//             onChange={(data) => setInk(el.id, data)}
//             //height={160}
//             initialRect={rect}
//             emitInitialRect={false} 
//             // onRectChange={(r)=> setVal(INK_KEY(RECT_KEY(el.id)), r)} // r = {w,h}
//             onRectChange={(r)=>{
//   const old = answers[INK_KEY(RECT_KEY(el.id))] as {w:number;h:number} | undefined;
//   if (!old || old.w !== r.w || old.h !== r.h) {
//     setVal(INK_KEY(RECT_KEY(el.id)), r);
//   }
// }}
//           />
//         </div>
//       ) : undefined}
//     >
//       <div className="field-wrap">
//         {el.type === 'text' && (
//           <input
//             className="input auto-grow"
//             style={inputStyle as React.CSSProperties}
//             placeholder={el.placeholder || ''}
//             value={answers[el.id] ?? ''}
//             onChange={(e) => setVal(el.id, e.target.value)}
//           />
//         )}
//         {el.type === 'dropdown' && (
//           <select
//             className="input auto-grow"
//             style={{ flex:1, maxWidth:'100%' }}
//             value={answers[el.id] ?? ''}
//             onChange={(e) => setVal(el.id, e.target.value)}
//           >
//             <option value="" disabled>Válassz...</option>
//             {(el.options ?? []).map((o: string, idx: number) => (
//               <option key={idx} value={o}>{o}</option>
//             ))}
//           </select>
//         )}

//         {/* kicsi “toll” ikon – nem fed, nem növeli a sor magasságát érdemben */}
//         <button
//   type="button"
//   className="icon-inline"
//   onClick={()=>{
//     const next = !inkEnabled
//     // 1) answers oldali flag frissítése
//     setVal(INK_TOGGLE(el.id), next)
//     // 2) form.elements oldali enabled frissítése (immutábilisan)
//     const els = (form.elements || []).slice()
//     const i = els.findIndex(e => e.id === el.id)
//     if (i > -1) {
//       els[i] = { ...els[i], ink: { ...(els[i].ink || {}), enabled: next } }
//       setFormState({ ...form, elements: els })
//     }
//   }}
//   title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}
// >✎</button>
//       </div>
//     </FieldRow>
//   )
// }

// // KOMMENT KOMPONENS = csak a rajz téglalap (resizable), nincs felirat
// // if (el.type === 'comment') {
// //   const dataUrl: string | undefined = answers[el.id];
// //   const rect = answers[RECT_KEY(el.id)] as {w:number;h:number} | undefined;
// //   return (
// //     <FieldRow key={el.id} label={el.label}>
// //       <div className="ink-wrapper">
// //         <button
// //           type="button"
// //           className="ink-clear"
// //           title="Tartalom törlése"
// //           onClick={()=>setVal(el.id, undefined)}
// //         >×</button>
// //         <InlineInkCanvas
// //         key={`${formId}:${el.id}`}
// //           value={dataUrl}
// //           onChange={(d)=>setVal(el.id, d)}
// //           //height={160}
// //           initialRect={rect}
// //           emitInitialRect={false} 
// //           onRectChange={(r)=> setVal(RECT_KEY(el.id), r)}
// //         />
// //       </div>
// //     </FieldRow>
// //   )
// // }

// // KOMMENT KOMPONENS = ugyanaz a minta, mint a simple gép "Megjegyzés":
// if (el.type === 'comment') {
//   const noteKey = el.id; // ugyanaz az id, csak logikailag "note"
//   const inkEnabled = !!answers[INK_TOGGLE(noteKey)];
//   const inkValue   = answers[INK_KEY(noteKey)] as string | undefined;

//   // textarea auto-grow (field-sizing) támogatás
//   const supportsFieldSizing =
//     typeof CSS !== 'undefined' && (CSS as any).supports?.('field-sizing','content');

//   const noteBox: React.CSSProperties = {
//     width:'100%', minHeight:36, lineHeight:'20px',
//     boxSizing:'border-box', border:'1px solid var(--border)', borderRadius:8,
//     padding:'8px 10px', background:'#fff'
//   };

//   // érték: külön mezőbe írjuk (ne az el.id-hoz tartozó dataUrl-t használjuk)
//   const textVal: string = (answers[`${noteKey}__text`] as string) ?? '';

//   return (
//     <FieldRow key={el.id} label={el.label} className="stacked">
//       {/* szerkeszthető szöveg */}
//       {supportsFieldSizing ? (
//         <textarea
//           className="input"
//           rows={1}
//           style={{ ...noteBox, ...( { ['fieldSizing' as any]:'content' } as any), overflow:'hidden', resize:'none', whiteSpace:'pre-wrap' }}
//           placeholder="Írd ide a megjegyzést…"
//           value={textVal}
//           onChange={(e)=> setVal(`${noteKey}__text`, e.target.value)}
//         />
//       ) : (
//         <div
//           className="input"
//           contentEditable
//           role="textbox"
//           aria-multiline="true"
//           suppressContentEditableWarning
//           style={{ ...noteBox, whiteSpace:'pre-wrap', wordBreak:'break-word', outline:'none' }}
//           onInput={(e)=> setVal(`${noteKey}__text`, e.currentTarget.textContent ?? '')}
//         >{textVal}</div>
//       )}

//       {/* eszköztár + ink toggle */}
//       <div className="small" style={{ color:'#6b7280', marginTop:6, display:'flex', alignItems:'center', gap:8 }}>
//         <span>Rajz/komment</span>
//         <button
//           type="button"
//           className="icon-inline"
//           title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}
//           onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}
//         >✎</button>
//       </div>

//       {/* canvas ALATTA, teljes szélességben */}
//       {inkEnabled && (
//         <div className="ink-box" style={{ position:'relative', marginTop:6 }}>
//           <button
//             type="button"
//             className="ink-clear-abs"
//             title="Komment törlése"
//             onClick={()=>{
//               setAnswers(prev=>{
//                 const merged = { ...(prev||{}) };
//                 merged[INK_TOGGLE(noteKey)] = false;
//                 merged[INK_KEY(noteKey)] = undefined;
//                 onAnswersChange?.(merged);
//                 return merged;
//               })
//             }}
//           >×</button>
//           <InlineInkCanvas
//             key={`${formId}:comment:${el.id}`}
//             value={inkValue}
//             onChange={(d)=> setVal(INK_KEY(noteKey), d)}
//           />
//         </div>
//       )}
//     </FieldRow>
//   )
// }

// if (el.type === 'title') {
//   return (
//     <div key={el.id} style={{padding:'6px 0'}}>
//       <h3 style={{margin:0, fontSize:18, fontWeight:700}}>{el.label}</h3>
//       {el.showNote && el.note && (
//         <div style={{ marginTop:2, color:'#6b7280', fontSize:12 }}>
//           {el.note}
//         </div>
//       )}
//     </div>
//   );
// }

// if (el.type === 'note_text') {
//   const val: string = answers[el.id] ?? '';

//   // közös alapszínezés/kinézet
//   const baseInputStyle: React.CSSProperties = {
//     width: '100%',
//     minHeight: 36,
//     lineHeight: '20px',
//     boxSizing: 'border-box',
//     border: '1px solid var(--border)',
//     borderRadius: 8,
//     padding: '8px 10px',
//     font: 'inherit',
//     background: 'var(--bg, #fff)',
//   };

//   if (supportsFieldSizing) {
//     // TEXTAREA + field-sizing: content (JS nélkül auto-növés)
//     const styleTextarea: React.CSSProperties = {
//       ...baseInputStyle,
//       // React nem ismeri a kulcsot, ezért setProperty-t használunk ref-ben:
//       // de egyszerűen átadjuk így is (TS-nek jelezzük, hogy engedje)
//       ...( { ['fieldSizing' as any]: 'content' } as any ),
//       overflow: 'hidden',
//       resize: 'none',
//       whiteSpace: 'pre-wrap',
//       // inline-size alternatívája:
//       width: '100%',
//     };

//     return (
//       <FieldRow key={el.id} label={el.label}>
//         <div style={{ width: '100%' }}>
//           <textarea
//             className="input"
//             rows={1}
//             style={styleTextarea}
//             value={val}
//             onChange={(e)=> setVal(el.id, e.target.value)}
//             placeholder="Írd ide a megjegyzést…"
//           />
//         </div>
//       </FieldRow>
//     );
//   }

//   // FALLBACK: contentEditable DIV (mindenhol nő, JS nélkül)
//   const wrapperStyle: React.CSSProperties = {
//     position: 'relative',
//     width: '100%',
//   };
//   const ceStyle: React.CSSProperties = {
//     ...baseInputStyle,
//     whiteSpace: 'pre-wrap',
//     wordBreak: 'break-word',
//     outline: 'none',
//   };
//   const placeholderStyle: React.CSSProperties = {
//     position: 'absolute',
//     left: 12,
//     top: 8,
//     pointerEvents: 'none',
//     opacity: 0.5,
//     font: 'inherit',
//     lineHeight: '20px',
//   };

//   return (
//     <FieldRow key={el.id} label={el.label}>
//       <div style={wrapperStyle}>
//         {/* placeholder csak üresen látszik */}
//         {(!val || val.length === 0) && (
//           <span style={placeholderStyle}>Írd ide a megjegyzést…</span>
//         )}
//         <div
//           className="input"
//           contentEditable
//           role="textbox"
//           aria-multiline="true"
//           suppressContentEditableWarning
//           style={ceStyle}
//           onInput={(e)=> setVal(el.id, (e.currentTarget.textContent ?? ''))}
//           onPaste={(e) => {
//             e.preventDefault();
//             const t = e.clipboardData.getData('text/plain');
//             // egyszerű plain-text beillesztés
//             document.execCommand('insertText', false, t);
//           }}
//         >
//           {val}
//         </div>
//       </div>
//     </FieldRow>
//   );
// }

// // if (el.type === 'dropdown_multi') {
// //   const selected: string[] = Array.isArray(answers[el.id]) ? answers[el.id] : [];
// //   const opts: string[] = el.options || [];

// //   const toggle = (opt: string) => {
// //     const has = selected.includes(opt);
// //     const next = has ? selected.filter(x=>x!==opt) : [...selected, opt];
// //     setVal(el.id, next);
// //   };

// //   return (
// //     <FieldRow key={el.id} label={el.label} className="no-border">
// //       <div style={{display:'flex', flexDirection:'column', gap:8, width:'100%'}}>
// //         <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:8}}>
// //           {opts.map((opt, i)=>(
// //             <label key={i} style={{display:'flex', alignItems:'center', gap:8, border:'1px solid var(--border)', borderRadius:6, padding:'6px 8px'}}>
// //               <input
// //                 type="checkbox"
// //                 checked={selected.includes(opt)}
// //                 onChange={()=>toggle(opt)}
// //               />
// //               <span>{opt}</span>
// //             </label>
// //           ))}
// //         </div>

// //         {selected.length > 0 && (
// //           <div className="small" style={{display:'flex', flexWrap:'wrap', gap:6}}>
// //             {selected.map((s, i)=>(
// //               <span key={i} className="file-chip" style={{borderRadius:999}}>
// //                 {s}
// //               </span>
// //             ))}
// //           </div>
// //         )}
// //       </div>
// //     </FieldRow>
// //   )
// // }

// // if (el.type === 'dropdown_multi') {
// //   const selected: string[] = Array.isArray(answers[el.id]) ? answers[el.id] : [];
// //   const opts: string[] = el.options || [];

// //   const onMultiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
// //     const values = Array.from(e.target.selectedOptions).map(o => o.value);
// //     setVal(el.id, values);
// //   };

// //   return (
// //     <FieldRow key={el.id} label={el.label} className="no-border">
// //       <select
// //         className="input"
// //         multiple
// //         size={Math.min(8, Math.max(3, opts.length))} // hogy látszódjon több sor
// //         style={{ width:'100%', maxWidth:'100%' }}
// //         value={selected}
// //         onChange={onMultiChange}
// //       >
// //         {opts.map((o, idx) => (
// //           <option key={idx} value={o}>{o}</option>
// //         ))}
// //       </select>
// //     </FieldRow>
// //   );
// // }

// if (el.type === 'dropdown_multi') {
//   const selected: string[] = Array.isArray(answers[el.id]) ? answers[el.id] : [];
//   const opts: string[] = el.options || [];

//   const openKey = `__open__${el.id}`;
//   const isOpen = !!answers[openKey];

//   const toggleValue = (val: string) => {
//     const has = selected.includes(val);
//     const next = has ? selected.filter(x => x !== val) : [...selected, val];
//     setVal(el.id, next);
//   };

//   const closeMenu = () => setVal(openKey, false);

//   // megjelenített érték csukva
//   const displayText =
//     selected.length > 0 ? selected.join(', ') : 'Válassz…';

//   return (
//     <FieldRow key={el.id} label={el.label} className="no-border">
//       <div className="combo" style={{ position:'relative' }}>
//         {/* trigger – ugyanúgy néz ki, mint a sima dropdown */}
//         <button
//           type="button"
//           className="input combo-trigger"
//           onClick={() => setVal(openKey, !isOpen)}
//           aria-expanded={isOpen}
//         >
//           <span className={selected.length === 0 ? 'muted' : ''}>
//             {displayText}
//           </span>
//           <span className="combo-caret">▾</span>
//         </button>

//         {/* lenyíló menü checkboxokkal */}
//         {isOpen && (
//           <div className="combo-menu" role="listbox" aria-multiselectable="true">
//             <div className="combo-list">
//               {opts.map((o, idx) => {
//                 const checked = selected.includes(o);
//                 return (
//                   <label
//                     key={idx}
//                     className={'combo-option' + (checked ? ' selected' : '')}
//                   >
//                     <input
//                       type="checkbox"
//                       checked={checked}
//                       onChange={() => toggleValue(o)}
//                     />
//                     <span className="combo-option-label">{o}</span>
//                   </label>
//                 );
//               })}
//             </div>

//             <div className="combo-actions">
//               <button type="button" className="btn" onClick={closeMenu}>Kész</button>
//             </div>
//           </div>
//         )}
//       </div>
//     </FieldRow>
//   );
// }

//           if (el.type === 'images') {
//   const imgs: FileItem[] = answers[el.id] || [];
//   // return (
//   //   <FieldRow key={el.id} label={el.label}>
//   //     <ImageUploaderWithInk
//   //       value={imgs}
//   //       onChange={(next)=>setVal(el.id, next)}
//   //     />
//   //   </FieldRow>
//   // );
//   return (
//   <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
//     <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
//       {/* <ImageUploaderWithInk
//         value={imgs}
//         onChange={(next)=>setVal(el.id, next)}
//       /> */}
//       {/* <ImageUploaderWithInk
//         value={imgs}
//         onChange={(next)=>{
//           const merged = { ...(answers || {}), [el.id]: next };
//           try { saveAnswersLocal(formId, merged); } catch {}
//           setAnswers(merged);
//           onAnswersChange?.(merged);
//         }}
//       /> */}
//       <ImageUploaderWithInk
//         value={imgs}
//         onChange={(next)=> setVal(el.id, next)}
//       />
//     </div>
//   </FieldRow>
// );
// }

// if (el.type === 'file') {
//   const files: FileItem[] = answers[el.id] || [];
//   // return (
//   //   <FieldRow key={el.id} label={el.label}>
//   //     <FileUploader
//   //       value={files}
//   //       onChange={(next)=>setVal(el.id, next)}
//   //     />
//   //   </FieldRow>
//   // );
//   return (
//   <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
//     <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
//       <FileUploader
//         value={files}
//         onChange={(next)=>setVal(el.id, next)}
//       />
//     </div>
//   </FieldRow>
// );
// }

//           // SKETCH
//           if (el.type === 'sketch') {
//             const dataUrl: string | undefined = answers[el.id];
//             const rect = answers[RECT_KEY(INK_KEY(el.id))] as {w:number;h:number} | undefined;
//             const h = el.height ?? 260
//             return (
//               <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
//                 <div className="ink-panel">
//                   {el.hideLabel && <div className="ink-title">{el.label}</div>}
//                   <div className="ink-body">
//                     <InlineInkCanvas 
//                     key={`${formId}:${el.id}`}
//                     value={dataUrl} 
//                     onChange={(d)=>setVal(el.id, d)} 
//                     //height={h}
//                     initialRect={rect}
//                     emitInitialRect={false} 
//                     // onRectChange={(r) => {
//                     //   // hogy kényelmesen nézhesd a konzolban:
//                     //   (window as any).lastRect = r;
//                     //   setVal(RECT_KEY(INK_KEY(el.id)), r);
//                     //   }}
//                     onRectChange={(r)=>{
//   const old = answers[INK_KEY(RECT_KEY(el.id))] as {w:number;h:number} | undefined;
//   if (!old || old.w !== r.w || old.h !== r.h) {
//     setVal(INK_KEY(RECT_KEY(el.id)), r);
//   }
// }}
//                     />
//                   </div>
//                 </div>
//               </FieldRow>
//             )
//           }




//           // MODULOK
//           // if (el.type === 'module_station' || el.type === 'module_compressor') {
//           //   return (
//           //     <FieldRow key={el.id} label={el.label}>
//           //       <div className="builder-indent">
//           //         <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
//           //           <button className="btn" onClick={() => {
//           //             const base = el.type==='module_station'
//           //               ? [{ key:'name', label:'Állomás neve' }, { key:'location', label:'Helyszín' }, { key:'note', label:'Megjegyzés' }]
//           //               : [{ key:'model', label:'Kompresszor típus' }, { key:'power', label:'Névleges teljesítmény [kW]' }, { key:'note', label:'Megjegyzés' }]
//           //             const inst: ModuleInstance = { id: uuid(), title:(el.type==='module_station'?'Állomás':'Kompresszor')+' #' + (((el.instances||[]).length)+1), open:true, fields: base.map(f=>({...f})) }
//           //             el.instances = [...(el.instances||[]), inst]
//           //             setFormState(prev => prev ? structuredClone(prev) : prev)
//           //           }}>
//           //             + {el.type === 'module_station' ? 'Állomás' : 'Kompresszor'} hozzáadása
//           //           </button>
//           //         </div>

//           //         {(el.instances || []).map((inst: ModuleInstance) => (
//           //           <div key={inst.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
//           //             <FieldRow label="Név">
//           //               <input
//           //                 className="input"
//           //                 value={inst.title}
//           //                 onChange={(e) => {
//           //                   inst.title = e.target.value
//           //                   setFormState(prev => prev ? structuredClone(prev) : prev)
//           //                 }}
//           //               />
//           //             </FieldRow>

//           //             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
//           //               <div className="small"><strong>Részletek</strong> {inst.open ? '(nyitva)' : '(zárva)'}</div>
//           //               <span>
//           //                 <button className="btn" onClick={() => { inst.open = !inst.open; setFormState(prev => prev ? structuredClone(prev) : prev) }}>
//           //                   {inst.open ? 'Bezár' : 'Kinyit'}
//           //                 </button>
//           //                 <button className="btn danger" style={{ marginLeft: 8 }} onClick={() => {
//           //                   el.instances = (el.instances || []).filter((i: ModuleInstance) => i.id !== inst.id)
//           //                   setFormState(prev => prev ? structuredClone(prev) : prev)
//           //                 }}>
//           //                   Törlés
//           //                 </button>
//           //               </span>
//           //             </div>

//           //             {!inst.open && (
//           //               <FieldRow label="Megjegyzés">
//           //                 <input
//           //                   className="input"
//           //                   value={(inst.fields||[]).find((f) => f.key === 'note')?.value || ''}
//           //                   onChange={(e) => {
//           //                     const f = (inst.fields||[]).find((f) => f.key === 'note')
//           //                     if (f) f.value = e.target.value
//           //                     setFormState(prev => prev ? structuredClone(prev) : prev)
//           //                   }}
//           //                 />
//           //               </FieldRow>
//           //             )}

//           //             {inst.open && (
//           //               <div style={{ marginTop: 8 }}>
//           //                 {(inst.fields||[]).map((f) => (
//           //                   <FieldRow key={f.key} label={f.label} className="no-border">
//           //                     <input
//           //                       className="input"
//           //                       value={f.value || ''}
//           //                       onChange={(e) => {
//           //                         f.value = e.target.value
//           //                         setFormState(prev => prev ? structuredClone(prev) : prev)
//           //                       }}
//           //                     />
//           //                   </FieldRow>
//           //                 ))}
//           //               </div>
//           //             )}
//           //           </div>
//           //         ))}
//           //       </div>
//           //     </FieldRow>
//           //   )
//           // }
//           if (el.type === 'module_machine_simple') {
//   const sep = <div style={{borderTop:'1px solid #e5e7eb', margin:'14px 0'}} />;
//   const noteBox: React.CSSProperties = {
//     width:'100%', minHeight:36, lineHeight:'20px',
//     boxSizing:'border-box', border:'1px solid var(--border)', borderRadius:8,
//     padding:'8px 10px', background:'#fff'
//   };
//   const supportsFieldSizing =
//     typeof CSS !== 'undefined' && (CSS as any).supports?.('field-sizing','content');

//   return (
//     <div key={el.id} style={{ width:'100%' }}>
//       {/* + Gép hozzáadása */}
//       <div style={{ display:'flex', gap:8, marginBottom:12 }}>
//         <button
//           className="btn"
//           onClick={()=>{
//             const t: MachineType = MACHINE_TYPES[0];
//             const idx = nextIndexForType(el.instances, t);
//             const inst = {
//               id: uuid(),
//               title: `${t} ${idx}`,
//               open: true,
//               machineType: t,
//               fields: [
//                 { key:'manufacturer', label:'gyártó', value:'' },
//                 { key:'model',        label:'típus',  value:'' },
//               ],
//             };
//             el.instances = [ ...(el.instances||[]), inst ];
//             setFormState(prev=>prev?structuredClone(prev):prev);
//           }}
//         >+ Gép hozzáadása</button>
//       </div>

//       {(el.instances || []).map((inst: any, idx: number) => {
//         const noteKey = `ms_note_${inst.id}`;
//         const inkEnabled = !!answers[INK_TOGGLE(noteKey)];
//         const inkValue   = answers[INK_KEY(noteKey)] as string | undefined;

//         // segéd a két mezőhöz
//         const getField = (k:string) => (inst.fields||[]).find((x:any)=>x.key===k);

//         return (
//           <div key={inst.id}>
//             {/* 1. sor: géptípus dropdown */}
//             <div style={{ marginBottom:8 }}>
//               <select
//                 className="input"
//                 style={{ width:260 }}
//                 value={inst.machineType}
//                 onChange={(e)=>{
//                   const newType = e.target.value as MachineType;
//                   const nextIdx = nextIndexForType((el.instances||[]).filter((x:any)=>x.id!==inst.id), newType);
//                   inst.machineType = newType;
//                   inst.title = `${newType} ${nextIdx}`;
//                   setFormState(prev=>prev?structuredClone(prev):prev);
//                 }}
//               >
//                 {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//               </select>
//             </div>

//             {/* 2. sor: balra Név, jobbra akciók */}
//             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
//               <div className="small"><strong>Név:</strong> {inst.title}</div>
//               <div style={{ display:'flex', gap:8 }}>
//                 <button
//                   className="btn"
//                   onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}
//                 >{inst.open ? 'Bezár' : 'Kinyit'}</button>
//                 <button
//                   className="btn danger"
//                   onClick={()=>{
//                     el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id);
//                     setFormState(prev=>prev?structuredClone(prev):prev);
//                   }}
//                 >Törlés</button>
//               </div>
//             </div>

//             {/* lenyitható: gyártó + típus (valós kitöltés, mentés inst.fields-be) */}
//             {inst.open && (
//               <div style={{ display:'grid', gap:6, marginBottom:10 }}>
//                 <FieldRow label="gyártó" className="no-border">
//                   <input
//                     className="input"
//                     value={getField('manufacturer')?.value || ''}
//                     onChange={(e)=>{
//                       const f = getField('manufacturer'); if (f) f.value = e.target.value;
//                       setFormState(prev=>prev?structuredClone(prev):prev);
//                     }}
//                   />
//                 </FieldRow>
//                 <FieldRow label="típus" className="no-border">
//                   <input
//                     className="input"
//                     value={getField('model')?.value || ''}
//                     onChange={(e)=>{
//                       const f = getField('model'); if (f) f.value = e.target.value;
//                       setFormState(prev=>prev?structuredClone(prev):prev);
//                     }}
//                   />
//                 </FieldRow>
//               </div>
//             )}

           

//             {/* Megjegyzés + rajz – a lenyitható részen KÍVÜL (STACKED) */}
// <div style={{ marginTop:12 }}>
//   <div className="small" style={{ color:'#6b7280', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
//     <span>Megjegyzés</span>
//     <button
//       type="button"
//       className="icon-inline"
//       title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}
//       onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}
//     >✎</button>
//   </div>

//   {/* szöveg fent */}
//   {supportsFieldSizing ? (
//     <textarea
//       className="input"
//       rows={1}
//       style={{ ...noteBox, ...( { ['fieldSizing' as any]:'content' } as any), overflow:'hidden', resize:'none', whiteSpace:'pre-wrap' }}
//       placeholder="Írd ide a megjegyzést…"
//       value={getField('__simple_note__')?.value || ''}
//       onChange={(e)=>{
//         let n = getField('__simple_note__');
//         if (!n) { inst.fields.push({ key:'__simple_note__', label:'__note__', value:'' }); n = getField('__simple_note__'); }
//         if (n) n.value = e.target.value;
//         setFormState(prev=>prev?structuredClone(prev):prev);
//       }}
//     />
//   ) : (
//     <div
//       className="input"
//       contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning
//       style={{ ...noteBox, whiteSpace:'pre-wrap', wordBreak:'break-word', outline:'none' }}
//       onInput={(e)=>{
//         let n = getField('__simple_note__');
//         if (!n) { inst.fields.push({ key:'__simple_note__', label:'__note__', value:'' }); n = getField('__simple_note__'); }
//         if (n) n.value = (e.currentTarget.textContent ?? '');
//         setFormState(prev=>prev?structuredClone(prev):prev);
//       }}
//     >{getField('__simple_note__')?.value || ''}</div>
//   )}

//   {/* canvas ALATTA */}
//   {inkEnabled && (
//     <div className="ink-box" style={{ position:'relative', marginTop:8 }}>
//       <button
//         type="button"
//         className="ink-clear-abs"
//         title="Komment törlése"
//         onClick={()=>{
//           setAnswers(prev => {
//             const merged = { ...(prev||{}) };
//             merged[INK_TOGGLE(noteKey)] = false;
//             merged[INK_KEY(noteKey)] = undefined;
//             onAnswersChange?.(merged);
//             return merged;
//           });
//         }}
//       >×</button>
//       <InlineInkCanvas
//         key={`${formId}:msnote:${inst.id}`}
//         value={inkValue}
//         onChange={(data)=> setVal(INK_KEY(noteKey), data)}
//       />
//     </div>
//   )}
// </div>

//             {/* elválasztó a gépek között */}
//             {idx < (el.instances?.length||0)-1 && sep}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ================= FormFillerEmbed =================
// // if (el.type === 'module_system_survey') {
// //   const unitCell: React.CSSProperties = { color:'#6b7280', fontSize:12, paddingLeft:6, whiteSpace:'nowrap' };
// //   const sep = <div style={{borderTop:'1px solid #e5e7eb', margin:'14px 0'}} />;

// //   const nextIndex = (instances?: SystemSurveyInstance[]) =>
// //     1 + Math.max(0, ...((instances||[]).map(i => i.index)));

// //   return (
// //     <div key={el.id} style={{ width:'100%' }}>
// //       {/* fejléc + új rendszer gomb */}
// //       <div style={{ display:'flex', gap:8, marginBottom:12 }}>
// //         <button
// //           className="btn"
// //           onClick={()=>{
// //             const idx = nextIndex((el as SystemSurveyElement).instances);
// //             const fields: ModuleField[] = SYSTEM_SECTIONS.flatMap(sec =>
// //               sec.fields.map(f => ({ key: `${sec.code}_${f.key}`, label: f.label }))
// //             );
// //             (el as SystemSurveyElement).instances = [
// //               ...((el as SystemSurveyElement).instances || []),
// //               { id: uuid(), index: idx, open: true, fields }
// //             ];
// //             setFormState(prev => prev ? structuredClone(prev) : prev);
// //           }}
// //         >
// //           + Rendszer hozzáadása
// //         </button>
// //       </div>

// //       {((el as SystemSurveyElement).instances || []).map((inst, iIdx) => {
// //         // szekciók renderelése
// //         return (
// //           <div key={inst.id} style={{ marginBottom:8 }}>
// //             {/* fejléc: név/sorszám + akciók */}
// //             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
// //               <div className="small"><strong>Blokk:</strong> {inst.index === 0 ? 'Általános (3.0–18.0)' : `Rendszer ${inst.index} (3.${inst.index}–18.${inst.index})`}</div>
// //               <div style={{ display:'flex', gap:8 }}>
// //                 <button className="btn" onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>
// //                   {inst.open ? 'Bezár' : 'Kinyit'}
// //                 </button>
// //                 {inst.index !== 0 && (
// //                   <button className="btn danger" onClick={()=>{
// //                     (el as SystemSurveyElement).instances = ((el as SystemSurveyElement).instances||[]).filter(x => x.id !== inst.id);
// //                     setFormState(prev=>prev?structuredClone(prev):prev);
// //                   }}>Törlés</button>
// //                 )}
// //               </div>
// //             </div>

// //             {inst.open && (
// //               <div>
// //                 {SYSTEM_SECTIONS.map((sec, sIdx) => {
// //                   const secNo = `${sec.code}.${inst.index}`;

// //                   return (
// //                     <div key={`${inst.id}:${sec.code}`} style={{ marginBottom:12 }}>
// //                       {/* szekció cím */}
// //                       <h3 style={{ margin:'8px 0 8px', fontSize:16, fontWeight:700 }}>
// //                         {secNo} {sec.title}
// //                       </h3>

// //                       {/* mezők */}
// //                       <div style={{ display:'grid', gap:6 }}>
// //                         {sec.fields.map((spec) => {
// //                           const specKey = `${sec.code}_${spec.key}`;
// //                           const mf = (inst.fields||[]).find(f => f.key === specKey);
// //                           const value = mf?.value ?? '';

// //                           // problémák/jegyzetek: ink-képes kulcsok
// //                           const isInkNote =
// //                             (sec.code === 3 && spec.key.startsWith('prob_')) ||
// //                             spec.key === 'note' ||
// //                             spec.key.startsWith('note_') ||
// //                             spec.key === 'other';

// //                           const fldKey = `sys_${inst.id}_${sec.code}_${spec.key}`; // answers kulcs
// //                           const inkEnabled = !!answers[INK_TOGGLE(fldKey)];
// //                           const inkValue   = answers[INK_KEY(fldKey)] as string | undefined;
// //                           const rect       = answers[INK_KEY(RECT_KEY(fldKey))] as {w:number;h:number} | undefined;

// //                           return (
// //                             <FieldRow key={specKey} label={spec.label} className="no-border"
// //                               inkPanel={isInkNote && inkEnabled ? (
// //                                 <div className="ink-box">
// //                                   <button
// //                                     type="button"
// //                                     className="ink-clear-abs"
// //                                     title="Komment törlése"
// //                                     onClick={()=>{
// //                                       // answers törlés
// //                                       setAnswers(prev => {
// //                                         const merged = {
// //                                           ...(prev || {}),
// //                                           [INK_TOGGLE(fldKey)]: false,
// //                                           [INK_KEY(fldKey)]: undefined,
// //                                           [RECT_KEY(fldKey)]: undefined,
// //                                         };
// //                                         onAnswersChange?.(merged);
// //                                         return merged;
// //                                       });
// //                                       setFormState(prev => prev ? structuredClone(prev) : prev);
// //                                     }}
// //                                   >×</button>

// //                                   <InlineInkCanvas
// //                                     key={`${formId}:${fldKey}`}
// //                                     value={inkValue}
// //                                     onChange={(data) => setVal(INK_KEY(fldKey), data)}
// //                                     initialRect={rect}
// //                                     emitInitialRect={false}
// //                                     onRectChange={(r)=>{
// //                                       const old = answers[INK_KEY(RECT_KEY(fldKey))] as {w:number;h:number} | undefined;
// //                                       if (!old || old.w !== r.w || old.h !== r.h) setVal(INK_KEY(RECT_KEY(fldKey)), r);
// //                                     }}
// //                                   />
// //                                 </div>
// //                               ) : undefined}
// //                             >
// //                               <div style={{ display:'grid', gridTemplateColumns: spec.unit ? 'minmax(0,1fr) auto' : '1fr', alignItems:'center', gap:6, width:'100%' }}>
// //                                 {spec.input === 'text' && (
// //                                   <input
// //                                     className="input"
// //                                     value={answers[fldKey] ?? value}
// //                                     onChange={(e)=>{ if (mf) mf.value = e.target.value; setVal(fldKey, e.target.value); }}
// //                                     style={{ width:'100%' }}
// //                                   />
// //                                 )}
// //                                 {spec.input === 'select' && (
// //                                   <select
// //                                     className="input"
// //                                     value={answers[fldKey] ?? value}
// //                                     onChange={(e)=>{ if (mf) mf.value = e.target.value; setVal(fldKey, e.target.value); }}
// //                                     style={{ width:'100%' }}
// //                                   >
// //                                     <option value="" disabled>Válassz…</option>
// //                                     {(spec.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
// //                                   </select>
// //                                 )}
// //                                 {spec.input === 'dropdown_multi' && (
// //                                   <select
// //                                     multiple
// //                                     className="input"
// //                                     value={(answers[fldKey] ?? (value || []) ) as string[]}
// //                                     onChange={(e)=>{
// //                                       const arr = Array.from(e.currentTarget.selectedOptions).map(x=>x.value);
// //                                       if (mf) mf.value = arr.join(', ');
// //                                       setVal(fldKey, arr);
// //                                     }}
// //                                     style={{ width:'100%', minHeight:86 }}
// //                                   >
// //                                     {(spec.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
// //                                   </select>
// //                                 )}
// //                                 {spec.unit && <span style={unitCell}>{spec.unit}</span>}
// //                               </div>

// //                               {/* toll ikon csak az ink-képes mezőknél */}
// //                               {isInkNote && (
// //                                 <button
// //                                   type="button"
// //                                   className="icon-inline"
// //                                   onClick={()=>{
// //                                     const next = !inkEnabled;
// //                                     setVal(INK_TOGGLE(fldKey), next);
// //                                     setFormState(prev => prev ? structuredClone(prev) : prev);
// //                                   }}
// //                                   title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}
// //                                 >✎</button>
// //                               )}
// //                             </FieldRow>
// //                           );
// //                         })}
// //                       </div>

// //                       {/* Fotók helye */}
// //                       {sec.photoKey && (
// //   <div style={{ marginTop:8 }}>
// //     <FieldRow label="Fotók helye" className="no-border">
// //       <ImageUploaderWithInk
// //         value={((answers[`${inst.id}:${sec.photoKey}`] as FileItem[]) ?? [])}
// //         onChange={(files: FileItem[]) => setVal(`${inst.id}:${sec.photoKey}`, files)}
// //       />
// //     </FieldRow>
// //   </div>
// // )}

// //                       {/* szekció szeparátor */}
// //                       {(sIdx < SYSTEM_SECTIONS.length - 1) && <div style={{ marginTop:10 }}>{sep}</div>}
// //                     </div>
// //                   );
// //                 })}
// //               </div>
// //             )}

// //             {/* blokkok szeparátora */}
// //             {iIdx < (((el as SystemSurveyElement).instances || []).length - 1) && sep}
// //           </div>
// //         );
// //       })}
// //     </div>
// //   );
// // }

// if (el.type === 'module_system_survey') {
//   const unitCell: React.CSSProperties = { color:'#6b7280', fontSize:12, paddingLeft:6, whiteSpace:'nowrap' };
//   const sep = <div style={{borderTop:'1px solid #e5e7eb', margin:'14px 0'}} />;
//   const supportsFieldSizing =
//     typeof CSS !== 'undefined' && (CSS as any).supports?.('field-sizing','content');
//   const noteBox: React.CSSProperties = {
//     width:'100%', minHeight:36, lineHeight:'20px', boxSizing:'border-box',
//     border:'1px solid var(--border)', borderRadius:8, padding:'8px 10px', background:'#fff'
//   };

//   const nextIndex = (instances?: SystemSurveyInstance[]) =>
//     1 + Math.max(0, ...((instances||[]).map(i => i.index)));

//   const getField = (inst: SystemSurveyInstance, k: string) =>
//     (inst.fields||[]).find(f => f.key === k);

//   return (
//     <div key={el.id} style={{ width:'100%' }}>
//       {/* fejléc + új rendszer gomb */}
//       <div style={{ display:'flex', gap:8, marginBottom:12 }}>
//         <button
//           className="btn"
//           onClick={()=>{
//             const idx = nextIndex((el as SystemSurveyElement).instances);
//             const fields: ModuleField[] = SYSTEM_SECTIONS.flatMap(sec =>
//               sec.fields.map(f => ({ key: `${sec.code}_${f.key}`, label: f.label }))
//             );
//             (el as SystemSurveyElement).instances = [
//               ...((el as SystemSurveyElement).instances || []),
//               { id: uuid(), index: idx, open: true, fields }
//             ];
//             setFormState(prev => prev ? structuredClone(prev) : prev);
//           }}
//         >
//           + Rendszer hozzáadása
//         </button>
//       </div>

//       {((el as SystemSurveyElement).instances || []).map((inst, iIdx) => {
//         // per-instance “Megjegyzés” kulcsok
//         const noteKey  = `sys_note_${inst.id}`;
//         const inkEnabled = !!answers[INK_TOGGLE(noteKey)];
//         const inkValue   = answers[INK_KEY(noteKey)] as string | undefined;

//         return (
//           <div key={inst.id} style={{ marginBottom:8 }}>
//             {/* fejléc: név/sorszám + akciók */}
//             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
//               <div className="small">
//                 <strong>Blokk:</strong>{' '}
//                 {inst.index === 0 ? 'Általános (3.0–18.0)' : `Rendszer ${inst.index} (3.${inst.index}–18.${inst.index})`}
//               </div>
//               <div style={{ display:'flex', gap:8 }}>
//                 <button className="btn" onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>
//                   {inst.open ? 'Bezár' : 'Kinyit'}
//                 </button>
//                 {inst.index !== 0 && (
//                   <button className="btn danger" onClick={()=>{
//                     (el as SystemSurveyElement).instances =
//                       ((el as SystemSurveyElement).instances||[]).filter(x => x.id !== inst.id);
//                     setFormState(prev=>prev?structuredClone(prev):prev);
//                   }}>Törlés</button>
//                 )}
//               </div>
//             </div>

//             {inst.open && (
//               <div>
//                 {SYSTEM_SECTIONS.map((sec, sIdx) => {
//                   const secNo = `${sec.code}.${inst.index}`;

//                   return (
//                     <div key={`${inst.id}:${sec.code}`} style={{ marginBottom:12 }}>
//                       {/* szekció cím */}
//                       <h3 style={{ margin:'8px 0 8px', fontSize:16, fontWeight:700 }}>
//                         {secNo} {sec.title}
//                       </h3>

//                       {/* mezők */}
//                       <div style={{ display:'grid', gap:6 }}>
//                         {sec.fields.map((spec) => {
//                           const specKey = `${sec.code}_${spec.key}`;
//                           const mf = (inst.fields||[]).find(f => f.key === specKey);
//                           const value = mf?.value ?? '';

//                           // ink-es mezők: 3.* probléma sorok + minden "note/other" nevű
//                           const isInkNote =
//                             (sec.code === 3 && spec.key.startsWith('prob_')) ||
//                             spec.key === 'note' || spec.key.startsWith('note_') || spec.key === 'other';

//                           const fldKey = `sys_${inst.id}_${sec.code}_${spec.key}`; // answers kulcs
//                           const rowInkEnabled = !!answers[INK_TOGGLE(fldKey)];
//                           const rowInkValue   = answers[INK_KEY(fldKey)] as string | undefined;
//                           const rect          = answers[INK_KEY(RECT_KEY(fldKey))] as {w:number;h:number} | undefined;

//                           // MULTI kombó – helper
//                           const renderMultiCombo = () => {
//                             const selected: string[] = Array.isArray(answers[fldKey])
//                               ? answers[fldKey] : [];
//                             const opts: string[] = spec.options || [];
//                             const openKey = `__open__${fldKey}`;
//                             const isOpen = !!answers[openKey];
//                             const toggleValue = (val: string) => {
//                               const has = selected.includes(val);
//                               const next = has ? selected.filter(x => x !== val) : [...selected, val];
//                               if (mf) mf.value = next.join(', ');
//                               setVal(fldKey, next);
//                             };
//                             const closeMenu = () => setVal(openKey, false);
//                             const displayText = selected.length > 0 ? selected.join(', ') : 'Válassz…';

//                             return (
//                               <div className="combo" style={{ position:'relative', width:'100%' }}>
//                                 <button
//                                   type="button"
//                                   className="input combo-trigger"
//                                   onClick={() => setVal(openKey, !isOpen)}
//                                   aria-expanded={isOpen}
//                                   style={{ width:'100%' }}
//                                 >
//                                   <span className={selected.length === 0 ? 'muted' : ''}>
//                                     {displayText}
//                                   </span>
//                                   <span className="combo-caret">▾</span>
//                                 </button>

//                                 {isOpen && (
//                                   <div className="combo-menu" role="listbox" aria-multiselectable="true">
//                                     <div className="combo-list">
//                                       {opts.map((o, idx) => {
//                                         const checked = selected.includes(o);
//                                         return (
//                                           <label
//                                             key={idx}
//                                             className={'combo-option' + (checked ? ' selected' : '')}
//                                           >
//                                             <input
//                                               type="checkbox"
//                                               checked={checked}
//                                               onChange={() => toggleValue(o)}
//                                             />
//                                             <span className="combo-option-label">{o}</span>
//                                           </label>
//                                         );
//                                       })}
//                                     </div>
//                                     <div className="combo-actions">
//                                       <button type="button" className="btn" onClick={closeMenu}>Kész</button>
//                                     </div>
//                                   </div>
//                                 )}
//                               </div>
//                             );
//                           };

//                           return (
//                             <FieldRow
//                               key={specKey}
//                               label={spec.label}
//                               className="no-border"
//                               inkPanel={isInkNote && rowInkEnabled ? (
//                                 <div className="ink-box">
//                                   <button
//                                     type="button"
//                                     className="ink-clear-abs"
//                                     title="Komment törlése"
//                                     onClick={()=>{
//                                       setAnswers(prev => {
//                                         const merged = {
//                                           ...(prev || {}),
//                                           [INK_TOGGLE(fldKey)]: false,
//                                           [INK_KEY(fldKey)]: undefined,
//                                           [RECT_KEY(fldKey)]: undefined,
//                                         };
//                                         onAnswersChange?.(merged);
//                                         return merged;
//                                       });
//                                       setFormState(prev => prev ? structuredClone(prev) : prev);
//                                     }}
//                                   >×</button>
//                                   <InlineInkCanvas
//                                         key={`${formId}:${fldKey}`}
//                                         value={rowInkValue}
//                                         onChange={(data) => setVal(INK_KEY(fldKey), data)}
//                                         initialRect={rect}
//                                         emitInitialRect={false}
//                                         onRectChange={(r)=>{
//                                           const old = answers[INK_KEY(RECT_KEY(fldKey))] as {w:number;h:number} | undefined;
//                                           if (!old || old.w !== r.w || old.h !== r.h) setVal(INK_KEY(RECT_KEY(fldKey)), r);
//                                         }}
//                                   />
//                                 </div>
//                               ) : undefined}
//                             >
//                               <div style={{ display:'grid', gridTemplateColumns: spec.unit ? 'minmax(0,1fr) auto' : '1fr', alignItems:'center', gap:6, width:'100%' }}>
//                                 {spec.input === 'text' && (
//                                   <input
//                                     className="input"
//                                     value={answers[fldKey] ?? value}
//                                     onChange={(e)=>{ if (mf) mf.value = e.target.value; setVal(fldKey, e.target.value); }}
//                                     style={{ width:'100%' }}
//                                   />
//                                 )}

//                                 {spec.input === 'select' && (
//                                   <select
//                                     className="input"
//                                     value={answers[fldKey] ?? value}
//                                     onChange={(e)=>{ if (mf) mf.value = e.target.value; setVal(fldKey, e.target.value); }}
//                                     style={{ width:'100%' }}
//                                   >
//                                     <option value="" disabled>Válassz…</option>
//                                     {(spec.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
//                                   </select>
//                                 )}

//                                 {spec.input === 'dropdown_multi' && renderMultiCombo() }

//                                 {spec.unit && <span style={unitCell}>{spec.unit}</span>}
//                               </div>

//                               {/* sorvégi toll ikon csak az ink-képeseknél */}
//                               {isInkNote && (
//                                 <button
//                                   type="button"
//                                   className="icon-inline"
//                                   onClick={()=>{
//                                     const next = !rowInkEnabled;
//                                     setVal(INK_TOGGLE(fldKey), next);
//                                     setFormState(prev => prev ? structuredClone(prev) : prev);
//                                   }}
//                                   title={rowInkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}
//                                 >✎</button>
//                               )}
//                             </FieldRow>
//                           );
//                         })}
//                       </div>

//                       {/* Fotók helye */}
//                       {sec.photoKey && (
//                         <div style={{ marginTop:8 }}>
//                           <FieldRow label="Fotók helye" className="no-border">
//                             <ImageUploaderWithInk
//                               value={((answers[`${inst.id}:${sec.photoKey}`] as FileItem[]) ?? [])}
//                               onChange={(files: FileItem[]) => setVal(`${inst.id}:${sec.photoKey}`, files)}
//                             />
//                           </FieldRow>
//                         </div>
//                       )}

//                       {(sIdx < SYSTEM_SECTIONS.length - 1) && <div style={{ marginTop:10 }}>{sep}</div>}
//                     </div>
//                   );
//                 })}

//                 {/* ===== Megjegyzés + rajz – STACKED a blokk végén ===== */}
//                 <div style={{ marginTop:12 }}>
//                   <div className="small" style={{ color:'#6b7280', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
//                     <span>Megjegyzés</span>
//                     <button
//                       type="button"
//                       className="icon-inline"
//                       title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}
//                       onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}
//                     >✎</button>
//                   </div>

//                   {/* szöveg fent */}
//                   {supportsFieldSizing ? (
//                     <textarea
//                       className="input"
//                       rows={1}
//                       style={{ ...noteBox, ...( { ['fieldSizing' as any]:'content' } as any), overflow:'hidden', resize:'none', whiteSpace:'pre-wrap' }}
//                       placeholder="Írd ide a megjegyzést…"
//                       value={getField(inst, '__simple_note__')?.value || ''}
//                       onChange={(e)=>{
//                         let n = getField(inst, '__simple_note__');
//                         if (!n) { inst.fields.push({ key:'__simple_note__', label:'__note__', value:'' }); n = getField(inst, '__simple_note__'); }
//                         if (n) n.value = e.target.value;
//                         setFormState(prev=>prev?structuredClone(prev):prev);
//                       }}
//                     />
//                   ) : (
//                     <div
//                       className="input"
//                       contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning
//                       style={{ ...noteBox, whiteSpace:'pre-wrap', wordBreak:'break-word', outline:'none' }}
//                       onInput={(e)=>{
//                         let n = getField(inst, '__simple_note__');
//                         if (!n) { inst.fields.push({ key:'__simple_note__', label:'__note__', value:'' }); n = getField(inst, '__simple_note__'); }
//                         if (n) n.value = (e.currentTarget.textContent ?? '');
//                         setFormState(prev=>prev?structuredClone(prev):prev);
//                       }}
//                     >{getField(inst, '__simple_note__')?.value || ''}</div>
//                   )}

//                   {/* canvas ALATTA */}
//                   {inkEnabled && (
//                     <div className="ink-box" style={{ position:'relative', marginTop:8 }}>
//                       <button
//                         type="button"
//                         className="ink-clear-abs"
//                         title="Komment törlése"
//                         onClick={()=>{
//                           setAnswers(prev => {
//                             const merged = { ...(prev||{}) };
//                             merged[INK_TOGGLE(noteKey)] = false;
//                             merged[INK_KEY(noteKey)] = undefined;
//                             onAnswersChange?.(merged);
//                             return merged;
//                           });
//                         }}
//                       >×</button>
//                       <InlineInkCanvas
//                         key={`${formId}:sysnote:${inst.id}`}
//                         value={inkValue}
//                         onChange={(data)=> setVal(INK_KEY(noteKey), data)}
//                       />
//                     </div>
//                   )}
//                 </div>
//                 {/* ===== /Megjegyzés ===== */}
//               </div>
//             )}

//             {/* blokkok szeparátora */}
//             {iIdx < (((el as SystemSurveyElement).instances || []).length - 1) && sep}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // helper: következő sorszám
// const nextSimpleIndex = (instances?: SimpleDetailInstance[]) =>
//   1 + ((instances || []).length || 0);

// // === ÚJ: RENDSZER + TARTÁLY ===
// if (el.type === 'module_system_detail' || el.type === 'module_tank_detail') {
//   const unitCell: React.CSSProperties = { color:'#6b7280', fontSize:12, paddingLeft:6, whiteSpace:'nowrap' };
//   const sep = <div style={{borderTop:'1px solid #e5e7eb', margin:'14px 0'}} />;

//   const specs = el.type === 'module_system_detail' ? SYSTEM_TEMPLATE : TANK_TEMPLATE;
//   const titleBase = el.type === 'module_system_detail' ? 'Rendszer' : 'Tartály';

//   return (
//     <div key={el.id} style={{ width:'100%' }}>
//       <div style={{ display:'flex', gap:8, marginBottom:12 }}>
//         <button
//           className="btn"
//           onClick={()=>{
//             const idx = nextSimpleIndex((el as any).instances);
//             const inst: SimpleDetailInstance = {
//               id: uuid(),
//               title: `${titleBase} ${idx}`,
//               open: true,
//               fields: specs.map(s => ({ key:s.key, label:s.label }))
//             };
//             (el as any).instances = [ ...(el as any).instances || [], inst ];
//             setFormState(prev=>prev?structuredClone(prev):prev);
//           }}
//         >
//           + {titleBase} hozzáadása
//         </button>
//       </div>

//       {((el as any).instances || []).map((inst: SimpleDetailInstance, i:number) => {
//         // specs és instance mezők szinkron
//         if ((inst.fields?.length ?? 0) !== specs.length) {
//           inst.fields = specs.map(s=>{
//             const old = (inst.fields||[]).find(f=>f.key===s.key);
//             return { key:s.key, label:s.label, value: old?.value ?? '' };
//           });
//         }

//         return (
//           <div key={inst.id}>
//             {/* fejléc: név + akciók */}
//             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
//               <div className="small"><strong>Név:</strong> {inst.title}</div>
//               <div style={{ display:'flex', gap:8 }}>
//                 <button className="btn" onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>
//                   {inst.open ? 'Bezár' : 'Kinyit'}
//                 </button>
//                 <button className="btn danger" onClick={()=>{
//                   (el as any).instances = ((el as any).instances || []).filter((x:SimpleDetailInstance)=>x.id!==inst.id);
//                   setFormState(prev=>prev?structuredClone(prev):prev);
//                 }}>Törlés</button>
//               </div>
//             </div>

//             {/* lenyitható kitöltő rész */}
//             {inst.open && (
//         <div style={{ display:'grid', gap:6, marginBottom:8 }}>
//           {specs.map(spec => {
//             const f = (inst.fields||[]).find(x => x.key === spec.key);
//             const value = f?.value || '';

//             // EGYEDI kulcs a válaszok/ink számára
//             const fldKey = `sys_${inst.id}_${spec.key}`;

//             // CSAK a "probléma" mezőknél legyen ink-panel
//             const isProblem =
//               spec.key === 'prob_flow'     || spec.key === 'prob_pressure' ||
//               spec.key === 'prob_solid'    || spec.key === 'prob_dew'      ||
//               spec.key === 'prob_oil'      || spec.key === 'prob_noise'    ||
//               spec.key === 'prob_other';

//             if (isProblem) {
//               const inkEnabled = !!answers[INK_TOGGLE(fldKey)];
//               const inkValue   = answers[INK_KEY(fldKey)] as string | undefined;
//               const rect       = answers[INK_KEY(RECT_KEY(fldKey))] as {w:number;h:number} | undefined;

//               const autoWidthCh = Math.min(String(answers[fldKey] ?? '').length + 2, 80);
//               const inputStyle = { flex: 1, width: `min(100%, ${autoWidthCh}ch)` };

//               return (
//                 <FieldRow
//                   key={spec.key}
//                   label={spec.label}
//                   inkPanel={inkEnabled ? (
//                     <div className="ink-box">
//                       <button
//                         type="button"
//                         className="ink-clear-abs"
//                         title="Komment törlése"
//                         onClick={()=>{
//                           // answers – 1 batch
//                           setAnswers(prev => {
//                             const merged = {
//                               ...(prev || {}),
//                               [INK_TOGGLE(fldKey)]: false,
//                               [INK_KEY(fldKey)]: undefined,
//                               [RECT_KEY(fldKey)]: undefined,
//                             };
//                             onAnswersChange?.(merged);
//                             return merged;
//                           });

//                           // form struktúra – flag vissza (immutábilisan)
//                           setFormState(prev => {
//                             if (!prev) return prev;
//                             const els = (prev.elements || []).slice();
//                             const idx = els.findIndex(e => e.id === el.id);
//                             if (idx > -1) {
//                               const curr = els[idx] as any;
//                               // nincs külön ink a specen, csak a flaget nullázzuk a UI-hoz
//                               els[idx] = { ...curr }; // no-op, csak rerender
//                             }
//                             return { ...prev, elements: els };
//                           });
//                         }}
//                       >×</button>

//                       <InlineInkCanvas
//                         key={`${formId}:${fldKey}`}
//                         value={inkValue}
//                         onChange={(data) => setVal(INK_KEY(fldKey), data)}
//                         initialRect={rect}
//                         emitInitialRect={false}
//                         onRectChange={(r)=>{
//                           const old = answers[INK_KEY(RECT_KEY(fldKey))] as {w:number;h:number} | undefined;
//                           if (!old || old.w !== r.w || old.h !== r.h) setVal(INK_KEY(RECT_KEY(fldKey)), r);
//                         }}
//                       />
//                     </div>
//                   ) : undefined}
//                 >
//                   <div className="field-wrap">
//                     {/* itt mindig TEXT-et használunk a problémamezőknél */}
//                     <input
//                       className="input auto-grow"
//                       style={inputStyle as React.CSSProperties}
//                       placeholder=""
//                       value={answers[fldKey] ?? value}
//                       onChange={(e) => {
//                         if (f) f.value = e.target.value; // instance-be is visszaírjuk
//                         setVal(fldKey, e.target.value);
//                       }}
//                     />

//                     {/* toll-ikon – ink toggle */}
//                     <button
//                       type="button"
//                       className="icon-inline"
//                       onClick={()=>{
//                         const next = !inkEnabled;
//                         setVal(INK_TOGGLE(fldKey), next);
//                         // opcionálisan formState-ben is jelezheted, ha szeretnéd
//                         setFormState(prev => prev ? structuredClone(prev) : prev);
//                       }}
//                       title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}
//                     >✎</button>
//                   </div>
//                 </FieldRow>
//               );
//             }

//             // NEM-probléma mezők: a korábbi „normál” input/select render
//             return (
//               <FieldRow key={spec.key} label={spec.label} className="no-border">
//                 <div style={{ display:'grid', gridTemplateColumns: spec.unit ? 'minmax(0,1fr) auto' : '1fr', alignItems:'center', gap:6, width:'100%' }}>
//                   {spec.input === 'select' ? (
//                     <select
//                       className="input"
//                       value={value}
//                       onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }}
//                       style={{ width:'100%' }}
//                     >
//                       <option value="" disabled>Válassz…</option>
//                       {(spec.options||[]).map(opt => <option key={opt} value={opt}>{opt}</option>)}
//                     </select>
//                   ) : (
//                     <input
//                       className="input"
//                       value={value}
//                       onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }}
//                       style={{ width:'100%' }}
//                     />
//                   )}
//                   {spec.unit && <span style={{ color:'#6b7280', fontSize:12, paddingLeft:6, whiteSpace:'nowrap' }}>{spec.unit}</span>}
//                 </div>
//               </FieldRow>
//             );
//           })}
//         </div>
//       )}

//             {i < (((el as any).instances || []).length - 1) && sep}
//           </div>
//         );
//       })}
//     </div>
//   );
// }


// if (el.type === 'module_machine_detail') {
//   const unitCell: React.CSSProperties = { color:'#6b7280', fontSize:12, paddingLeft:6, whiteSpace:'nowrap' };
//   const sep = <div style={{borderTop:'1px solid #e5e7eb', margin:'14px 0'}} />;
//   const noteBox: React.CSSProperties = { width:'100%', minHeight:36, lineHeight:'20px', boxSizing:'border-box', border:'1px solid var(--border)', borderRadius:8, padding:'8px 10px', background:'#fff' };
//   const supportsFieldSizing = typeof CSS !== 'undefined' && (CSS as any).supports?.('field-sizing','content');

//   return (
//     <div key={el.id} style={{ width:'100%' }}>
//       <div style={{ display:'flex', gap:8, marginBottom:12 }}>
//         <button className="btn" onClick={()=>{
//           const t: MachineType = MACHINE_TYPES[0];
//           const idx = nextIndexForType(el.instances, t);
//           const specs = DETAIL_TEMPLATES[t] || [];
//           el.instances = [...(el.instances||[]), { id:uuid(), title:`${t} ${idx}`, open:true, machineType:t, fields: specs.map(s=>({key:s.key,label:s.label})) }];
//           setFormState(prev=>prev?structuredClone(prev):prev);
//         }}>+ Gép hozzáadása</button>
//       </div>

//       {(el.instances || []).map((inst: any, i: number) => {
//         const specs = DETAIL_TEMPLATES[inst.machineType] || [];
//         if ((inst.fields?.length ?? 0) !== specs.length) {
//           inst.fields = specs.map((s:any)=>{
//             const old = (inst.fields||[]).find((f:any)=>f.key===s.key);
//             return { key:s.key, label:s.label, value: old?.value ?? '' };
//           });
//         }

//         const noteKey  = `md_note_${inst.id}`;
//         const filesKey = `md_files_${inst.id}`;
//         const inkEnabled = !!answers[INK_TOGGLE(noteKey)];
//         const inkValue   = answers[INK_KEY(noteKey)] as string | undefined;
//         const filesVal   = (answers[filesKey] || []) as FileItem[];

//         const getField = (k:string) => (inst.fields||[]).find((x:any)=>x.key===k);

//         return (
//           <div key={inst.id}>
//             {/* 1. sor: géptípus dropdown */}
//             <div style={{ marginBottom:8 }}>
//               <select
//                 className="input" style={{ width:260 }}
//                 value={inst.machineType}
//                 onChange={(e)=>{
//                   const newType = e.target.value as MachineType;
//                   const idx = nextIndexForType(el.instances?.filter((x:any)=>x.id!==inst.id), newType);
//                   inst.machineType = newType;
//                   inst.title = `${newType} ${idx}`;
//                   const newspecs = DETAIL_TEMPLATES[newType] || [];
//                   inst.fields = newspecs.map((s:any)=>({ key:s.key, label:s.label }));
//                   setFormState(prev=>prev?structuredClone(prev):prev);
//                 }}
//               >
//                 {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//               </select>
//             </div>

//             {/* 2. sor: balra Név, jobbra akciók */}
//             <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
//               <div className="small"><strong>Név:</strong> {inst.title}</div>
//               <div style={{ display:'flex', gap:8 }}>
//                 <button className="btn" onClick={()=>{ inst.open=!inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>
//                   {inst.open ? 'Bezár' : 'Kinyit'}
//                 </button>
//                 <button className="btn danger" onClick={()=>{
//                   el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id);
//                   setFormState(prev=>prev?structuredClone(prev):prev);
//                 }}>Törlés</button>
//               </div>
//             </div>

//             {/* LENYITHATÓ – kitöltés */}
//             {inst.open && (
//               <div style={{ display:'grid', gap:6, marginBottom:8 }}>
//                 {specs.map((spec:any)=>{
//                   const f = (inst.fields||[]).find((x:any)=>x.key===spec.key);
//                   const value = f?.value || '';
//                   return (
//                     // <FieldRow key={spec.key} label={spec.label} className="no-border">
//                     //   {spec.input==='select' ? (
//                     //     <select
//                     //       className="input" value={value}
//                     //       onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }}
//                     //     >
//                     //       <option value="" disabled>Válassz…</option>
//                     //       {(spec.options||[]).map((opt:string)=> <option key={opt} value={opt}>{opt}</option>)}
//                     //     </select>
//                     //   ) : (
//                     //     <input
//                     //       className="input" value={value}
//                     //       onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }}
//                     //     />
//                     //   )}
//                     //   {spec.unit && <span style={unitCell}>{spec.unit}</span>}
//                     // </FieldRow>
//                     <FieldRow key={spec.key} label={spec.label} className="no-border">
//   <div style={{ display:'grid', gridTemplateColumns: spec.unit ? 'minmax(0,1fr) auto' : '1fr', alignItems:'center', gap:6, width:'100%' }}>
//     {spec.input === 'select' ? (
//       <select
//         className="input"
//         value={value}
//         onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }}
//         style={{ width:'100%' }}
//       >
//         <option value="" disabled>Válassz…</option>
//         {(spec.options||[]).map((opt:string)=> <option key={opt} value={opt}>{opt}</option>)}
//       </select>
//     ) : (
//       <input
//         className="input"
//         value={value}
//         onChange={(e)=>{ if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }}
//         style={{ width:'100%' }}
//       />
//     )}
//     {spec.unit && (
//       <span style={{ color:'#6b7280', fontSize:12, paddingLeft:6, whiteSpace:'nowrap' }}>{spec.unit}</span>
//     )}
//   </div>
// </FieldRow>
//                   );
//                 })}
//               </div>
//             )}

//             {/* Megjegyzés + rajz (fix: ensureField + stabil get/set) */}
// {/* {(() => {
//   const noteKey = `md_note_${inst.id}`;
//   const inkEnabled = !!answers[INK_TOGGLE(noteKey)];
//   const inkValue   = answers[INK_KEY(noteKey)] as string | undefined;

//   // --- helpers (ugyanaz a minta, mint a simple-ben) ---
//   function getField(k: string){ return (inst.fields||[]).find((x:any)=>x.key===k) }
//   function ensureField(k: string){
//     if (!inst.fields) inst.fields = [];
//     let f = inst.fields.find((x:any)=>x.key===k);
//     if (!f) { f = { key:k, label:'__note__', value:'' }; inst.fields.push(f); }
//     return f;
//   }

//   const noteBox: React.CSSProperties = {
//     width:'100%', minHeight:36, lineHeight:'20px',
//     boxSizing:'border-box', border:'1px solid var(--border)', borderRadius:8,
//     padding:'8px 10px', background:'#fff'
//   };
//   const supportsFieldSizing =
//     typeof CSS !== 'undefined' && (CSS as any).supports?.('field-sizing','content');

//   return (
   
//     <div style={{ marginTop:12 }}>
//   <div className="small" style={{ color:'#6b7280', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
//     <span>Gépállapot általános leírása</span>
//     <button
//       type="button"
//       className="icon-inline"
//       title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}
//       onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}
//     >✎</button>
//   </div> */}

//   {/* SZÖVEG FELÜL – mindig textarea, hogy biztosan szerkeszthető legyen */}
//   {/* <textarea
//     className="input"
//     rows={1}
//     style={{ ...noteBox, ...( { ['fieldSizing' as any]:'content' } as any), overflow:'hidden', resize:'none', whiteSpace:'pre-wrap' }}
//     placeholder="A felmérést készítő saját véleménye…"
//     value={getField('__general_note__')?.value || ''}
//     onChange={(e)=>{
//       const n = ensureField('__general_note__');
//       n.value = e.target.value;
//       setFormState(prev=>prev?structuredClone(prev):prev);
//     }}
//   /> */}

//   {/* CANVAS ALATTA, teljes szélességben */}
//   {/* {inkEnabled && (
//     <div className="ink-box" style={{ position:'relative', marginTop:8 }}>
//       <button
//         type="button"
//         className="ink-clear-abs"
//         title="Komment törlése"
//         onClick={()=>{
//           setAnswers(prev => {
//             const merged = { ...(prev||{}) };
//             merged[INK_TOGGLE(noteKey)] = false;
//             merged[INK_KEY(noteKey)] = undefined;
//             onAnswersChange?.(merged);
//             return merged;
//           });
//         }}
//       >×</button>
//       <InlineInkCanvas
//         key={`${formId}:mdnote:${inst.id}`}
//         value={inkValue}
//         onChange={(data)=> setVal(INK_KEY(noteKey), data)}
//       />
//     </div>
//   )}
// </div>
//   );
// })()} */}
// <div style={{ marginTop:12 }}>
//   <div className="small" style={{ color:'#6b7280', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
//     <span>Gépállapot általános leírása</span>
//     <button
//       type="button"
//       className="icon-inline"
//       title={inkEnabled ? 'Komment elrejtése' : 'Komment hozzáadása'}
//       onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}
//     >✎</button>
//   </div>

//   {/* szöveg fent */}
//   {supportsFieldSizing ? (
//     <textarea
//       className="input"
//       rows={1}
//       style={{ ...noteBox, ...( { ['fieldSizing' as any]:'content' } as any), overflow:'hidden', resize:'none', whiteSpace:'pre-wrap' }}
//       placeholder="Írd ide a megjegyzést…"
//       value={getField('__simple_note__')?.value || ''}
//       onChange={(e)=>{
//         let n = getField('__simple_note__');
//         if (!n) { inst.fields.push({ key:'__simple_note__', label:'__note__', value:'' }); n = getField('__simple_note__'); }
//         if (n) n.value = e.target.value;
//         setFormState(prev=>prev?structuredClone(prev):prev);
//       }}
//     />
//   ) : (
//     <div
//       className="input"
//       contentEditable role="textbox" aria-multiline="true" suppressContentEditableWarning
//       style={{ ...noteBox, whiteSpace:'pre-wrap', wordBreak:'break-word', outline:'none' }}
//       onInput={(e)=>{
//         let n = getField('__simple_note__');
//         if (!n) { inst.fields.push({ key:'__simple_note__', label:'__note__', value:'' }); n = getField('__simple_note__'); }
//         if (n) n.value = (e.currentTarget.textContent ?? '');
//         setFormState(prev=>prev?structuredClone(prev):prev);
//       }}
//     >{getField('__simple_note__')?.value || ''}</div>
//   )}

//   {/* canvas ALATTA */}
//   {inkEnabled && (
//     <div className="ink-box" style={{ position:'relative', marginTop:8 }}>
//       <button
//         type="button"
//         className="ink-clear-abs"
//         title="Komment törlése"
//         onClick={()=>{
//           setAnswers(prev => {
//             const merged = { ...(prev||{}) };
//             merged[INK_TOGGLE(noteKey)] = false;
//             merged[INK_KEY(noteKey)] = undefined;
//             onAnswersChange?.(merged);
//             return merged;
//           });
//         }}
//       >×</button>
//       <InlineInkCanvas
//         key={`${formId}:msnote:${inst.id}`}
//         value={inkValue}
//         onChange={(data)=> setVal(INK_KEY(noteKey), data)}
//       />
//     </div>
//   )}
// </div>

//             {/* --- (2) Fotók helye – képfeltöltő (AnswerMap-ben tároljuk) --- */}
// {(() => {
//   const imgKey = `md_images_${inst.id}`;
//   const imgs = (answers[imgKey] as FileItem[]) || [];
//   return (
//     <div style={{ marginTop:10 }}>
//       <FieldRow label="Fotók helye" className="stacked">
//         <ImageUploaderWithInk
//           value={imgs}
//           onChange={(next)=> setVal(imgKey, next)}
//         />
//       </FieldRow>
//     </div>
//   );
// })()}

//             {/* elválasztó gépek között */}
//             {i < (el.instances?.length||0)-1 && sep}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

//           return null
//         })}
//       </div>
//     </A4Page>
//   )
// }




import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { loadAll, loadGlobals } from '../storage'
import { loadAnswersLocal, saveAnswersLocal, saveAllLocal } from '../storage'
import type { AnswerMap, FormData, Globals, FileItem, ModuleInstance } from '../types'
import { v4 as uuid } from 'uuid'
import InlineInkCanvas from '../components/InlineInkCanvas'
import A4Page from '../components/A4Page'
import FieldRow from '../components/FieldRow'
import { loadTemplateForTab } from '../storage/formsLib'

import { MACHINE_TYPES, MachineType, DETAIL_TEMPLATES, SimpleDetailInstance, 
         SYSTEM_TEMPLATE, TANK_TEMPLATE, SystemSurveyInstance, SystemSurveyElement, 
         SYSTEM_SECTIONS, ModuleField } from '../types'
import { EMPTY } from '../types'

import { ImageUploaderWithInk, FileUploader } from '../components/FormComponents'

const INK_KEY = (id: string) => `__ink__${id}`;
const INK_TOGGLE = (id: string) => `__ink_enabled__${id}`;
const RECT_KEY = (id:string)=> `${id}__rect`; 

const supportsFieldSizing = typeof CSS !== 'undefined' && (CSS as any).supports?.('field-sizing', 'content');

// --- EGYSÉGES DESIGN RENDSZER ---
export const formDesign = {
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    marginBottom: '16px',
    borderBottom: '1px solid #e5e7eb'
  },
  cardTitle: { fontSize: '15px', fontWeight: 600, color: '#111827' },
  cardTitleHighlight: { color: '#2563eb' },
  addBtn: {
    background: 'transparent', border: 'none', color: '#2563eb', fontSize: '14px',
    fontWeight: 500, cursor: 'pointer', padding: '8px 0', display: 'inline-flex',
    alignItems: 'center', gap: '4px', marginBottom: '8px'
  },
  btnSecondary: {
    backgroundColor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb',
    padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
  },
  btnDanger: {
    backgroundColor: '#ef4444', color: '#fff', border: 'none',
    padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer'
  },
  fieldGroup: { marginBottom: '16px' },
  label: {
    display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280',
    textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px'
  },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' as const,
    fontFamily: 'inherit', backgroundColor: '#fff', color: '#111827'
  },
  systemHeaderBar: {
    backgroundColor: '#f9fafb', padding: '10px 16px', margin: '-16px -16px 16px -16px',
    borderTopLeftRadius: '8px', borderTopRightRadius: '8px', borderBottom: '1px solid #e5e7eb',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  systemHeaderTitle: {
    fontSize: '12px', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' as const, letterSpacing: '0.5px'
  },
  systemSubTitle: {
    fontSize: '16px', fontWeight: 700, color: '#111827', borderLeft: '3px solid #2563eb',
    paddingLeft: '10px', margin: '16px 0 20px 0', display: 'flex', alignItems: 'center'
  }
};

const INK_GLOBAL_CSS = `
  .ink-box { position: relative; margin-top: 8px; width: 100%; min-height: 150px; box-sizing: border-box; }
  .ink-box > div { width: 100% !important; max-width: 100% !important; min-width: 100% !important; resize: vertical !important; overflow: hidden !important; }
`;

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

const empty = EMPTY;

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
      try { saveAnswersLocal(formId, merged); } catch {}
      onAnswersChange?.(merged);
      return merged;
    });
  }

  const setVal = (key: string, value: any) => {
    setAnswers(prev => {
      const merged = { ...(prev || {}), [key]: value };
      try { saveAnswersLocal(formId, merged); } catch {}
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
    if (!old || old.h !== r.h) setVal(rKey, r);
  };

  const elements = useMemo(()=>{
    if (!form) return []
    const arr = Array.isArray(form.elements) ? form.elements : []
    return [...arr].sort((a:any,b:any)=> ((a?.grid?.y ?? 0) - (b?.grid?.y ?? 0)) || ((a?.grid?.x ?? 0) - (b?.grid?.x ?? 0)))
  }, [form])

  if (!form) return null

  return (
    <>
      <style>{INK_GLOBAL_CSS}</style>
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
                    <div className="ink-box">
                      <button type="button" className="ink-clear-abs" title="Komment törlése" onClick={()=>{
                          setAnswers(prev => {
                            const merged = { ...prev, [INK_TOGGLE(el.id)]: false, [INK_KEY(el.id)]: undefined, [INK_KEY(RECT_KEY(el.id))]: undefined };
                            try { saveAnswersLocal(formId, merged); } catch {}
                            onAnswersChange?.(merged); return merged;
                          });
                          const els = (form.elements || []).slice();
                          const i = els.findIndex(e => e.id === el.id);
                          if (i > -1) { els[i] = { ...els[i], ink: { ...(els[i].ink || {}), enabled: false } }; setFormState({ ...form, elements: els }); }
                        }}>×</button>
                      <InlineInkCanvas key={`${formId}:${el.id}`} value={inkValue} onChange={(data) => setInk(el.id, data)} initialRect={getInkRect(baseKey)} emitInitialRect={false} onRectChange={(r) => setInkRect(baseKey, r)} />
                    </div>
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
                    <div className="ink-box">
                      <button type="button" className="ink-clear-abs" title="Komment törlése" onClick={()=>{
                          setAnswers(prev=>{
                            const merged = { ...prev, [INK_TOGGLE(noteKey)]: false, [INK_KEY(noteKey)]: undefined, [INK_KEY(RECT_KEY(noteKey))]: undefined };
                            try { saveAnswersLocal(formId, merged); } catch {}
                            onAnswersChange?.(merged); return merged;
                          })
                        }}>×</button>
                      <InlineInkCanvas key={`${formId}:comment:${el.id}`} value={answers[INK_KEY(noteKey)] as string} onChange={(d)=> setVal(INK_KEY(noteKey), d)} initialRect={getInkRect(noteKey)} emitInitialRect={false} onRectChange={(r) => setInkRect(noteKey, r)} />
                    </div>
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
              return (
                <FieldRow key={el.id} label={el.label} className="stacked" isLabel={!el.hideLabel}>
                  <div className="ink-panel">
                    {el.hideLabel && <div className="ink-title">{el.label}</div>}
                    <div className="ink-body">
                      <InlineInkCanvas key={`${formId}:${el.id}`} value={dataUrl} onChange={(d)=>setVal(el.id, d)} initialRect={getInkRect(baseKey)} emitInitialRect={false} onRectChange={(r)=> setInkRect(baseKey, r)} />
                    </div>
                  </div>
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
                      <div key={inst.id} style={formDesign.card}>
                        <div style={formDesign.cardHeader}>
                          <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
                          <div style={{ display:'flex', gap:8 }}>
                            <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
                            <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
                          </div>
                        </div>

                        {inst.open && (
                          <>
                            <div style={formDesign.fieldGroup}>
                              <label style={formDesign.label}>Gép típusa</label>
                              <select className="input" style={formDesign.input} value={inst.machineType} onChange={(e)=>{
                                  const newType = e.target.value as MachineType;
                                  inst.machineType = newType; inst.title = `${newType} ${nextIndexForType((el.instances||[]).filter((x:any)=>x.id!==inst.id), newType)}`;
                                  setFormState(prev=>prev?structuredClone(prev):prev);
                                }}>
                                {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            
                            <div style={formDesign.fieldGroup}>
                              <label style={formDesign.label}>Gyártó</label>
                              <input className="input" style={formDesign.input} value={getFieldVal('manufacturer')} onChange={(e)=>{ const f = (inst.fields||[]).find((x:any)=>x.key==='manufacturer'); if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                            </div>

                            <div style={formDesign.fieldGroup}>
                              <label style={formDesign.label}>Típus</label>
                              <input className="input" style={formDesign.input} value={getFieldVal('model')} onChange={(e)=>{ const f = (inst.fields||[]).find((x:any)=>x.key==='model'); if (f) f.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                            </div>

                            <div style={formDesign.fieldGroup}>
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
                                <div className="ink-box">
                                  <button type="button" className="ink-clear-abs" onClick={()=>{ setAnswers(prev => { const merged = { ...prev, [INK_TOGGLE(noteKey)]: false, [INK_KEY(noteKey)]: undefined, [INK_KEY(RECT_KEY(noteKey))]: undefined }; try { saveAnswersLocal(formId, merged); } catch {} onAnswersChange?.(merged); return merged; }); }}>×</button>
                                  <InlineInkCanvas key={`${formId}:msnote:${inst.id}`} value={answers[INK_KEY(noteKey)] as string} onChange={(data)=> setVal(INK_KEY(noteKey), data)} initialRect={getInkRect(noteKey)} emitInitialRect={false} onRectChange={(r) => setInkRect(noteKey, r)} />
                                </div>
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
                      <div key={inst.id} style={formDesign.card}>
                        <div style={formDesign.cardHeader}>
                          <div style={formDesign.cardTitle}>Név: <span style={formDesign.cardTitleHighlight}>{inst.title}</span></div>
                          <div style={{ display:'flex', gap:8 }}>
                            <button style={formDesign.btnSecondary} onClick={()=>{ inst.open=!inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
                            <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter((x:any)=>x.id!==inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>
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
                                  setFormState(prev=>prev?structuredClone(prev):prev);
                                }}>
                                {MACHINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>

                            {specs.map((spec:any)=>{
                              const f = (inst.fields||[]).find((x:any)=>x.key===spec.key);
                              return (
                                <div key={spec.key} style={formDesign.fieldGroup}>
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

                            <div style={formDesign.fieldGroup}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                                <label style={{...formDesign.label, marginBottom:0}}>Gépállapot általános leírása</label>
                                <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
                              </div>
                              <textarea className="input" rows={2} style={formDesign.input} placeholder="Írd ide a megjegyzést…" value={(inst.fields||[]).find((x:any)=>x.key==='__simple_note__')?.value || ''} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                              
                              {inkEnabled && (
                                <div className="ink-box">
                                  <button type="button" className="ink-clear-abs" onClick={()=>{ setAnswers(prev => { const merged = { ...prev, [INK_TOGGLE(noteKey)]: false, [INK_KEY(noteKey)]: undefined, [INK_KEY(RECT_KEY(noteKey))]: undefined }; try { saveAnswersLocal(formId, merged); } catch {} onAnswersChange?.(merged); return merged; }); }}>×</button>
                                  <InlineInkCanvas key={`${formId}:mdnote:${inst.id}`} value={answers[INK_KEY(noteKey)] as string} onChange={(data)=> setVal(INK_KEY(noteKey), data)} initialRect={getInkRect(noteKey)} emitInitialRect={false} onRectChange={(r) => setInkRect(noteKey, r)} />
                                </div>
                              )}
                            </div>

                            <div style={formDesign.fieldGroup}>
                               <label style={formDesign.label}>Fotók helye</label>
                               <ImageUploaderWithInk value={(answers[imgKey] as FileItem[]) || []} onChange={(next)=> setVal(imgKey, next)} />
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

                  {(el.instances || []).map((inst) => {
                    const noteKey  = `sys_note_${inst.id}`;
                    const inkEnabled = !!answers[INK_TOGGLE(noteKey)];

                    return (
                      <div key={inst.id} style={formDesign.card}>
                        <div style={formDesign.systemHeaderBar}>
                          <div style={formDesign.systemHeaderTitle}>BLOKK: {inst.index === 0 ? 'ÁLTALÁNOS (3.0–18.0)' : `RENDSZER ${inst.index} (3.${inst.index}–18.${inst.index})`}</div>
                          <div style={{ display:'flex', gap:8 }}>
                            <button style={formDesign.btnSecondary} onClick={()=>{ inst.open = !inst.open; setFormState(prev=>prev?structuredClone(prev):prev); }}>{inst.open ? 'Bezár' : 'Kinyit'}</button>
                            {inst.index !== 0 && <button style={formDesign.btnDanger} onClick={()=>{ el.instances = (el.instances||[]).filter(x => x.id !== inst.id); setFormState(prev=>prev?structuredClone(prev):prev); }}>Törlés</button>}
                          </div>
                        </div>

                        {inst.open && (
                          <div>
                            {SYSTEM_SECTIONS.map((sec) => {
                              const secNo = `${sec.code}.${inst.index}`;
                              return (
                                <div key={`${inst.id}:${sec.code}`}>
                                  <div style={formDesign.systemSubTitle}>{secNo} {sec.title}</div>
                                  {sec.fields.map((spec) => {
                                    const specKey = `${sec.code}_${spec.key}`;
                                    const mf = (inst.fields||[]).find(f => f.key === specKey);
                                    const isInkNote = (sec.code === 3 && spec.key.startsWith('prob_')) || spec.key === 'note' || spec.key.startsWith('note_') || spec.key === 'other';
                                    const fldKey = `sys_${inst.id}_${sec.code}_${spec.key}`;
                                    const rowInkEnabled = !!answers[INK_TOGGLE(fldKey)];

                                    return (
                                      <div key={specKey} style={formDesign.fieldGroup}>
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
                                          <div className="ink-box">
                                            <button type="button" className="ink-clear-abs" onClick={()=>{ setAnswers(prev => { const merged = { ...prev, [INK_TOGGLE(fldKey)]: false, [INK_KEY(fldKey)]: undefined, [INK_KEY(RECT_KEY(fldKey))]: undefined }; try { saveAnswersLocal(formId, merged); } catch {} onAnswersChange?.(merged); return merged; }); }}>×</button>
                                            <InlineInkCanvas key={`${formId}:${fldKey}`} value={answers[INK_KEY(fldKey)] as string} onChange={(data) => setVal(INK_KEY(fldKey), data)} initialRect={getInkRect(fldKey)} emitInitialRect={false} onRectChange={(r) => setInkRect(fldKey, r)} />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {sec.photoKey && (
                                    <div style={formDesign.fieldGroup}>
                                      <label style={formDesign.label}>Fotók helye</label>
                                      <ImageUploaderWithInk value={((answers[`${inst.id}:${sec.photoKey}`] as FileItem[]) ?? [])} onChange={(files: FileItem[]) => setVal(`${inst.id}:${sec.photoKey}`, files)} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            
                            <div style={formDesign.fieldGroup}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                                <label style={{...formDesign.label, marginBottom:0}}>Megjegyzés</label>
                                <button type="button" style={{background:'none', border:'none', cursor:'pointer'}} title="Rajz/Komment" onClick={()=> setVal(INK_TOGGLE(noteKey), !inkEnabled)}>✎</button>
                              </div>
                              <textarea className="input" rows={2} style={formDesign.input} placeholder="Írd ide a megjegyzést…" value={(inst.fields||[]).find((x:any)=>x.key==='__simple_note__')?.value || ''} onChange={(e)=>{ let n = (inst.fields||[]).find((x:any)=>x.key==='__simple_note__'); if (!n) { n = { key:'__simple_note__', label:'__note__', value:'' }; inst.fields.push(n); } n.value = e.target.value; setFormState(prev=>prev?structuredClone(prev):prev); }} />
                              
                              {inkEnabled && (
                                <div className="ink-box">
                                  <button type="button" className="ink-clear-abs" onClick={()=>{ setAnswers(prev => { const merged = { ...prev, [INK_TOGGLE(noteKey)]: false, [INK_KEY(noteKey)]: undefined, [INK_KEY(RECT_KEY(noteKey))]: undefined }; try { saveAnswersLocal(formId, merged); } catch {} onAnswersChange?.(merged); return merged; }); }}>×</button>
                                  <InlineInkCanvas key={`${formId}:sysnote:${inst.id}`} value={answers[INK_KEY(noteKey)] as string} onChange={(data)=> setVal(INK_KEY(noteKey), data)} initialRect={getInkRect(noteKey)} emitInitialRect={false} onRectChange={(r) => setInkRect(noteKey, r)} />
                                </div>
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
                      <div key={inst.id} style={formDesign.card}>
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
    </>
  )
}
