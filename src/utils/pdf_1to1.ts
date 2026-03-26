// src/utils/pdf_1to1.ts
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'


type Job = { name: string; el: HTMLElement; form?: any; answers?: Record<string, any> }

const PAGE_W_MM = 210
const PAGE_H_MM = 297
const A4_PX_W = 794
const SLICE_QUALITY = 0.92

async function waitForFontsReady() {
  try {
    // a böngésző font loading API-ja: biztosan rasterelhető lesz minden glyph
    // @ts-ignore
    if (document.fonts?.ready) await (document as any).fonts.ready
  } catch {}
}

function injectPrintCSS(cloneRoot: HTMLElement, opts?: { fontSizePx?: number; lineHeight?: number }) {
  const fontSizePx = Math.max(10, Math.min(24, opts?.fontSizePx ?? 14))
  const lineHeight = Math.max(1.2, Math.min(2.0, opts?.lineHeight ?? 1.45))
  const style = document.createElement('style')
  style.setAttribute('data-injected', 'print-tune')
  style.textContent = `
    /* alap tipó */
    .a4-page, .a4-page * {
      font-size: ${fontSizePx}px !important;
      line-height: ${lineHeight} !important;
      letter-spacing: normal !important;
      text-rendering: optimizeLegibility !important;
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
      white-space: normal !important;
      word-break: break-word !important;
    }
    /* sticky/abs header hatások kikapcsolása a klónban */
    .a4-page [style*="position: sticky"], .a4-page .sticky { position: static !important; top: auto !important; }
    .a4-page { width: ${A4_PX_W}px !important; margin: 0 auto !important; }

    /* ---- HEADER specifikus fixek ---- */
    .a4-page header, .a4-page .header, .a4-page .page-header {
      position: static !important;
      display: grid !important;
      align-items: start !important;
      overflow: visible !important;
      font-size: ${Math.max(11, Math.round(fontSizePx * 0.90))}px !important;
      line-height: ${Math.max(1.25, Math.min(1.5, lineHeight * 0.92))} !important;
      letter-spacing: normal !important;
      white-space: normal !important;
    }
    .a4-page header img, .a4-page .header img, .a4-page .page-header img {
      max-height: 56px !important;
      height: auto !important;
      object-fit: contain !important;
    }

    /* ---- KÉTOSZLOPOS SOR RÁCS (label bal, érték jobb) ---- */
    /* Alapeset: nincs ink-panel */
    .a4-page .form-row {
      display: grid !important;
      grid-template-columns: 220px 1fr !important;
      align-items: start !important;
      column-gap: 12px !important;
    }
    .a4-page .form-row > .field-row-label { grid-column: 1 !important; }
    .a4-page .form-row > .field-wrap,
    .a4-page .form-row > .input { grid-column: 2 !important; }

    /* Ha van ink-box a sorban: három oszlop (label / value / ink) */
    .a4-page .form-row:has(.ink-box) {
      grid-template-columns: 220px 1fr 340px !important;
      column-gap: 12px !important;
    }
    .a4-page .form-row:has(.ink-box) .ink-box { grid-column: 3 !important; }

    /* Stacked layout-okra ne erőltessük a gridet (ha külön osztályt használtok) */
    .a4-page .form-row.stacked {
      display: block !important;
    }

    /* Sínek: a .input ne törje be a saját tipóját */
    .a4-page .input {
      width: 100% !important;
      min-width: 0 !important;
    }
  `
  cloneRoot.prepend(style)
}

/** elemsor rendezése ugyanúgy, mint a renderben (grid.y, majd grid.x) */
function sortElementsLikeUI(arr: any[] = []) {
  return [...arr].sort((a: any, b: any) =>
    ((a?.grid?.y ?? 0) - (b?.grid?.y ?? 0)) || ((a?.grid?.x ?? 0) - (b?.grid?.x ?? 0))
  )
}



