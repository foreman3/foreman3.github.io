// Resolve from this shared module so game pages and subdirectory hosting use
// the same app identity, manifest, and service worker scope.
const appRoot = new URL('./', import.meta.url);
if (!document.querySelector('link[rel="manifest"]')) {
  const manifest = document.createElement('link');
  manifest.rel = 'manifest';
  manifest.href = new URL('manifest.webmanifest', appRoot).href;
  document.head.appendChild(manifest);
}

const offlineCard = document.getElementById('offline-card');
const offlineStatus = document.getElementById('offline-status');
const offlineProgress = document.getElementById('offline-progress');
const offlineRetry = document.getElementById('offline-retry');
const offlineDetail = document.getElementById('offline-detail');
const updateMessage = 'Arcade update downloaded. Close all VibeCade windows and reopen to use it.';
let updateWaiting = false;
function showOfflineStatus(data) {
  if (!offlineCard || data.type !== 'VIBECADE_OFFLINE_STATUS') return;
  offlineCard.hidden = false;
  offlineProgress.max = data.total;
  offlineProgress.value = data.completed;
  offlineProgress.hidden = data.state !== 'downloading';
  offlineRetry.hidden = data.state !== 'error';
  const size = (data.bytes / 1_000_000).toFixed(1);
  offlineDetail.textContent = data.state === 'ready'
    ? 'Audio Assault opens a separate website and needs internet.'
    : 'Keep this page open until the download finishes. Audio Assault opens a separate website and needs internet.';
  offlineStatus.textContent = data.state === 'ready'
    ? updateWaiting ? updateMessage : `${data.games} games ready offline (${size} MB). You can play without internet.`
    : data.state === 'error'
      ? 'Download interrupted. Reconnect and retry to finish saving the arcade.'
      : `Saving the arcade for offline play: ${data.completed}/${data.total} files (${size} MB).`;
}
async function registerOffline() {
  if (!window.isSecureContext || !('serviceWorker' in navigator)) return;
  if (offlineCard) offlineCard.hidden = false;
  try {
    const registration = await navigator.serviceWorker.register(new URL('service-worker.js', appRoot), {
      scope: appRoot.pathname,
      updateViaCache: 'none'
    });
    const askStatus = () => {
      updateWaiting = Boolean(registration.waiting && navigator.serviceWorker.controller);
      navigator.serviceWorker.controller?.postMessage({ type: 'VIBECADE_OFFLINE_STATUS' });
    };
    navigator.serviceWorker.addEventListener('controllerchange', askStatus);
    askStatus();
    const watchInstall = () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'redundant' && offlineStatus) {
          offlineProgress.hidden = true;
          offlineRetry.hidden = false;
          offlineStatus.textContent = 'Download interrupted. Reconnect and retry to finish saving the arcade.';
        } else if (worker.state === 'installed' && registration.waiting && navigator.serviceWorker.controller && offlineStatus) {
          updateWaiting = true;
          offlineStatus.textContent = updateMessage;
          offlineProgress.hidden = true;
        }
      });
    };
    registration.addEventListener('updatefound', watchInstall);
    watchInstall();
    if (registration.waiting && navigator.serviceWorker.controller && offlineStatus) {
      updateWaiting = true;
      offlineStatus.textContent = updateMessage;
      offlineProgress.hidden = true;
    }
  } catch (error) {
    if (offlineStatus) {
      offlineStatus.textContent = 'Offline download unavailable. Reconnect and retry.';
      offlineProgress.hidden = true;
      offlineRetry.hidden = false;
    }
    console.warn('VibeCade install support:', error);
  }
}
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', event => showOfflineStatus(event.data || {}));
offlineRetry?.addEventListener('click', () => location.reload());
registerOffline();

const card = document.getElementById('install-card');
const button = document.getElementById('install-app');
const help = document.getElementById('install-help');
const appMode = window.matchMedia('(display-mode: fullscreen), (display-mode: standalone), (display-mode: minimal-ui)');
let installed = appMode.matches || navigator.standalone === true;
let installPrompt = null;
let prompting = false;

const syncCard = () => {
  if (card) card.hidden = installed;
};
const showHelp = message => {
  if (!help) return;
  help.textContent = message;
  help.hidden = false;
};

window.addEventListener('beforeinstallprompt', event => {
  // Keep the browser's own install UI on game pages, which have no install card.
  if (!card || !button) return;
  event.preventDefault();
  installPrompt = event;
  syncCard();
});
window.addEventListener('appinstalled', () => {
  installed = true;
  installPrompt = null;
  syncCard();
});
appMode.addEventListener('change', () => {
  installed = appMode.matches || navigator.standalone === true;
  syncCard();
});

button?.addEventListener('click', async () => {
  if (prompting) return;
  if (!installPrompt) {
    showHelp(window.isSecureContext
      ? 'On Android, open this site in Chrome, tap the ⋮ menu, then “Add to home screen” → “Install”. After installing, launch VibeCade from its home screen icon. Other browsers may call this “Install app”.'
      : 'To install, open VibeCade at its HTTPS website in Chrome. Then use the ⋮ menu → Add to home screen → Install.');
    return;
  }
  const event = installPrompt;
  installPrompt = null; // A browser install event can only be used once.
  prompting = true;
  button.disabled = true;
  try {
    await event.prompt();
    const choice = await event.userChoice;
    showHelp(choice.outcome === 'accepted'
      ? 'Finish installing, then launch VibeCade from its home screen icon for fullscreen play.'
      : 'You can install later using Chrome’s ⋮ menu → Add to home screen → Install.');
  } catch (_) {
    showHelp('Use Chrome’s ⋮ menu → Add to home screen → Install, then launch the home screen icon.');
  } finally {
    prompting = false;
    button.disabled = false;
  }
});
syncCard();
