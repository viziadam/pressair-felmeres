import React from "react";
import './FormComponents.css';
// types
import { FileItem } from "../types";

type ImageUploaderWithInkProps = {
  value: FileItem[];
  onChange: (v: FileItem[]) => void;
  //isTitle?: boolean;
};
export function ImageUploaderWithInk({ value, onChange }: ImageUploaderWithInkProps) {
  // const handleFiles = async (fileList: File[]) => {
  //   const models: FileItem[] = await Promise.all(fileList.map(async f => {
  //     const dataUrl = await new Promise<string>((res, rej) => {
  //       const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f);
  //     });
  //     return { name: f.name, type: f.type || 'image/png', dataUrl };
  //   }));
  //   onChange([...value, ...models]);
  // };

  // handleFiles — opcionális EXIF/rotáció normalizálás
const handleFiles = async (fileList: File[]) => {
  const models: FileItem[] = await Promise.all(fileList.map(async f => {
    // 1) próbáljuk createImageBitmap-kel beolvasni EXIF szerint
    try {
      const bmp = await createImageBitmap(f, { imageOrientation: 'from-image' as any });
      const off = document.createElement('canvas');
      off.width = bmp.width; off.height = bmp.height;
      const ctx = off.getContext('2d')!;
      ctx.drawImage(bmp, 0, 0);
      const dataUrl = off.toDataURL('image/png');
      return { name: f.name, type: 'image/png', dataUrl };
    } catch {
      // 2) fallback: sima FileReader (mindenképp működik)
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f);
      });
      return { name: f.name, type: f.type || 'image/png', dataUrl };
    }
  }));
  onChange([...(value || []), ...models]);
};

 

  const removeAt = (idx: number) => {
    const next = value.slice(); next.splice(idx, 1); onChange(next);
  };

 const [camOpen, setCamOpen] = React.useState(false);
const [facing, setFacing] = React.useState<"environment" | "user">("environment");
const streamRef = React.useRef<MediaStream | null>(null);
const videoRef = React.useRef<HTMLVideoElement>(null);
const fileInputRef = React.useRef<HTMLInputElement>(null);

async function openCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing },
      audio: false,
    });
    streamRef.current = stream;
    setCamOpen(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    }, 0);
  } catch (e) {
    console.error("Camera open failed", e);
    fileInputRef.current?.click(); // fallback: fájlválasztó
  }
}

function stopCamera() {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }
  setCamOpen(false);
}

async function capturePhoto() {
  const video = videoRef.current;
  if (!video) return;
  const canvas = document.createElement("canvas");
  const w = video.videoWidth || 1280;
  const h = video.videoHeight || 720;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0, w, h);
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], `photo_${Date.now()}.png`, { type: "image/png" });
    await handleFiles([file]);
    stopCamera();
  }, "image/png", 0.92);
}

// takarítás unmount-kor
React.useEffect(() => () => stopCamera(), []);

  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      {/* <input
        type="file" accept="image/*" multiple
        onChange={(e)=> handleFiles(Array.from(e.target.files || []))}
      /> */}
      <input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  multiple
  style={{ display: 'none' }}
  onChange={(e)=> handleFiles(Array.from(e.target.files || []))}
/>

<div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
  <button type="button" onClick={() => fileInputRef.current?.click()}>
    Kép feltöltése
  </button>
  <button type="button" onClick={openCamera}>
    Fénykép készítése (közvetlen)
  </button>
