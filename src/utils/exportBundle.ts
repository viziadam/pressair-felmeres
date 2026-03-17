import type { FormData, AnswerMap, Globals } from '../types'
import type { ExportMode } from '../utils/fs' // ha ott van; ha nem, írd be: type ExportMode = 'visual' | 'vector'
import { sanitize } from '../utils/fs'         // ha itt van sanitize; ha nem, használd a sajátodat
import { exportForms1to1 } from './pdf_1to1'
import { buildPdfsVector } from './pdf_vector'

function u8ToPdfBlob(u8: Uint8Array) {
  const ab = u8.slice().buffer // slice() új Uint8Array-t ad, annak buffer-e ArrayBuffer
  return new Blob([ab], { type: 'application/pdf' })
}

type Bundle = Record<string, Blob>

export async function buildSurveyBundle(
  globals: Globals,
  forms: FormData[],
  answersMaps: Record<string, AnswerMap>,
  domByFormId: Record<string, HTMLElement | null>,
  mode: ExportMode = 'visual'
): Promise<Bundle> {
  const bundle: Bundle = {}

  if (mode === 'visual') {
    for (const f of forms) {
      const fid = String(f.meta.id)
      const el = domByFormId[fid] || null
      if (!el) continue

      const answers = answersMaps[fid] || {}
      const name = sanitize(f.meta.name || 'lap')

      const out = await exportForms1to1(
        [{ name: f.meta.name, el, form: f, answers }],
        { fontSizePx: 14, lineHeight: 1.45 }
      )

      const u8 =
        out instanceof Uint8Array ? out :
        Array.isArray(out) ? (out[0] as Uint8Array) :
        (Object.values(out as Record<string, Uint8Array>)[0] as Uint8Array)

      bundle[`${name}.pdf`] = u8ToPdfBlob(u8)
    }
  } else {
    // VECTOR mód esetén a meglévő builderedet használd
    const pdfs = await buildPdfsVector(globals, forms, answersMaps) // Record<string, Uint8Array>
    for (const [fname, u8] of Object.entries(pdfs)) {
      bundle[sanitize(fname) || 'lap.pdf'] = u8ToPdfBlob(u8)
    }
  }

  // survey.json mindig
  const snapshot = {
    globals,
    answersMaps,
    formIds: forms.map(f => f.meta.id),
    savedAt: new Date().toISOString(),
  }
  bundle['survey.json'] = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json',
  })

  if (Object.keys(bundle).length === 1 && bundle['survey.json']) {
    throw new Error('Nincs exportálható PDF (hiányzó DOM gyökerek).')
  }

  return bundle
}