function enableCorsAndReloadImages(cloneRoot: HTMLElement) {
  const imgs = Array.from(cloneRoot.querySelectorAll<HTMLImageElement>('img'))
  for (const im of imgs) {
    const src = im.getAttribute('src') || ''
    if (!src || src.startsWith('data:')) continue
    // CORS engedélyezés
    im.setAttribute('crossorigin', 'anonymous')
    // kényszerített újratöltés (cache-ből is jó)
    const cur = im.src
    im.src = ''    // kis trükk, hogy biztosan "src change"-nek lássa
    im.src = cur
  }
}



/** 1) Gombok, ikonok, szerkesztő toolbarok elrejtése */
function stripUiControls(cloneRoot: HTMLElement) {
  const selectors = [
    'button', '.btn', '.icon-inline', '.ink-clear-abs',
    '.uploader-toolbar', '.image-uploader-toolbar',
    '[type="button"]', '[role="button"]'
  ]
  cloneRoot.querySelectorAll<HTMLElement>(selectors.join(',')).forEach(el => {
    el.style.display = 'none'
  })
}


function mirrorFormValues(srcRoot: HTMLElement, dstRoot: HTMLElement) {
  // --- INPUTOK ---
  const sInputs = srcRoot.querySelectorAll<HTMLInputElement>('input')
  const dInputs = dstRoot.querySelectorAll<HTMLInputElement>('input')

  sInputs.forEach((s, i) => {
    const d = dInputs[i]; if (!d) return

    // ⛔ soha ne állítsuk programból a file input value-ját
    if (d.type === 'file' || s.type === 'file') {
      // opcionálisan: d.value = ''  // ez engedélyezett, de nem szükséges
      return
    }

    if (s.type === 'checkbox' || s.type === 'radio') {
      d.checked = s.checked
    } else {
      d.value = s.value
    }
  })

  // --- TEXTAREÁK ---
  const sTa = srcRoot.querySelectorAll<HTMLTextAreaElement>('textarea')
  const dTa = dstRoot.querySelectorAll<HTMLTextAreaElement>('textarea')
  sTa.forEach((s, i) => {
    const d = dTa[i]; if (!d) return
    d.value = s.value
  })

  // --- SELECTEK ---
  const sSel = srcRoot.querySelectorAll<HTMLSelectElement>('select')
  const dSel = dstRoot.querySelectorAll<HTMLSelectElement>('select')
  sSel.forEach((s, i) => {
    const d = dSel[i]; if (!d) return

    if (s.multiple || d.multiple) {
      const selected = new Set(Array.from(s.selectedOptions).map(o => o.value))
      Array.from(d.options).forEach(o => { o.selected = selected.has(o.value) })
    } else {
      d.value = s.value
    }
  })

  // --- contentEditable ---
  // (általánosabb szelektor, mint a korábbi)
  const sCE = srcRoot.querySelectorAll<HTMLElement>('[contenteditable]')
  const dCE = dstRoot.querySelectorAll<HTMLElement>('[contenteditable]')
  sCE.forEach((s, i) => {
    const d = dCE[i]; if (!d) return
    // csak sima szöveg (ne hozzunk át formázást)
    d.textContent = s.textContent || ''
  })
}

function replaceCanvasesWithImages(srcRoot: HTMLElement, dstRoot: HTMLElement) {
  const srcCanvases = srcRoot.querySelectorAll<HTMLCanvasElement>('canvas')
  const dstCanvases = dstRoot.querySelectorAll<HTMLCanvasElement>('canvas')
  srcCanvases.forEach((src, i) => {
    const dst = dstCanvases[i]; if (!dst) return
    const r = src.getBoundingClientRect()
    const img = dst.ownerDocument!.createElement('img')
    img.src = src.toDataURL('image/png')
    img.alt = 'ink'
    img.style.display = 'block'
    img.style.width = `${Math.max(1, Math.round(r.width))}px`
    img.style.height = `${Math.max(1, Math.round(r.height))}px`
    dst.replaceWith(img)
  })
}