</div>

      {value.length>0 && (
        <div className="image-grid">
          {value.map((f, i)=>(
            // <ImageTile
            //   key={i}
            //   file={f}
            //   onBake={(dataUrl)=>{ const next=[...value]; next[i]={...f, dataUrl}; onChange(next); }}
            //   onRemove={()=>removeAt(i)}
            // />

            <ImageTile
              key={i}
              file={f}
              onBake={(dataUrl)=>{ const next=[...value]; next[i]={...f, dataUrl}; onChange(next); }}
              onRemove={()=>removeAt(i)}
              onResize={(w:number,h:number)=>{                   // típus: number, ne any
              const next=[...value];
              const cur = next[i] || f;
              const chg = Math.abs((cur.wPx||0)-w)>1 || Math.abs((cur.hPx||0)-h)>1;
              if (chg) { next[i] = { ...cur, wPx: Math.round(w), hPx: Math.round(h) }; onChange(next); }
              }}
              />
          ))}

          
        </div>
      )}
    {camOpen && (
  <div
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}
    onClick={(e)=>{ if (e.target === e.currentTarget) stopCamera(); }}
  >
    <div style={{ background:'#111', borderRadius:12, padding:12, width:'min(92vw, 720px)' }}>
      <div style={{ position:'relative', width:'100%', paddingTop:'56.25%', borderRadius:8, overflow:'hidden' }}>
        <video
          ref={videoRef}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
          playsInline
          muted
          autoPlay
        />
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'space-between', marginTop:12 }}>
        <div style={{ display:'flex', gap:8 }}>
          <button type="button" onClick={capturePhoto}>Fénykép</button>
          <button type="button" onClick={()=>setFacing(p=>p==="environment"?"user":"environment")}>
            Kamera váltás
          </button>
        </div>
        <button type="button" onClick={stopCamera}>Mégse</button>
      </div>
    </div>
  </div>
)}
</div>
      
  );
}

 const IconBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({children, ...rest}) => (
   <button type="button" {...rest} title={rest.title} aria-label={rest['aria-label']}>
     {children}
   </button>
 );

