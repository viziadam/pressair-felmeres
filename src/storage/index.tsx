


import { v4 as uuid } from 'uuid'
import { SURVEY_TABS } from '../constants'
import { loadTemplateForTab } from './formsLib'
import { Globals, EMPTY } from '../types'

// ======================================================================
// TÍPUSOK
// ======================================================================

export type Completion = 'done' | 'progress' | 'empty'

export type SurveyState = {
  id: string
  globals: Globals
  // {
  //   companyName: string
  //   site: string
  //   phone: string
  //   email: string
  //   logoDataUrl?: string
  // }
  forms: any[]                    // FormData[]
  answers: Record<string, any>    // formId -> AnswerMap
  files?: Record<string, any>
  snapshots?: any[]
  updatedAt: string               // ISO datetime
}

export type SurveySummary = {
  id: string
  companyName: string
  updatedAt: string
  formCount: number
}

// ======================================================================
// KONSTANSOK + HELYI SEGÉDEK (egyszerűek, nem “core” réteg)
// ======================================================================

const KEY_ACTIVE = 'surveys/__active__'
const KEY_INDEX  = 'surveys/__index__'
const KEY_SURVEY = (id: string) => `surveys/${id}`

const API_BASE = '/api'

export function nowIso() { 
  return new Date().toISOString() 
}
function normName(s: string): string { return (s || '').trim().toLowerCase() }

function readIndex(): SurveySummary[] {
  try { return JSON.parse(localStorage.getItem(KEY_INDEX) || '[]') } catch { return [] }
}
function writeIndex(idx: SurveySummary[]) {
  localStorage.setItem(KEY_INDEX, JSON.stringify(idx))
}
export function readSurvey(id: string): SurveyState | null {
  const raw = localStorage.getItem(KEY_SURVEY(id))
  if (!raw) return null
  try { return JSON.parse(raw) as SurveyState } catch { return null }
}
function writeSurvey(s: SurveyState) {
  localStorage.setItem(KEY_SURVEY(s.id), JSON.stringify(s))
}

export function updateSurveyLocalOnly(id: string, patch: (cur: SurveyState) => SurveyState) {
  // Mindig a LEGFRISSEBB lokál példányon dolgozzunk (újraolvasás write előtt)
  const cur = readSurvey(id);
  if (!cur) return;
  const next = patch(structuredClone(cur));
  // Csak lokálba írunk, nincs háttér POST
  writeSurvey(next);
}

export function saveIndexLocal(idx: SurveySummary[]) {
  writeIndex(idx);
}

function findSurveyIdByCompanyName(name: string): string | null {
  const idx = readIndex()
  const n = normName(name)
  const hit = idx.find(it => normName(it.companyName) === n)
  return hit ? hit.id : null
}

export function getActiveSurveyId(): string | null {
  return localStorage.getItem(KEY_ACTIVE)
}
export function setActiveSurveyId(id: string | null) {
  if (id) localStorage.setItem(KEY_ACTIVE, id)
  else localStorage.removeItem(KEY_ACTIVE)
}

// Egyszerű fetch utilok (külön kérted, hogy legyenek)
async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { credentials: 'same-origin' })
    if (!r.ok) return null
    return await r.json() as T
  } catch { return null }
}
async function postJSON<T=any>(url: string, body: any): Promise<T | null> {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    })
    if (!r.ok) return null
    return await r.json() as T
  } catch { return null }
}
async function del(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method:'DELETE', credentials:'same-origin' })
    return r.ok
  } catch { return false }
}

// ======================================================================
/** Aktívon kívül mindent kidob lokálból (index + surveys/*), aktívot meghagyja. */
export function pruneLocalToActive() {
  const active = getActiveSurveyId()
  const idxRaw = localStorage.getItem(KEY_INDEX)
  const idx: SurveySummary[] = idxRaw ? JSON.parse(idxRaw) : []
  const nextIdx = active ? idx.filter(s => s.id === active) : []
  localStorage.setItem(KEY_INDEX, JSON.stringify(nextIdx))

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) || ''
    if (k.startsWith('surveys/')) {
      const isIndex = k === KEY_INDEX || k === KEY_ACTIVE
      const isActiveSurvey = active && k === KEY_SURVEY(active)
      if (!isIndex && !isActiveSurvey) {
        localStorage.removeItem(k)
        i = -1 // re-scan
      }
    }
  }
}

