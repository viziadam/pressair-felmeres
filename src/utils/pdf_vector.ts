// src/utils/pdf_vector.ts
import { jsPDF } from 'jspdf'
import type {
  FormData,
  AnswerMap,
  Globals as GlobalInfo,
  ModuleElement,
  FormElement,
  FileItem,
} from '../types'

// ====== FONT (Unicode) ======
// KELL egy base64-esített TTF a magyar ékezetekhez (pl. Noto Sans).
// Hozz létre egy fájlt: src/utils/fonts/NotoSans-Regular.ttf.base64 (export default string)
// és importáld be itt:
import NotoSansRegular from '../assets/NotoSans-Regular.ttf'

let UNICODE_FONT_READY: Promise<void> | null = null

async function ensureUnicodeFontOnce(
  fontUrl: string = '/fonts/NotoSans-Regular.ttf', // tedd a TTF-et a /public/fonts alá
  vfsName = 'NotoSans-Regular.ttf',
  fontName = 'NotoSans'
) {
  if (UNICODE_FONT_READY) return UNICODE_FONT_READY
  UNICODE_FONT_READY = (async () => {
    const res = await fetch(fontUrl, { cache: 'force-cache' })
    if (!res.ok) throw new Error('Font fetch failed: ' + res.status)
    const ab = await res.arrayBuffer()
    const u8 = new Uint8Array(ab)
    let bin = ''
    for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i])
    const b64 = btoa(bin) // ⬅️ csak tiszta base64, NINCS "data:..." prefix!

    // egy ideiglenes jsPDF példánnyal tegyük be a VFS-be és regisztráljuk
    const tmp = new jsPDF()
    ;(tmp as any).addFileToVFS(vfsName, b64)
    tmp.addFont(vfsName, fontName, 'normal')
  })()
  return UNICODE_FONT_READY
}

function useUnicodeOnDoc(doc: jsPDF, fontName = 'NotoSans') {
  try {
    doc.setFont(fontName, 'normal')
  } catch {
    // vészfék – ha bármi félremegy, essen vissza helveticára, ne dőljön el a mentés
    doc.setFont('helvetica', 'normal')
  }
}



// ====== Segédek / konstansok ======
const INK_KEY = (id: string) => `__ink__${id}`
const INK_TOGGLE = (id: string) => `__ink_toggle__${id}`
const RECT_KEY = (id: string) => `${id}__rect`

const MM_PER_PX = 25.4 / 96 // képernyős px -> mm (96dpi)
const PAGE = { L: 14, R: 14, TOP: 10, WIDTH: 210, HEIGHT: 297 }
const CONTENT_W = PAGE.WIDTH - PAGE.L - PAGE.R

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
  const k1 = `${INK_KEY(elId)}__rect`
  const k2 = RECT_KEY(INK_KEY(elId))
  const k3 = RECT_KEY(elId)
  const k4 = INK_KEY(RECT_KEY(elId))  // nálatok ez is előfordul
  return (ans[k1] || ans[k2] || ans[k3] || ans[k4]) as { w:number; h:number } | undefined
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
    doc.setFont('NotoSans', 'normal'); doc.setFontSize(8)
    doc.text('LOGÓ', x + BOX_W/2, y + BOX_H/2, { align:'center', baseline:'middle' as any })
  }

  // Cím
  doc.setFont('NotoSans', 'bold' as any); doc.setFontSize(14); doc.setTextColor(0)
  doc.text(`${(g as any).companyName || 'Cégnév'} – ${name || ''}`, rightX, y + 6, { align: 'right' })

  // Jobb oldali kártya
  const cardX = rightX - 90
  const cardY = y + 9
  const cardW = 90
  const pad = 3
  doc.setDrawColor(229); doc.setFillColor(250, 250, 250)
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
    doc.setFont('NotoSans','normal'); doc.setTextColor(107); doc.setFontSize(9)
    doc.text(lab, cardX + pad, ry)
    doc.setFont('NotoSans','bold' as any); doc.setTextColor(0)
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
  doc.setFont('NotoSans','bold' as any); doc.setFontSize(12)
  doc.text(text || '', PAGE.L, y + 5)
  y += 10
  doc.setDrawColor(235); doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
  return y + 2
}

function renderNoteText(doc: jsPDF, label: string, value: string, y: number) {
  doc.setFont('NotoSans','bold' as any); doc.setFontSize(10)
  doc.text(label, PAGE.L, y + 4)
  y += 6
  doc.setFont('NotoSans','normal'); doc.setFontSize(10)
  const lines = doc.splitTextToSize(value || '-', CONTENT_W)
  doc.text(lines, PAGE.L, y + 4)
  y += textH(lines) + 8
  doc.setDrawColor(235); doc.line(PAGE.L, y, PAGE.WIDTH - PAGE.R, y)
  return y + 2
}

