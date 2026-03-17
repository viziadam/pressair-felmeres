
// import { jsPDF } from 'jspdf'
// import type {
//   FormData,
//   AnswerMap,
//   GlobalInfo,
//   ModuleElement,
//   FormElement,
//   FileItem,
// } from '../types'
// import fallbackLogoUrl from '../public/pressair_logo.png?url'

// type LogoAsset = { dataUrl: string; w: number; h: number }

// const INK_KEY = (id: string) => `__ink__${id}`

// // --- Oldal + rács (mm)
// const MM_PER_PX = 25.4 / 96 // képernyős px -> mm
// const PAGE = { L: 14, R: 14, TOP: 10, WIDTH: 210, HEIGHT: 297 }
// const CONTENT_W = PAGE.WIDTH - PAGE.L - PAGE.R

// // pdf.ts tetején (importok után)
// const imgSizeCache = new Map<string, { w: number, h: number }>()
// async function getImageSize(dataUrl: string): Promise<{ w: number, h: number }> {
//   if (imgSizeCache.has(dataUrl)) return imgSizeCache.get(dataUrl)!
//   const out = await new Promise<{ w:number,h:number }>(res => {
//     const im = new Image()
//     im.onload = () => res({ w: im.naturalWidth || im.width, h: im.naturalHeight || im.height })
//     im.onerror = () => res({ w: 1, h: 1 })
//     im.src = dataUrl
//   })
//   imgSizeCache.set(dataUrl, out)
//   return out
// }

// // -------------------- ÜRESSÉG ELLENŐRZÉS --------------------
// function isBlank(v: any) {
//   return v == null || (typeof v === 'string' && v.trim() === '')
// }
// function hasAnyFile(files?: FileItem[]) {
//   return Array.isArray(files) && files.length > 0
// }
// function hasAnyImage(files?: FileItem[]) {
//   return Array.isArray(files) && files.some(f =>
//     (!!f?.dataUrl && /^data:image\//i.test(f.dataUrl)) ||
//     (typeof f?.type === 'string' && f.type.startsWith('image/'))
//   )
// }

// // UI grid (px) -> mm; szükség esetén arányos zsugorítás
// function computeCols(hasInk: boolean) {
//   // képernyős rács: label 220px, gap 12px, ink 340px, value = maradék
//   let label = 220 * MM_PER_PX
//   let gap = 12 * MM_PER_PX
//   let ink = hasInk ? 340 * MM_PER_PX : 0
//   const gaps = hasInk ? 2 : 1

//   const MIN_VALUE = hasInk ? 40 : 70 // értelmezhető value oszlop
//   const fixed = label + gaps * gap + ink
//   if (fixed + MIN_VALUE > CONTENT_W) {
//     const scale = (CONTENT_W - MIN_VALUE) / fixed
//     label *= scale
//     gap *= scale
//     ink *= scale
//   }
//   const value = CONTENT_W - (label + gaps * gap + ink)
//   const xLabel = PAGE.L
//   const xValue = xLabel + label + gap
//   const xInk = hasInk ? xValue + value + gap : 0
//   return { xLabel, xValue, xInk, wLabel: label, wValue: value, wInk: ink, gap }
// }

// // -------------------- LOGÓ BETÖLTÉS (aránytartással) --------------------
// function isDataUrl(s?: string | null) {
//   return !!s && s.startsWith('data:image/')
// }

// // URL/dataURL → <img> → canvas → PNG dataURL + természetes méret
// async function loadImageAsPng(src: string): Promise<LogoAsset> {
//   const img = new Image()
//   img.crossOrigin = 'anonymous'
//   img.decoding = 'sync'
//   img.loading = 'eager'
//   return await new Promise<LogoAsset>((resolve, reject) => {
//     img.onload = () => {
//       try {
//         const canvas = document.createElement('canvas')
//         canvas.width = img.naturalWidth || img.width
//         canvas.height = img.naturalHeight || img.height
//         const ctx = canvas.getContext('2d')
//         if (!ctx) return reject(new Error('Canvas ctx missing'))
//         ctx.drawImage(img, 0, 0)
//         const dataUrl = canvas.toDataURL('image/png')
//         resolve({ dataUrl, w: canvas.width, h: canvas.height })
//       } catch (e) {
//         reject(e)
//       }
//     }
//     img.onerror = () => reject(new Error('Image load failed: ' + src))
//     img.src = src
//   })
// }

// // Logó feloldása: GlobalInfo.logoDataUrl → import fallback → /pressair_logo.png
// async function resolveLogo(g: GlobalInfo): Promise<LogoAsset | null> {
//   try {
//     const anyG = g as any
//     if (isDataUrl(anyG?.logoDataUrl)) {
//       return await loadImageAsPng(anyG.logoDataUrl)
//     }
//     if (typeof anyG?.logoDataUrl === 'string' && anyG.logoDataUrl) {
//       return await loadImageAsPng(anyG.logoDataUrl)
//     }
//     // import fallback (src/public/pressair_logo.png?url)
//     if (fallbackLogoUrl) {
//       try {
//         return await loadImageAsPng(fallbackLogoUrl)
//       } catch {}
//     }
//     // gyökér public fallback (/pressair_logo.png)
//     const base = (import.meta as any).env?.BASE_URL ?? '/'
//     const rootUrl = (base.endsWith('/') ? base : base + '/') + 'pressair_logo.png'
//     return await loadImageAsPng(rootUrl)
//   } catch {
//     return null
//   }
// }