// ======================================================================
// MEGJELENÍTÉSHEZ SZÜKSÉGES SEGÉD: telítettség
// ======================================================================

export function computeCompletion(form: any, ans: Record<string, any>): Completion {
  const elements: any[] = Array.isArray(form?.elements) ? form.elements : []
  const fillable = elements.filter((el) => {
    const t = el?.type
    return t === 'text' || t === 'comment' || t === 'dropdown' ||
           t === 'file' || t === 'sketch' ||
           t === 'module_station' || t === 'module_compressor'
  })
  if (fillable.length === 0) return 'empty'

  let filled = 0
  for (const el of fillable) {
    const t = el?.type
    const key = String(el?.id ?? '')
    const v = ans?.[key]
    let has = false
    if (t === 'text' || t === 'comment' || t === 'dropdown') {
      has = typeof v === 'string' ? v.trim().length > 0 : !!v
    } else if (t === 'file') {
      has = Array.isArray(v) ? v.length > 0 : !!v
    } else if (t === 'sketch') {
      has = !!v
    } else if (t === 'module_station' || t === 'module_compressor') {
      const inst = Array.isArray(el?.instances) ? el.instances : []
      has = inst.length > 0 && inst.some((i: any) =>
        Array.isArray(i?.fields) && i.fields.some((f: any) => (f?.value ?? '').toString().trim().length > 0)
      )
    }
    if (has) filled++
  }

  if (filled === 0) return 'empty'
  if (filled === fillable.length) return 'done'
  return 'progress'
}

// ======================================================================
// INDEX/REFRESH (opcionális, de kértél “refreshIndex”-et is)
// ======================================================================

let latestServerIndex: SurveySummary[] = []

export async function refreshIndex(): Promise<SurveySummary[]> {
  const active = getActiveSurveyId()
  const idx = await (async () => {
    try {
      const r = await fetch(`${API_BASE}/surveys/index`, { credentials:'same-origin' })
      if (!r.ok) return [] as SurveySummary[]
      return (await r.json()) as SurveySummary[]
    } catch { return [] as SurveySummary[] }
  })()

  idx.sort((a,b)=> (b.updatedAt||'').localeCompare(a.updatedAt||''))  
  latestServerIndex = idx

  const onlyActive = active ? idx.filter(s => s.id === active) : []
  writeIndex(onlyActive)

  try { pruneLocalToActive() } catch {}

  return idx
}

// ======================================================================
// LISTA / CRUD (LOCAL az igazság, szerver tükrözés explicit híváskor)
// ======================================================================

export function listSurveys(): SurveySummary[] {
  const active = getActiveSurveyId()

  const immediate = (latestServerIndex.length
    ? latestServerIndex
    : readIndex().sort((a,b)=> (b.updatedAt||'').localeCompare(a.updatedAt||'')))

  // háttér frissítés szerverről
  getJSON<SurveySummary[]>(`${API_BASE}/surveys/index`).then(idx => {
    if (!idx) return
    idx.sort((a,b)=> (b.updatedAt||'').localeCompare(a.updatedAt||''))  
    latestServerIndex = idx

    const onlyActive = active ? idx.filter(s => s.id === active) : []
    writeIndex(onlyActive)
    try { pruneLocalToActive() } catch {}
  }).catch(()=>{})

  return immediate
}

export function loadSurvey(id: string): SurveyState | null {
  const cached = readSurvey(id)
  // háttérben frissítjük (csak cache-be ír)
  getJSON<SurveyState>(`${API_BASE}/surveys/${encodeURIComponent(id)}`).then(s=>{
    if (s) writeSurvey(s)
  })
  return cached
}

