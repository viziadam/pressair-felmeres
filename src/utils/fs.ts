// import type { FormData, AnswerMap, GlobalInfo } from '../types'
// import { buildPdfs, type SurveySnapshot } from './pdf'

// export async function pickRootDir(): Promise<FileSystemDirectoryHandle> {
//   // @ts-ignore
//   const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
//     id: 'felmeres-root',
//     mode: 'readwrite'
//   })
//   return handle
// }

// export async function ensurePerms(dir: FileSystemDirectoryHandle, mode: 'read'|'readwrite'='readwrite'){
//   // @ts-ignore
//   const q = await (dir as any).queryPermission?.({ mode }) ?? 'granted'
//   if (q === 'granted') return
//   // @ts-ignore
//   const r = await (dir as any).requestPermission?.({ mode })
//   if (r !== 'granted') throw new Error('A mappa-engedély szükséges.')
// }

// export async function listCompanyFolders(root: FileSystemDirectoryHandle): Promise<string[]> {
//   const out: string[] = []
//   // @ts-ignore
//   for await (const [name, handle] of (root as any).entries?.() || []) {
//     if ((handle as any).kind === 'directory') out.push(name)
//   }
//   out.sort()
//   return out
// }

// function sanitize(name: string){
//   return name.replace(/[\\/:*?"<>|]+/g, '_').trim()
// }

// export async function saveSurveyToFolder(
//   root: FileSystemDirectoryHandle,
//   globals: GlobalInfo,
//   forms: FormData[],
//   answersMaps: Record<string, AnswerMap>
// ){
//   await ensurePerms(root, 'readwrite')

//   const folderName = sanitize(globals.companyName || 'Ismeretlen')
//   const companyDir = await root.getDirectoryHandle(folderName, { create: true })

//   // ⬇⬇⬇ ASYNC buildPdfs + Blob írás
//   const pdfs = await buildPdfs(globals, forms, answersMaps)
//   for (const [fname, u8] of Object.entries(pdfs)) {
//     const fileHandle = await companyDir.getFileHandle(fname, { create: true })
//     const ws = await fileHandle.createWritable()

//     // Uint8Array -> ArrayBuffer -> Blob (TS kompatibilis)
//     const ab: ArrayBuffer = (u8 as Uint8Array).buffer.slice(
//       (u8 as Uint8Array).byteOffset,
//       (u8 as Uint8Array).byteOffset + (u8 as Uint8Array).byteLength
//     ) as ArrayBuffer
//     const pdfBlob = new Blob([ab], { type: 'application/pdf' })

//     await ws.write(pdfBlob)
//     await ws.close()
//   }

//   // survey.json (globál + válaszok)
//   const snapshot: SurveySnapshot = {
//     globals,
//     answersMaps,
//     formIds: forms.map(f => f.meta.id),
//     savedAt: new Date().toISOString()
//   }
//   const jsonHandle = await companyDir.getFileHandle('survey.json', { create: true })
//   const js = await jsonHandle.createWritable()
//   await js.write(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }))
//   await js.close()
// }

// export async function loadSurveyFromFolder(
//   root: FileSystemDirectoryHandle,
//   companyFolderName: string
// ): Promise<SurveySnapshot | null> {
//   try {
//     const dir = await root.getDirectoryHandle(companyFolderName, { create: false })
//     const fh = await dir.getFileHandle('survey.json', { create: false })
//     const file = await fh.getFile()
//     const text = await file.text()
//     return JSON.parse(text) as SurveySnapshot
//   } catch {
//     return null
//   }
// }

// import type { FormData, AnswerMap, Globals } from '../types'
// import { buildPdfs } from './pdf'
// import { buildPdfsExact } from './pdfDom'

// // JSON snapshot a PDF-ek mellé
// export type SurveySnapshot = {
//   globals: Globals
//   answersMaps: Record<string, AnswerMap>
//   formIds: string[]
//   savedAt: string
// }

// // ====== Fájlrendszer helper-ek =================================
// export async function pickRootDir(): Promise<FileSystemDirectoryHandle> {
//   // @ts-ignore
//   const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
//     id: 'felmeres-root',
//     mode: 'readwrite'
//   })
//   return handle
// }

// export async function ensurePerms(
//   dir: FileSystemDirectoryHandle,
//   mode: 'read'|'readwrite' = 'readwrite'
// ){
//   // @ts-ignore
//   const q = await (dir as any).queryPermission?.({ mode }) ?? 'granted'
//   if (q === 'granted') return
//   // @ts-ignore
//   const r = await (dir as any).requestPermission?.({ mode })
//   if (r !== 'granted') throw new Error('A mappa-engedély szükséges.')
// }

