

// server/src/offline/offline.ts
import express, { type Request, type Response, type NextFunction, type Router } from "express";
import path from "node:path";
import fs from "node:fs";

// --- GOLYÓÁLLÓ ÚTVONAL KERESŐ ---
// Mivel a TypeScript (tsc) nem másolja át a .js és .webmanifest fájlokat a dist mappába,
// meg kell keresnünk az eredeti 'src' mappát a Docker konténeren belül.
let assetsDir = path.join(__dirname, "assets"); // Fallback

const possiblePaths = [
  path.resolve(process.cwd(), "src", "offline", "assets"),           // Ha a WORKDIR a /server mappa
  path.resolve(process.cwd(), "server", "src", "offline", "assets"), // Ha a WORKDIR a projekt gyökér
  path.join(__dirname, "..", "..", "src", "offline", "assets")       // Relatív útvonal a dist/offline-ból
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    assetsDir = p;
    break;
  }
}

console.log("[OFFLINE] SW Assets könyvtár megtalálva:", assetsDir);

const isProd = process.env.NODE_ENV === "production";

// ... INNENTŐL A FÁJL TÖBBI RÉSZE VÁLTOZATLANUL MARAD (offlineInjector, offlineRoutes stb.) ...
export function offlineInjector() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send.bind(res);
    res.send = (body?: any): Response => {
      try {
        const ct = String(res.getHeader("content-type") || "");
        if (typeof body === "string" && ct.includes("text/html")) {
          const injection = `
<link rel="manifest" href="/manifest.webmanifest">
<script src="/sw-register.js" defer></script>`;
          body = body.replace("</head>", `${injection}\n</head>`);
        }
      } catch {}
      return originalSend(body);
    };
    next();
  };
}

/**
 * /sw.js, /manifest.webmanifest, /sw-register.js kiszolgálása
 */
export function offlineRoutes(): Router {
  const router = express.Router();

  // /sw.js – DEV → sw.dev.js, PROD → sw.prod.js
  router.get("/sw.js", (req: Request, res: Response) => {
    const force = String(req.query.force || "").toLowerCase();
    let file = isProd ? "sw.prod.js" : "sw.dev.js";
    if (force === "dev")  file = "sw.dev.js";
    if (force === "prod") file = "sw.prod.js";
    if (process.env.FORCE_SW === "dev")  file = "sw.dev.js";
    if (process.env.FORCE_SW === "prod") file = "sw.prod.js";

    console.log("[SW] /sw.js requested. NODE_ENV=", process.env.NODE_ENV, "-> serving", file);

    res.type("application/javascript");
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(assetsDir, file));
  });

  // /manifest.webmanifest
  router.get("/manifest.webmanifest", (_req: Request, res: Response) => {
    res.type("application/manifest+json");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(assetsDir, "manifest.webmanifest"));
  });

  // /sw-register.js – a SW regisztráció külön fájlban (CSP-barát)
  router.get("/sw-register.js", (_req: Request, res: Response) => {
    res.type("application/javascript");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(assetsDir, "sw-register.js"));
  });

  return router;
}

/**
 * (Opcionális) Vite dev proxy – változatlan
 */
export function viteDevProxyLazy({ target }: { target: string }) {
  let mw: ((req: any, res: any, next: any) => void) | null = null;

  return async (req: any, res: any, next: any) => {
    if (!mw) {
      const mod = await import("http-proxy-middleware");
      const createProxyMiddleware = (mod as any).createProxyMiddleware as Function;
      const responseInterceptor  = (mod as any).responseInterceptor as Function;

      mw = createProxyMiddleware({
        target,
        changeOrigin: true,
        ws: true,
        selfHandleResponse: true,
        on: {
          proxyRes: responseInterceptor(async (buffer: Buffer, proxyRes: any) => {
            const ct = String((proxyRes.headers || {})["content-type"] || "");
            if (ct.includes("text/html")) {
              const html = buffer.toString("utf8");
              const injection = `
<link rel="manifest" href="/manifest.webmanifest">
<script src="/sw-register.js" defer></script>`;
              return html.replace("</head>", `${injection}\n</head>`);
            }
            return buffer;
          })
        }
      }) as any;
    }
    return mw!(req, res, next);
  };
}