export function saveSurvey(id: string, next: SurveyState): void {
  // LOCAL azonnali írás
  next.updatedAt = nowIso()
  writeSurvey(next)

  console.log('surveyState: ', next);

  const idx = readIndex()
  const i = idx.findIndex(s => s.id === id)
  const item: SurveySummary = {
    id,
    companyName: next.globals?.companyName ,
    updatedAt: next.updatedAt,
    formCount: Array.isArray(next.forms) ? next.forms.length : 0
  }
  if (i >= 0) idx[i] = item
  else idx.push(item)
  writeIndex(idx)

  // szerver tükör (egész survey)
  postJSON(`${API_BASE}/surveys/${encodeURIComponent(id)}`, next).then(()=>{
    // opcionálisan frissíthetjük az index puffert is
    refreshIndex().catch(()=>{})
  })
}

export function saveSurveyLocal(id: string, next: SurveyState): void {
  // 1) timestamp + teljes survey lokális írása
  next.updatedAt = nowIso()
  writeSurvey(next)

  // 2) index frissítése lokálban
  const idx = readIndex()
  const i = idx.findIndex(s => s.id === id)
  const item: SurveySummary = {
    id,
    companyName: next.globals?.companyName,
    updatedAt: next.updatedAt,
    formCount: Array.isArray(next.forms) ? next.forms.length : 0,
  }
  if (i >= 0) idx[i] = item
  else idx.push(item)
  writeIndex(idx)

  // 3) NINCS szerver hívás
}

export function deleteSurvey(id: string): void {
  localStorage.removeItem(KEY_SURVEY(id))
  const idx = readIndex().filter(s => s.id !== id)
  writeIndex(idx)
  if (getActiveSurveyId() === id) setActiveSurveyId(null)

  del(`${API_BASE}/surveys/${encodeURIComponent(id)}`).then(()=>{
    refreshIndex().catch(()=>{})
  })
}

// ======================================================================
// CREATE SURVEY – SZINKRON + HÁTTÉR TEMPLATE SEED a LOCALBA (kért logika)
// ======================================================================

export function createSurvey(globals: SurveyState['globals']): SurveyState {
  const id = uuid()

  const seed: SurveyState = {
    id,
    globals: {
      companyName: globals.companyName || '',
      site: globals.site || '',
      contactName: globals.contactName || '',
      contactTitle: globals.contactTitle || '',
      phone: globals.phone || '',
      email: globals.email || '',
      date: globals.date || '',
      inspectorName: globals.inspectorName || '',
      logoDataUrl: globals.logoDataUrl
    },
    forms: [],      // itt még üres; SABLONOK háttérben érkeznek és LOCALBA íródnak
    answers: {},
    files: {},
    snapshots: [],
    updatedAt: nowIso()
  }

  writeSurvey(seed)
  const idx = readIndex()
  idx.push({
    id,
    companyName: seed.globals.companyName || 'Névtelen cég',
    updatedAt: seed.updatedAt,
    formCount: 0
  })
  writeIndex(idx)
  setActiveSurveyId(id)

  // HÁTTÉR: sablonok betöltése és LOCAL FRISSÍTÉS
  ;(async () => {
    try {
      const tabForms: any[] = []
      for (const tab of SURVEY_TABS as readonly string[]) {
        const tpl = await loadTemplateForTab(tab)
        if (tpl) {
          const f = structuredClone(tpl) as any
          f.meta = f.meta || {}
          f.meta.id = String(f.meta.id || crypto.randomUUID())
          f.meta.name = tab
          if (!Array.isArray(f.elements)) f.elements = []
          tabForms.push(f)
        } else {
          tabForms.push({ meta: { id: crypto.randomUUID(), name: tab }, elements: [] })
        }
      }

      // dupe-védelem id alapján
      const seen = new Set<string>()
      const dedup: any[] = []
      for (const f of tabForms) {
        const fid = String(f?.meta?.id || '')
        if (!fid || seen.has(fid)) continue
        seen.add(fid)
        dedup.push(f)
      }

      const cur = readSurvey(id)
      if (!cur) return
      const next: SurveyState = { ...cur, forms: dedup, updatedAt: nowIso() }
      writeSurvey(next)

      const idx2 = readIndex().map(s =>
        s.id === id ? { ...s, formCount: dedup.length, updatedAt: next.updatedAt } : s
      )
      writeIndex(idx2)

      // NINCS automatikus szerver POST itt (csak a Mentés gombnál)
      // ha akarnád: postJSON(`${API_BASE}/surveys/${id}/forms`, dedup)
    } catch (e) {
      // swallow – UI továbbra is működik, max template nélkül
      console.error('[createSurvey] template seeding failed', e)
    }
  })()

  return seed
}

