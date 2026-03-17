// src/utils/pdfDom.ts
// src/utils/pdfDom.ts
import React from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import A4Page from '../components/A4Page'
import type { FormData, AnswerMap, Globals as GlobalInfo } from '../types'

// --- Read-only kirajzoló a kitöltött űrlaphoz (ugyanaz a markup/címkék, csak nem inputok) ---
function ReadOnlyForm({ form, answers }: { form: FormData; answers: AnswerMap }) {
  const items = [...(form.elements || [])].sort(
    (a: any, b: any) =>
      (a?.grid?.y ?? 0) - (b?.grid?.y ?? 0) ||
      (a?.grid?.x ?? 0) - (b?.grid?.x ?? 0)
  )

  return (
    <div className="list">
      {items.map((el: any) => {
        // cím
        if (el.type === 'title') {
          return (
            <div key={el.id} style={{ padding: '6px 0' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{el.label}</h3>
            </div>
          )
        }

        // sima szöveg / megjegyzés
        if (el.type === 'note_text') {
          const val = String(answers[el.id] ?? '')
          return (
            <div key={el.id} className="form-row stacked">
              <label className="field-row-label">{el.label}</label>
              <div className="input" style={{ whiteSpace: 'pre-wrap' }}>
                {val || '-'}
              </div>
            </div>
          )
        }

        // többválasztós „chipek”
        if (el.type === 'dropdown_multi') {
          const vals: string[] = Array.isArray(answers[el.id]) ? answers[el.id] : []
          return (
            <div key={el.id} className="form-row stacked">
              <label className="field-row-label">{el.label}</label>
              <div className="small" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {vals.length
                  ? vals.map((s, i) => <span key={i} className="file-chip">{s}</span>)
                  : '-'}
              </div>
            </div>
          )
        }

        // képek
        if (el.type === 'images') {
          const files = (answers[el.id] || []) as any[]
          return (
            <div key={el.id} className="form-row stacked">
              {!el.hideLabel && <label className="field-row-label">{el.label}</label>}
              <div className="image-grid">
                {files?.length
                  ? files.map((f, i) => (
                      <div key={i} className="image-tile">
                        <div className="resize-box">
                          {f?.dataUrl ? (
                            <img
                              src={f.dataUrl}
                              alt={f.name || 'kép'}
                              style={{ display: 'block', width: '100%', height: 'auto' }}
                            />
                          ) : (
                            <div className="file-thumb" />
                          )}
                        </div>
                        {f?.name && <div className="small">{f.name}</div>}
                      </div>
                    ))
                  : <div className="uploader-preview disabled"><div className="hint">Nincs kép</div></div>}
              </div>
            </div>
          )
        }

        // fájlok listája
        if (el.type === 'file') {
          const files = (answers[el.id] || []) as any[]
          return (
            <div key={el.id} className="form-row stacked">
              {!el.hideLabel && <label className="field-row-label">{el.label}</label>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {files?.length ? files.map((f, i) => (
                  <span key={i} className="file-chip">{f?.name || 'fájl'}</span>
                )) : '-'}
              </div>
            </div>
          )
        }

        // rajz / comment (kép)
        if (el.type === 'sketch' || el.type === 'comment') {
          const dataUrl: string | undefined = answers[el.id]
          return (
            <div key={el.id} className="form-row stacked">
              {!el.hideLabel && <label className="field-row-label">{el.label}</label>}
              <div className="ink-box">
                {dataUrl
                  ? <img src={dataUrl} alt="rajz" style={{ display: 'block', width: '100%', height: 'auto' }} />
                  : <div style={{ padding: 8 }} className="small">–</div>}
              </div>
            </div>
          )
        }

        // sima mező (text/dropdown) értékkel
        if (el.type === 'text' || el.type === 'dropdown') {
          const val = String(answers[el.id] ?? '')
          return (
            <div key={el.id} className="form-row">
              <label>{el.label}</label>
              <div className="field-wrap">
                <div className="input" style={{ whiteSpace: 'pre-wrap' }}>
                  {val || '-'}
                </div>
              </div>
            </div>
          )
        }

        // modulok (read-only)
        if (
          el.type === 'module' ||
          el.type === 'module_station' ||
          el.type === 'module_compressor' ||
          el.type === 'module_machine_simple' ||
          el.type === 'module_machine_detail'
        ) {
          const instances = Array.isArray(el?.instances) ? el.instances : []
          return (
            <div key={el.id} className="form-row stacked">
              <label className="field-row-label">{el.label}</label>
              <div style={{ display: 'grid', gap: 8 }}>
                {instances.length ? instances.map((inst: any) => (
                  <div key={inst.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
                    <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>{inst.title}</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {(inst.fields || []).map((f: any) => (
                        <div key={f.key} className="form-row">
                          <label>{f.label}</label>
                          <div className="field-wrap">
                            <div className="input">{f.value || '-'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : <div className="small">–</div>}
              </div>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

// --- A tényleges, 1:1 DOM-snapshot alapú PDF építés ---
export async function buildPdfsExact(
  globals: GlobalInfo,
  forms: FormData[],
  answersMaps: Record<string, AnswerMap>,
): Promise<Record<string, Uint8Array>> {

  const out: Record<string, Uint8Array> = {}

  // offscreen staging konténer, hogy ne villogjon
  const staging = document.createElement('div')
  staging.style.position = 'fixed'
  staging.style.left = '-200vw'
  staging.style.top = '0'
  staging.style.width = '794px'         // ~ A4 szélesség @96dpi
  staging.style.pointerEvents = 'none'
  document.body.appendChild(staging)
  const root = createRoot(staging)

  // A4 pixel méret (képernyőn, 96dpi-hez igazítva)
  const A4_PX_W = 794
  const A4_PX_H = 1123

  // PDF méret mm-ben
  const PAGE_W_MM = 210
  const PAGE_H_MM = 297

  for (const form of forms) {
    const answers = answersMaps[form.meta.id] || {}

    // A4Page + ReadOnlyForm kirajzolása offscreen
    root.render(
      <A4Page
        globals={globals}
        surveyName={form.meta.name}
        // ha van logó url/dataUrl: (nem kötelező prop, nálad így volt használva)
        logoSrc={(globals as any).logoDataUrl || undefined}
      >
        <ReadOnlyForm form={form} answers={answers} />
      </A4Page>
    )

    // várjuk meg, hogy a layout elkészüljön
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })

    // html2canvas snapshot – nagyobb skála az élesebb képért
    const host = staging.firstElementChild as HTMLElement
    const canvas = await html2canvas(host, {
      backgroundColor: '#ffffff',
      scale: Math.max(2, window.devicePixelRatio || 1),
      useCORS: true,
      logging: false,
      width: A4_PX_W,
      // height: automatikus, a DOM-tól
    })

    const fullW = canvas.width
    const fullH = canvas.height

    // hány px legyen 1 oldal magassága? a szélességhez igazított A4 arány: Hpx = Wpx * (297/210)
    const pageHeightPx = Math.floor(fullW * (PAGE_H_MM / PAGE_W_MM))

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const scaleMmPerPx = PAGE_W_MM / fullW

    let yOffset = 0
    let first = true

    while (yOffset < fullH) {
      const sliceH = Math.min(pageHeightPx, fullH - yOffset)
      // vágjunk ki egy csíkot
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = fullW
      pageCanvas.height = sliceH
      const ctx = pageCanvas.getContext('2d')!
      ctx.drawImage(canvas, 0, yOffset, fullW, sliceH, 0, 0, fullW, sliceH)

      const dataUrl = pageCanvas.toDataURL('image/jpeg', 0.92)
      const imgWmm = PAGE_W_MM
      const imgHmm = sliceH * scaleMmPerPx

      if (!first) doc.addPage()
      doc.addImage(dataUrl, 'JPEG', 0, 0, imgWmm, imgHmm)
      first = false
      yOffset += sliceH
    }

    const ab = doc.output('arraybuffer')
    out[`${form.meta.name}.pdf`] = new Uint8Array(ab)
  }

  root.unmount()
  document.body.removeChild(staging)

  return out
}

// docker compose up -d --no-deps --force-recreate web