type ImageTileProps = {
  file: FileItem;
  onBake: (dataUrl: string)=>void;
  onRemove: ()=>void;
  onResize?: (w: number, h: number)=>void;   // <-- EZ KELL
};
// 2) BŐVÍTÉS: vedd át a props-ból
function ImageTile({ file, onBake, onRemove, onResize }: ImageTileProps) {  // <-- EZ KELL
  const boxRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [drawEnabled, setDrawEnabled] = React.useState(true);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [last, setLast] = React.useState<{x:number,y:number}|null>(null);
  const [strokeWidth, setStrokeWidth] = React.useState(3);

  const rafRef = React.useRef<number | null>(null);
  const pendingSizeRef = React.useRef<{ w: number; h: number } | null>(null);

  const lastSizeRef = React.useRef<{w:number,h:number}>({w:0,h:0}); 


  // // size canvas to box
  // const syncCanvasSize = React.useCallback(()=>{
  //   const box = boxRef.current!, c = canvasRef.current!;
  //   const dpr = window.devicePixelRatio || 1;
  //   const w = box.clientWidth, h = Math.max(box.clientHeight, 160);
  //   c.style.width = w+'px'; c.style.height = h+'px';
  //   c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr);
  // }, []);

   const originalRef = React.useRef<string | null>(null);
  React.useEffect(() => {
   if (!originalRef.current && file?.dataUrl) {
     // csak egyszer rögzítjük az elsőként látott, annotáció nélküli képet
     originalRef.current = file.dataUrl;
   }
 }, [file?.dataUrl]);

  // 3) HÍVÁS: a méret-szinkron végén jelezd vissza a px-méretet
  // const syncCanvasSize = React.useCallback(()=>{
  //   const box = boxRef.current!, c = canvasRef.current!;
  //   const dpr = window.devicePixelRatio || 1;
  //   const w = box.clientWidth;
  //   const h = box.clientHeight; // min-height menjen CSS-ből, ne itt JS-sel
  //   c.style.width = w + 'px'; c.style.height = h + 'px';
  //   c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr);

  //   if (onResize) {
  //     const last = lastSizeRef.current;
  //     if (Math.abs(last.w - w) > 1 || Math.abs(last.h - h) > 1) {
  //         pendingSizeRef.current = { w, h };
  //     if (rafRef.current) cancelAnimationFrame(rafRef.current);
  //       rafRef.current = requestAnimationFrame(() => {
  //       const p = pendingSizeRef.current!;
  //       lastSizeRef.current = p;
  //       onResize(p.w, p.h);
  //       rafRef.current = null;
  //     });
  //   }
  //       }
  // }, [onResize]);

  const syncCanvasSize = React.useCallback(()=>{
  const box = boxRef.current!, c = canvasRef.current!;
  const dpr = window.devicePixelRatio || 1;
  const w = box.clientWidth;
  const h = box.clientHeight; // min-height menjen CSS-ből, ne itt JS-sel
  c.style.width = w + 'px'; c.style.height = h + 'px';
  c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr);

  // Itt NEM hívunk onResize-t. Csak a fogantyú elengedésekor mentsünk.
  lastSizeRef.current = { w, h };
}, []);

  React.useEffect(()=>{ syncCanvasSize(); const ro = new ResizeObserver(syncCanvasSize); if(boxRef.current) ro.observe(boxRef.current); return ()=>ro.disconnect();},[syncCanvasSize]);


  React.useEffect(() => {
  // ha már van eltárolt méret, állítsuk rá azonnal a boxot is
  const box = boxRef.current;
  if (!box) return;
  if (file.wPx) box.style.width = `${file.wPx}px`;
  if (file.hPx) box.style.height = `${file.hPx}px`;
  // és méretezzük a canvast ehhez
  syncCanvasSize();
  // csak file.wPx/hPx változásakor fusson
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [file.wPx, file.hPx]);
  // const onPointerDown = (e: React.PointerEvent) => {
  //   if(!drawEnabled) return;
  //   const c = canvasRef.current!; c.setPointerCapture(e.pointerId);
  //   setIsDrawing(true);
  //   const r = c.getBoundingClientRect();
  //   setLast({ x: e.clientX - r.left, y: e.clientY - r.top });
  // };
  const onPointerDown = (e: React.PointerEvent) => {
  const c = canvasRef.current!;
  const r = c.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;

  c.setPointerCapture(e.pointerId);
  setIsDrawing(true);
  setLast({ x, y });
};

  const onPointerMove = (e: React.PointerEvent) => {
    if(!drawEnabled || !isDrawing || !last) return;
    const c = canvasRef.current!, ctx = c.getContext('2d')!;
    const r = c.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    // scale for DPR
    const sx = c.width / c.clientWidth, sy = c.height / c.clientHeight;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = strokeWidth * ((sx+sy)/2);
    ctx.beginPath();
    ctx.moveTo(last.x * sx, last.y * sy);
    ctx.lineTo(x * sx, y * sy);
    ctx.stroke();
    setLast({x,y});
  };
  // const onPointerUp = (e: React.PointerEvent) => {
  //   if(!drawEnabled) return;
  //   canvasRef.current!.releasePointerCapture(e.pointerId);
  //   setIsDrawing(false); setLast(null);
  // };

  const endDrawing = (e?: React.PointerEvent) => {
  if (e && canvasRef.current?.hasPointerCapture(e.pointerId)) {
    canvasRef.current.releasePointerCapture(e.pointerId);
  }
  setIsDrawing(false);
  setLast(null);
};

const MIN_W = 180;
const MIN_H = 160;
const dragStartRef = React.useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);

const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.currentTarget.setPointerCapture(e.pointerId);
  const box = boxRef.current!;
  dragStartRef.current = {
    sx: e.clientX,
    sy: e.clientY,
    sw: box.clientWidth,
    sh: box.clientHeight,
  };
};

const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!dragStartRef.current) return;
  const box = boxRef.current!;
  const s = dragStartRef.current;

  const dx = e.clientX - s.sx;
  const dy = e.clientY - s.sy;

  // Clamp: ne nőjön nagyobbra, mint a viewport (így nem erőltetünk ki scrollbart)
  const maxW = window.innerWidth;
  const maxH = window.innerHeight;

  const w = Math.max(MIN_W, Math.min(maxW, s.sw + dx));
  const h = Math.max(MIN_H, Math.min(maxH, s.sh + dy));

  // közvetlen inline méretezés
  box.style.width = w + 'px';
  box.style.height = h + 'px';

  // opcionális: azonnal szinkronizáljuk a canvast (különben a ResizeObserver is le fogja követni)
  syncCanvasSize();
};

