"use strict";
// import express from "express"
// import cors from "cors"
// import fs from "fs/promises"
// import path from "path"
// import { v4 as uuid } from "uuid"
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// // ====== Típusok – egyezzenek a frontend storage/index.ts típusaival ======
// export type Completion = 'done' | 'progress' | 'empty'
// export type SurveyState = {
//   id: string
//   globals: {
//     companyName: string
//     site: string
//     phone: string
//     email: string
//     logoDataUrl?: string
//   }
//   forms: any[]                    // FormData[]
//   answers: Record<string, any>    // formId -> AnswerMap
//   files?: Record<string, any>
//   snapshots?: any[]
//   updatedAt: string               // ISO datetime
// }
// export type SurveySummary = {
//   id: string
//   companyName: string
//   updatedAt: string
//   formCount: number
// }
// // ====== (opcionális) fix tabok szerver-oldali createSurvey seedhez ======
// const SURVEY_TABS: readonly string[] = [
//   "Rendszer",
//   "Kivitelezés",
//   "Szervíz",
//   "Üzembe helyezés",
//   "Zárás"
// ]
// // --- új: biztonságos könyvtárnév a céghez
// function safeCompanyDir(name: string) {
//   const s = (name || '').trim().toLowerCase()
//     .replace(/[^\p{L}\p{N}\- _]+/gu, '')   // csak betű/szám/-/space/_ marad
//     .replace(/\s+/g, '_')                  // szóköz -> _
//     .slice(0, 80) || 'ismeretlen_ceg';
//   return path.join(dataRoot, 'surveys', s);
// }
// // RÉGI: id-alapú útvonalak (meghagyjuk migrációhoz)
// function oldSurveyDirById(id: string) { return path.join(dataRoot, 'surveys', id) }
// function oldSurveyJsonPath(id: string) { return path.join(oldSurveyDirById(id), 'survey.json') }
// // ÚJ: cég-alapú survey.json útvonal (globálból számoljuk)
// function surveyJsonPathByCompany(companyName: string) {
//   return path.join(safeCompanyDir(companyName), 'survey.json');
// }
// // ====== Express alap ======
// const app = express()
// const PORT = Number(process.env.PORT || 5174)
// app.use(cors())
// app.use(express.json({ limit: "20mb" }))
// // ====== Fájlrendszer elérési utak ======
// const dataRoot = path.resolve(process.cwd(), "server", "data")
// // Struktúra:
// // server/data/
// //   index.json                          ← SurveySummary[]
// //   templates/template_<TAB>.json       ← sablonok
// //   surveys/<id>/survey.json            ← teljes SurveyState
// const indexFile = path.join(dataRoot, "index.json")
// // ====== Util ======
// async function ensureDir(p: string) { await fs.mkdir(p, { recursive: true }) }
// async function readJSON<T>(file: string, fallback: T): Promise<T> {
//   try { return JSON.parse(await fs.readFile(file, "utf8")) as T } catch { return fallback }
// }
// async function writeJSON(file: string, data: any) {
//   await ensureDir(path.dirname(file))
//   await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8")
// }
// function nowIso() { return new Date().toISOString() }
// function normName(s: string) { return (s || "").trim().toLowerCase() }
// // ----- Index kezelése -----
// async function readIndex(): Promise<SurveySummary[]> {
//   return readJSON<SurveySummary[]>(indexFile, [])
// }
// async function writeIndex(idx: SurveySummary[]) {
//   await writeJSON(indexFile, idx)
// }
// async function upsertIndexItem(state: SurveyState) {
//   const idx = await readIndex()
//   const i = idx.findIndex(x => x.id === state.id)
//   const item: SurveySummary = {
//     id: state.id,
//     companyName: state.globals?.companyName || "Névtelen cég",
//     updatedAt: state.updatedAt,
//     formCount: Array.isArray(state.forms) ? state.forms.length : 0
//   }
//   if (i >= 0) idx[i] = item
//   else idx.push(item)
//   await writeIndex(idx)
// }
// async function removeIndexItem(id: string) {
//   const idx = await readIndex()
//   await writeIndex(idx.filter(x => x.id !== id))
// }
// async function findSurveyIdByCompanyName(name: string): Promise<string | null> {
//   const idx = await readIndex()
//   const n = normName(name)
//   const hit = idx.find(it => normName(it.companyName) === n)
//   return hit ? hit.id : null
// }
// // ----- Survey fájlok -----
// function surveyDir(id: string) { return path.join(dataRoot, "surveys", id) }
// function surveyJsonPath(id: string) { return path.join(surveyDir(id), "survey.json") }
// // async function readSurvey(id: string): Promise<SurveyState | null> {
// //   return readJSON<SurveyState>(surveyJsonPath(id), null as any)
// // }
// async function readSurvey(id: string): Promise<SurveyState | null> {
//   // 1) próbáljuk index alapján kinyerni a cégnevet
//   const idx = await readIndex();
//   const it = idx.find(x => x.id === id);
//   if (it && it.companyName) {
//     const p = surveyJsonPathByCompany(it.companyName);
//     const s = await readJSON<SurveyState>(p, null as any);
//     if (s && s.id === id) return s;
//   }
//   // 2) fallback: keressük meg lemezen id szerint
//   return await findSurveyByIdOnDisk(id);
// }
// // async function writeSurvey(state: SurveyState) {
// //   await writeJSON(surveyJsonPath(state.id), state)
// //   await upsertIndexItem(state)
// // }
// async function writeSurvey(state: SurveyState) {
//   const targetPath = surveyJsonPathByCompany(state.globals?.companyName || '');
//   await writeJSON(targetPath, state);
//   await upsertIndexItem(state); // indexet is naprakészen tartjuk
// }
// async function deleteSurveyDisk(id: string) {
//   // 1) keresd meg a survey-t lemezen (akár cég-mappa, akár legacy id-mappa)
//   const s = await findSurveyByIdOnDisk(id);
//   // 2) ha megtaláltuk cégnév alapján: töröljük a céges könyvtárat
//   if (s && s.globals?.companyName) {
//     const dir = safeCompanyDir(s.globals.companyName); // .../surveys/<company_slug>
//     try { await fs.rm(dir, { recursive: true, force: true }); } catch {}
//   }
//   // 3) legacy id-alapú könyvtár is törlődjön, ha még létezik
//   try { await fs.rm(surveyDir(id), { recursive: true, force: true }); } catch {}
//   // 4) indexből kivenni
//   await removeIndexItem(id);
// }
// // ----- Template fájlok -----
// function templatePath(tab: string) {
//   return path.join(dataRoot, "templates", `template_${tab}.json`)
// }
// async function loadTemplateForTab(tab: string): Promise<any | null> {
//   try {
//     const raw = await fs.readFile(templatePath(tab), "utf8")
//     return JSON.parse(raw)
//   } catch { return null }
// }
// // --- listázd a surveys könyvtár alkönyvtárait (céges mappák)
// async function listCompanyDirs(): Promise<string[]> {
//   const root = path.join(dataRoot, 'surveys');
//   await ensureDir(root);
//   const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
//   return entries.filter(e => e.isDirectory()).map(e => path.join(root, e.name));
// }
// // --- próbáld beolvasni a survey.json-t egy cég-mappából
// async function readSurveyFromCompanyDir(dir: string): Promise<SurveyState | null> {
//   const p = path.join(dir, 'survey.json');
//   try {
//     const raw = await fs.readFile(p, 'utf8');
//     const s = JSON.parse(raw) as SurveyState;
//     return (s && typeof s.id === 'string') ? s : null;
//   } catch { return null; }
// }
// // --- teljes rebuild: végigmegy az összes cég-mappán és SurveySummary listát épít
// async function rebuildIndexFromDisk(): Promise<SurveySummary[]> {
//   const dirs = await listCompanyDirs();
//   const items: SurveySummary[] = [];
//   for (const d of dirs) {
//     const s = await readSurveyFromCompanyDir(d);
//     if (s) {
//       items.push({
//         id: s.id,
//         companyName: s.globals?.companyName || 'Névtelen cég',
//         updatedAt: s.updatedAt || nowIso(),
//         formCount: Array.isArray(s.forms) ? s.forms.length : 0,
//       });
//     }
//   }
//   // rendezés legfrissebb elöl
//   items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
//   return items;
// }
// // --- fallback: ha nem találjuk index alapján, keressük meg a lemezen id szerint
// async function findSurveyByIdOnDisk(id: string): Promise<SurveyState | null> {
//   const dirs = await listCompanyDirs();
//   for (const d of dirs) {
//     const s = await readSurveyFromCompanyDir(d);
//     if (s && s.id === id) return s;
//   }
//   // régi id-alapú tárolás támogatása (legacy)
//   const legacy = await readJSON<SurveyState>(oldSurveyJsonPath(id), null as any);
//   if (legacy && legacy.id === id) {
//     // migráció: mentsük át az új céges helyre és frissítsük az indexet
//     const newP = surveyJsonPathByCompany(legacy.globals?.companyName || '');
//     await writeJSON(newP, legacy);
//     await upsertIndexItem(legacy);
//     try { await fs.rm(oldSurveyDirById(id), { recursive: true, force: true }) } catch {}
//     return legacy;
//   }
//   return null;
// }
// // ======================================================================
// // ============================== ENDPOINTOK =============================
// // ======================================================================
// // -- Templates --
// app.get("/api/templates/:tab", async (req, res) => {
//   try {
//     const raw = await fs.readFile(templatePath(req.params.tab), "utf8")
//     res.type("application/json").send(raw)
//   } catch {
//     res.status(404).json({ ok: false, error: "not found" })
//   }
// })
// app.post("/api/templates/:tab", async (req, res) => {
//   try {
//     await writeJSON(templatePath(req.params.tab), req.body)
//     res.json({ ok: true })
//   } catch (e: any) {
//     res.status(500).json({ ok: false, error: e?.message || "save failed" })
//   }
// })
// // -- Index (listSurveys / writeIndex) --
// app.get("/api/surveys/index", async (_req, res) => {
//   try {
//     const built = await rebuildIndexFromDisk();
//     // tartsunk egy konzisztenst cache-t is (nem forrás, csak melléktermék)
//     await writeIndex(built);
//     res.json(built);
//   } catch (e: any) {
//     res.status(500).json({ ok: false, error: e?.message || "index build failed" });
//   }
// });
// app.post("/api/surveys/index", async (req, res) => {
//   try {
//     const idx = Array.isArray(req.body) ? req.body as SurveySummary[] : []
//     await writeIndex(idx)
//     res.json({ ok: true })
//   } catch (e: any) {
//     res.status(500).json({ ok: false, error: e?.message || "index save failed" })
//   }
// })
// // -- Create Survey (opcionális szerver-oldali create, sablon seedeléssel) --
// app.post("/api/surveys", async (req, res) => {
//   try {
//     const g = (req.body?.globals ?? {}) as SurveyState["globals"]
//     const id = uuid()
//     const seededForms: any[] = []
//     for (const tab of SURVEY_TABS) {
//       const tpl = await loadTemplateForTab(tab)
//       if (tpl) seededForms.push(tpl)
//     }
//     const fresh: SurveyState = {
//       id,
//       globals: {
//         companyName: g.companyName || "",
//         site: g.site || "",
//         phone: g.phone || "",
//         email: g.email || "",
//         logoDataUrl: g.logoDataUrl
//       },
//       forms: seededForms,
//       answers: {},
//       files: {},
//       snapshots: [],
//       updatedAt: nowIso()
//     }
//     await writeSurvey(fresh)
//     res.status(201).json(fresh)
//   } catch (e: any) {
//     res.status(500).json({ ok: false, error: e?.message || "create failed" })
//   }
// })
// // -- Load / Save / Delete Survey --
// app.get("/api/surveys/:id", async (req, res) => {
//   const s = await readSurvey(req.params.id)
//   if (!s) return res.status(404).json(null)
//   res.json(s)
// })
// app.post("/api/surveys/:id", async (req, res) => {
//   try {
//     const id = req.params.id
//     const next = req.body as SurveyState
//     if (!next || !next.id || next.id !== id) {
//       return res.status(400).json({ ok: false, error: "invalid payload or id mismatch" })
//     }
//     next.updatedAt = nowIso()
//     await writeSurvey(next)
//     res.json({ ok: true, updatedAt: next.updatedAt })
//   } catch (e: any) {
//     res.status(500).json({ ok: false, error: e?.message || "save failed" })
//   }
// })
// app.delete("/api/surveys/:id", async (req, res) => {
//   try {
//     await deleteSurveyDisk(req.params.id)
//     res.json({ ok: true })
//   } catch (e: any) {
//     console.log('error: ', e)
//     res.status(500).json({ ok: false, error: e?.message || "delete failed" })
//   }
// })
// // -- Globals (névütközés kezeléssel) --
// app.get("/api/surveys/:id/globals", async (req, res) => {
//   const s = await readSurvey(req.params.id)
//   if (!s) return res.status(404).json(null)
//   res.json(s.globals)
// })
// app.post("/api/surveys/:id/globals", async (req, res) => {
//   try {
//     const id = req.params.id
//     const s = await readSurvey(id)
//     if (!s) return res.status(404).json({ ok: false, error: "not found" })
//     const g = req.body as SurveyState["globals"]
//     const targetName = (g.companyName || "").trim()
//     if (targetName) {
//       const conflict = await findSurveyIdByCompanyName(targetName)
//       if (conflict && conflict !== id) {
//         return res.status(409).json({ ok: false, code: "DUPLICATE_COMPANY_NAME" })
//       }
//     }
//     s.globals = {
//       companyName: targetName,
//       site: g.site || "",
//       phone: g.phone || "",
//       email: g.email || "",
//       logoDataUrl: g.logoDataUrl
//     }
//     s.updatedAt = nowIso()
//     await writeSurvey(s)
//     res.json({ ok: true, updatedAt: s.updatedAt })
//   } catch (e: any) {
//     res.status(500).json({ ok: false, error: e?.message || "globals save failed" })
//   }
// })
// // -- Forms (loadAll / saveAll / save(form)) --
// app.get("/api/surveys/:id/forms", async (req, res) => {
//   const s = await readSurvey(req.params.id)
//   if (!s) return res.status(404).json([])
//   res.json(Array.isArray(s.forms) ? s.forms : [])
// })
// app.post("/api/surveys/:id/forms", async (req, res) => {
//   try {
//     const s = await readSurvey(req.params.id)
//     if (!s) return res.status(404).json({ ok: false, error: "not found" })
//     s.forms = Array.isArray(req.body) ? req.body : []
//     s.updatedAt = nowIso()
//     await writeSurvey(s)
//     res.json({ ok: true, updatedAt: s.updatedAt })
//   } catch (e: any) {
//     res.status(500).json({ ok: false, error: e?.message || "forms save failed" })
//   }
// })
// app.get("/api/surveys/:id/forms/:formId", async (req, res) => {
//   const s = await readSurvey(req.params.id)
//   if (!s) return res.status(404).json(null)
//   const f = (s.forms || []).find((x: any) => String(x?.meta?.id || "") === String(req.params.formId))
//   if (!f) return res.status(404).json(null)
//   res.json(f)
// })
// app.post("/api/surveys/:id/forms/:formId", async (req, res) => {
//   try {
//     const s = await readSurvey(req.params.id)
//     if (!s) return res.status(404).json({ ok: false, error: "not found" })
//     const formId = String(req.params.formId)
//     const forms = Array.isArray(s.forms) ? [...s.forms] : []
//     const payload = req.body
//     const i = forms.findIndex((x: any) => String(x?.meta?.id || "") === formId)
//     if (i >= 0) forms[i] = payload
//     else forms.push(payload)
//     s.forms = forms
//     s.updatedAt = nowIso()
//     await writeSurvey(s)
//     res.json({ ok: true, updatedAt: s.updatedAt })
//   } catch (e: any) {
//     res.status(500).json({ ok: false, error: e?.message || "form upsert failed" })
//   }
// })
// // -- Answers (loadAnswers / saveAnswers) --
// app.get("/api/surveys/:id/answers/:formId", async (req, res) => {
//   const s = await readSurvey(req.params.id)
//   if (!s) return res.status(404).json({})
//   res.json((s.answers || {})[String(req.params.formId)] || {})
// })
// app.post("/api/surveys/:id/answers/:formId", async (req, res) => {
//   try {
//     const s = await readSurvey(req.params.id)
//     if (!s) return res.status(404).json({ ok: false, error: "not found" })
//     const formId = String(req.params.formId)
//     s.answers = s.answers || {}
//     s.answers[formId] = req.body || {}
//     s.updatedAt = nowIso()
//     await writeSurvey(s)
//     res.json({ ok: true, updatedAt: s.updatedAt })
//   } catch (e: any) {
//     res.status(500).json({ ok: false, error: e?.message || "answers save failed" })
//   }
// })
// // ======================================================================
// app.listen(PORT, () => {
//   console.log(`API listening on http://localhost:${PORT}`)
// })
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
// import { v4 as uuid } from "uuid"
const node_crypto_1 = require("node:crypto");
const offline_1 = require("./offline/offline");
// ====== (opcionális) fix tabok szerver-oldali createSurvey seedhez ======
const SURVEY_TABS = [
    "Rendszer",
    "Kivitelezés",
    "Szervíz",
    "Üzembe helyezés",
    "Zárás"
];
// --- új: biztonságos könyvtárnév a céghez
function safeCompanyDir(name) {
    const s = (name || '').trim().toLowerCase()
        .replace(/[^\p{L}\p{N}\- _]+/gu, '') // csak betű/szám/-/space/_ marad
        .replace(/\s+/g, '_') // szóköz -> _
        .slice(0, 80) || 'ismeretlen_ceg';
    return path_1.default.join(dataRoot, 'surveys', s);
}
// RÉGI: id-alapú útvonalak (meghagyjuk migrációhoz)
function oldSurveyDirById(id) { return path_1.default.join(dataRoot, 'surveys', id); }
function oldSurveyJsonPath(id) { return path_1.default.join(oldSurveyDirById(id), 'survey.json'); }
// ÚJ: cég-alapú survey.json útvonal (globálból számoljuk)
function surveyJsonPathByCompany(companyName) {
    return path_1.default.join(safeCompanyDir(companyName), 'survey.json');
}
// ====== Express alap ======
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT || 5174);
// 1) HTML-injektálás (SW regisztráló snippet + manifest link)
// app.use(offlineInjector());
// 2) SW és manifest kiszolgálása (egyből az offline/assets-ből)
app.use((0, offline_1.offlineRoutes)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "100mb" }));
// Frontend build mappa (Vite build kimenet)
// const distDir = path.resolve(process.cwd(), "dist");
const distDir = path_1.default.resolve(process.cwd(), "..", "dist");
// nagyon korán:
app.use((req, _res, next) => {
    console.log("[REQ]", req.method, req.url);
    next();
});
// 4) CSAK az asseteket szolgáljuk ki statikusan (nem az egész dist-et!)
app.use("/assets", express_1.default.static(path_1.default.join(distDir, "assets"), {
    immutable: true,
    maxAge: "1y"
}));
// ====== Fájlrendszer elérési utak ======
const dataRoot = path_1.default.resolve(process.cwd(), "server", "data");
// Struktúra:
// server/data/
//   index.json                          ← SurveySummary[]
//   templates/template_<TAB>.json       ← sablonok
//   surveys/<id>/survey.json            ← teljes SurveyState
const indexFile = path_1.default.join(dataRoot, "index.json");
const LOCKS_FILE = path_1.default.join(dataRoot, "locks.json");
// ====== Util ======
async function ensureDir(p) { await promises_1.default.mkdir(p, { recursive: true }); }
async function readJSON(file, fallback) {
    try {
        return JSON.parse(await promises_1.default.readFile(file, "utf8"));
    }
    catch {
        return fallback;
    }
}
async function writeJSON(file, data) {
    await ensureDir(path_1.default.dirname(file));
    await promises_1.default.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}
