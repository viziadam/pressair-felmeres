

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type Props = {
  value?: string;                       // mentett PNG dataURL (opcionális)
  onChange: (dataUrl?: string) => void; // pointer-up/clear után frissít
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  initialRect?: { w: number; h: number };
  onRectChange?: (rect: { w: number; h: number }) => void;
  emitInitialRect?: boolean; // ← ÚJ (alapértelmezés: false)
};

export default function InlineInkCanvas({
  value,
  onChange,
  minWidth = 220,
  maxWidth = 800,
  minHeight = 120,
  maxHeight = 800,
  initialRect,
  onRectChange,
  emitInitialRect
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Offscreen back buffer (BITMAP px-ben, mindig identity transzform)
  const backRef = useRef<HTMLCanvasElement | null>(null);

  // Flags/refs
  const initedRef = useRef(false);
  const dprRef = useRef(1);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const resizingRef = useRef(false);
  const resizingBusyRef = useRef(false); // reentrancia zár
  const loadTokenRef = useRef(0);        // async value onload guard

  // Méret állapot (CSS px)
  // const [wState, setWState] = useState<number|null>(null);
  // const [hState, setHState] = useState<number|null>(null);
  
  const [wState, setWState] = useState<number>(() =>
  initialRect?.w
    ? Math.round(Math.min(Math.max(initialRect.w, minWidth), maxWidth))
    : 0
);

const [hState, setHState] = useState<number>(() =>
  initialRect?.h
    ? Math.round(Math.min(Math.max(initialRect.h, minHeight), maxHeight))
    : 0
);

  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // Manuális sarok-húzáshoz
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startWRef = useRef(0);
  const startHRef = useRef(0);

  // Helpers
  const getCtx = () => canvasRef.current!.getContext('2d')!;
  const getBackCtx = () => backRef.current!.getContext('2d')!;

  // DPR-es, felhasználói rajzoláshoz beállított kontextus (látható vászon)
  const setupCtx = (ctx: CanvasRenderingContext2D, dpr: number) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  };

  // Látható vászon fehérre (CSS px-ben; ctx már skálázott a hívás előtt/után)
  const paintWhiteCSS = (ctx: CanvasRenderingContext2D, cssW: number, cssH: number, dpr: number) => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, Math.floor(cssW * dpr), Math.floor(cssH * dpr));
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.restore();
  };

  // Back buffer fehérre (BITMAP px-ben, identity)
  const paintWhitePX = (ctx: CanvasRenderingContext2D, pxW: number, pxH: number) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pxW, pxH);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, pxW, pxH);
  };

  useEffect(() =>{
    if (initialRect)
    {
      setWState(initialRect.w);
      setHState(initialRect.h);
      sizeRef.current = { w: initialRect.w, h: initialRect.h };
      console.log('itt vagyunk');

      const cssW = initialRect.w;
      const cssH = initialRect.h;

      const c = canvasRef.current!;
      const wrap = wrapRef.current!;
      const parent = wrap.parentElement || wrap;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      dprRef.current = dpr;

      // Látható vászon bitmap px
    const pxW = Math.max(1, Math.floor(cssW * dpr));
    const pxH = Math.max(1, Math.floor(cssH * dpr));
    c.width = pxW;
    c.height = pxH;

    const ctx = getCtx();
    setupCtx(ctx, dpr);
    paintWhiteCSS(ctx, cssW, cssH, dpr);

    // Back buffer létrehozás (bitmap px)
    backRef.current = document.createElement('canvas');
    backRef.current.width = pxW;
    backRef.current.height = pxH;

    const bctx = getBackCtx();
    paintWhitePX(bctx, pxW, pxH);

    // Inicializáló value betöltés (token guard)
    if (value) {
      const token = ++loadTokenRef.current;
      const img = new Image();
      img.onload = () => {
        if (token !== loadTokenRef.current) return; // lejárt betöltés
        // back (px)
        bctx.setTransform(1, 0, 0, 1, 0, 0);
        bctx.drawImage(img, 0, 0, backRef.current!.width, backRef.current!.height);
        // visible (css)
        ctx.drawImage(img, 0, 0, cssW, cssH);
      };
      img.src = value;
    }
    }
  }, [initialRect])

  // ---- initial mount
  useLayoutEffect(() => {
    const c = canvasRef.current!;
    const wrap = wrapRef.current!;
    const parent = wrap.parentElement || wrap;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    dprRef.current = dpr;

    // induló méret (CSS px)
    const parentW = parent.clientWidth || wrap.clientWidth || 600;
    let cssW = initialRect?.w ?? Math.min(Math.max(parentW, minWidth), maxWidth);
    let cssH = initialRect?.h ?? Math.min(Math.max(minHeight, minHeight), maxHeight);
    cssW = Math.round(Math.min(Math.max(cssW, minWidth), maxWidth));
    cssH = Math.round(Math.min(Math.max(cssH, minHeight), maxHeight));

    console.log('initialRect: ', initialRect);
    setWState(cssW);
    setHState(cssH);
    sizeRef.current = { w: cssW, h: cssH };
    const wrapEl = wrapRef.current!;
    wrapEl.style.width = `${cssW}px`;
    wrapEl.style.height = `${cssH}px`;
    // onRectChange?.({ w: cssW, h: cssH });
    if (emitInitialRect) {
  onRectChange?.({ w: cssW, h: cssH });
}

    // Látható vászon bitmap px
    const pxW = Math.max(1, Math.floor(cssW * dpr));
    const pxH = Math.max(1, Math.floor(cssH * dpr));
    c.width = pxW;
    c.height = pxH;

    const ctx = getCtx();
    setupCtx(ctx, dpr);
    paintWhiteCSS(ctx, cssW, cssH, dpr);

    // Back buffer létrehozás (bitmap px)
    backRef.current = document.createElement('canvas');
    backRef.current.width = pxW;
    backRef.current.height = pxH;

    const bctx = getBackCtx();
    paintWhitePX(bctx, pxW, pxH);

    // Inicializáló value betöltés (token guard)
    if (value) {
      const token = ++loadTokenRef.current;
      const img = new Image();
      img.onload = () => {
        if (token !== loadTokenRef.current) return; // lejárt betöltés
        // back (px)
        bctx.setTransform(1, 0, 0, 1, 0, 0);
        bctx.drawImage(img, 0, 0, backRef.current!.width, backRef.current!.height);
        // visible (css)
        ctx.drawImage(img, 0, 0, cssW, cssH);
      };
      img.src = value;
    }

    initedRef.current = true;
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // ---- external value changes: redraw onto both (token guarded)
  useEffect(() => {
    if (!initedRef.current || !value) return;
    const token = ++loadTokenRef.current;

    const dpr = dprRef.current;
    const cssW = sizeRef.current.w || wState || 600;
    const cssH = sizeRef.current.h || hState || 260;

    const ctx = getCtx();
    const bctx = getBackCtx();

    const img = new Image();
    img.onload = () => {
      if (token !== loadTokenRef.current) return; // másik betöltés közben
      // back px-ben
      paintWhitePX(bctx, backRef.current!.width, backRef.current!.height);
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.drawImage(img, 0, 0, backRef.current!.width, backRef.current!.height);
      // visible css-ben
      paintWhiteCSS(ctx, cssW, cssH, dpr);
      setupCtx(ctx, dpr);
      ctx.drawImage(img, 0, 0, cssW, cssH);
    };
    img.src = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Húzás közben CSS preview
  function resizeVisual(newCssW: number, newCssH: number) {
    const wrap = wrapRef.current!;
    wrap.style.width = `${newCssW}px`;
    wrap.style.height = `${newCssH}px`;
  }

  // ---- core resize (stabil, reentrancia-safe)
  function resizeTo(newCssW: number, newCssH: number) {
    if (resizingBusyRef.current) return; // reentrancia zár
    resizingBusyRef.current = true;

    try {
      // clamp CSS méretek
      newCssW = Math.round(Math.min(Math.max(newCssW, minWidth), maxWidth));
      newCssH = Math.round(Math.min(Math.max(newCssH, minHeight), maxHeight));

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      dprRef.current = dpr;

      const oldBack = backRef.current;
      if (!oldBack) return;

      const newPxW = Math.max(1, Math.floor(newCssW * dpr));
      const newPxH = Math.max(1, Math.floor(newCssH * dpr));

      // Új back (bitmap px)
      const newBack = document.createElement('canvas');
      newBack.width = newPxW;
      newBack.height = newPxH;

      const nb = newBack.getContext('2d')!;
      // előbb tisztázunk (px)
      paintWhitePX(nb, newPxW, newPxH);

      // Régi → új back másolás: identity, px→px
      const srcPxW = Math.min(oldBack.width, newPxW);
      const srcPxH = Math.min(oldBack.height, newPxH);
      if (srcPxW > 0 && srcPxH > 0) {
        nb.setTransform(1, 0, 0, 1, 0, 0);
        nb.drawImage(
          oldBack,
          0, 0, srcPxW, srcPxH,
          0, 0, srcPxW, srcPxH
        );
      }

      // Látható vászon bitmap px frissítés
      const c = canvasRef.current!;
      c.width = newPxW;
      c.height = newPxH;

      const ctx = getCtx();
      // Identity-ben rá a teljes back px→px
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(
        newBack,
        0, 0, newBack.width, newBack.height,
        0, 0, c.width,        c.height
      );

      // Vissza DPR-re a felhasználói rajzhoz (CSS px)
      setupCtx(ctx, dpr);

      // Állapotok
      backRef.current = newBack;
      setWState(newCssW);
      setHState(newCssH);
      sizeRef.current = { w: newCssW, h: newCssH };
      onRectChange?.({ w: newCssW, h: newCssH });
    } finally {
      resizingBusyRef.current = false;
    }
  }

  // ---- pointer drawing (mirror: visible CSS, back PX)
  function relXY(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();   //+
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = relXY(e);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || !lastRef.current) return;
    e.preventDefault();
    const { x, y } = relXY(e);
    const ctx = getCtx();
    const bctx = getBackCtx();
    const dpr = dprRef.current;

    // visible (CSS px, skálázott ctx)
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    // back (bitmap px, identity)
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.beginPath();
    bctx.moveTo(lastRef.current.x * dpr, lastRef.current.y * dpr);
    bctx.lineTo(x * dpr, y * dpr);
    bctx.lineWidth = 2 * dpr;
    bctx.lineCap = 'round';
    bctx.strokeStyle = '#000';
    bctx.stroke();

    lastRef.current = { x, y };
  }
  function end(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    drawingRef.current = false;
    lastRef.current = null;
    onChange(backRef.current!.toDataURL('image/png'));
  }

  function clearCanvas() {
    const dpr = dprRef.current;
    const cssW = sizeRef.current.w || wState || 600;
    const cssH = sizeRef.current.h || hState || 260;
    const ctx = getCtx();
    const bctx = getBackCtx();

    // back px-ben törlés
    paintWhitePX(bctx, backRef.current!.width, backRef.current!.height);
    // visible css-ben törlés
    paintWhiteCSS(ctx, cssW, cssH, dpr);
    setupCtx(ctx, dpr);

    onChange(undefined);
  }

  // ---- egérmozgás/engedés: CSS-preview húzás közben, végén egyszeri reallok
  useEffect(() => {
    let raf = 0;
    let lastW = 0, lastH = 0;

    // const onMove = (e: MouseEvent) => {
    //   if (!resizingRef.current) return;
    //   const dx = e.clientX - startXRef.current;
    //   const dy = e.clientY - startYRef.current;

    //   const nextW = Math.round(Math.min(Math.max(startWRef.current + dx, minWidth), maxWidth));
    //   const nextH = Math.round(Math.min(Math.max(startHRef.current + dy, minHeight), maxHeight));

    //   if (nextW === lastW && nextH === lastH) return;
    //   lastW = nextW; lastH = nextH;

    //   if (raf) cancelAnimationFrame(raf);
    //   raf = requestAnimationFrame(() => resizeVisual(nextW, nextH));
    // };

    const onMove = (e: PointerEvent) => {
    if (!resizingRef.current) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    const nextW = Math.round(Math.min(Math.max(startWRef.current + dx, minWidth), maxWidth));
    const nextH = Math.round(Math.min(Math.max(startHRef.current + dy, minHeight), maxHeight));

    if (nextW === lastW && nextH === lastH) return;
    lastW = nextW; lastH = nextH;

    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => resizeVisual(nextW, nextH));
  };

    const onUp = () => {
      if (!resizingRef.current) return;

      // kurzor/selection vissza
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      const wrap = wrapRef.current!;
      // végső méretek leolvasása, zero guard
      let finalW = Math.max(1, Math.round(wrap.clientWidth));
      let finalH = Math.max(1, Math.round(wrap.clientHeight));

      // egyszeri véglegesítés
      resizeTo(finalW, finalH);

      // inline méret törlése (vizuális stílus takarítás)
      wrap.style.width = '';
      wrap.style.height = '';

      // csak a legvégén engedjük el
      resizingRef.current = false;
    };

    // window.addEventListener('mousemove', onMove);
    // window.addEventListener('mouseup', onUp);
    // return () => {
    //   window.removeEventListener('mousemove', onMove);
    //   window.removeEventListener('mouseup', onUp);
    //   if (raf) cancelAnimationFrame(raf);
    // };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    if (raf) cancelAnimationFrame(raf);
  };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minWidth, maxWidth, minHeight, maxHeight]);

  // const onResizeStart = (e: React.MouseEvent) => {
  //   e.preventDefault();
  //   const wrap = wrapRef.current!;
  //   resizingRef.current = true;
  //   startXRef.current = e.clientX;
  //   startYRef.current = e.clientY;
  //   startWRef.current = Math.round(wrap.clientWidth);
  //   startHRef.current = Math.round(wrap.clientHeight);
  //   document.body.style.userSelect = 'none';
  //   document.body.style.cursor = 'nwse-resize';
  // };

  // --- resize start: MouseEvent -> PointerEvent és capture
const onResizeStart = (e: React.PointerEvent) => {
  e.preventDefault();
  const wrap = wrapRef.current!;
  resizingRef.current = true;
  startXRef.current = e.clientX;
  startYRef.current = e.clientY;
  startWRef.current = Math.round(wrap.clientWidth);
  startHRef.current = Math.round(wrap.clientHeight);
  (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'nwse-resize';
};

  return (
    <div
      ref={wrapRef}
      style={{
        maxWidth: '100%',
        position: 'relative',
        border: '1px solid #1f2937',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
        touchAction: 'none',
        userSelect: 'none',
        width: `${wState}px`,
        height: `${hState}px`,
      }}
    >
      <button
        type="button"
        onClick={clearCanvas}
        title="Törlés"
        style={{
          position: 'absolute',
          left: 8,
          bottom: 8,
          width: 24,
          height: 24,
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          background: '#fff',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 2,
          opacity: 0.85,
        }}
      >
        ×
      </button>

      {/* látható vászon */}
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onContextMenu={(e)=>e.preventDefault()}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      />

      {/* jobb-alsó sarok fogantyú – kétirányú resize */}
      <div
        // onMouseDown={onResizeStart}
        onPointerDown={onResizeStart}
        title="Méret változtatása"
        style={{
          position: 'absolute',
          right: 4,
          bottom: 4,
          width: 16,
          height: 16,
          border: '1px solid #d1d5db',
          borderRadius: 3,
          background: 'linear-gradient(135deg, #eef2f7 0%, #e5e7eb 100%)',
          boxShadow: 'inset -1px -1px 0 rgba(0,0,0,.06)',
          cursor: 'nwse-resize',
          zIndex: 2,
        }}
      />
    </div>
  );
}