async function normalizeImages(srcRoot: HTMLElement, dstRoot: HTMLElement) {
  const sImgs = srcRoot.querySelectorAll<HTMLImageElement>('img')
  const dImgs = dstRoot.querySelectorAll<HTMLImageElement>('img')
  sImgs.forEach((s, i) => {
    const d = dImgs[i]; if (!d) return
    const r = s.getBoundingClientRect()
    d.style.width = `${Math.max(1, Math.round(r.width))}px`
    d.style.height = `${Math.max(1, Math.round(r.height))}px`
  })
  await Promise.all(Array.from(dImgs).map(im => (im.decode ? im.decode() : Promise.resolve()).catch(()=>{})))
}

function makeStaging(): HTMLElement {
  const staging = document.createElement('div')
  staging.style.position = 'fixed'
  staging.style.left = '-200vw'
  staging.style.top = '0'
  staging.style.width = `${A4_PX_W}px`
  staging.style.pointerEvents = 'none'
  staging.style.zIndex = '-1'
  document.body.appendChild(staging)
  return staging
}

// --- MEGLÉVŐ: AnswerMap alapú elrejtés top-level elemekhez (javított) ---
function isEmptyByAnswers(el: any, ans: Record<string, any>): boolean {
  const v = ans[el.id]
  const t = el.type
  const inkToggle = !!ans[`__ink_toggle__${el.id}`]
  const inkData = ans[`__ink__${el.id}`] as string | undefined

  if (t === 'text' || t === 'dropdown') {
    const txt = (v == null ? '' : String(v)).trim()
    return txt === '' && !inkToggle && !inkData
  }
  if (t === 'note_text') return (v == null ? '' : String(v)).trim() === ''
  if (t === 'dropdown_multi') return !Array.isArray(v) || v.length === 0
  if (t === 'images' || t === 'file') return !Array.isArray(v) || v.length === 0
  if (t === 'sketch' || t === 'comment') return !v && !inkData
  if (t?.startsWith('module')) {
    const inst = Array.isArray(el.instances) ? el.instances : []
    return inst.length === 0
  }
  return false
}

/** true, ha a node-on belül van érdemi, NEM label tartalom (kép/ink vagy nem üres value) */
function hasMeaningfulContent(block: HTMLElement): boolean {
  // vizuális tartalom?
  if (block.querySelector('img, canvas, .ink-box img, .ink-box canvas')) return true

  // érték-cellák (labelt kizárjuk)
  const valueSelectors = [
    '.field-wrap', '.input', '.file-chip', '.file-list', '.image-grid', '.ink-box'
  ]
  const candidates = Array.from(block.querySelectorAll<HTMLElement>(valueSelectors.join(',')))
    // dobjuk ki a címkéket / label-elemeket
    .filter(n => n.tagName.toLowerCase() !== 'label' &&
                 !n.classList.contains('field-row-label'))

  for (const n of candidates) {
    if (getComputedStyle(n).display === 'none' || getComputedStyle(n).visibility === 'hidden') continue
    const text = (n.textContent || '').replace(/\s+/g, ' ').trim()
    const isMarkedEmpty = n.dataset.empty === 'true'
    // ha valami látszik és nem üres: megvan a tartalom
    if (!isMarkedEmpty && (text.length > 0)) return true
  }

  // ha maradt látható .form-row, akkor is van tartalom
  if (block.querySelector('.form-row:not([style*="display: none"])')) return true

  return false
}

/** Top-level prune: a .list közvetlen gyerekeit rejti el, ha nincs értelmes tartalom bennük. */
function pruneEmptyTopLevelBlocks(root: HTMLElement) {
  const list = root.querySelector('.list')
  if (!list) return
  const blocks = Array.from(list.children) as HTMLElement[]
  blocks.forEach(b => {
    if (getComputedStyle(b).display === 'none') return
    if (!hasMeaningfulContent(b)) {
      b.style.display = 'none'
    }
  })
}




