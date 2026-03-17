"use strict";
// import path from "node:path";
// import type { Request, Response, NextFunction } from "express";
// import express from "express";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.offlineInjector = offlineInjector;
exports.offlineRoutes = offlineRoutes;
exports.viteDevProxyLazy = viteDevProxyLazy;
// /**
//  * 1) HTML-injektáló middleware:
//  *    - Regisztrálja a Service Workert
//  *    - Hozzáadja a manifest linket
//  *    Nem nyúl a többi assethez, és csak HTML-re hat.
//  */
// export function offlineInjector() {
//   return (req: Request, res: Response, next: NextFunction) => {
//     const origSend = res.send.bind(res);
//     res.send = (body?: any): Response => {
//       try {
//         const ct = String(res.getHeader("content-type") || "");
//         if (typeof body === "string" && ct.includes("text/html")) {
//           const injection = `
//   <link rel="manifest" href="/manifest.webmanifest">
//   <script>
//   (function(){
//     if ('serviceWorker' in navigator) {
//       navigator.serviceWorker.register('/sw.js', { scope: '/' })
//         .catch(console.error);
//       // ha visszajön a net, üzenünk a SW-nek, hogy ürítse a sort
//       window.addEventListener('online', () => {
//         navigator.serviceWorker.controller?.postMessage('replay-outbox');
//       });
//     }
//   })();
//   </script>
//   `;
//           body = body.replace("</head>", injection + "\n</head>");
//         }
//       } catch {}
//       return origSend(body);
//     };
//     next();
//   };
// }
// /**
//  * 2) Route-ok a SW + manifest kiszolgálására
//  *    - Közvetlenül a TS forrásból szolgálunk, build nélkül is fejleszthető.
//  */
// export function offlineRoutes() {
//   const router = express.Router();
//   // Itt a TS forrás mappájához képest keressük az assets-ot:
//   const assetsDir = path.join(__dirname, "assets");
//   router.get("/sw.js", (_req, res) => {
//     res.setHeader("Content-Type", "application/javascript");
//     res.setHeader("Service-Worker-Allowed", "/");
//     res.sendFile(path.join(assetsDir, "sw.js"));
//   });
//   router.get("/manifest.webmanifest", (_req, res) => {
//     res.setHeader("Content-Type", "application/manifest+json");
//     res.sendFile(path.join(assetsDir, "manifest.webmanifest"));
//   });
//   return router;
// }
// // offline/offline.ts végén (vagy ahol van a proxy helper)
// import { createProxyMiddleware, responseInterceptor } from "http-proxy-middleware";
// import type { Options } from "http-proxy-middleware";
// export function viteDevProxy({ target }: { target: string }) {
//   const opts: Options = {
//     target,
//     changeOrigin: true,
//     ws: true,
//     selfHandleResponse: true,
//     on: {
//       proxyRes: responseInterceptor(async (buffer, proxyRes) => {
//         const ct = String(proxyRes.headers["content-type"] || "");
//         if (ct.includes("text/html")) {
//           const html = buffer.toString("utf8");
//           const injection = `
// <link rel="manifest" href="/manifest.webmanifest">
// <script>
// (function(){
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(console.error);
//     window.addEventListener('online', () => {
//       navigator.serviceWorker.controller?.postMessage('replay-outbox');
//     });
//   }
// })();
// </script>`;
//           return html.replace("</head>", injection + "\n</head>");
//         }
//         return buffer; // nem HTML
//       })
//     }
//   };
//   return createProxyMiddleware(opts);
// }
// import express from "express";
// import path from "node:path";
// import type { Request, Response, NextFunction } from "express";
// import { createProxyMiddleware, responseInterceptor } from "http-proxy-middleware";
// import type { Options } from "http-proxy-middleware";
// import express from "express";
// import path from "node:path";
// import type { Request, Response, NextFunction } from "express";
// // NINCS top-level import a http-proxy-middleware-re
// type AnyFn = (...args: any[]) => any;
// type Options = any;
// /**
//  * 1) HTML-injektáló middleware:
//  *    - Hozzáadja a manifest linket
//  *    - Regisztrálja a Service Workert (DEV és PROD módban is)
//  *    Nem nyúl a többi assethez, és csak HTML-re hat.
//  */
// export function offlineInjector() {
//   return (req: Request, res: Response, next: NextFunction) => {
//     const origSend = res.send.bind(res);
//     res.send = (body?: any): Response => {
//       try {
//         const ct = String(res.getHeader("content-type") || "");
//         if (typeof body === "string" && ct.includes("text/html")) {
//           const injection = `
// <link rel="manifest" href="/manifest.webmanifest">
// <script>
// (function(){
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(console.error);
//     // ha visszajön a net, üzenünk a SW-nek, hogy ürítse a sort
//     window.addEventListener('online', () => {
//       navigator.serviceWorker.controller?.postMessage('replay-outbox');
//     });
//   }
// })();
// </script>`;
//           body = body.replace("</head>", injection + "\n</head>");
//         }
//       } catch {}
//       return origSend(body);
//     };
//     next();
//   };
// }
// /**
//  * 2) Route-ok a SW + manifest kiszolgálására.
//  *    DEV: sw.dev.js
//  *    PROD: sw.prod.js  (a régi sw.js-ed változtatás nélkül, csak átnevezve)
//  */
// export function offlineRoutes() {
//   const router = express.Router();
//   const assetsDir = path.join(__dirname, "assets");
//   const isProd = process.env.NODE_ENV === "production";
//   router.get("/sw.js", (_req, res) => {
//     res.setHeader("Content-Type", "application/javascript");
//     res.setHeader("Service-Worker-Allowed", "/");
//     const file = isProd ? "sw.prod.js" : "sw.dev.js";
//     res.sendFile(path.join(assetsDir, file));
//   });
//   router.get("/manifest.webmanifest", (_req, res) => {
//     res.setHeader("Content-Type", "application/manifest+json");
//     res.sendFile(path.join(assetsDir, "manifest.webmanifest"));
//   });
//   return router;
// }
// /**
//  * 3) Vite DEV proxy (HTML injektálással).
//  *    Ezt hagyhatod így; a DEV SW úgysem cache-eli a Vite dev asseteket.
//  */
// export function viteDevProxyLazy({ target }: { target: string }) {
//   let mw: AnyFn | null = null;
//   return async (req: any, res: any, next: AnyFn) => {
//     if (!mw) {
//       const mod = await import("http-proxy-middleware");
//       const createProxyMiddleware = (mod as any).createProxyMiddleware as AnyFn;
//       const responseInterceptor = (mod as any).responseInterceptor as AnyFn;
//       const opts: Options = {
//         target,
//         changeOrigin: true,
//         ws: true,
//         selfHandleResponse: true,
//         on: {
//           proxyRes: responseInterceptor(async (buffer: Buffer, proxyRes: any) => {
//             const ct = String((proxyRes.headers || {})["content-type"] || "");
//             if (ct.includes("text/html")) {
//               const html = buffer.toString("utf8");
//               const injection = `
// <link rel="manifest" href="/manifest.webmanifest">
// <script>
// (function(){
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(console.error);
//     window.addEventListener('online', () => {
//       navigator.serviceWorker.controller?.postMessage('replay-outbox');
//     });
//   }
// })();
// </script>`;
//               return html.replace("</head>", injection + "\n</head>");
//             }
//             return buffer; // nem HTML → továbbengedjük módosítás nélkül
//           })
//         }
//       };
//       mw = createProxyMiddleware(opts);
//     }
//     return (mw as AnyFn)(req, res, next);
//   };
// }
// // router.get("/sw.js", (_req, res) => {
// //   res.setHeader("Content-Type", "application/javascript");
// //   res.setHeader("Service-Worker-Allowed", "/");
// //   res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
// //   const file = isProd ? "sw.prod.js" : "sw.dev.js";
// //   res.sendFile(path.join(assetsDir, file));
// // });
// import express, { type Request, type Response, type NextFunction, type Router } from "express";
// import path from "node:path";
// // CommonJS környezet: használd a globális __dirname-t
// const assetsDir = path.join(__dirname, "assets");
// const isProd = (process.env.NODE_ENV === "production");
// router.get("/sw-register.js", (_req, res) => {
//   res.type("application/javascript");
//   res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
//   res.sendFile(path.join(assetsDir, "sw-register.js"));
// });
// /**
//  * HTML injektor: manifest link + SW regisztráció
//  * Csak akkor hat, ha NEM express.static szolgálja ki az index.html-t közvetlenül.
//  * Ha statikus kiszolgálás van, inkább a server.ts-ben a catch-all route injektáljon.
//  */
// export function offlineInjector() {
//   return (req: Request, res: Response, next: NextFunction) => {
//     const originalSend = res.send.bind(res);
//     res.send = (body?: any): Response => {
//       try {
//         const ct = String(res.getHeader("content-type") || "");
//         if (typeof body === "string" && ct.includes("text/html")) {
//           const injection = `
// <link rel="manifest" href="/manifest.webmanifest">
// <script>
// (function(){
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(console.error);
//     window.addEventListener('online', () => {
//       navigator.serviceWorker.controller?.postMessage('replay-outbox');
//     });
//   }
// })();
// </script>`;
//           body = body.replace("</head>", `${injection}\n</head>`);
//         }
//       } catch {}
//       return originalSend(body);
//     };
//     next();
//   };
// }
// /**
//  * /sw.js és /manifest.webmanifest kiszolgálása.
//  * - /sw.js: DEV → sw.dev.js, PROD → sw.prod.js
//  *   (Opcionális felülbírálás: ?v vagy FORCE_SW env)
//  */
// export function offlineRoutes(): Router {
//   const router = express.Router();
//   router.get("/sw.js", (req: Request, res: Response) => {
//     // Opcionális felülbírálás teszthez: /sw.js?force=dev|prod
//     const force = String(req.query.force || "").toLowerCase();
//     let file = isProd ? "sw.prod.js" : "sw.dev.js";
//     if (force === "dev")  file = "sw.dev.js";
//     if (force === "prod") file = "sw.prod.js";
//     if (process.env.FORCE_SW === "dev")  file = "sw.dev.js";
//     if (process.env.FORCE_SW === "prod") file = "sw.prod.js";
//     console.log("[SW] /sw.js requested. NODE_ENV=", process.env.NODE_ENV, "-> serving", file);
//     res.type("application/javascript");
//     res.setHeader("Service-Worker-Allowed", "/");
//     // Ne cache-elje a böngésző a SW-t, hogy deploy után azonnal frissüljön
//     res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
//     res.sendFile(path.join(assetsDir, file));
//   });
//   router.get("/manifest.webmanifest", (_req: Request, res: Response) => {
//     res.type("application/manifest+json");
//     res.sendFile(path.join(assetsDir, "manifest.webmanifest"));
//   });
//   return router;
// }
// /**
//  * Vite DEV proxy (lusta betöltés), HTML injektálással.
//  * Csak fejlesztéshez – PROD-ban ne használd.
//  */
// export function viteDevProxyLazy({ target }: { target: string }) {
//   let mw: ((req: any, res: any, next: any) => void) | null = null;
//   return async (req: any, res: any, next: any) => {
//     if (!mw) {
//       const mod = await import("http-proxy-middleware");
//       const createProxyMiddleware = (mod as any).createProxyMiddleware as Function;
//       const responseInterceptor  = (mod as any).responseInterceptor as Function;
//       mw = createProxyMiddleware({
//         target,
//         changeOrigin: true,
//         ws: true,
//         selfHandleResponse: true,
//         on: {
//           proxyRes: responseInterceptor(async (buffer: Buffer, proxyRes: any) => {
//             const ct = String((proxyRes.headers || {})["content-type"] || "");
//             if (ct.includes("text/html")) {
//               const html = buffer.toString("utf8");
//               const injection = `
// <link rel="manifest" href="/manifest.webmanifest">
// <script>
// (function(){
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(console.error);
//     window.addEventListener('online', () => {
//       navigator.serviceWorker.controller?.postMessage('replay-outbox');
//     });
//   }
// })();
// </script>`;
//               return html.replace("</head>", `${injection}\n</head>`);
//             }
//             return buffer;
//           })
//         }
//       }) as any;
//     }
//     return mw!(req, res, next);
//   };
// }
// server/src/offline/offline.ts
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
// CommonJS: van __dirname
const assetsDir = node_path_1.default.join(__dirname, "assets");
const isProd = process.env.NODE_ENV === "production";
/**
 * (Opcionális) HTML injektor – ha használod, inkább külső regisztrálót linkeljen
 * Megjegyzés: nálatok a server.ts catch-all már injektál, ez akár el is hagyható.
 */