// export async function listCompanyFolders(root: FileSystemDirectoryHandle): Promise<string[]> {
//   const out: string[] = []
//   // @ts-ignore
//   for await (const [name, handle] of (root as any).entries?.() || []) {
//     if ((handle as any).kind === 'directory') out.push(name)
//   }
//   out.sort()
//   return out
// }

// function sanitize(name: string){
//   return (name || '')
//     .replace(/[\\/:*?"<>|]+/g, '_')
//     .replace(/\s+/g, ' ')
//     .trim()
// }

// // ====== Mentés: PDF-ek + survey.json ===========================
// export async function saveSurveyToFolder(
//   root: FileSystemDirectoryHandle,
//   globals: Globals,
//   forms: FormData[],
//   answersMaps: Record<string, AnswerMap>
// ){
//   await ensurePerms(root, 'readwrite')

//   const folderName = sanitize(globals.companyName || 'Ismeretlen')
//   const companyDir = await root.getDirectoryHandle(folderName, { create: true })

//   // PDF-ek építése (UI-val megegyező rács + fix fejléc + Unicode font)
//   const pdfs = await buildPdfs(globals, forms, answersMaps)
//   // const pdfs = await buildPdfsExact(globals, forms, answersMaps);

//   for (const [fname, u8] of Object.entries(pdfs)) {
//     const safeName = sanitize(fname) || 'lap.pdf'
//     const fileHandle = await companyDir.getFileHandle(safeName, { create: true })
//     const ws = await fileHandle.createWritable()

//     const ab: ArrayBuffer = (u8 as Uint8Array).buffer.slice(
//       (u8 as Uint8Array).byteOffset,
//       (u8 as Uint8Array).byteOffset + (u8 as Uint8Array).byteLength
//     ) as ArrayBuffer
//     const pdfBlob = new Blob([ab], { type: 'application/pdf' })

//     await ws.write(pdfBlob)
//     await ws.close()
//   }

//   // survey.json
//   const snapshot: SurveySnapshot = {
//     globals,
//     answersMaps,
//     formIds: forms.map(f => f.meta.id),
//     savedAt: new Date().toISOString()
//   }
//   const jsonHandle = await companyDir.getFileHandle('survey.json', { create: true })
//   const js = await jsonHandle.createWritable()
//   await js.write(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }))
//   await js.close()
// }

// // ====== Betöltés: survey.json olvasás ==========================
// export async function loadSurveyFromFolder(
//   root: FileSystemDirectoryHandle,
//   companyFolderName: string
// ): Promise<SurveySnapshot | null> {
//   try {
//     const dir = await root.getDirectoryHandle(companyFolderName, { create: false })
//     const fh = await dir.getFileHandle('survey.json', { create: false })
//     const file = await fh.getFile()
//     const text = await file.text()
//     return JSON.parse(text) as SurveySnapshot
//   } catch {
//     return null
//   }
// }

// src/utils/fs.ts
import type { FormData, AnswerMap, Globals } from '../types'
//import { buildPdfs } from './pdf'
// import { buildPdfsExact } from './pdfDom'
import { buildPdfsVector } from './pdf_vector'
import { exportForms1to1 } from './pdf_1to1'   // ha használod az 1:1 exportot

// ===== TÍPUS =====
export type SurveySnapshot = {
  globals: Globals
  answersMaps: Record<string, AnswerMap>
  formIds: string[]
  savedAt: string
}