// const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
//   if (e.currentTarget.hasPointerCapture(e.pointerId)) {
//     e.currentTarget.releasePointerCapture(e.pointerId);
//   }
//   dragStartRef.current = null;
// };

const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }
  // Végső méret leolvasása és egyszeri mentés
  const box = boxRef.current!;
  const w = Math.round(box.clientWidth);
  const h = Math.round(box.clientHeight);
  if (onResize) onResize(w, h); // → parent onChange → setVal → saveAnswersLocal
  dragStartRef.current = null;
};

const onPointerUp = (e: React.PointerEvent) => { endDrawing(e); };
const onPointerLeave = (e: React.PointerEvent) => { if (isDrawing) endDrawing(e); };
const onPointerCancel = (e: React.PointerEvent) => { if (isDrawing) endDrawing(e); };

  const bakeToImage = () => {
    if(!file.dataUrl || !imgRef.current || !canvasRef.current) return;
    const img = imgRef.current;
    const overlay = canvasRef.current;
    const off = document.createElement('canvas');
    off.width = img.naturalWidth; off.height = img.naturalHeight;
    const ctx = off.getContext('2d')!;
    ctx.drawImage(img, 0, 0, off.width, off.height);
    ctx.drawImage(overlay, 0, 0, off.width, off.height);
    onBake(off.toDataURL('image/png'));
  };

  const clearOverlay = () => {
    const c = canvasRef.current!, ctx = c.getContext('2d')!;
    ctx.clearRect(0,0,c.width,c.height);
  };

  React.useEffect(() => {
  return () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };
  }, []);

  const HANDLE_GAP = 14;

  return (
    <div className="image-tile">
      <div
  className="resize-box"
  ref={boxRef}
  style={{
    // ha van eltárolt méret, már első renderen állítsuk be:
    width:  (file.wPx ? `${file.wPx}px` : undefined),
    height: (file.hPx ? `${file.hPx}px` : undefined),
  }}
>
        {file.dataUrl && (
          <>
            <img ref={imgRef} src={file.dataUrl} alt={file.name} draggable={false}
            onLoad={() => {
              if (!boxRef.current || !imgRef.current) return;
              if (file.wPx && file.hPx) return; // már mentett méret

              // a doboz tényleges mérete (CSS px)
              const box = boxRef.current;
              let w = Math.round(box.clientWidth);
              let h = Math.round(box.clientHeight);

              // ha a box magassága még 0, számoljuk aránnyal az img természetes méretéből
              if (!h || h < 1) {
                const img = imgRef.current;
                const ratio = img.naturalHeight / Math.max(1, img.naturalWidth);
                h = Math.max(160, Math.round(w * ratio)); // tarts egy alsó limitet
                }

              onResize?.(w, h); // egyszeri persist az aktuális renderelt méretre
              }}
            />
            <canvas
              ref={canvasRef}
              className="annotation-canvas active"
              style={{ position:'absolute', inset: 0, touchAction: 'none', zIndex: 1 }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerLeave}
              onPointerCancel={onPointerCancel}
            />
            <div
              className="resize-handle"
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
                style={{ position: 'absolute', right: 0 ,bottom: 0, width: 16, height: 16, cursor: 'se-resize', zIndex: 2, }}
/>
          </>
        )}
      </div>
      <div className="tile-actions">
        <span className="small" title={file.name}>{file.name}</span>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <label className="small">Vastagság</label>
          <input type="range" min={1} max={12} value={strokeWidth} onChange={e=>setStrokeWidth(Number(e.target.value))} />
          {/* <button type="button" onClick={()=>setDrawEnabled(v=>!v)}>
            {drawEnabled ? 'Rajzolás kikapcs' : 'Rajzolás bekapcs'}
          </button> */}
          {/* <button type="button" onClick={clearOverlay}>Törlés</button>
          <button type="button" onClick={bakeToImage}>Mentés a képre</button>
          <button type="button" onClick={onRemove}>Eltávolítás</button> */}
          + {/* CLEAR OVERLAY (radír ikon) */}
 <IconBtn aria-label="Clear annotation" title="Clear annotation" onClick={clearOverlay}>
   <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
     <path d="M16.24 3.56a3 3 0 0 1 4.24 4.24L10.83 17.44a3 3 0 0 1-2.12.88H5a1 1 0 0 1 0-2h3.71L16.24 3.56zM13.41 20a1 1 0 0 1 0-2H21a1 1 0 0 1 0 2h-7.59z"/>
   </svg>
 </IconBtn>

 {/* BAKE TO IMAGE (floppy ikon) */}
 {/* <IconBtn aria-label="Save to image" title="Save to image" onClick={bakeToImage}>
   <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
     <path d="M17 3H5a2 2 0 0 0-2 2v14h18V7l-4-4zM6 5h9v4H6V5zm6 14a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
   </svg>
 </IconBtn> */}

 <IconBtn
  aria-label="Save to image"
  title="Save to image"
  onClick={() => { bakeToImage(); clearOverlay(); }}
>
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M17 3H5a2 2 0 0 0-2 2v14h18V7l-4-4zM6 5h9v4H6V5zm6 14a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
  </svg>
</IconBtn>

 {/* DELETE == REVERT TO ORIGINAL (undo ikon) */}
 <IconBtn
   aria-label="Revert to original"
   title="Revert to original"
   onClick={()=>{
     const orig = originalRef.current || file?.dataUrl || '';
     if (orig) onBake(orig);   // visszaállítjuk az eredeti képet
     clearOverlay();           // és töröljük az overlayt
   }}
 >
   <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
     <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6a6 6 0 0 1-6 6H6v2h6a8 8 0 1 0 0-16z"/>
   </svg>
 </IconBtn>

 {/* TILE REMOVE (trash ikon) */}
 <IconBtn aria-label="Remove image" title="Remove image" onClick={onRemove}>
   <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
     <path d="M6 7h12l-1 14H7L6 7zm9-4 1 2h4v2H4V5h4l1-2h6z"/>
   </svg>
 </IconBtn>
        </div>
      </div>
    </div>
  );
}

