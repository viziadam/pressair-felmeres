// Egységes debug log: konzol + UI event
// export function dbg(message: string, data?: Record<string, any>) {
//   const ts = new Date().toISOString();
//   const line = `${ts} ${message}`;
//   // konzol
//   if (data) console.log('[SURVEY]', line, data);
//   else console.log('[SURVEY]', line);

//   // UI esemény (Surveys.tsx debug panelhez)
//   if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
//     const detail = data ? `${line} :: ${safeJson(data)}` : line;
//     window.dispatchEvent(new CustomEvent('survey-debug', { detail }));
//   }
// }

// function safeJson(v: any) {
//   try { return JSON.stringify(v); } catch { return String(v); }
// }