function offlineInjector() {
    return (req, res, next) => {
        const originalSend = res.send.bind(res);
        res.send = (body) => {
            try {
                const ct = String(res.getHeader("content-type") || "");
                if (typeof body === "string" && ct.includes("text/html")) {
                    const injection = `
<link rel="manifest" href="/manifest.webmanifest">
<script src="/sw-register.js" defer></script>`;
                    body = body.replace("</head>", `${injection}\n</head>`);
                }
            }
            catch { }
            return originalSend(body);
        };
        next();
    };
}
/**
 * /sw.js, /manifest.webmanifest, /sw-register.js kiszolgálása
 */
function offlineRoutes() {
    const router = express_1.default.Router();
    // /sw.js – DEV → sw.dev.js, PROD → sw.prod.js
    router.get("/sw.js", (req, res) => {
        const force = String(req.query.force || "").toLowerCase();
        let file = isProd ? "sw.prod.js" : "sw.dev.js";
        if (force === "dev")
            file = "sw.dev.js";
        if (force === "prod")
            file = "sw.prod.js";
        if (process.env.FORCE_SW === "dev")
            file = "sw.dev.js";
        if (process.env.FORCE_SW === "prod")
            file = "sw.prod.js";
        console.log("[SW] /sw.js requested. NODE_ENV=", process.env.NODE_ENV, "-> serving", file);
        res.type("application/javascript");
        res.setHeader("Service-Worker-Allowed", "/");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.sendFile(node_path_1.default.join(assetsDir, file));
    });
    // /manifest.webmanifest
    router.get("/manifest.webmanifest", (_req, res) => {
        res.type("application/manifest+json");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.sendFile(node_path_1.default.join(assetsDir, "manifest.webmanifest"));
    });
    // /sw-register.js – a SW regisztráció külön fájlban (CSP-barát)
    router.get("/sw-register.js", (_req, res) => {
        res.type("application/javascript");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.sendFile(node_path_1.default.join(assetsDir, "sw-register.js"));
    });
    return router;
}
/**
 * (Opcionális) Vite dev proxy – változatlan
 */
function viteDevProxyLazy({ target }) {
    let mw = null;
    return async (req, res, next) => {
        if (!mw) {
            const mod = await Promise.resolve().then(() => __importStar(require("http-proxy-middleware")));
            const createProxyMiddleware = mod.createProxyMiddleware;
            const responseInterceptor = mod.responseInterceptor;
            mw = createProxyMiddleware({
                target,
                changeOrigin: true,
                ws: true,
                selfHandleResponse: true,
                on: {
                    proxyRes: responseInterceptor(async (buffer, proxyRes) => {
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
            });
        }
        return mw(req, res, next);
    };
}