/** Gyűjtsünk "biztonságos" töréspontokat: a .list minden LÁTHATÓ gyermekének alsó éle (bottom). */
function collectBreakpointsPx(root: HTMLElement): number[] {
  const baseTop = root.getBoundingClientRect().top
  const sels = [
    '.list > *',
    '.form-row',
    '.form-row.stacked',
    '.ink-panel',
    '.image-grid',
    '[class*="module"]',
    '[data-module]',
    '[data-instance]',
  ]
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(sels.join(',')))
  const out: number[] = []
  for (const n of nodes) {
    const cs = getComputedStyle(n)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    const r = n.getBoundingClientRect()
    if (r.height < 1) continue
    out.push(Math.round(r.bottom - baseTop))
  }
  // egyedi, növekvő
  return Array.from(new Set(out)).sort((a,b)=>a-b)
}

/** html2canvas → szeletelés töréspontokhoz igazítva (nem vágunk ketté blokkot) */
async function elementToPagedPdf(el: HTMLElement, breakpointsPx?: number[]): Promise<jsPDF> {
  const A4_PX_W = 794
  const PAGE_W_MM = 210
  const PAGE_H_MM = 297

  const canvas = await html2canvas(el, {
    backgroundColor: '#ffffff',
    scale: Math.max(2, window.devicePixelRatio || 1),
    useCORS: true,
    logging: false,
    width: A4_PX_W,
  })

  const fullW = canvas.width
  const fullH = canvas.height
  const scaleFactor = fullW / A4_PX_W   // mennyivel nagyobb a renderelt vászon a CSS px-hez képest
  const pageHeightPxCss = Math.floor(A4_PX_W * (PAGE_H_MM / PAGE_W_MM)) // CSS px-ben
  const pageHeightPxCanvas = Math.floor(pageHeightPxCss * scaleFactor)  // canvas px-ben

  // töréspontok a canvas koordinátarendszerében
  const breaks = (breakpointsPx || []).map(y => Math.round(y * scaleFactor)).filter(y => y>0 && y<fullH)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const mmPerPx = PAGE_W_MM / fullW

  let y = 0
  let first = true
  const MIN_CONTENT = Math.round(120 * scaleFactor) // ne legyen túl pici utolsó csík

  while (y < fullH) {
    const suggestedEnd = y + pageHeightPxCanvas
    // keresd meg az utolsó töréspontot, ami belefér a lap aljáig (de legalább MIN_CONTENT-tel a teteje alatt)
    const candidates = breaks.filter(bp => bp <= suggestedEnd && bp >= y + MIN_CONTENT)
    const cutAt = candidates.length ? candidates[candidates.length - 1] : Math.min(suggestedEnd, fullH)

    const sliceH = Math.min(cutAt - y, fullH - y)
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = fullW
    pageCanvas.height = sliceH
    const ctx = pageCanvas.getContext('2d')!
    ctx.drawImage(canvas, 0, y, fullW, sliceH, 0, 0, fullW, sliceH)

    const dataUrl = pageCanvas.toDataURL('image/jpeg', 0.92)
    const imgHmm = sliceH * mmPerPx

    if (!first) doc.addPage()
    doc.addImage(dataUrl, 'JPEG', 0, 0, PAGE_W_MM, imgHmm)
    first = false
    y += sliceH
  }
  return doc
}

function replaceSelectsWithText(cloneRoot: HTMLElement) {
  cloneRoot.querySelectorAll<HTMLSelectElement>('select').forEach(sel => {
    const txt = Array.from(sel.selectedOptions).map(o => o.textContent || o.value).join(', ')
    const span = document.createElement('span')
    span.textContent = txt || ''                    // ⬅️ nincs „–”
    if (!txt) span.dataset.empty = 'true'           // ⬅️ megjelöljük üresnek
    span.className = 'input'
    span.style.display = 'inline-block'
    span.style.minWidth = sel.clientWidth + 'px'
    sel.replaceWith(span)
  })
}