// // Hasznos: képet „contain” módban egy dobozba (jsPDF tartja az arányt PNG-nél)
// function addImageContain(
//   doc: jsPDF,
//   dataUrl: string,
//   x: number,
//   y: number,
//   boxW: number,
//   boxH: number
// ) {
//   try {
//     doc.addImage(dataUrl, 'PNG', x, y, boxW, boxH)
//   } catch {}
// }

// // -------------------- HEADER --------------------
// function header(doc: jsPDF, g: GlobalInfo, name: string, logo: LogoAsset | null) {
//   const x = PAGE.L
//   const y = PAGE.TOP
//   const BOX_W = 60 // mm
//   const BOX_H = 22 // mm

//   if (logo) {
//     // aránytartó illesztés a BOX_W×BOX_H keretbe (vertikális középre igazítás)
//     const ratio = logo.w / logo.h
//     let w = BOX_W
//     let h = w / ratio
//     if (h > BOX_H) {
//       h = BOX_H
//       w = h * ratio
//     }
//     const yOff = y + (BOX_H - h) / 2
//     try {
//       doc.addImage(logo.dataUrl, 'PNG', x, yOff, w, h)
//     } catch {
//       doc.setDrawColor(180)
//       doc.rect(x, y, BOX_W, BOX_H, 'S')
//       doc.setFont('helvetica', 'normal')
//       doc.setFontSize(8)
//       doc.text('LOGÓ', x + BOX_W / 2, y + BOX_H / 2, {
//         align: 'center',
//         baseline: 'middle' as any,
//       })
//     }
//   } else {
//     doc.setDrawColor(180)
//     doc.rect(x, y, BOX_W, BOX_H, 'S')
//     doc.setFont('helvetica', 'normal')
//     doc.setFontSize(8)
//     doc.text('LOGÓ', x + BOX_W / 2, y + BOX_H / 2, {
//       align: 'center',
//       baseline: 'middle' as any,
//     })
//   }

//   // jobb oldali (jobbra igazított) szöveg blokk – mint az UI-ban
//   const xRight = PAGE.WIDTH - PAGE.R
//   const ty = y + 6
//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(14)
//   doc.text(`${g.companyName || 'Cégnév'} – ${name}`, xRight, ty, { align: 'right' })
//   doc.setFont('helvetica', 'normal')
//   doc.setFontSize(9)
//   doc.text(`Telephely: ${g.site || '-'}`, xRight, ty + 6, { align: 'right' })
//   doc.text(`Telefon: ${g.phone || '-'}`, xRight, ty + 10, { align: 'right' })
//   doc.text(`Email: ${g.email || '-'}`, xRight, ty + 14, { align: 'right' })

//   // 90% széles, középre igazított szürke separator a fejléc alá
//   const sepW = CONTENT_W * 0.9
//   const sepX = PAGE.L + (CONTENT_W - sepW) / 2
//   const sepY = y + BOX_H + 6
//   doc.setDrawColor(210)
//   doc.line(sepX, sepY, sepX + sepW, sepY)
// }

// // -------------------- SZÖVEG TÖRDELŐ --------------------
// function wrap(doc: jsPDF, text: string, maxW: number) {
//   return doc.splitTextToSize(text || '-', maxW)
// }
// function textH(lines: string[] | string, lineH = 5) {
//   return (Array.isArray(lines) ? lines.length : 1) * lineH
// }

// // -------------------- SOROK RENDER --------------------
// const INK_H = 38 // ≈ 140px a képernyőn

// function renderRow(
//   doc: jsPDF,
//   label: string,
//   value: string,
//   inkDataUrl: string | undefined,
//   y: number
// ) {
//   const hasInk = !!inkDataUrl
//   const { xLabel, xValue, xInk, wLabel, wValue, wInk } = computeCols(hasInk)

//   // Label
//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(10)
//   const lab = wrap(doc, label, wLabel)
//   doc.text(lab, xLabel, y + 4)

//   // Value
//   doc.setFont('helvetica', 'normal')
//   doc.setFontSize(10)
//   const val = wrap(doc, value, wValue)
//   doc.text(val, xValue, y + 4)

//   // Ink panel (ha van)
//   let inkH = 0
//   if (hasInk && inkDataUrl) {
//     doc.setDrawColor(210)
//     doc.rect(xInk, y, wInk, INK_H)
//     try {
//       doc.addImage(inkDataUrl, 'PNG', xInk + 2, y + 2, wInk - 4, INK_H - 4)
//     } catch {}
//     inkH = INK_H
//   }

//   // Sor magasság = max(label, value, ink) + padding
//   const rowH = Math.max(textH(lab), textH(val), inkH) + 10

//   // Alsó szeparátor – teljes szélességben
//   doc.setDrawColor(235)
//   doc.line(PAGE.L, y + rowH, PAGE.WIDTH - PAGE.R, y + rowH)

//   return y + rowH + 2
// }