// ======================================================================
// GLOBALS
// ======================================================================

export function loadGlobals(): SurveyState['globals'] {
  const id = getActiveSurveyId()
  if (!id) return EMPTY
  // { companyName:'', site:'', phone:'', email:'', logoDataUrl: undefined }
  const s = readSurvey(id)
  // háttérben pontosítás szerverről (cache-be ír)
  getJSON<SurveyState>(`${API_BASE}/surveys/${encodeURIComponent(id)}`).then(ns=>{
    if (ns) writeSurvey(ns)
  })
  return s?.globals ?? EMPTY
  // { companyName:'', site:'', phone:'', email:'', logoDataUrl: undefined }
}
export function saveGlobals(g: SurveyState['globals']) {
  const id = getActiveSurveyId()
  if (!id) return
  const s = readSurvey(id)
  if (!s) return

  const targetName = (g.companyName || '').trim()
  const conflictId = findSurveyIdByCompanyName(targetName)
  if (conflictId && conflictId !== id) throw new Error('DUPLICATE_COMPANY_NAME')

  s.globals = {
    companyName: targetName,
    site: g.site || '',
    contactName: g.contactName || '',
    contactTitle: g.contactTitle || '',
    phone: g.phone || '',
    email: g.email || '',
    date: g.date || '',
    inspectorName: g.inspectorName || '',
    logoDataUrl: g.logoDataUrl
  }
  saveSurvey(id, s) // lokális + szerver tükör a saveSurvey-en keresztül

  // jelzés a külön globals endpontra (opcionális)
  postJSON(`${API_BASE}/surveys/${encodeURIComponent(id)}/globals`, s.globals).then(()=>{})
}

// ======================================================================
// FORMS
// ======================================================================

export function loadAll(): any[] {
  const id = getActiveSurveyId()
  if (!id) return []
  const s = readSurvey(id)

  // háttér frissítés (csak cache-be ír)
  getJSON<any[]>(`${API_BASE}/surveys/${encodeURIComponent(id)}/forms`).then(fs=>{
    if (fs && s) {
      const merged: SurveyState = { ...s, forms: fs, updatedAt: nowIso() }
      writeSurvey(merged)
    }
  })
  return s?.forms ?? []
}
// export function saveAll(forms: any[]) {
//   const id = getActiveSurveyId()
//   if (!id) return
//   const s = readSurvey(id)
//   if (!s) return
//   s.forms = forms
//   saveSurvey(id, s) // lokális + szerver tükör

//   // postJSON(`${API_BASE}/surveys/${encodeURIComponent(id)}/forms`, forms).then(()=>{
//   //   refreshIndex().catch(()=>{})
//   // })
// }

export async function saveAll(forms: any[], answersMap: Record<string, any>, globals: Globals) {
  const id = getActiveSurveyId();
  if (!id) throw new Error("Nincs aktív felmérés.");

  // 1. Kiolvassuk a régit (hogy a files/snapshots megmaradjon, ha van)
  let s = readSurvey(id);
  if (!s) {
    s = {
      id,
      globals: EMPTY,
      forms: [],
      answers: {},
      files: {},
      snapshots: [],
      updatedAt: nowIso()
    };
  }

  // 2. FELÜLÍRJUK a paraméterben kapott, garantáltan friss React memóriából!
  s.forms = forms;
  s.answers = answersMap;
  s.globals = globals;
  s.updatedAt = nowIso();

  // 3. Megpróbáljuk elmenteni lokálisan (ha van még hely a böngészőben)
  try {
    writeSurvey(s);
    
    // Index frissítése
    const idx = readIndex();
    const i = idx.findIndex(x => x.id === id);
    const item: SurveySummary = {
      id,
      companyName: s.globals?.companyName || 'Névtelen cég',
      updatedAt: s.updatedAt,
      formCount: Array.isArray(s.forms) ? s.forms.length : 0
    };
    if (i >= 0) idx[i] = item;
    else idx.push(item);
    writeIndex(idx);
  } catch (e: any) {
    // Ha megtelt a LocalStorage, itt elkapjuk, de NEM állítjuk meg a futást!
    console.warn("Helyi mentés nem sikerült (talán betelt a tárhely), de a szerverre küldés folytatódik!", e);
  }

  // 4. KÜLDÉS A SZERVERRE a tökéletesen friss csomaggal
  const result = await postJSON(`${API_BASE}/surveys/${encodeURIComponent(id)}`, s);
  
  if (!result) {
    throw new Error("Szerver hiba történt a mentés során.");
  }
  
  // Opcionálisan frissítjük az indexet a szerverről
  refreshIndex().catch(()=>{});

  return result;
}
export function save(form: any) {
  const id = getActiveSurveyId()
  if (!id || !form) return
  const s = readSurvey(id)
  if (!s) return
  const forms = Array.isArray(s.forms) ? [...s.forms] : []
  const fid = String(form.meta?.id || '')
  const i = forms.findIndex((f: any) => String(f.meta?.id||'') === fid)
  if (i >= 0) forms[i] = form
  else forms.push(form)
  s.forms = forms
  saveSurvey(id, s)

  postJSON(`${API_BASE}/surveys/${encodeURIComponent(id)}/forms/${encodeURIComponent(fid)}`, form).then(()=>{
    refreshIndex().catch(()=>{})
  })
}