function replaceInputsWithText(cloneRoot: HTMLElement) {
  cloneRoot.querySelectorAll<HTMLInputElement>('input').forEach(inp => {
    const span = document.createElement('span')
    let txt = ''
    if (inp.type === 'checkbox' || inp.type === 'radio') {
      txt = inp.checked ? '✓' : ''
      if (!inp.checked) span.dataset.empty = 'true'
    } else {
      txt = inp.value || ''
      if (!inp.value) span.dataset.empty = 'true'
    }
    span.textContent = txt                         // ⬅️ nincs „–”
    span.className = 'input'
    span.style.display = 'inline-block'
    span.style.minWidth = inp.clientWidth + 'px'
    inp.replaceWith(span)
  })

  cloneRoot.querySelectorAll<HTMLTextAreaElement>('textarea').forEach(ta => {
    const div = document.createElement('div')
    const txt = ta.value || ''
    div.textContent = txt                          // ⬅️ nincs „–”
    if (!txt) div.dataset.empty = 'true'
    div.className = 'input'
    div.style.whiteSpace = 'pre-wrap'
    div.style.display = 'block'
    div.style.minHeight = ta.clientHeight + 'px'
    ta.replaceWith(div)
  })
}

function stripDashPlaceholders(cloneRoot: HTMLElement) {
  const isDashOnly = (s: string) => {
    const t = (s || '').replace(/\s+/g, ' ').trim()
    return t === '-' || t === '–' || t === '—' || t.toLowerCase() === 'n/a'
  }

  // tipikus value cellák
  const candidates = cloneRoot.querySelectorAll<HTMLElement>(
    '.field-wrap, .input, .small, .value, .image-grid, .ink-box'
  )

  candidates.forEach(node => {
    if (node.children.length > 0) return
    if (isDashOnly(node.textContent || '')) {
      node.textContent = ''
      node.dataset.empty = 'true'
    }
  })
}

function hasVisualContent(node: Element): boolean {
  return !!node.querySelector('img, canvas, .ink-box img, .ink-box canvas')
}
function isReallyEmptyText(s: string): boolean {
  return (s || '').replace(/\s+/g, ' ').trim() === ''
}
function pickValueCell(row: HTMLElement): HTMLElement | null {
  return (
    (row.querySelector('.field-wrap') as HTMLElement) ||
    (row.querySelector('.input') as HTMLElement) ||
    (row.children[1] as HTMLElement) ||
    null
  )
}

function pruneDomEmptiesDeep(root: HTMLElement) {
  // 1) sorok (bármely mélységben)
  const rows = Array.from(root.querySelectorAll<HTMLElement>('.form-row'))
  for (const row of rows) {
    if (row.style.display === 'none') continue
    if (hasVisualContent(row)) continue
    const valueCell = pickValueCell(row)
    const markedEmpty = valueCell?.dataset.empty === 'true' || row.dataset.empty === 'true'
    const text = valueCell ? (valueCell.textContent || '') : (row.textContent || '')
    if (markedEmpty || isReallyEmptyText(text)) {
      row.style.display = 'none'
    }
  }

  // 2) teljesen kiürült konténerek eltüntetése
  const containers = Array.from(root.querySelectorAll<HTMLElement>(
    '.list > *, .form-row.stacked, [class*="module"], [data-module], [data-instance], .ink-panel, .image-grid'
  ))
  containers.forEach(el => {
    if (el.style.display === 'none') return
    if (el.querySelector('.form-row:not([style*="display: none"])')) return
    if (hasVisualContent(el)) return
    const txt = (el.textContent || '').replace(/\s+/g, ' ').trim()
    const markedEmpty = el.dataset.empty === 'true'
    if (markedEmpty || isReallyEmptyText(txt)) el.style.display = 'none'
  })
}

function stripFileInputs(cloneRoot: HTMLElement) {
  cloneRoot.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach(inp => {
    inp.style.display = 'none'
  })
}

function normalizeValueNodesForEmpty(cloneRoot: HTMLElement) {
  const vals = cloneRoot.querySelectorAll<HTMLElement>(
    '.field-wrap .input, .form-row .input, .input'
  )
  vals.forEach(v => {
    const t = (v.textContent || '').replace(/\s+/g, ' ').trim()
    if (t === '') {
      // fontos: :empty csak akkor igaz, ha NINCS gyerek NODÉ
      v.textContent = ''
      v.dataset.empty = 'true'
    } else {
      v.dataset.empty = 'false'
    }
  })
}