// // Modul (állomás/kompresszor)
// // function renderModule(doc: jsPDF, el: ModuleElement, y: number) {
// //   doc.setFont('helvetica', 'bold')
// //   doc.setFontSize(11)
// //   doc.text(el.label, PAGE.L, y + 4)
// //   y += 8
// //   for (const inst of el.instances) {
// //     if (y > PAGE.HEIGHT - 40) {
// //       doc.addPage()
// //       y = PAGE.TOP + 20
// //     }
// //     doc.setFont('helvetica', 'bold')
// //     doc.setFontSize(10)
// //     doc.text(`• ${inst.title}`, PAGE.L, y + 4)
// //     y += 6
// //     doc.setFont('helvetica', 'normal')
// //     doc.setFontSize(9)
// //     for (const f of inst.fields) {
// //       const t = `${f.label}: ${f.value ?? '-'}`
// //       const lines = wrap(doc, t, CONTENT_W - 6)
// //       doc.text(lines, PAGE.L + 4, y + 4)
// //       y += textH(lines) + 2
// //     }
// //     doc.setDrawColor(235)
// //     doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
// //     y += 2
// //   }
// //   return y
// // }

// // pdf.ts – a többi renderX mellé
// async function renderImages(doc: jsPDF, el: FormElement, files: FileItem[], y: number) {
//   // label | value elrendezés (mint renderFile)
//   const labelW = 40
//   const gap = 4
//   const xLabel = PAGE.L
//   const xValue = xLabel + labelW + gap
//   const wValue = CONTENT_W - labelW - gap

//   // Címke
//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(10)
//   doc.text((el as any).label || 'Képek', xLabel, y + 4)

//   // Flow a value oszlopban: a saját px méretet követjük
//   let curX = xValue
//   let curY = y
//   let lineH = 0
//   const maxX = xValue + wValue

//   for (const f of files || []) {
//     const isImg = !!f?.dataUrl && (
//       /^data:image\//i.test(f.dataUrl) ||
//       (typeof f.type === 'string' && f.type.startsWith('image/'))
//     )
//     if (!isImg || !f.dataUrl) continue

//     // 1) px → mm
//     let wMm = (f.wPx ?? 240) * MM_PER_PX
//     let hMm: number
//     if (typeof f.hPx === 'number') {
//       hMm = f.hPx * MM_PER_PX
//     } else {
//       const { w, h } = await getImageSize(f.dataUrl)
//       hMm = w > 0 ? (wMm * h / w) : (wMm * 0.75)
//     }

//     // 2) value oszlop szélesség clamp
//     if (wMm > wValue) {
//       const s = wValue / wMm
//       wMm = wValue
//       hMm = hMm * s
//     }

//     // 3) sortörés, ha nem fér
//     if (curX + wMm > maxX) {
//       curX = xValue
//       curY += lineH + 2
//       lineH = 0
//     }

//     // 4) tényleges rajzolás
//     try {
//       doc.addImage(f.dataUrl, 'PNG', curX, curY, wMm, hMm)
//     } catch {
//       // fallback
//       doc.setDrawColor(210)
//       doc.rect(curX, curY, wMm, hMm)
//       doc.setFontSize(8)
//       const nameLines = doc.splitTextToSize(f.name || 'kép', wMm - 2)
//       doc.text(nameLines, curX + 1, curY + 5)
//     }

//     curX += wMm + 2
//     lineH = Math.max(lineH, hMm)
//   }

//   // következő blokk kezdete + szeparátor
//   y = Math.max(y + 10, curY + lineH) + 4
//   doc.setDrawColor(235)
//   doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
//   return y + 2
// }

// function renderModule(doc: jsPDF, el: ModuleElement, y: number) {
//   const label = (el as any)?.label ?? 'Modul'
//   const instances = Array.isArray((el as any)?.instances) ? (el as any).instances : []

//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(11)
//   doc.text(label, PAGE.L, y + 4)
//   y += 8

//   for (const inst of instances) {
//     if (y > PAGE.HEIGHT - 40) {
//       doc.addPage()
//       y = PAGE.TOP + 20
//     }
//     const title = inst?.title ?? '-'
//     const fields = Array.isArray(inst?.fields) ? inst.fields : []

//     doc.setFont('helvetica', 'bold')
//     doc.setFontSize(10)
//     doc.text(`• ${title}`, PAGE.L, y + 4)
//     y += 6

//     doc.setFont('helvetica', 'normal')
//     doc.setFontSize(9)
//     for (const f of fields) {
//       const t = `${f?.label ?? ''}: ${f?.value ?? '-'}`
//       const lines = wrap(doc, t, CONTENT_W - 6)
//       doc.text(lines, PAGE.L + 4, y + 4)
//       y += textH(lines) + 2
//     }

//     doc.setDrawColor(235)
//     doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
//     y += 2
//   }
//   return y
// }

// // -------------------- ÚJ: FILE + SKETCH RENDER --------------------
// function renderFile(doc: jsPDF, el: FormElement, files: FileItem[], y: number) {
//   // label | value (komment oszlop nélkül)
//   const labelW = 40
//   const gap = 4
//   const xLabel = PAGE.L
//   const xValue = xLabel + labelW + gap
//   const wValue = CONTENT_W - labelW - gap

//   // Label
//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(10)
//   doc.text((el as any).label || 'Csatolmányok', xLabel, y + 4)

//   // Value: előnézet rács
//   const TH_W = 30
//   const TH_H = 22
//   const GAP = 2
//   let curX = xValue
//   let curY = y
//   const maxX = xValue + wValue