function renderDropdownMulti(doc: jsPDF, label: string, values: string[], y: number) {
  doc.setFont('NotoSans','bold' as any); doc.setFontSize(10)
  doc.text(label, PAGE.L, y + 4)
  y += 6
  doc.setFont('NotoSans','normal'); doc.setFontSize(9)
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
  doc.setFont('NotoSans', 'bold' as any); doc.setFontSize(10)
  const lab = wrap(doc, label, wLabel); doc.text(lab, xLabel, y + 4)

  // Value
  doc.setFont('NotoSans','normal'); doc.setFontSize(10)
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
  doc.setFont('NotoSans','bold' as any); doc.setFontSize(10)
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
  doc.setFont('NotoSans','bold' as any); doc.setFontSize(10)
  doc.text((el as any).label || 'Csatolmányok', PAGE.L, y + 4)
  y += 6

  const TH_W = 30, TH_H = 22, GAP = 2
  let curX = PAGE.L, curY = y, lineH = 0
  const maxX = PAGE.L + CONTENT_W

  if (!files || files.length === 0) {
    doc.setFont('NotoSans','normal'); doc.setFontSize(9)
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
        doc.setFont('NotoSans','normal'); doc.setFontSize(8)
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
  doc.setFont('NotoSans','bold' as any); doc.setFontSize(10)
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

  doc.setFont('NotoSans', 'bold' as any); doc.setFontSize(11)
  doc.text(label, PAGE.L, y + 4)
  y += 8

  for (const inst of instances) {
    if (y > PAGE.HEIGHT - 40) { doc.addPage(); doc.setFont('NotoSans','normal'); y = PAGE.TOP + 20 }
    const title = inst?.title ?? '-'
    const fields = Array.isArray(inst?.fields) ? inst.fields : []

    doc.setFont('NotoSans', 'bold' as any); doc.setFontSize(10)
    doc.text(`• ${title}`, PAGE.L, y + 4)
    y += 6

    doc.setFont('NotoSans', 'normal'); doc.setFontSize(9)
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

/** ===== Üres elem logika (ugyanaz, mint a DOM-snapshot ágban) ===== */
function isEmptyByAnswers(el: any, ans: Record<string, any>): boolean {
  const v = ans[el.id]
  const t = el.type
  const inkToggle = !!ans[INK_TOGGLE(el.id)]
  const inkData = ans[INK_KEY(el.id)] as string | undefined

  if (t === 'text' || t === 'dropdown') {
    const txt = (v == null ? '' : String(v)).trim()
    return txt === '' && !inkToggle && !inkData
  }
  if (t === 'note_text') {
    const txt = (v == null ? '' : String(v)).trim()
    return txt === ''
  }
  if (t === 'dropdown_multi') {
    return !Array.isArray(v) || v.length === 0
  }
  if (t === 'images' || t === 'file') {
    return !Array.isArray(v) || v.length === 0
  }
  if (t === 'sketch' || t === 'comment') {
    return !v && !inkData
  }
  if (t?.startsWith('module')) {
    const inst = Array.isArray(el.instances) ? el.instances : []
    if (inst.length === 0) return true
    return false
  }
  return false
}

/** ===== PDF fő ===== */
function useUnicode(doc: jsPDF) {
  ;(doc as any).addFileToVFS('NotoSans-Regular.ttf', NotoSansRegular)
  ;(doc as any).addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
  ;(doc as any).addFont('NotoSans-Regular.ttf', 'NotoSans', 'bold') // "bold" is a style alias
  doc.setFont('NotoSans', 'normal')
  doc.setFontSize(10)
}

export async function buildPdfsVector(
  g: GlobalInfo,
  forms: FormData[],
  answersMaps: Record<string, AnswerMap>
): Promise<Record<string, Uint8Array>> {
  const out: Record<string, Uint8Array> = {}
  const logoAsset = await resolveLogo(g)

  // ⬇️ FONT egyszeri előkészítése (fetch + VFS reg)
  try {
    await ensureUnicodeFontOnce('/fonts/NotoSans-Regular.ttf', 'NotoSans-Regular.ttf', 'NotoSans')
  } catch (e) {
    console.warn('Unicode font init failed, falling back to helvetica:', e)
  }

  for (const form of forms) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    useUnicodeOnDoc(doc) // ⬅️ itt áll be a font (vagy fallback)

    header(doc, g, form.meta.name, logoAsset)
    let y = PAGE.TOP + 36

    const items = [...(form.elements || [])].sort(
      (a: any, b: any) => (a?.grid?.y ?? 0) - (b?.grid?.y ?? 0) ||
                          (a?.grid?.x ?? 0) - (b?.grid?.x ?? 0)
    )
    const ans = answersMaps[form.meta.id] || {}

    for (const el of items) {
      if (isEmptyByAnswers(el, ans)) continue
      if (y > PAGE.HEIGHT - 40) {
        doc.addPage()
        useUnicodeOnDoc(doc) // ⬅️ új oldal után IS állítsd vissza a fontot
        header(doc, g, form.meta.name, logoAsset)
        y = PAGE.TOP + 36
      }

      const t = (el as any).type

      if (t === 'title') { y = renderTitle(doc, (el as any).label, y); continue }
      if (t === 'note_text') {
        const val = String(ans[el.id] ?? '')
        y = renderNoteText(doc, (el as any).label || 'Megjegyzés', val, y)
        continue
      }
      if (t === 'dropdown_multi') {
        const vals: string[] = Array.isArray(ans[el.id]) ? ans[el.id] : []
        y = renderDropdownMulti(doc, (el as any).label || 'Választások', vals, y)
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
        const userWantsInk = !!ans[INK_TOGGLE(el.id)]
        const formFlag = (el as any)?.ink?.enabled
        const hasInk = !!((userWantsInk ?? formFlag) && ink)
        const rectPx = hasInk ? readInkRectPx(ans, el.id) : undefined
        y = renderRow(doc, (el as any).label, val, hasInk ? ink : undefined, rectPx, y)
        continue
      }
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