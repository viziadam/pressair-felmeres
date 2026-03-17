import { useEffect, useRef, useState } from 'react'
import Tesseract from 'tesseract.js'

type Props = {
  initialImage?: string
  onClose: () => void
  onSaveComment: (dataUrl: string) => void   // kézírás mint kép (komment)
  onPasteText: (text: string) => void        // OCR eredmény beillesztése a mezőbe
  lang?: string                               // pl. 'hun' vagy 'eng+hun'
}

export default function HandwritingPad({
  initialImage,
  onClose,
  onSaveComment,
  onPasteText,
  lang = 'eng+hun',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [last, setLast] = useState<{ x: number; y: number } | null>(null)
  const [busy, setBusy] = useState<null | 'ocr'>(null)
  const [progress, setProgress] = useState(0)

  // vászon előkészítés (HiDPI)
  useEffect(() => {
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const cssW = 760
    const cssH = 400
    c.width = Math.floor(cssW * dpr)
    c.height = Math.floor(cssH * dpr)
    c.style.width = cssW + 'px'
    c.style.height = cssH + 'px'
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, cssW, cssH)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'

    if (initialImage) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, cssW, cssH)
      img.src = initialImage
    }
  }, [initialImage])

  function relXY(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    setDrawing(true)
    setLast(relXY(e))
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing || !last) return
    const { x, y } = relXY(e)
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    setLast({ x, y })
  }
  function end(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId)
    setDrawing(false)
    setLast(null)
  }

  function handleClear() {
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.restore()
  }

  function handleSaveComment() {
    const dataUrl = canvasRef.current!.toDataURL('image/png')
    onSaveComment(dataUrl)
  }

  async function handlePasteOCR() {
    try {
      setBusy('ocr')
      setProgress(0)
      const dataUrl = canvasRef.current!.toDataURL('image/png')
      const { data } = await Tesseract.recognize(dataUrl, lang, {
        // progress callback (0..1)
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setProgress(Math.round(m.progress * 100))
          }
        },
      })
      const text = (data.text || '').replace(/\r/g, '').trim()
      onPasteText(text)
    } catch (e) {
      console.error('OCR hiba:', e)
      onPasteText('') // ne akadjon fenn; hívó oldalon kezelhető
    } finally {
      setBusy(null)
      setProgress(0)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: '#0b1220',
          border: '1px solid #1f2937',
          borderRadius: 12,
          padding: 12,
          width: 820,
          boxShadow: '0 10px 24px rgba(0,0,0,.45)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <strong>Kézírás panel</strong>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={handleClear} disabled={!!busy}>Törlés</button>
            <button className="btn" onClick={handleSaveComment} disabled={!!busy}>Komment (kép)</button>
            <button className="btn success" onClick={handlePasteOCR} disabled={!!busy}>
              {busy === 'ocr' ? `Beilleszt (OCR… ${progress}%)` : 'Beilleszt (OCR)'}
            </button>
            <button className="btn danger" onClick={onClose} disabled={!!busy}>Bezár</button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          style={{ background: '#fff', borderRadius: 8, touchAction: 'none', width: '100%', display: 'block' }}
        />

        <p className="small">
          Tipp: A „Komment (kép)” a rajzot csatolja a mező alá. A „Beilleszt (OCR)” a rajzból felismert szöveget
          írja be közvetlenül a mezőbe (eng+hun). A felismerés pontossága függ az írás olvashatóságától.
        </p>
      </div>
    </div>
  )
}

// import { useEffect, useRef, useState } from 'react';

// type Props = {
//   initialImage?: string;
//   initialText?: string;
//   onClose: () => void;
//   onSaveComment: (dataUrl: string) => void; // vászon mentése képként (komment)
//   onPasteText: (text: string) => void;      // a beírt szöveg visszaadása (beilleszt)
// };

// export default function HandwritingPad({
//   initialImage,
//   initialText,
//   onClose,
//   onSaveComment,
//   onPasteText
// }: Props) {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [drawing, setDrawing] = useState(false);
//   const [last, setLast] = useState<{ x: number; y: number } | null>(null);
//   const [typedText, setTypedText] = useState(initialText || '');