//   doc.setFont('helvetica', 'normal')
//   doc.setFontSize(9)

//   // if (!files || files.length === 0) {
//   //   doc.text('-', xValue, y + 4)
//   //   y += 10
//   // } else {
//   //   for (const f of files) {
//   //     if (curX + TH_W > maxX) {
//   //       curX = xValue
//   //       curY += TH_H + GAP
//   //     }
//   //     doc.setDrawColor(210)
//   //     doc.rect(curX, curY, TH_W, TH_H)

//   //     if (f.dataUrl && f.type?.startsWith('image/')) {
//   //       addImageContain(doc, f.dataUrl, curX + 1, curY + 1, TH_W - 2, TH_H - 2)
//   //     } else {
//   //       doc.text('📄', curX + 2, curY + 7)
//   //       const nameLines = doc.splitTextToSize(f.name || 'fájl', TH_W - 4)
//   //       doc.text(nameLines, curX + 2, curY + 12)
//   //     }
//   //     curX += TH_W + GAP
//   //   }
//   //   y = Math.max(y + 10, curY + TH_H) + 4
//   // }

//   if (!files || files.length === 0) {
//   doc.text('-', xValue, y + 4)
//   y += 10
// } else {
//   for (const f of files) {
//     if (curX + TH_W > maxX) { curX = xValue; curY += TH_H + GAP; }

//     doc.setDrawColor(210)
//     doc.rect(curX, curY, TH_W, TH_H)

//     const isImage =
//       (typeof f.dataUrl === 'string' && /^data:image\//i.test(f.dataUrl)) ||
//       (typeof f.type === 'string' && f.type.startsWith('image/'))

//     if (isImage && f.dataUrl) {
//       addImageContain(doc, f.dataUrl, curX + 1, curY + 1, TH_W - 2, TH_H - 2)
//     } else {
//       // egyszeru fallback
//       // (ha az emoji gond, sima szöveg legyen itt)
//       doc.setFontSize(8)
//       const nameLines = doc.splitTextToSize(f.name || 'fájl', TH_W - 4)
//       doc.text(nameLines, curX + 2, curY + 6)
//     }

//     curX += TH_W + GAP
//   }
//   y = Math.max(y + 10, curY + TH_H) + 4
// }

//   // szeparátor
//   doc.setDrawColor(235)
//   doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
//   return y + 2
// }

// function renderSketch(doc: jsPDF, el: FormElement, dataUrl: string | undefined, y: number) {
//   // label | value (komment oszlop nélkül)
//   const labelW = 40
//   const gap = 4
//   const xLabel = PAGE.L
//   const xValue = xLabel + labelW + gap
//   const wValue = CONTENT_W - labelW - gap

//   // Label
//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(10)
//   doc.text((el as any).label || 'Szabadkézi rajz', xLabel, y + 4)

//   // Rajzkeret + tartalom
//   const H = 50 // nagyobb panel a PDF-ben
//   doc.setDrawColor(210)
//   doc.rect(xValue, y, wValue, H)
//   if (dataUrl) {
//     addImageContain(doc, dataUrl, xValue + 2, y + 2, wValue - 4, H - 4)
//   }

//   // szeparátor
//   y += H + 6
//   doc.setDrawColor(235)
//   doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
//   return y + 2
// }

// // -------------------- FŐ: PDF ÉPÍTÉS --------------------
// export async function buildPdfs(
//   g: GlobalInfo,
//   forms: FormData[],
//   answersMaps: Record<string, AnswerMap>
// ): Promise<Record<string, Uint8Array>> {
//   const out: Record<string, Uint8Array> = {}
//   const logoAsset = await resolveLogo(g)

//   for (const form of forms) {
//     const doc = new jsPDF({ unit: 'mm', format: 'a4' })
//     header(doc, g, form.meta.name, logoAsset)
//     let y = PAGE.TOP + 32 // fejléc után

//     // UI sorrend (grid y,x szerint)
//     const items = [...form.elements].sort(
//       (a, b) => a.grid.y - b.grid.y || a.grid.x - b.grid.x
//     )
//     const ans = answersMaps[form.meta.id] || {}

//     for (const el of items) {
//       if (y > PAGE.HEIGHT - 40) {
//         doc.addPage()
//         header(doc, g, form.meta.name, logoAsset)
//         y = PAGE.TOP + 32
//       }

//       // --- ÚJ TÍPUSOK ---
//       // if ((el as any).type === 'file') {
//       //   const files = (ans[el.id] as FileItem[]) || []
//       //   y = renderFile(doc, el, files, y)
//       //   continue
//       // }
//       // --- ÚJ TÍPUSOK ---
//       // IMAGES (képgaléria) – csak ha tényleges kép van
// if ((el as any).type === 'images') {
//   const files = (ans[el.id] as FileItem[]) || []
//   if (!hasAnyImage(files)) continue
//   // ha van renderImages (px→mm követés):
//   y = await renderImages(doc, el, files, y)
//   continue
// }

// // FILE – csak ha van feltöltött elem
// if ((el as any).type === 'file') {
//   const files = (ans[el.id] as FileItem[]) || []
//   if (!hasAnyFile(files)) continue
//   y = renderFile(doc, el, files, y)
//   continue
// }