// ======================================================================
// ANSWERS
// ======================================================================

export function loadAnswers(formId: string): Record<string, any> {
  const id = getActiveSurveyId()
  if (!id) return {}
  const s = readSurvey(id)

  // háttér frissítés
  getJSON<Record<string, any>>(`${API_BASE}/surveys/${encodeURIComponent(id)}/answers/${encodeURIComponent(formId)}`).then(map=>{
    if (map && s) {
      const next: SurveyState = {
        ...s,
        answers: { ...(s.answers||{}), [formId]: map },
        updatedAt: nowIso()
      }
      writeSurvey(next)
    }
  })
  return (s?.answers?.[formId]) ?? {}
}

/** Ezt külön kérted: explicit async load egy form-hoz, cache-be írással. */
export async function loadAnswersAsync(formId: string): Promise<Record<string, any>> {
  const id = getActiveSurveyId()
  if (!id) return {}
  // lokál fallback
  let s = readSurvey(id)
  const local = (s?.answers?.[formId]) ?? {}

  const url = `${API_BASE}/surveys/${encodeURIComponent(id)}/answers/${encodeURIComponent(formId)}`
  try {
    const map = await getJSON<Record<string, any>>(url)
    if (map) {
      const isEmpty = Object.keys(map).length === 0
      if (!s) {
        const whole = await getJSON<SurveyState>(`${API_BASE}/surveys/${encodeURIComponent(id)}`)
        if (whole) { writeSurvey(whole); s = whole }
      }
      if (s) {
        const next: SurveyState = {
          ...s,
          answers: { ...(s.answers || {}), [formId]: (!isEmpty ? map : local) },
          updatedAt: nowIso()
        }
        writeSurvey(next)
      }
      return !isEmpty ? map : local
    }
  } catch {}
  return local
}

export function saveAnswers(formId: string, map: Record<string, any>) {
  const id = getActiveSurveyId()
  if (!id) return
  const s = readSurvey(id)
  if (!s) return
  s.answers = s.answers || {}
  s.answers[formId] = map
  saveSurvey(id, s)

  postJSON(`${API_BASE}/surveys/${encodeURIComponent(id)}/answers/${encodeURIComponent(formId)}`, map).then(()=>{
    refreshIndex().catch(()=>{})
  })
}

// KÜLÖN KÉRT (gépelés közbeni) LOKÁL ÍRÁSOK
// export function loadAnswersLocal(formId: string): Record<string, any> {
//   const id = getActiveSurveyId()
//   if (!id) return {}
//   const s = readSurvey(id)
//   return (s?.answers?.[formId]) ?? {}
// }

