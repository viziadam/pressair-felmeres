

// import React, { useRef, useEffect } from 'react';
// import InlineInkCanvas from './InlineInkCanvas';

// type Props = {
//   value?: string;
//   onChange: (val: string) => void;
//   onClear: () => void;
//   initialRect?: { w: number; h: number };
//   onRectChange?: (r: { w: number; h: number }) => void;
//   emitInitialRect?: boolean;
//   minHeight?: number; 
// };

// export default function ResizableInkBox({
//   value, onChange, onClear, initialRect, onRectChange, emitInitialRect = false, minHeight = 150
// }: Props) {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const appliedInitial = useRef(false);

//   // 1. Kezdeti mentett méret visszaállítása
//   useEffect(() => {
//     if (containerRef.current && !appliedInitial.current) {
//       if (initialRect && initialRect.h) {
//         containerRef.current.style.width = initialRect.w ? `${initialRect.w}px` : '100%';
//         containerRef.current.style.height = `${initialRect.h}px`;
//       } else {
//         containerRef.current.style.height = `${minHeight}px`;
//       }
//       appliedInitial.current = true;
//     }
//   }, [initialRect, minHeight]);

//   // 2. Az okos szinkronizáció
//   useEffect(() => {
//     const container = containerRef.current;
//     if (!container) return;

//     const canvas = container.querySelector('canvas');
//     if (!canvas) return;

//     let resizeTimeout: ReturnType<typeof setTimeout>;
//     const tempCanvas = document.createElement('canvas');
//     const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

//     const observer = new ResizeObserver((entries) => {
//       for (const entry of entries) {
//         const targetW = Math.round(entry.contentRect.width);
//         const targetH = Math.round(entry.contentRect.height);

//         // Ha a méret fizikailag megváltozott a húzástól
//         if (targetW > 0 && targetH > 0 && (canvas.width !== targetW || canvas.height !== targetH)) {
          
//           // A: Gyors másolat a memóriába (így nem tűnik el a rajz a folyamat közben)
//           tempCanvas.width = canvas.width;
//           tempCanvas.height = canvas.height;
//           if (tempCtx) {
//             tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
//             tempCtx.drawImage(canvas, 0, 0);
//           }

//           // B: Megadjuk a Canvasnak az új felbontást (itt keletkezik a fehér, üres terület a széleken)
//           canvas.width = targetW;
//           canvas.height = targetH;

//           // C: Visszamásoljuk az eredeti rajzot torzítás nélkül (pontosan a bal felső sarokba)
//           const ctx = canvas.getContext('2d');
//           if (ctx) {
//             ctx.drawImage(tempCanvas, 0, 0);
//           }

//           // D: A LEGFONTOSABB LÉPÉS
//           clearTimeout(resizeTimeout);
//           resizeTimeout = setTimeout(() => {
//             // Elmentjük az új méretet...
//             if (onRectChange) onRectChange({ w: targetW, h: targetH });
            
//             // ...ÉS AZONNAL ELMENTJÜK AZ ÚJ, KIBŐVÍTETT KÉPET IS!
//             // Így amikor a React újrarenderel, a komponens már az üres résszel bővített 
//             // képet kapja meg, így nem fogja széthúzni az eredeti vonalakat!
//             if (onChange) onChange(canvas.toDataURL());
            
//           }, 300);
//         }
//       }
//     });

//     observer.observe(container);

//     return () => {
//       observer.disconnect();
//       clearTimeout(resizeTimeout);
//       tempCanvas.width = 0;
//       tempCanvas.height = 0;
//     };
//   }, [onRectChange, onChange]);

//   return (
//     <div
//       ref={containerRef}
//       className="single-resizable-viewport"
//       style={{
//         position: 'relative',
//         marginTop: '8px',
//         resize: 'both',
//         overflow: 'hidden',
//         border: '1px solid #cbd5e1',
//         borderRadius: '8px',
//         backgroundColor: '#fafafa',
//         minWidth: '200px',
//         maxWidth: '100%', 
//         minHeight: `${minHeight}px`,
//         display: 'flex',
//         flexDirection: 'column'
//       }}
//     >
//       <button
//         type="button"
//         onClick={onClear}
//         title="Rajz/Komment törlése"
//         style={{
//           position: 'absolute', top: 6, right: 6, zIndex: 10,
//           background: '#ef4444', color: '#fff', border: 'none',
//           borderRadius: '50%', width: 24, height: 24,
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
//           boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//         }}
//       >
//         ×
//       </button>

//       <style>{`
//         .single-resizable-viewport > div { 
//           resize: none !important; 
//           width: 100% !important; 
//           height: 100% !important; 
//           flex: 1; 
//         }
//         .single-resizable-viewport canvas { 
//           width: 100% !important; 
//           height: 100% !important; 
//           display: block; 
//         }
//       `}</style>

//       <InlineInkCanvas
//         value={value}
//         onChange={onChange}
//         initialRect={initialRect}
//         onRectChange={() => {}} // Mi intézzük a ResizeObserverben az új logikával!
//         emitInitialRect={emitInitialRect}
//       />
//     </div>
//   );
// }