// // SKETCH – csak ha van rajz
// if ((el as any).type === 'sketch') {
//   const dataUrl = ans[el.id] as string | undefined
//   if (!dataUrl) continue
//   y = renderSketch(doc, el, dataUrl, y)
//   continue
// }

// // COMMENT – rajz jellegű komment: csak ha van tartalom
// if ((el as any).type === 'comment') {
//   const dataUrl = ans[el.id] as string | undefined
//   if (!dataUrl) continue
//   y = renderSketch(doc, el, dataUrl, y)
//   continue
// }

//       // // --- Egyszerű mezők (label | value | [ink]) ---
//       // if ((el as any).type === 'text' || (el as any).type === 'comment' || (el as any).type === 'dropdown') {
//       //   const val = String(ans[el.id] ?? '')
//       //   const ink = ans[INK_KEY(el.id)] as string | undefined
//       //   y = renderRow(doc, (el as any).label, val, (el as any).ink?.enabled ? ink : undefined, y)
//       //   continue
//       // }

//       // Egyszerű mezők (text | dropdown) – csak ha van érték VAGY van ink-tartalom
// if ((el as any).type === 'text' || (el as any).type === 'dropdown') {
//   const val = String(ans[el.id] ?? '')
//   const ink = ans[INK_KEY(el.id)] as string | undefined
//   const hasInk = !!((el as any).ink?.enabled && ink)
//   if (isBlank(val) && !hasInk) continue
//   y = renderRow(doc, (el as any).label, val, hasInk ? ink : undefined, y)
//   continue
// }

// // Modulok – csak ha van legalább egy NEM üres instance (bármely mezője kitöltött)
// if ((el as any).type === 'module_station' || (el as any).type === 'module_compressor' || (el as any).type === 'module') {
//   const inst = Array.isArray((el as any).instances) ? (el as any).instances : []
//   const filtered = inst.filter((ins: any) => {
//     const fields = Array.isArray(ins?.fields) ? ins.fields : []
//     return fields.some((f: any) => !isBlank(f?.value))
//   })
//   if (filtered.length === 0) continue
//   const el2 = { ...(el as any), instances: filtered } as ModuleElement
//   y = renderModule(doc, el2, y)
//   continue
// }

//       // --- Modulok ---
//       y = renderModule(doc, el as ModuleElement, y)
//     }

//     const ab = doc.output('arraybuffer')
//     out[`${form.meta.name}.pdf`] = new Uint8Array(ab)
//   }

//   return out
// }

// // fs.ts használja
export type SurveySnapshot = {
  globals: GlobalInfo
  answersMaps: Record<string, AnswerMap>
  formIds: string[]
  savedAt: string
}


// src/utils/pdf.ts
import { jsPDF } from 'jspdf'
import type {
  FormData,
  AnswerMap,
  Globals as GlobalInfo,
  ModuleElement,
  FormElement,
  FileItem,
} from '../types'

/** ===== Segédek / konstansok ===== */
const INK_KEY = (id: string) => `__ink__${id}`
const RECT_KEY = (id: string) => `${id}__rect`

const MM_PER_PX = 25.4 / 96 // képernyős px -> mm (96dpi)
const PAGE = { L: 14, R: 14, TOP: 10, WIDTH: 210, HEIGHT: 297 }
const CONTENT_W = PAGE.WIDTH - PAGE.L - PAGE.R

// Egységes wrap
function wrap(doc: jsPDF, text: string, maxW: number) {
  return doc.splitTextToSize(text || '-', maxW)
}
function textH(lines: string[] | string, lineH = 5) {
  return (Array.isArray(lines) ? lines.length : 1) * lineH
}
function isBlank(v: any) { return v == null || (typeof v === 'string' && v.trim() === '') }
function hasAnyFile(files?: FileItem[]) { return Array.isArray(files) && files.length > 0 }
function hasAnyImage(files?: FileItem[]) {
  return Array.isArray(files) && files.some(f =>
    (!!f?.dataUrl && /^data:image\//i.test(f.dataUrl)) ||
    (typeof f?.type === 'string' && f.type.startsWith('image/'))
  )
}
function isDataUrl(s?: string | null) { return !!s && s.startsWith('data:image/') }

// A Filler több formában is tárolhatja az ink rect-et – próbáljunk minden kulcsot
function readInkRectPx(ans: Record<string, any>, elId: string): { w:number; h:number } | undefined {
  const k1 = `${INK_KEY(elId)}__rect` // "__ink__<id>__rect"
  const k2 = RECT_KEY(INK_KEY(elId))  // ugyanaz a string, de legyünk robusztusak
  const k3 = RECT_KEY(elId)           // "<id>__rect" (comment/sketch variáns)
  return (ans[k1] || ans[k2] || ans[k3]) as { w:number; h:number } | undefined
}

/** ===== Képméret cache (adat URL esetén) ===== */
const imgSizeCache = new Map<string, { w: number; h: number }>()
async function getImageSize(dataUrl: string): Promise<{ w: number, h: number }> {
  if (imgSizeCache.has(dataUrl)) return imgSizeCache.get(dataUrl)!
  const out = await new Promise<{ w:number,h:number }>(res => {
    const im = new Image()
    im.onload = () => res({ w: im.naturalWidth || im.width, h: im.naturalHeight || im.height })
    im.onerror = () => res({ w: 1, h: 1 })
    im.src = dataUrl
  })
  imgSizeCache.set(dataUrl, out)
  return out
}

/** ===== Logó betöltés ===== */
type LogoAsset = { dataUrl: string; w: number; h: number }

async function loadImageAsPng(src: string): Promise<LogoAsset> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.decoding = 'sync'
  img.loading = 'eager'
  return await new Promise<LogoAsset>((resolve, reject) => {
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas ctx missing'))
        ctx.drawImage(img, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        resolve({ dataUrl, w: canvas.width, h: canvas.height })
      } catch (e) { reject(e) }
    }
    img.onerror = () => reject(new Error('Image load failed: ' + src))
    img.src = src
  })
}