export function loadAnswersLocal(formId: string): Record<string, any> {
  const id = getActiveSurveyId()
  if (!id) {
    console.log('LOAD LOCAL → SKIP (no active survey id)', { formId })
    return {}
  }
  const s = readSurvey(id)
  const map = (s?.answers?.[formId]) ?? {}
  console.log('LOAD LOCAL', { formId, keys: Object.keys(map || {}).length })
  return map
}
// export function saveAnswersLocal(formId: string, map: Record<string, any>) {
//   const id = getActiveSurveyId()
//   if (!id) return
//   const s = readSurvey(id)
//   if (!s) return
//   s.answers = { ...(s.answers || {}), [formId]: map }
//   writeSurvey(s) // fontos: csak writeSurvey, ne post-oljunk háttérben
  
// }

// export function saveAnswersLocal(formId: string, map: Record<string, any>) {
//   const id = getActiveSurveyId();
//   if (!id) return;
//   updateSurveyLocalOnly(id, (cur) => ({
//     ...cur,
//     // mezőszintű merge: megőrizzük MINDEN más form answerjét
//     answers: { ...(cur.answers || {}), [formId]: map },
//     updatedAt: nowIso(),
//   }));
// }

export function saveAnswersLocal(formId: string, map: Record<string, any>) {
  const id = getActiveSurveyId()
  if (!id) {
    console.log('SAVE LOCAL → SKIP (no active survey id)', { formId })
    return
  }

  let s = readSurvey(id)
  if (!s) {
    // Védő inicializálás: ha még nincs survey entry, ne bukjon a mentés
    s = {
      id,
      globals: EMPTY,
      // { companyName:'', site:'', phone:'', email:'' },
      forms: [],
      answers: {},
      files: {},
      snapshots: [],
      updatedAt: new Date().toISOString(),
    }
    console.log('SAVE LOCAL → INIT SURVEY ENTRY', { id })
  }

  // Merge és írás
  s.answers = { ...(s.answers || {}), [formId]: map }
  try {
    s.answers = { ...(s.answers || {}), [formId]: structuredClone(map) }
    writeSurvey(structuredClone(s)) // biztos, ami biztos: teljes survey deep clone
    console.log('SAVE LOCAL → OK', { formId, keys: Object.keys(map || {}).length })
        } catch (e:any) {
      console.log('SAVE LOCAL → ERROR', { formId, error: String(e?.message || e) })
    }
}

// export function saveAllLocal(forms: any[]) {
//   const id = getActiveSurveyId()
//   if (!id) return
//   const s = readSurvey(id)
//   if (!s) return
//   s.forms = forms
//   writeSurvey(s)
// }

export function saveAllLocal(forms: any[]) {
  const id = getActiveSurveyId();
  if (!id) return;
  updateSurveyLocalOnly(id, (cur) => ({
    ...cur,
    // csak a forms frissül, answers/globals/files/snapshots érintetlen marad
    forms,
    updatedAt: nowIso(),
  }));
}

// ======================================================================
// “Strict” és “Bootstrap” – MEGMARAD, de egyszerűek (no-op/óvatos)
// ======================================================================

let __strictLocal = false
export function setStrictLocalMode(on: boolean) { __strictLocal = !!on }

/** Ha nincs értelmes lokál az aktívhoz, megpróbál betölteni szerverről és cache-be írni. */
export async function bootstrapActiveFromServer(): Promise<void> {
  const activeId = getActiveSurveyId()
  if (!activeId) return
  // van-e lokál értelmes adat?
  try {
    const s = readSurvey(activeId)
    const hasForms = Array.isArray(s?.forms) && s!.forms.length > 0
    const hasAnswers = s?.answers && Object.keys(s.answers).length > 0
    if (hasForms || hasAnswers) return
  } catch {}

  const srv = await getJSON<SurveyState>(`${API_BASE}/surveys/${encodeURIComponent(activeId)}`)
  if (srv && srv.id === activeId) {
    writeSurvey(srv)
    // indexbe is bekerül, ha kell
    const idx = readIndex()
    const i = idx.findIndex(x => x.id === activeId)
    const item: SurveySummary = {
      id: srv.id,
      companyName: srv.globals?.companyName || 'Névtelen cég',
      updatedAt: srv.updatedAt || nowIso(),
      formCount: Array.isArray(srv.forms) ? srv.forms.length : 0
    }
    if (i >= 0) idx[i] = item
    else idx.push(item)
    writeIndex(idx)
  }
}