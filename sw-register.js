/* ═══════════════════════════════════════════════════════════
   SPRINT OS — sw-register.js
   Registers the service worker for PWA / offline support.
   Include as <script src="sw-register.js"></script> in every page.
   Safe to include even if SW is not supported (graceful degradation).
═══════════════════════════════════════════════════════════ */

(function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/life-plan/sw.js', { scope: '/life-plan/' })
      .then(reg => {
        console.info('[Sprint OS] SW registered. Scope:', reg.scope);

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              document.dispatchEvent(new CustomEvent('sw:update-available'));
              // Show a subtle toast via U if available
              setTimeout(() => {
                if (window.U && typeof U._toast === 'function') {
                  // U._toast is internal — use public event instead
                }
                const existing = document.getElementById('sw-update-toast');
                if (existing) return;
                const tc = document.getElementById('toast-container') || document.body;
                const t  = document.createElement('div');
                t.id        = 'sw-update-toast';
                t.className = 'toast toast-info';
                t.innerHTML = '<span>🔄 Sprint OS updated. <a onclick="location.reload()" class="toast-link" style="cursor:pointer">Reload to apply →</a></span>';
                tc.appendChild(t);
              }, 500);
            }
          });
        });

        // Listen for messages from SW (e.g. sync-ready)
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data?.type === 'sync-ready') {
            document.dispatchEvent(new CustomEvent('sw:sync-ready'));
          }
        });
      })
      .catch(err => {
        console.warn('[Sprint OS] SW registration failed:', err);
      });
  });
})();