async function resolveLogo(g: GlobalInfo): Promise<LogoAsset | null> {
  try {
    const anyG = g as any
    if (isDataUrl(anyG?.logoDataUrl)) return await loadImageAsPng(anyG.logoDataUrl)
    if (typeof anyG?.logoDataUrl === 'string' && anyG.logoDataUrl) {
      return await loadImageAsPng(anyG.logoDataUrl)
    }
    // Public fallback (Vite/CRA a /public tartalmat gyökérre másolja)
    return await loadImageAsPng('/pressair_logo.png')
  } catch { return null }
}

/** ===== UI rács (px -> mm) ===== */
function computeCols(hasInk: boolean) {
  // képernyős rács: label 220px, gap 12px, ink 340px, value = maradék
  let label = 220 * MM_PER_PX
  let gap = 12 * MM_PER_PX
  let ink = hasInk ? 340 * MM_PER_PX : 0

  const MIN_VALUE = hasInk ? 40 : 70
  const fixed = label + gap + (hasInk ? gap + ink : 0)
  if (fixed + MIN_VALUE > CONTENT_W) {
    const scale = (CONTENT_W - MIN_VALUE) / fixed
    label *= scale; gap *= scale; ink *= scale
  }
  const value = CONTENT_W - (label + gap + (hasInk ? gap + ink : 0))
  const xLabel = PAGE.L
  const xValue = xLabel + label + gap
  const xInk   = hasInk ? xValue + value + gap : 0
  return { xLabel, xValue, xInk, wLabel: label, wValue: value, wInk: ink, gap }
}

/** ===== Header ===== */
function header(doc: jsPDF, g: GlobalInfo, name: string, logo: LogoAsset | null) {
  const x = PAGE.L
  const y = PAGE.TOP
  const BOX_H = 28
  const BOX_W = BOX_H
  const rightX = PAGE.WIDTH - PAGE.R

  // Bal: logó-keret
  doc.setDrawColor(229)
  doc.rect(x, y, BOX_W, BOX_H)
  if (logo) {
    const r = logo.w / logo.h
    let w = BOX_W, h = w / r
    if (h > BOX_H) { h = BOX_H; w = h * r }
    const yOff = y + (BOX_H - h) / 2
    const xOff = x + (BOX_W - w) / 2
    try { doc.addImage(logo.dataUrl, 'PNG', xOff, yOff, w, h) } catch {}
  } else {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    doc.text('LOGÓ', x + BOX_W/2, y + BOX_H/2, { align:'center', baseline:'middle' as any })
  }

  // Cím
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(0)
  doc.text(`${g.companyName || 'Cégnév'} – ${name || ''}`, rightX, y + 6, { align: 'right' })

  // Jobb oldali kártya
  const cardX = rightX - 90
  const cardY = y + 9
  const cardW = 90
  const pad = 3
  doc.setDrawColor(229); doc.setFillColor(250, 250, 250)   // <- számok, nem stringek
  doc.rect(cardX, cardY, cardW, BOX_H - 9, 'FD')

  const rows: Array<[string,string]> = [
    ['Telephely', (g as any).site || '-'],
    ['Kapcsolattartó', [ (g as any).contactName, (g as any).contactTitle ].filter(Boolean).join(', ') || '-' ],
    ['Telefonszám', (g as any).phone || '-'],
    ['Email', (g as any).email || '-'],
    ['Dátum', (g as any).date || '-'],
    ['Felmérő', (g as any).inspectorName || '-'],
  ]
  let ry = cardY + pad + 3
  for (const [lab, val] of rows) {
    doc.setFont('helvetica','normal'); doc.setTextColor(107); doc.setFontSize(9)
    doc.text(lab, cardX + pad, ry)
    doc.setFont('helvetica','bold'); doc.setTextColor(0)
    const labelW = 32
    const valueX = cardX + pad + labelW + 2
    const valueW = cardW - pad*2 - labelW - 2
    const lines = doc.splitTextToSize(val || '-', valueW)
    doc.text(lines, valueX, ry)
    ry += Math.max(5, textH(lines, 4.5)) + 1.5
  }

  doc.setDrawColor(210)
  doc.line(PAGE.L, y + BOX_H + 6, PAGE.WIDTH - PAGE.R, y + BOX_H + 6)
}

/** ===== Sorok render ===== */
function renderTitle(doc: jsPDF, text: string, y: number) {
  doc.setFont('helvetica','bold'); doc.setFontSize(12)
  doc.text(text || '', PAGE.L, y + 5)
  y += 10
  doc.setDrawColor(235); doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
  return y + 2
}