function nowIso() { return new Date().toISOString(); }
function normName(s) { return (s || "").trim().toLowerCase(); }
// ----- Index kezelése -----
async function readIndex() {
    return readJSON(indexFile, []);
}
async function writeIndex(idx) {
    await writeJSON(indexFile, idx);
}
async function upsertIndexItem(state) {
    const idx = await readIndex();
    const i = idx.findIndex(x => x.id === state.id);
    const item = {
        id: state.id,
        companyName: state.globals?.companyName || "Névtelen cég",
        updatedAt: state.updatedAt,
        formCount: Array.isArray(state.forms) ? state.forms.length : 0
    };
    if (i >= 0)
        idx[i] = item;
    else
        idx.push(item);
    await writeIndex(idx);
}
async function removeIndexItem(id) {
    const idx = await readIndex();
    await writeIndex(idx.filter(x => x.id !== id));
}
async function findSurveyIdByCompanyName(name) {
    const idx = await readIndex();
    const n = normName(name);
    const hit = idx.find(it => normName(it.companyName) === n);
    return hit ? hit.id : null;
}
// ----- Survey fájlok -----
function surveyDir(id) { return path_1.default.join(dataRoot, "surveys", id); }
function surveyJsonPath(id) { return path_1.default.join(surveyDir(id), "survey.json"); }
// async function readSurvey(id: string): Promise<SurveyState | null> {
//   return readJSON<SurveyState>(surveyJsonPath(id), null as any)
// }
async function readSurvey(id) {
    // 1) próbáljuk index alapján kinyerni a cégnevet
    const idx = await readIndex();
    const it = idx.find(x => x.id === id);
    if (it && it.companyName) {
        const p = surveyJsonPathByCompany(it.companyName);
        const s = await readJSON(p, null);
        if (s && s.id === id)
            return s;
    }
    // 2) fallback: keressük meg lemezen id szerint
    return await findSurveyByIdOnDisk(id);
}
// async function writeSurvey(state: SurveyState) {
//   await writeJSON(surveyJsonPath(state.id), state)
//   await upsertIndexItem(state)
// }
async function writeSurvey(state) {
    const targetPath = surveyJsonPathByCompany(state.globals?.companyName || '');
    await writeJSON(targetPath, state);
    await upsertIndexItem(state); // indexet is naprakészen tartjuk
}
// async function deleteSurveyDisk(id: string) {
//   try { await fs.rm(surveyDir(id), { recursive: true, force: true }) } catch {}
//   await removeIndexItem(id)
// }
async function deleteSurveyDisk(id) {
    // Megkeressük lemezen (kezeli a céges mappát és a legacy id-mappát is)
    const s = await findSurveyByIdOnDisk(id);
    // Ha cégnév alapján tárolt, töröljük a céges mappát
    try {
        if (s && s.globals?.companyName) {
            const companyDir = safeCompanyDir(s.globals.companyName); // .../surveys/<slug>
            await promises_1.default.rm(companyDir, { recursive: true, force: true });
        }
    }
    catch { }
    // Legacy: az id-alapú mappát is töröljük, ha létezne
    try {
        await promises_1.default.rm(surveyDir(id), { recursive: true, force: true });
    }
    catch { }
    // Indexből kivesszük
    await removeIndexItem(id);
}
// ----- Template fájlok -----
function templatePath(tab) {
    return path_1.default.join(dataRoot, "templates", `template_${tab}.json`);
}
async function loadTemplateForTab(tab) {
    try {
        const raw = await promises_1.default.readFile(templatePath(tab), "utf8");
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
// --- listázd a surveys könyvtár alkönyvtárait (céges mappák)
async function listCompanyDirs() {
    const root = path_1.default.join(dataRoot, 'surveys');
    await ensureDir(root);
    const entries = await promises_1.default.readdir(root, { withFileTypes: true }).catch(() => []);
    return entries.filter(e => e.isDirectory()).map(e => path_1.default.join(root, e.name));
}
// --- próbáld beolvasni a survey.json-t egy cég-mappából
async function readSurveyFromCompanyDir(dir) {
    const p = path_1.default.join(dir, 'survey.json');
    try {
        const raw = await promises_1.default.readFile(p, 'utf8');
        const s = JSON.parse(raw);
        return (s && typeof s.id === 'string') ? s : null;
    }
    catch {
        return null;
    }
}
// --- teljes rebuild: végigmegy az összes cég-mappán és SurveySummary listát épít
async function rebuildIndexFromDisk() {
    const dirs = await listCompanyDirs();
    const items = [];
    for (const d of dirs) {
        const s = await readSurveyFromCompanyDir(d);
        if (s) {
            items.push({
                id: s.id,
                companyName: s.globals?.companyName || 'Névtelen cég',
                updatedAt: s.updatedAt || nowIso(),
                formCount: Array.isArray(s.forms) ? s.forms.length : 0,
            });
        }
    }
    // rendezés legfrissebb elöl
    items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    return items;
}
// --- fallback: ha nem találjuk index alapján, keressük meg a lemezen id szerint
async function findSurveyByIdOnDisk(id) {
    const dirs = await listCompanyDirs();
    for (const d of dirs) {
        const s = await readSurveyFromCompanyDir(d);
        if (s && s.id === id)
            return s;
    }
    // régi id-alapú tárolás támogatása (legacy)
    const legacy = await readJSON(oldSurveyJsonPath(id), null);
    if (legacy && legacy.id === id) {
        // migráció: mentsük át az új céges helyre és frissítsük az indexet
        const newP = surveyJsonPathByCompany(legacy.globals?.companyName || '');
        await writeJSON(newP, legacy);
        await upsertIndexItem(legacy);
        try {
            await promises_1.default.rm(oldSurveyDirById(id), { recursive: true, force: true });
        }
        catch { }
        return legacy;
    }
    return null;
}
const locks = new Map(); // key: surveyId
const LOCK_TTL_MS = 2 * 60 * 1000; // 2 perc
function now() { return Date.now(); }
function purgeExpired() {
    const t = now();
    for (const [k, v] of locks)
        if (v.expiresAt <= t)
            locks.delete(k);
}
function getClientId(req) {
    return String(req.header('X-Client-Id') || '');
}
// ======================================================================
// ============================== ENDPOINTOK =============================
// ======================================================================
// -- Templates --
app.get("/api/templates/:tab", async (req, res) => {
    try {
        const raw = await promises_1.default.readFile(templatePath(req.params.tab), "utf8");
        res.type("application/json").send(raw);
    }
    catch {
        res.status(404).json({ ok: false, error: "not found" });
    }
});
app.post("/api/templates/:tab", async (req, res) => {
    try {
        await writeJSON(templatePath(req.params.tab), req.body);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || "save failed" });
    }
});
// -- Index (listSurveys / writeIndex) --
app.get("/api/surveys/index", async (_req, res) => {
    try {
        const built = await rebuildIndexFromDisk();
        // tartsunk egy konzisztenst cache-t is (nem forrás, csak melléktermék)
        await writeIndex(built);
        res.json(built);
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || "index build failed" });
    }
});
app.post("/api/surveys/index", async (req, res) => {
    try {
        const idx = Array.isArray(req.body) ? req.body : [];
        await writeIndex(idx);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || "index save failed" });
    }
});
// -- Create Survey (opcionális szerver-oldali create, sablon seedeléssel) --
app.post("/api/surveys", async (req, res) => {
    try {
        const g = (req.body?.globals ?? {});
        // const id = uuid()
        const id = (0, node_crypto_1.randomUUID)();
        const seededForms = [];
        for (const tab of SURVEY_TABS) {
            const tpl = await loadTemplateForTab(tab);
            if (tpl)
                seededForms.push(tpl);
        }
        const fresh = {
            id,
            globals: {
                companyName: g.companyName || "",
                site: g.site || "",
                phone: g.phone || "",
                email: g.email || "",
                logoDataUrl: g.logoDataUrl
            },
            forms: seededForms,
            answers: {},
            files: {},
            snapshots: [],
            updatedAt: nowIso()
        };
        await writeSurvey(fresh);
        res.status(201).json(fresh);
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || "create failed" });
    }
});
// -- Load / Save / Delete Survey --
app.get("/api/surveys/:id", async (req, res) => {
    const s = await readSurvey(req.params.id);
    if (!s)
        return res.status(404).json(null);
    res.json(s);
});
app.post("/api/surveys/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const next = req.body;
        if (!next || !next.id || next.id !== id) {
            return res.status(400).json({ ok: false, error: "invalid payload or id mismatch" });
        }
        next.updatedAt = nowIso();
        await writeSurvey(next);
        res.json({ ok: true, updatedAt: next.updatedAt });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || "save failed" });
    }
});
app.delete("/api/surveys/:id", async (req, res) => {
    try {
        await deleteSurveyDisk(req.params.id);
        res.json({ ok: true });
    }
    catch (e) {
        console.log('error: ', e);
        res.status(500).json({ ok: false, error: e?.message || "delete failed" });
    }
});
// -- Globals (névütközés kezeléssel) --
app.get("/api/surveys/:id/globals", async (req, res) => {
    const s = await readSurvey(req.params.id);
    if (!s)
        return res.status(404).json(null);
    res.json(s.globals);
});
app.post("/api/surveys/:id/globals", async (req, res) => {
    try {
        const id = req.params.id;
        const s = await readSurvey(id);
        if (!s)
            return res.status(404).json({ ok: false, error: "not found" });
        const g = req.body;
        const targetName = (g.companyName || "").trim();
        if (targetName) {
            const conflict = await findSurveyIdByCompanyName(targetName);
            if (conflict && conflict !== id) {
                return res.status(409).json({ ok: false, code: "DUPLICATE_COMPANY_NAME" });
            }
        }
        s.globals = {
            companyName: targetName,
            site: g.site || "",
            phone: g.phone || "",
            email: g.email || "",
            logoDataUrl: g.logoDataUrl
        };
        s.updatedAt = nowIso();
        await writeSurvey(s);
        res.json({ ok: true, updatedAt: s.updatedAt });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || "globals save failed" });
    }
});
// -- Forms (loadAll / saveAll / save(form)) --
app.get("/api/surveys/:id/forms", async (req, res) => {
    const s = await readSurvey(req.params.id);
    if (!s)
        return res.status(404).json([]);
    res.json(Array.isArray(s.forms) ? s.forms : []);
});
app.post("/api/surveys/:id/forms", async (req, res) => {
    try {
        const s = await readSurvey(req.params.id);
        if (!s)
            return res.status(404).json({ ok: false, error: "not found" });
        s.forms = Array.isArray(req.body) ? req.body : [];
        s.updatedAt = nowIso();
        await writeSurvey(s);
        res.json({ ok: true, updatedAt: s.updatedAt });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || "forms save failed" });
    }
});
app.get("/api/surveys/:id/forms/:formId", async (req, res) => {
    const s = await readSurvey(req.params.id);
    if (!s)
        return res.status(404).json(null);
    const f = (s.forms || []).find((x) => String(x?.meta?.id || "") === String(req.params.formId));
    if (!f)
        return res.status(404).json(null);
    res.json(f);
});
app.post("/api/surveys/:id/forms/:formId", async (req, res) => {
    try {
        const s = await readSurvey(req.params.id);
        if (!s)
            return res.status(404).json({ ok: false, error: "not found" });
        const formId = String(req.params.formId);
        const forms = Array.isArray(s.forms) ? [...s.forms] : [];
        const payload = req.body;
        const i = forms.findIndex((x) => String(x?.meta?.id || "") === formId);
        if (i >= 0)
            forms[i] = payload;
        else
            forms.push(payload);
        s.forms = forms;
        s.updatedAt = nowIso();
        await writeSurvey(s);
        res.json({ ok: true, updatedAt: s.updatedAt });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || "form upsert failed" });
    }
});
// -- Answers (loadAnswers / saveAnswers) --
app.get("/api/surveys/:id/answers/:formId", async (req, res) => {
    const s = await readSurvey(req.params.id);
    if (!s)
        return res.status(404).json({});
    res.json((s.answers || {})[String(req.params.formId)] || {});
});
app.post("/api/surveys/:id/answers/:formId", async (req, res) => {
    try {
        const s = await readSurvey(req.params.id);
        if (!s)
            return res.status(404).json({ ok: false, error: "not found" });
        const formId = String(req.params.formId);
        s.answers = s.answers || {};
        s.answers[formId] = req.body || {};
        s.updatedAt = nowIso();
        await writeSurvey(s);
        res.json({ ok: true, updatedAt: s.updatedAt });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || "answers save failed" });
    }
});
const locksFile = path_1.default.join(dataRoot, 'locks.json');
async function readLocks() {
    return readJSON(locksFile, {});
}
async function writeLocks(map) {
    await writeJSON(locksFile, map);
}
function isExpired(lock) {
    return !lock || !lock.expiresAt || new Date(lock.expiresAt).getTime() <= Date.now();
}
function addSeconds(iso, sec) {
    return new Date(new Date(iso).getTime() + sec * 1000).toISOString();
}
// GET /api/surveys/locks  → összes aktív lock
app.get('/api/surveys/locks', async (_req, res) => {
    try {
        const map = await readLocks();
        // purge lejártak
        const now = Date.now();
        let dirty = false;
        for (const k of Object.keys(map)) {
            if (isExpired(map[k])) {
                delete map[k];
                dirty = true;
            }
        }
        if (dirty)
            await writeLocks(map);
        res.json(map);
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || 'locks read failed' });
    }
});
// POST /api/surveys/:id/lock  body: { owner: string, ttlSec?: number }
app.post('/api/surveys/:id/lock', async (req, res) => {
    try {
        const id = String(req.params.id);
        const owner = String(req.body?.owner || '');
        const ttlSec = Math.max(15, Math.min(600, Number(req.body?.ttlSec || 60))); // 15–600s
        if (!owner)
            return res.status(400).json({ ok: false, error: 'owner required' });
        const map = await readLocks();
        // purge
        for (const k of Object.keys(map))
            if (isExpired(map[k]))
                delete map[k];
        const cur = map[id];
        if (cur && !isExpired(cur) && cur.owner !== owner) {
            return res.status(423).json({ ok: false, error: 'locked', lock: cur });
        }
        const now = new Date().toISOString();
        map[id] = { id, owner, expiresAt: addSeconds(now, ttlSec) };
        await writeLocks(map);
        res.json({ ok: true, lock: map[id] });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || 'lock failed' });
    }
});
// DELETE /api/surveys/:id/lock?owner=...
app.delete('/api/surveys/:id/lock', async (req, res) => {
    try {
        const id = String(req.params.id);
        const owner = String(req.query?.owner || '');
        const map = await readLocks();
        // purge
        for (const k of Object.keys(map))
            if (isExpired(map[k]))
                delete map[k];
        const cur = map[id];
        if (!cur || isExpired(cur)) {
            delete map[id];
            await writeLocks(map);
            return res.json({ ok: true });
        }
        if (owner && cur.owner !== owner)
            return res.status(403).json({ ok: false, error: 'not owner' });
        delete map[id];
        await writeLocks(map);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || 'unlock failed' });
    }
});
// 4) Minden más kérést (nem /api) proxizzunk Vite-ra
// app.use(
//   viteDevProxy({ target: "http://localhost:5173" }) // ha a Vite dev 5173-on fut
// );
// ====== Statikus frontend (Vite dist) ======
app.use(express_1.default.static(distDir, {
    extensions: ["html"],
    setHeaders: (res, filePath) => {
        // Az index.html ne cache-elődjön (különben az injektálás frissítés után késhet)
        if (filePath.endsWith("index.html")) {
            res.setHeader("Cache-Control", "no-cache");
        }
    }
}));
// 6) SPA catch-all: index.html beolvasás + SW/manifest injektálás
app.get("*", async (_req, res, next) => {
    try {
        const indexPath = path_1.default.join(distDir, "index.html");
        let html = await promises_1.default.readFile(indexPath, "utf8");
        // Mindig injektálunk (egyszerű és biztos)
        //     const injection = `
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
        // </script>`.trim();
        const injection = `
      <link rel="manifest" href="/manifest.webmanifest">
      <script src="/sw-register.js" defer></script>
      `.trim();
        if (!html.includes("navigator.serviceWorker.register")) {
            html = html.replace("</head>", `${injection}\n</head>`);
            console.log("[HTML] SW regisztrációs snippet injektálva.");
        }
        else {
            console.log("[HTML] SW snippet már jelen van.");
        }
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache"); // index.html ne cache-elődjön
        res.send(html);
    }
    catch (err) {
        next(err);
    }
});
// ====== Indítás ======
// app.listen(PORT, () => {
//   console.log(`API listening on http://localhost:${PORT} (NODE_ENV=${process.env.NODE_ENV || "development"})`);
// });
exports.default = app; // <<< EZZEL ZÁRJ!  Nincs app.listen itt.
