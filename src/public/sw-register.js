console.log("[SW-REG] script loaded");   // <-- Ezt keressük majd a böngésző Konzolban

(function () {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Not supported'); 
    return;
  }
  if (!window.isSecureContext) {
    console.warn('[SW] Not secure context');
    return;
  }

  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((reg) => {
      console.log('[SW] Registered:', reg.scope);
      try { reg.update(); } catch {}
    })
    .catch((err) => {
      console.error('[SW] Register failed:', err);
    });

  window.addEventListener('online', () => {
    navigator.serviceWorker.controller?.postMessage('replay-outbox');
  });
})();