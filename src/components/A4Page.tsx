import type { PropsWithChildren } from 'react'
import type { Globals } from '../types'

import { useEffect, forwardRef } from 'react'

import logoUrl from '../public/pressair_logo.png?url'

type Props = PropsWithChildren<{
  globals: Globals
  surveyName: string
  logoSrc?: string | null
}>

// export default function A4Page({ globals, surveyName, children, logoSrc }: Props){
//   const src = logoSrc ?? logoUrl ?? null

//   return (
//     <section className="a4">
//       <header className="a4-header">
//         <div className="header-top">
//           <div className="logo-box" style={{ position:'relative', overflow:'hidden' }}>
//             {src ? (
//               <img
//                 src={src}
//                 alt="Céglogó"
//                 style={{
//                   width:'100%', height:'100%',
//                   objectFit:'contain', objectPosition:'left center',
//                 }}
//               />
//             ) : (
//               <span>LOGÓ HELYE</span>
//             )}
//           </div>
//           <div className="a4-title">
//             <h1>{globals.companyName || 'Cégnév'} – {surveyName}</h1>
//             <div className="small">
//               Telephely: {globals.site || '-'} &nbsp;•&nbsp; Tel: {globals.phone || '-'} &nbsp;•&nbsp; Email: {globals.email || '-'}
//             </div>
//           </div>
//         </div>
//         {/* elválasztó vonal */}
//         <div className="header-separator"></div>
//       </header>

//       <div className="a4-content">
//         {children}
//       </div>
//       {/* <div className="a4-footer small">
//         Jegyzőkönyv – automatikusan generálva
//       </div> */}
//     </section>
//   )
// }

// export default function A4Page({ globals, surveyName, children, logoSrc }: Props){
const A4Page = forwardRef<HTMLDivElement, Props>(function A4Page(
  { children, globals, surveyName, logoSrc }, ref
){
  const src = logoSrc ?? logoUrl ?? null
  const HEADER_H = 130; // px – ehhez igazítjuk a logót

  const rows: Array<{label:string; value:string}> = [
    { label: 'Telephely', value: globals.site || '-' },
    { label: 'Kapcsolattartó', value: [globals.contactName, globals.contactTitle].filter(Boolean).join(', ') || '-' },
    { label: 'Telefonszám', value: globals.phone || '-' },
    { label: 'Email', value: globals.email || '-' },
    { label: 'Dátum', value: globals.date || '-' },
    { label: 'Felmérő', value: globals.inspectorName || '-' },
  ];

  

  return (
    // <section className="a4">
    <div ref={ref} className="a4-page">
      <header className="a4-header" style={{ padding: '12px 16px' }}>
        <div
          className="header-top"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            minHeight: HEADER_H,
          }}
        >
          {/* BAL: LOGÓ – négyzetes doboz, a fejléc magasságához igazítva */}
          <div
            className="logo-box"
            style={{
              height: HEADER_H,
              aspectRatio: '1 / 1',
              width: 320,            // aspectRatio fallback régi böngészőkre
              // border: '1px solid #e5e7eb',
              // borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            {src ? (
              <img
                src={src}
                alt="Céglogó"
                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
              />
            ) : (
              <span style={{ fontSize: 12, color: '#9ca3af' }}>LOGÓ</span>
            )}
          </div>

          {/* JOBB: Cím + adatlista (jobbra zárt kártya) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', columnGap: 16, width: '100%' }}>
            <div className="a4-title" style={{ alignSelf: 'start' }}>
              <h1 style={{ margin: 0, fontSize: 18, lineHeight: '24px' }}>
                { (surveyName || '')}
              </h1>
              <div className="small" style={{ color: '#6b7280', marginTop: 2 }}>
                Jegyzőkönyv / Felmérési lap
              </div>
            </div>

            <div
              style={{
                justifySelf: 'end',
                alignSelf: 'stretch',
                border: '1px solid #e5e7eb',
                // borderRadius: 8,
                padding: '10px 12px',
                minWidth: 280,
                background: '#fafafa',
              }}
            >
              {rows.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '130px 1fr',
                    gap: 8,
                    alignItems: 'baseline',
                    padding: '2px 0',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{r.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* elválasztó vonal */}
        <div className="header-separator" style={{ height: 1, background: '#e5e7eb', marginTop: 12 }} />
      </header>

      <div className="a4-content">
        {children}
      </div>
      {/* <div className="a4-footer small">Jegyzőkönyv – automatikusan generálva</div> */}
    {/* </section> */}
    </div>
  )
})

export default A4Page;