function injectHideEmptyCss(root: HTMLElement) {
  const style = document.createElement('style')
  style.setAttribute('data-pdf-clean', '1')
  style.textContent = `
/* ⬇⬇ MINDEN prune CSAK a .list alá vonatkozzon, a header érintetlen! */
.list .form-row
  :not(:has(img, canvas, .ink-box img, .ink-box canvas))
  :has(.input:empty) { display: none !important; }

.list > *:not(.keep)
  :not(:has(img, canvas, .ink-box img, .ink-box canvas))
  :not(:has(.form-row:not([style*="display: none"])))
  :not(:has(.input:not(:empty))) { display: none !important; }

.list .form-row .field-wrap:has(> .input:empty) { display: none !important; }
`
  root.prepend(style)
}

function ensureExportableEvenIfEmpty(cloneRoot: HTMLElement) {
  // alap A4 méret @96dpi: 794 x 1123
  const host = cloneRoot.closest('.a4-page') as HTMLElement || cloneRoot
  host.style.minHeight = '1123px'
  host.style.background = '#fff'

  const list = cloneRoot.querySelector('.list') as HTMLElement | null
  if (!list) return

  // ha nincs látható gyermek, tegyünk be egy pici "távtartót", hogy legyen tartalom-sáv
  const hasVisibleChild = Array.from(list.children).some(
    (n) => getComputedStyle(n as HTMLElement).display !== 'none'
  )
  if (!hasVisibleChild) {
    const pad = document.createElement('div')
    pad.className = 'pdf-empty-pad'
    pad.style.height = '40px'   // kicsi, nem látszik zavaróan
    list.appendChild(pad)
  }
}

// ——— utils: trim + láthatóság ———
function _txt(s?: string|null){ return (s||'').replace(/\u00A0/g,' ').replace(/[\u200B-\u200D\uFEFF]/g,'').trim() }
function _shown(el: Element){ const cs = getComputedStyle(el as HTMLElement); return cs.display!=='none' && cs.visibility!=='hidden' && cs.opacity!=='0' }

// ——— egy “blokk” tényleg üres-e? ———
function _blockIsEmpty(block: HTMLElement): boolean {
  // 1) képek/canvas → ha bármelyik van, nem üres
  const hasImg = block.querySelectorAll('img').length > 0
  const hasCanvas = block.querySelectorAll('canvas').length > 0
  if (hasImg || hasCanvas) return false

  // 2) input/textarea/contentEditable/select értékek
  //    (itt a KLÓNON futunk, a mirrorFormValues már bemásolta az értékeket)
  const inputs = Array.from(block.querySelectorAll('input')).filter(i => i.type!=='file')
  for (const i of inputs) {
    if ((i.type==='checkbox' || i.type==='radio') && (i as HTMLInputElement).checked) return false
    if (i.type!=='checkbox' && i.type!=='radio' && _txt((i as HTMLInputElement).value)) return false
  }

  const tas = block.querySelectorAll('textarea')
  for (const ta of Array.from(tas)) if (_txt((ta as HTMLTextAreaElement).value)) return false

  const ces = block.querySelectorAll('[contenteditable=""],[contenteditable="true"]')
  for (const ce of Array.from(ces)) if (_txt((ce as HTMLElement).textContent)) return false

  const sels = block.querySelectorAll('select')
  for (const s of Array.from(sels)) {
    const sel = s as HTMLSelectElement
    if (sel.multiple) {
      if (sel.selectedOptions.length > 0) return false
    } else {
      if (_txt(sel.value)) return false
    }
  }

  // 3) tipikus értékdobozok (ha a komponens szöveget ír bele)
  const valueCells = block.querySelectorAll('.input, .field-wrap, .small, .value, .image-grid')
  for (const c of Array.from(valueCells)) {
    if (_txt((c as HTMLElement).textContent)) return false
    // image-grid-et már képnél kezeltük; ha ide eljutunk és nincs szöveg se, üresnek tekintjük
  }

  // 4) ha SEMMI látható, akkor üres
  const visibleChild = Array.from(block.children).some(ch => _shown(ch))
  if (!visibleChild) return true

  // 5) ha csak label maradt, de nincs érték
  const labels = block.querySelectorAll('label, .field-row-label, h3, .ink-title')
  if (labels.length && !(_txt((block as HTMLElement).innerText.replace(/[\s\r\n]+/g,' ')).length > 0)) {
    return true
  }

  // alapértelmezés: üresnek tekintjük, ha NINCS semmi informatív jel
  return true
}