// ===== Segéd =====
export function sanitize(name: string){
  return (name || '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
}

function makeHeaderOnlyA4(globals: Globals, formName: string): HTMLElement {
  // A4 szélesség @96dpi ~ 794px; biztosítjuk az 'a4-page' osztályt, hogy a meglévő CSS érvényesüljön
  const host = document.createElement('div')
  host.className = 'a4-page'
  host.style.width = '794px'
  host.style.minHeight = '1123px'
  host.style.background = '#fff'
  host.style.color = '#111827'
  host.style.boxSizing = 'border-box'
  host.style.padding = '16px' // biztonsági padding, ha a CSS nincs betöltve

  // egyszerű, stabil header markup – nem üres, így a prune NEM tünteti el
  const header = document.createElement('div')
  header.className = 'page-header'
  header.style.display = 'grid'
  header.style.gridTemplateColumns = '64px 1fr'
  header.style.alignItems = 'center'
  header.style.gap = '12px'
  header.style.borderBottom = '1px solid #e5e7eb'
  header.style.paddingBottom = '12px'

  const logoBox = document.createElement('div')
  logoBox.style.width = '64px'
  logoBox.style.height = '64px'
  logoBox.style.border = '1px solid #e5e7eb'
  logoBox.style.display = 'flex'
  logoBox.style.alignItems = 'center'
  logoBox.style.justifyContent = 'center'
  logoBox.style.fontSize = '10px'
  logoBox.textContent = 'LOGÓ'

  // ha van logoDataUrl, tegyük bele
  const anyG: any = globals as any
  if (anyG?.logoDataUrl && /^data:image\//i.test(anyG.logoDataUrl)) {
    logoBox.textContent = ''
    const img = document.createElement('img')
    img.src = anyG.logoDataUrl
    img.alt = 'logo'
    img.style.maxWidth = '100%'
    img.style.maxHeight = '100%'
    img.style.display = 'block'
    logoBox.appendChild(img)
  }

  const right = document.createElement('div')
  const title = document.createElement('div')
  title.style.fontWeight = '700'
  title.style.fontSize = '18px'
  title.textContent = `${globals.companyName || 'Cégnév'} – ${formName || ''}`

  const meta = document.createElement('div')
  meta.className = 'small'
  meta.style.marginTop = '6px'
  meta.style.lineHeight = '1.4'
  meta.innerHTML = [
    anyG?.site ? `Telephely: <strong>${anyG.site}</strong>` : '',
    anyG?.contactName ? `Kapcsolattartó: <strong>${anyG.contactName}${anyG?.contactTitle ? ', '+anyG.contactTitle : ''}</strong>` : '',
    anyG?.phone ? `Tel: <strong>${anyG.phone}</strong>` : '',
    anyG?.email ? `Email: <strong>${anyG.email}</strong>` : '',
    anyG?.date ? `Dátum: <strong>${anyG.date}</strong>` : '',
    anyG?.inspectorName ? `Felmérő: <strong>${anyG.inspectorName}</strong>` : '',
  ].filter(Boolean).join(' • ')

  right.appendChild(title)
  right.appendChild(meta)

  header.appendChild(logoBox)
  header.appendChild(right)

  // üres tartalom-lista, de jelöljük "keep"-nek, hogy semmilyen prune CSS ne tüntesse el
  const list = document.createElement('div')
  list.className = 'list keep'
  list.style.minHeight = '40px'

  host.appendChild(header)
  host.appendChild(list)
  return host
}

// (Opcionális) autodetektálás: ha nem kaptunk minden formhoz DOM-gyökeret,
// megpróbáljuk összepárosítani a dokumentumban található .a4-page elemeket a forms sorrendjében.
function autoCollectDomRoots(
  forms: FormData[],
  given?: Record<string, HTMLElement | null>
): Record<string, HTMLElement | null> {
  const out: Record<string, HTMLElement | null> = { ...(given || {}) }
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('.a4-page'))
  forms.forEach((f, i) => {
    if (!out[f.meta.id]) out[f.meta.id] = nodes[i] || null
  })
  return out
}



// ===== Fájlrendszer helper-ek =====
export async function pickRootDir(): Promise<FileSystemDirectoryHandle> {
  // @ts-ignore
  const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
    id: 'felmeres-root',
    mode: 'readwrite'
  })
  return handle
}

export async function ensurePerms(
  dir: FileSystemDirectoryHandle,
  mode: 'read'|'readwrite' = 'readwrite'
){
  // @ts-ignore
  const q = await (dir as any).queryPermission?.({ mode }) ?? 'granted'
  if (q === 'granted') return
  // @ts-ignore
  const r = await (dir as any).requestPermission?.({ mode })
  if (r !== 'granted') throw new Error('A mappa-engedély szükséges.')
}

export async function listCompanyFolders(root: FileSystemDirectoryHandle): Promise<string[]> {
  const out: string[] = []
  // @ts-ignore
  for await (const [name, handle] of (root as any).entries?.() || []) {
    if ((handle as any).kind === 'directory') out.push(name)
  }
  out.sort()
  return out
}

// src/utils/fs.ts
export type ExportMode = 'visual' | 'vector'