function renderNoteText(doc: jsPDF, label: string, value: string, y: number) {
  doc.setFont('helvetica','bold'); doc.setFontSize(10)
  doc.text(label, PAGE.L, y + 4)
  y += 6
  doc.setFont('helvetica','normal'); doc.setFontSize(10)
  const lines = doc.splitTextToSize(value || '-', CONTENT_W)
  doc.text(lines, PAGE.L, y + 4)
  y += textH(lines) + 8
  doc.setDrawColor(235); doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
  return y + 2
}

function renderDropdownMulti(doc: jsPDF, label: string, values: string[], y: number) {
  doc.setFont('helvetica','bold'); doc.setFontSize(10)
  doc.text(label, PAGE.L, y + 4)
  y += 6
  doc.setFont('helvetica','normal'); doc.setFontSize(9)
  const CHIP_H = 6, PAD_X = 2, GAP = 2
  let x = PAGE.L, curY = y
  if (!values || values.length === 0) {
    doc.text('-', PAGE.L, y + 4)
    y += 10
  } else {
    for (const v of values) {
      const w = doc.getTextWidth(v) + PAD_X*2 + 2
      if (x + w > PAGE.L + CONTENT_W) { x = PAGE.L; curY += CHIP_H + GAP }
      doc.setDrawColor(210); doc.rect(x, curY, w, CHIP_H, 'S')
      doc.text(v, x + PAD_X + 1, curY + 4)
      x += w + GAP
    }
    y = curY + CHIP_H + 6
  }
  doc.setDrawColor(235); doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
  return y + 2
}

function renderRow(
  doc: jsPDF,
  label: string,
  value: string,
  inkDataUrl: string | undefined,
  inkRectPx: { w:number; h:number } | undefined,
  y: number
) {
  const hasInk = !!inkDataUrl
  const { xLabel, xValue, xInk, wLabel, wValue, wInk } = computeCols(hasInk)

  // Label
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  const lab = wrap(doc, label, wLabel); doc.text(lab, xLabel, y + 4)

  // Value
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  const val = wrap(doc, value, wValue); doc.text(val, xValue, y + 4)

  // Ink panel (mentett px arány alapján)
  let inkH = 0
  if (hasInk && inkDataUrl) {
    const rw = (inkRectPx?.w ?? 140) * MM_PER_PX
    const rh = (inkRectPx?.h ?? 140) * MM_PER_PX
    const s  = rw > 0 ? (wInk / rw) : 1
    inkH = Math.max(rh * s, 20)

    doc.setDrawColor(210); doc.rect(xInk, y, wInk, inkH)
    try { doc.addImage(inkDataUrl, 'PNG', xInk + 2, y + 2, wInk - 4, inkH - 4) } catch {}
  }

  const rowH = Math.max(textH(lab), textH(val), inkH) + 10
  doc.setDrawColor(235); doc.line(PAGE.L, y + rowH, PAGE.WIDTH - PAGE.R, y + rowH)
  return y + rowH + 2
}