// --- Üres-e egy vezérlő? ----------------------------------------------------
function _trim(s?: string | null) {
  return (s ?? '').replace(/\u00A0/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
}
function _controlIsEmpty(el: Element): boolean {
  if (el instanceof HTMLInputElement) {
    const t = el.type
    if (t === 'file') return true                        // fájlt nem vizsgáljuk itt
    if (t === 'checkbox' || t === 'radio') return !el.checked
    return _trim(el.value) === ''
  }
  if (el instanceof HTMLTextAreaElement) {
    return _trim(el.value) === ''
  }
  if (el instanceof HTMLSelectElement) {
    if (el.multiple) return el.selectedOptions.length === 0
    return _trim(el.value) === ''
  }
  // contenteditable
  const ce = (el as HTMLElement)
  if (ce && (ce.getAttribute('contenteditable') === '' || ce.getAttribute('contenteditable') === 'true')) {
    return _trim(ce.textContent || '') === ''
  }
  return true
}

// --- Egy .form-row (vagy stacked blokk) üres-e a benne lévő vezérlők szerint?-
function _rowIsEmpty(row: HTMLElement): boolean {
  // ha van bármilyen img/canvas → NEM üres
  if (row.querySelector('img, canvas')) return false

  // összes vezérlő
  const ctrls = row.querySelectorAll('input, textarea, select, [contenteditable=""], [contenteditable="true"]')
  if (ctrls.length === 0) {
    // ha nincsenek vezérlők, nézzük, van-e bármilyen „értelmes” szöveg
    const txt = _trim(row.textContent || '')
    return txt === ''
  }
  // ha bármelyik NEM üres → a sor marad
  for (const c of Array.from(ctrls)) {
    if (!_controlIsEmpty(c)) return false
  }
  return true
}

// --- Prune: üres sorok kidobása a .list alatt (modulokon belül is) ----------
// function pruneEmptyByControls(cloneRoot: HTMLElement) {
//   const list = cloneRoot.querySelector('.list') as HTMLElement | null
//   if (!list) return

//   // 1) kidobjuk az üres .form-row / .stacked / .no-border blokkokat
//   const rows = list.querySelectorAll<HTMLElement>('.form-row, .stacked, .no-border')
//   rows.forEach(row => {
//     if (_rowIsEmpty(row)) row.remove()
//   })

//   // 2) ha egy modul/kártya teljesen kiürült (nincs benne sem vezérlő, sem kép),
//   //    akkor a felső konténert is eltávolítjuk, hogy ne maradjon címke
//   //    (lefuttatjuk párszor, amíg nem marad „csontváz”):
//   for (let pass = 0; pass < 3; pass++) {
//     const blocks = Array.from(list.querySelectorAll<HTMLElement>('*'))
//     let removed = 0
//     for (const b of blocks) {
//       // hagyjuk békén a sorokat (azokat már kezeltük), és a .list-et magát
//       if (b === list) continue
//       if (b.matches('.form-row, .stacked, .no-border')) continue

//       // ha nincs benne sem input/textarea/select/CE/img/canvas/file-chip/image-tile → kuka
//       if (!b.querySelector('input, textarea, select, [contenteditable=""], [contenteditable="true"], img, canvas, .file-chip, .image-tile')) {
//         // és csak „tipikus” wrapper-eket takarítunk: div, section, article, fieldset, etc.
//         if (/(DIV|SECTION|ARTICLE|FIELDSET)/.test(b.tagName)) {
//           // de csak akkor, ha tényleg nincs benne látható gyerek
//           const hasVisible = Array.from(b.children).some(ch => {
//             const cs = getComputedStyle(ch as HTMLElement)
//             return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0'
//           })
//           if (!hasVisible) { b.remove(); removed++ }
//         }
//       }
//     }
//     if (!removed) break
//   }

//   // 3) ha teljesen kiürült a .list → hagyjunk kicsi padot, hogy a header alatt legyen tér
//   if (list.children.length === 0) {
//     const pad = document.createElement('div')
//     pad.style.height = '40px'
//     list.appendChild(pad)
//   }
// }

// --- Prune: üres sorok kidobása a .list alatt (modulokon belül is) ----------
function pruneEmptyByControls(cloneRoot: HTMLElement) {
  const list = cloneRoot.querySelector('.list') as HTMLElement | null
  if (!list) return

  // 1) Kidobjuk az üres .form-row blokkokat (A FormFiller class-ok miatt most már a modulokban is megtalálja!)
  const rows = list.querySelectorAll<HTMLElement>('.form-row, .stacked, .no-border')
  rows.forEach(row => {
    if (_rowIsEmpty(row)) row.remove()
  })

  // 2) ÚJ: Üres szekciók (pl. "3.0 Légkezelő") alcímeinek eltüntetése
  const sections = list.querySelectorAll<HTMLElement>('.module-section')
  sections.forEach(sec => {
    // Ha a szekció alatt nem maradt egyetlen látható sor (form-row) sem, kuka az alcím is!
    if (!sec.querySelector('.form-row:not([style*="display: none"])')) {
      sec.remove() 
    }
  })

  // 3) ÚJ: Teljesen kiürült modul példányok (kártyák) eltüntetése
  const instances = list.querySelectorAll<HTMLElement>('.module-instance')
  instances.forEach(inst => {
    // Csak akkor tartjuk meg a kártyát (címmel együtt), ha maradt benne értelmes tartalom
    const hasContent = inst.querySelector('input, textarea, select, img, canvas, .form-row:not([style*="display: none"])');
    if (!hasContent) {
      inst.remove(); // Nincs érdemi tartalom -> kuka a komplett kártya!
    }
  })

  // 4) Ha teljesen kiürült a .list -> hagyjunk kicsi padot
  if (list.children.length === 0) {
    const pad = document.createElement('div')
    pad.style.height = '40px'
    list.appendChild(pad)
  }
}


export async function exportForms1to1(
  jobs: Job[],
  opts?: { fontSizePx?: number; lineHeight?: number }
): Promise<Record<string, Uint8Array>> {
  const out: Record<string, Uint8Array> = {}
  const staging = makeStaging()
  try {
    for (const { name, el, form, answers } of jobs) {
      const clone = el.cloneNode(true) as HTMLElement
      staging.appendChild(clone)

    injectPrintCSS(clone, opts)
    enableCorsAndReloadImages(clone)

    // a klón előkészítésekor:
    mirrorFormValues(el, clone)
    pruneEmptyByControls(clone)
    stripFileInputs(clone)
    replaceCanvasesWithImages(el, clone)

    stripUiControls(clone)
    replaceSelectsWithText(clone)
    replaceInputsWithText(clone)
    stripDashPlaceholders(clone)   // ⬅️ kiszedi a „- / –” maradékot

   // ⬇️ itt
    normalizeValueNodesForEmpty(clone)

    // ⬇️ CSS injektálás (köv. blokk)
    // pruneEmptyByControls(clone)

    await waitForFontsReady()
    await normalizeImages(el, clone)

    // 🔸 gyűjts biztonságos töréspontokat a KLÓNBÓL, és azokat használd a szeleteléshez
    const breaksPx = collectBreakpointsPx(clone)

      const doc = await elementToPagedPdf(clone, breaksPx);
      const ab = doc.output('arraybuffer')
      out[`${name}.pdf`] = new Uint8Array(ab)
      staging.removeChild(clone)
    }
  } finally {
    document.body.removeChild(staging)
  }
  return out
}