//   // HiDPI skálázás és vászon inicializálás
//   useEffect(() => {
//     const c = canvasRef.current!;
//     const ctx = c.getContext('2d')!;
//     const dpr = Math.max(1, window.devicePixelRatio || 1);
//     const cssW = 760;
//     const cssH = 400;
//     c.width = Math.floor(cssW * dpr);
//     c.height = Math.floor(cssH * dpr);
//     c.style.width = cssW + 'px';
//     c.style.height = cssH + 'px';
//     ctx.scale(dpr, dpr);

//     ctx.fillStyle = '#fff';
//     ctx.fillRect(0, 0, cssW, cssH);
//     ctx.lineWidth = 2;
//     ctx.lineCap = 'round';
//     ctx.strokeStyle = '#000';

//     if (initialImage) {
//       const img = new Image();
//       img.onload = () => ctx.drawImage(img, 0, 0, cssW, cssH);
//       img.src = initialImage;
//     }
//   }, [initialImage]);

//   function relXY(e: React.PointerEvent<HTMLCanvasElement>) {
//     const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
//     return { x: e.clientX - rect.left, y: e.clientY - rect.top };
//   }
//   function start(e: React.PointerEvent<HTMLCanvasElement>) {
//     (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
//     setDrawing(true);
//     setLast(relXY(e));
//   }
//   function move(e: React.PointerEvent<HTMLCanvasElement>) {
//     if (!drawing || !last) return;
//     const { x, y } = relXY(e);
//     const ctx = canvasRef.current!.getContext('2d')!;
//     ctx.beginPath();
//     ctx.moveTo(last.x, last.y);
//     ctx.lineTo(x, y);
//     ctx.stroke();
//     setLast({ x, y });
//   }
//   function end(e: React.PointerEvent<HTMLCanvasElement>) {
//     (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
//     setDrawing(false);
//     setLast(null);
//   }

//   function handleClear() {
//     const c = canvasRef.current!;
//     const ctx = c.getContext('2d')!;
//     ctx.save();
//     ctx.setTransform(1, 0, 0, 1, 0, 0);
//     ctx.fillStyle = '#fff';
//     ctx.fillRect(0, 0, c.width, c.height);
//     ctx.restore();
//   }

//   function handleSaveComment() {
//     const dataUrl = canvasRef.current!.toDataURL('image/png');
//     onSaveComment(dataUrl);
//   }

//   function handlePasteText() {
//     onPasteText(typedText.trim());
//   }

//   return (
//     <div
//       style={{
//         position: 'fixed',
//         inset: 0,
//         background: 'rgba(0,0,0,.5)',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         zIndex: 9999
//       }}
//     >
//       <div
//         style={{
//           background: '#0b1220',
//           border: '1px solid #1f2937',
//           borderRadius: 12,
//           padding: 12,
//           width: 820,
//           boxShadow: '0 10px 24px rgba(0,0,0,.45)'
//         }}
//       >
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
//           <strong>Kézírás panel</strong>
//           <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
//             <button className="btn" onClick={handleClear}>Törlés</button>
//             <button className="btn success" onClick={handleSaveComment}>Mentés kommentként</button>
//             <button className="btn" onClick={handlePasteText}>Beilleszt szövegként</button>
//             <button className="btn danger" onClick={onClose}>Bezár</button>
//           </div>
//         </div>

//         <canvas
//           ref={canvasRef}
//           onPointerDown={start}
//           onPointerMove={move}
//           onPointerUp={end}
//           onPointerCancel={end}
//           style={{ background: '#fff', borderRadius: 8, touchAction: 'none', width: '100%', display: 'block' }}
//         />

//         <div style={{ marginTop: 10 }}>
//           <label className="small">Beírt / felismert szöveg (opcionális, ezt illesztem be a mezőbe):</label>
//           <textarea
//             className="input"
//             rows={3}
//             value={typedText}
//             onChange={(e) => setTypedText(e.target.value)}
//             placeholder="Ide írhatod, amit a mezőbe szeretnél illeszteni…"
//           />
//         </div>

//         <p className="small">Tipp: A „Mentés kommentként” a kézírást képként csatolja. A „Beilleszt szövegként” a fenti szöveget írja a mezőbe, és elrejti a mezőt, amíg újra nem kéred.</p>
//       </div>
//     </div>
//   );
// }