/** ===== Stacked blokkok ===== */
async function renderImages(doc: jsPDF, el: FormElement, files: FileItem[], y: number) {
  // Címke (stacked)
  doc.setFont('helvetica','bold'); doc.setFontSize(10)
  doc.text((el as any).label || 'Képek', PAGE.L, y + 4)
  y += 6

  let curX = PAGE.L, curY = y, lineH = 0
  const maxX = PAGE.L + CONTENT_W

  for (const f of files || []) {
    const isImg = !!f?.dataUrl && (/^data:image\//i.test(f.dataUrl) || (f.type||'').startsWith('image/'))
    if (!isImg || !f.dataUrl) continue

    let wMm = (f.wPx ?? 240) * MM_PER_PX
    let hMm: number
    if (typeof f.hPx === 'number') { hMm = f.hPx * MM_PER_PX }
    else {
      const { w, h } = await getImageSize(f.dataUrl)
      hMm = w > 0 ? (wMm * h / w) : (wMm * 0.75)
    }

    if (wMm > CONTENT_W) { const s = CONTENT_W / wMm; wMm = CONTENT_W; hMm *= s }
    if (curX + wMm > maxX) { curX = PAGE.L; curY += lineH + 2; lineH = 0 }

    try { doc.addImage(f.dataUrl, 'PNG', curX, curY, wMm, hMm) }
    catch { doc.setDrawColor(210); doc.rect(curX, curY, wMm, hMm) }

    curX += wMm + 2; lineH = Math.max(lineH, hMm)
  }

  y = Math.max(y + 10, curY + lineH) + 4
  doc.setDrawColor(235); doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
  return y + 2
}

function renderFile(doc: jsPDF, el: FormElement, files: FileItem[], y: number) {
  doc.setFont('helvetica','bold'); doc.setFontSize(10)
  doc.text((el as any).label || 'Csatolmányok', PAGE.L, y + 4)
  y += 6

  const TH_W = 30, TH_H = 22, GAP = 2
  let curX = PAGE.L, curY = y, lineH = 0
  const maxX = PAGE.L + CONTENT_W

  if (!files || files.length === 0) {
    doc.setFont('helvetica','normal'); doc.setFontSize(9)
    doc.text('-', PAGE.L, y + 4)
    y += 10
  } else {
    for (const f of files) {
      if (curX + TH_W > maxX) { curX = PAGE.L; curY += TH_H + GAP; lineH = 0 }
      doc.setDrawColor(210); doc.rect(curX, curY, TH_W, TH_H)

      const isImage = (f.type||'').startsWith('image/') && !!f.dataUrl
      if (isImage) {
        try { doc.addImage(f.dataUrl!, 'PNG', curX + 1, curY + 1, TH_W - 2, TH_H - 2) } catch {}
      } else {
        doc.setFont('helvetica','normal'); doc.setFontSize(8)
        const nameLines = doc.splitTextToSize(f.name || 'fájl', TH_W - 4)
        doc.text(nameLines, curX + 2, curY + 6)
      }

      curX += TH_W + GAP; lineH = Math.max(lineH, TH_H)
    }
    y = Math.max(y + 10, curY + lineH) + 4
  }
  doc.setDrawColor(235); doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
  return y + 2
}

function renderSketch(doc: jsPDF, el: FormElement, dataUrl: string | undefined, y: number) {
  doc.setFont('helvetica','bold'); doc.setFontSize(10)
  doc.text((el as any).label || 'Rajz', PAGE.L, y + 4)
  y += 6
  const H = 50
  doc.setDrawColor(210); doc.rect(PAGE.L, y, CONTENT_W, H)
  if (dataUrl) {
    try { doc.addImage(dataUrl, 'PNG', PAGE.L + 2, y + 2, CONTENT_W - 4, H - 4) } catch {}
  }
  y += H + 6
  doc.setDrawColor(235); doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
  return y + 2
}

function renderModule(doc: jsPDF, el: ModuleElement, y: number) {
  const label = (el as any)?.label ?? 'Modul'
  const instances = Array.isArray((el as any)?.instances) ? (el as any).instances : []

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text(label, PAGE.L, y + 4)
  y += 8

  for (const inst of instances) {
    if (y > PAGE.HEIGHT - 40) { doc.addPage(); y = PAGE.TOP + 20 }
    const title = inst?.title ?? '-'
    const fields = Array.isArray(inst?.fields) ? inst.fields : []

    doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.text(`• ${title}`, PAGE.L, y + 4)
    y += 6

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    for (const f of fields) {
      const t = `${f?.label ?? ''}: ${f?.value ?? '-'}`
      const lines = wrap(doc, t, CONTENT_W - 6)
      doc.text(lines, PAGE.L + 4, y + 4)
      y += textH(lines) + 2
    }

    doc.setDrawColor(235); doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
    y += 2
  }
  return y
}

/** ===== Fő: PDF építés (stabil) ===== */
export async function buildPdfs(
  g: GlobalInfo,
  forms: FormData[],
  answersMaps: Record<string, AnswerMap>
): Promise<Record<string, Uint8Array>> {
  const out: Record<string, Uint8Array> = {}
  const logoAsset = await resolveLogo(g)

  for (const form of forms) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    header(doc, g, form.meta.name, logoAsset)
    let y = PAGE.TOP + 36

    const items = [...(form.elements || [])].sort(
      (a: any, b: any) => (a?.grid?.y ?? 0) - (b?.grid?.y ?? 0) ||
                          (a?.grid?.x ?? 0) - (b?.grid?.x ?? 0)
    )
    const ans = answersMaps[form.meta.id] || {}

    for (const el of items) {
      if (y > PAGE.HEIGHT - 40) { doc.addPage(); header(doc, g, form.meta.name, logoAsset); y = PAGE.TOP + 36 }

      const t = (el as any).type

      if (t === 'title') { y = renderTitle(doc, (el as any).label, y); continue }
      if (t === 'note_text') {
        const val = String(ans[el.id] ?? '')
        if (!isBlank(val)) y = renderNoteText(doc, (el as any).label || 'Megjegyzés', val, y)
        continue
      }
      if (t === 'dropdown_multi') {
        const vals: string[] = Array.isArray(ans[el.id]) ? ans[el.id] : []
        if (vals.length) y = renderDropdownMulti(doc, (el as any).label || 'Választások', vals, y)
        continue
      }
      if (t === 'images') {
        const files = (ans[el.id] as FileItem[]) || []
        if (hasAnyImage(files)) y = await renderImages(doc, el, files, y)
        continue
      }
      if (t === 'file') {
        const files = (ans[el.id] as FileItem[]) || []
        if (hasAnyFile(files)) y = renderFile(doc, el, files, y)
        continue
      }
      if (t === 'sketch' || t === 'comment') {
        const dataUrl = ans[el.id] as string | undefined
        if (dataUrl) y = renderSketch(doc, el, dataUrl, y)
        continue
      }
      if (t === 'text' || t === 'dropdown') {
        const val = String(ans[el.id] ?? '')
        const ink = ans[INK_KEY(el.id)] as string | undefined
        const hasInk = !!((el as any).ink?.enabled && ink)
        if (isBlank(val) && !hasInk) continue
        const rectPx = hasInk ? readInkRectPx(ans, el.id) : undefined
        y = renderRow(doc, (el as any).label, val, hasInk ? ink : undefined, rectPx, y)
        continue
      }
      // Modulok
      if (t === 'module_station' || t === 'module_compressor' ||
          t === 'module' || t === 'module_machine_simple' || t === 'module_machine_detail') {
        y = renderModule(doc, el as ModuleElement, y)
        continue
      }
    }

    const ab = doc.output('arraybuffer')
    out[`${form.meta.name}.pdf`] = new Uint8Array(ab)
  }

  return out
}