import React, { useRef, useEffect, useCallback } from 'react';
import InlineInkCanvas from './InlineInkCanvas';

type Props = {
  value?: string;
  onChange: (val: string) => void;
  onClear: () => void;
  initialRect?: { w: number; h: number };
  onRectChange?: (r: { w: number; h: number }) => void;
  emitInitialRect?: boolean;
  minHeight?: number; 
};

export default function ResizableInkBox({
  value, onChange, onClear, initialRect, onRectChange, emitInitialRect = false, minHeight = 150
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appliedInitial = useRef(false);

  // Átméretezés (Drag) állapotok
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0 });

  // 1. Kezdeti mentett méret visszaállítása
  useEffect(() => {
    if (containerRef.current && !appliedInitial.current) {
      if (initialRect && initialRect.h) {
        containerRef.current.style.width = initialRect.w ? `${initialRect.w}px` : '100%';
        containerRef.current.style.height = `${initialRect.h}px`;
      } else {
        containerRef.current.style.height = `${minHeight}px`;
      }
      appliedInitial.current = true;
    }
  }, [initialRect, minHeight]);

  // 2. A Canvas felbontásának véglegesítése (Csak átméretezés UTÁN fut le!)
  const finalizeResize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const canvas = container.querySelector('canvas');
    if (!canvas) return;

    const rect = container.getBoundingClientRect();
    const targetW = Math.round(rect.width);
    const targetH = Math.round(rect.height);

    if (targetW > 0 && targetH > 0 && (canvas.width !== targetW || canvas.height !== targetH)) {
      // Biztonsági mentés
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      // Új felbontás
      canvas.width = targetW;
      canvas.height = targetH;

      // Visszaállítás
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(tempCanvas, 0, 0);
      }

      // Mentés a React state-be
      if (onRectChange) onRectChange({ w: targetW, h: targetH });
      if (onChange) onChange(canvas.toDataURL());
    }
  }, [onChange, onRectChange]);


  // 3. EGYEDI ÁTMÉRETEZŐ LOGIKA (Mobil/Tablet kompatibilis)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault(); // Megakadályozzuk az oldal görgetését
    e.stopPropagation(); // Ne adjuk át a canvasnak a kattintást
    
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    
    const rect = containerRef.current!.getBoundingClientRect();
    startSize.current = { w: rect.width, h: rect.height };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    
    // Új méret számolása
    const newW = Math.max(200, startSize.current.w + (e.clientX - startPos.current.x));
    const newH = Math.max(minHeight, startSize.current.h + (e.clientY - startPos.current.y));

    // Csak a dobozt (CSS) méretezzük át, a Canvas pixeljeit még békén hagyjuk!
    containerRef.current.style.width = `${newW}px`;
    containerRef.current.style.height = `${newH}px`;
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);

    // Amikor elengedte az ujját/tollát, VÉGREHAJTJUK a canvas minőségi átméretezését
    finalizeResize();
  };

  // Biztonsági takarítás, ha a komponens megszűnne húzás közben
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="single-resizable-viewport"
      style={{
        position: 'relative',
        marginTop: '8px',
        // 'resize: both' KIVÉVE, mert átvettük az irányítást!
        overflow: 'hidden',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
        minWidth: '200px',
        maxWidth: '100%', 
        minHeight: `${minHeight}px`,
        display: 'flex',
        flexDirection: 'column',
        touchAction: 'none' // Nincs görgetés ezen a felületen
      }}
    >
      <button
        type="button"
        onClick={onClear}
        title="Rajz/Komment törlése"
        style={{
          position: 'absolute', top: 6, right: 6, zIndex: 10,
          background: '#ef4444', color: '#fff', border: 'none',
          borderRadius: '50%', width: 24, height: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        ×
      </button>

      {/* AZ ÚJ MOBIL/EGÉR ÁTMÉRETEZŐ FÜL */}
      <div
        onPointerDown={handlePointerDown}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '32px',
          height: '32px',
          cursor: 'nwse-resize',
          zIndex: 20,
          // Egy diszkrét szürke sáv a sarokban, hogy látszódjon, hol kell húzni
          background: 'linear-gradient(135deg, transparent 50%, #94a3b8 50%)',
          borderBottomRightRadius: '7px' // illeszkedik a dobozhoz
        }}
      />

      <style>{`
        .single-resizable-viewport {
          user-select: none;
          -webkit-user-select: none;
        }
        /* Csak a belső canvas containert nyújtjuk, a gombot és a fület nem */
        .single-resizable-viewport > div:last-of-type { 
          width: 100% !important; 
          height: 100% !important; 
          flex: 1; 
        }
        .single-resizable-viewport canvas { 
          width: 100% !important; 
          height: 100% !important; 
          display: block; 
          touch-action: none !important; 
        }
      `}</style>

      <InlineInkCanvas
        value={value}
        onChange={onChange}
        initialRect={initialRect}
        onRectChange={() => {}} 
        emitInitialRect={emitInitialRect}
      />
    </div>
  );
}