// ===== Mentés: PDF-ek + survey.json =====
export async function saveSurveyToFolder(
  root: FileSystemDirectoryHandle,
  globals: Globals,
  forms: FormData[],
  answersMaps: Record<string, AnswerMap>,
  domByFormId?: Record<string, HTMLElement | null>,
  mode: ExportMode = 'visual'        // ⬅️ új: alapból vizuális (1:1)
){
  await ensurePerms(root, 'readwrite')
  const folderName = sanitize(globals.companyName || 'Ismeretlen')
  const companyDir = await root.getDirectoryHandle(folderName, { create: true })

  let pdfs: Record<string, Uint8Array>

  if (mode === 'visual') {
  pdfs = {}

  // 1) forrás DOM-ok összegyűjtése:
  //    - ha kaptunk domByFormId-t, azt használjuk
  //    - ha üres vagy nincs, akkor a dokumentumból szedjük össze a .a4-page elemeket
  let rootsById: Record<string, HTMLElement | null> = {}
  if (domByFormId && Object.keys(domByFormId).length > 0) {
    rootsById = domByFormId
  } else {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.a4-page'))
    // index szerinti párosítás: forms[i] ⇄ nodes[i]
    forms.forEach((f, i) => { rootsById[f.meta.id] = nodes[i] || null })
  }

  // 2) formonként 1-1 export (determinista fájlnév hozzárendelés)
  for (const f of forms) {
    const el = rootsById[f.meta.id] || null
    if (!el) {
      // nincs DOM ehhez a formhoz → nem exportáljuk, és NEM gyártunk semmit helyette
      console.warn('[saveSurveyToFolder] Hiányzó DOM ehhez a formhoz:', f.meta.name, f.meta.id)
      continue
    }

    const answers = answersMaps[f.meta.id] || {}
    const name = sanitize(f.meta.name || 'lap')

    // Mindig EGY job / form → 100%-os név ↔ buffer hozzárendelés
    const out = await exportForms1to1(
      [{ name: f.meta.name, el, form: f, answers }],
      { fontSizePx: 14, lineHeight: 1.45 }
    )

    // többféle visszatérési forma támogatása
    if (out instanceof Uint8Array) {
      pdfs[`${name}.pdf`] = out
    } else if (Array.isArray(out) && out[0] instanceof Uint8Array) {
      pdfs[`${name}.pdf`] = out[0] as Uint8Array
    } else if (out && typeof out === 'object') {
      const vals = Object.values(out as Record<string, Uint8Array>)
      if (vals[0] instanceof Uint8Array) {
        pdfs[`${name}.pdf`] = vals[0] as Uint8Array
      }
    }
  }

  // ha végül semmi nem készült, jelezzünk explicit hibát
  if (Object.keys(pdfs).length === 0) {
    throw new Error('Nincs exportálható form: nem találtunk .a4-page DOM-gyökereket.')
  }
} else {
  // VECTOR ág változatlan
  pdfs = await buildPdfsVector(globals, forms, answersMaps)
}


  // 4) fájlok kiírása
  for (const [fname, u8] of Object.entries(pdfs)) {
    const safeName = sanitize(fname) || 'lap.pdf'
    const fileHandle = await companyDir.getFileHandle(safeName, { create: true })
    const ws = await fileHandle.createWritable()

    const ab: ArrayBuffer = (u8 as Uint8Array).buffer.slice(
      (u8 as Uint8Array).byteOffset,
      (u8 as Uint8Array).byteOffset + (u8 as Uint8Array).byteLength
    ) as ArrayBuffer
    const pdfBlob = new Blob([ab], { type: 'application/pdf' })

    await ws.write(pdfBlob)
    await ws.close()
  }

  // 5) survey.json
  const snapshot: SurveySnapshot = {
    globals,
    answersMaps,
    formIds: forms.map(f => f.meta.id),
    savedAt: new Date().toISOString()
  }
  const jsonHandle = await companyDir.getFileHandle('survey.json', { create: true })
  const js = await jsonHandle.createWritable()
  await js.write(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }))
  await js.close()
}

// ===== Betöltés =====
export async function loadSurveyFromFolder(
  root: FileSystemDirectoryHandle,
  companyFolderName: string
): Promise<SurveySnapshot | null> {
  try {
    const dir = await root.getDirectoryHandle(companyFolderName, { create: false })
    const fh = await dir.getFileHandle('survey.json', { create: false })
    const file = await fh.getFile()
    const text = await file.text()
    return JSON.parse(text) as SurveySnapshot
  } catch {
    return null
  }
}