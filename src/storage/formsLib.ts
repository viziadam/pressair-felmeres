


import type { FormData } from '../types'
import type { FormTemplate } from "../types";

const KEY_FOR_TAB = (tab: string) => `formlib/templates/${tab}`     // egy tab = egy kulcs
const LEGACY_SINGLE_KEY = 'formlib/__single__'                      // régi "Űrlap" kulcs

function readJSON<T>(k: string, fb: T): T {
  try { return JSON.parse(localStorage.getItem(k) || '') as T } catch { return fb }
}
function writeJSON(k: string, v: any) {
  localStorage.setItem(k, JSON.stringify(v))
}

/** Egyszeri takarítás: a régi single sablon törlése (Űrlap) */
export function removeLegacySingleTemplate(): void {
  localStorage.removeItem(LEGACY_SINGLE_KEY)
}

// ====== ITT A FRISSÍTETT FÜGGVÉNY ======
const API_BASE = "/api" // a Vite proxy miatt ez elég

export async function loadTemplateForTab(tab: string): Promise<FormData | null> {
  // 1) normál próbálkozás
  try {
    const r = await fetch(`${API_BASE}/templates/${encodeURIComponent(tab)}`, {
      credentials: "same-origin",
    });
    if (r.ok) {
      const data = (await r.json()) as FormData;
      if (data && typeof data === 'object') return data;
    }
  } catch {
    // megyünk tovább a bust-os próbára
  }

  // 2) cache-busting retry: kikerüljük a SW cache-first-et (ha korábban 404-et cache-elt)
  try {
    const r2 = await fetch(
      `${API_BASE}/templates/${encodeURIComponent(tab)}?bust=${Date.now()}`,
      { credentials: "same-origin" }
    );
    if (r2.ok) {
      const data2 = (await r2.json()) as FormData;
      if (data2 && typeof data2 === 'object') return data2;
    }
  } catch {
    // megyünk a local fallbackre
  }

  // 3) utolsó fallback: localStorage-ban tárolt sablon (ha korábban elmentetted)
  const localTpl = readJSON<FormData | null>(KEY_FOR_TAB(tab), null);
  return localTpl;
}

/** form: a teljes FormData objektum (meta, elements, stb.) */
export async function saveTemplateForTab(tab: string, form: any): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/templates/${encodeURIComponent(tab)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(form)
    })
    return r.ok
  } catch {
    return false
  }
}