type FileUploaderProps = {
  value: FileItem[];
  onChange: (v: FileItem[]) => void;
};
export function FileUploader({ value, onChange }: FileUploaderProps) {
  const handleFiles = async (fileList: File[]) => {
    const models: FileItem[] = await Promise.all(fileList.map(async f=>{
      const isImg = f.type.startsWith('image/');
      const dataUrl = isImg ? await new Promise<string>((res,rej)=>{
        const r = new FileReader(); r.onload = ()=>res(String(r.result)); r.onerror=rej; r.readAsDataURL(f);
      }) : undefined;
      return { name: f.name, type: f.type || 'application/octet-stream', dataUrl };
    }));
    onChange([...(value||[]), ...models]);
  };

  const removeAt = (idx: number) => {
    const next = value.slice(); next.splice(idx, 1); onChange(next);
  };

  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      <input type="file" multiple onChange={(e)=>handleFiles(Array.from(e.target.files || []))}/>
      {value?.length>0 && (
        <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
          {value.map((f,i)=> f.dataUrl
            ? (<div key={i} style={{width:96}}>
                <img src={f.dataUrl} alt={f.name} style={{width:'100%', height:72, objectFit:'cover', border:'1px solid var(--border)', borderRadius:6}}/>
                <div className="small" style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={f.name}>{f.name}</div>
                <button type="button" className="small" onClick={()=>removeAt(i)}>Eltávolítás</button>
              </div>)
            : (<div key={i} className="small" style={{border:'1px dashed var(--border)', borderRadius:6, padding:6}} title={f.name}>
                {f.name}
                <button type="button" className="small" style={{marginLeft:8}} onClick={()=>removeAt(i)}>X</button>
              </div>)
          )}
        </div>
      )}
    </div>
  );
}