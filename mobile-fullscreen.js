(() => {
  'use strict';

  const root = document.documentElement;
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const narrowViewport = window.matchMedia('(max-width: 900px)');
  const touchCapable = () => coarsePointer.matches
    || navigator.maxTouchPoints > 0
    || narrowViewport.matches;
  let touchLayoutEnabled = touchCapable();

  const syncTouchLayout = () => {
    if (touchCapable()) touchLayoutEnabled = true;
    document.body?.classList.toggle('touch-device', touchLayoutEnabled);
    document.querySelectorAll('#touch-controls, .touch-controls').forEach((controls) => {
      controls.setAttribute('aria-hidden', String(!touchLayoutEnabled));
    });
  };

  const mobileStyles = document.createElement('style');
  mobileStyles.textContent = `
    body.touch-device [role="dialog"],
    body.touch-device .modal,
    body.touch-device #instruction-modal {
      overflow-y: auto !important;
      overscroll-behavior: contain;
    }
    body.touch-device [role="dialog"] > div,
    body.touch-device .modal-card,
    body.touch-device .instruction-card,
    body.touch-device .instructions-card,
    body.touch-device #instruction-modal > div {
      max-height: calc(100dvh - 20px) !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch;
    }
    body.touch-device button,
    body.touch-device canvas {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    body.touch-device .flyout-nav,
    body.touch-device .menu-toggle,
    body.touch-device #menu-toggle,
    body.touch-device #nav-slot,
    body.touch-device #help-button {
      display: none !important;
    }
    body.touch-device .touch-controls {
      display: flex !important;
    }
    body.touch-device #touch-controls {
      position: fixed !important;
      inset: 0 !important;
    }
    body.touch-device #touch-controls:has(.touch-key) {
      display: block !important;
    }
    body.touch-device .directional-diamond {
      display: grid !important;
      grid-template-columns: repeat(3, clamp(52px, 12vw, 66px));
      grid-template-rows: repeat(3, clamp(52px, 12vw, 66px));
      gap: 4px !important;
      align-items: center;
      justify-items: center;
    }
    body.touch-device .directional-diamond .control-button {
      width: clamp(52px, 12vw, 66px) !important;
      height: clamp(52px, 12vw, 66px) !important;
    }
    body.touch-device .directional-diamond .pad-up { grid-column: 2; grid-row: 1; }
    body.touch-device .directional-diamond .pad-left { grid-column: 1; grid-row: 2; }
    body.touch-device .directional-diamond .pad-right { grid-column: 3; grid-row: 2; }
    body.touch-device .directional-diamond .pad-down { grid-column: 2; grid-row: 3; }
    body.touch-device .qbert-diagonals {
      display: grid !important;
      grid-template-columns: repeat(2, clamp(58px, 13vw, 70px));
      grid-template-rows: repeat(2, clamp(58px, 13vw, 70px));
      gap: 10px !important;
    }
    body.touch-device .qbert-diagonals .control-button {
      width: clamp(58px, 13vw, 70px) !important;
      height: clamp(58px, 13vw, 70px) !important;
    }
    body.touch-device .tetris-pad,
    body.touch-device .tetris-actions {
      flex-direction: row !important;
      align-items: center;
      gap: 8px !important;
    }
    body.touch-device .tetris-pad .control-button {
      width: clamp(54px, 12vw, 68px) !important;
      height: clamp(54px, 12vw, 68px) !important;
    }
    body.touch-device .tetris-actions .control-button {
      width: clamp(62px, 14vw, 76px) !important;
      height: clamp(62px, 14vw, 76px) !important;
      font-size: clamp(.72rem, 2.5vw, 1rem) !important;
    }
    .vibecade-mobile-restart {
      position: fixed;
      top: max(8px, env(safe-area-inset-top));
      right: max(8px, env(safe-area-inset-right));
      z-index: 39;
      display: none;
      width: 42px;
      height: 42px;
      place-items: center;
      padding: 0;
      border: 1px solid rgba(255, 255, 255, .3);
      border-radius: 50%;
      background: rgba(5, 8, 20, .5);
      color: #fff;
      box-shadow: 0 6px 20px rgba(0, 0, 0, .25);
      font: 800 24px/1 system-ui, sans-serif;
      backdrop-filter: blur(8px);
    }
    body.touch-device .vibecade-mobile-restart {
      display: grid;
    }
  `;
  document.head.appendChild(mobileStyles);

  const restartButton = document.createElement('button');
  restartButton.type = 'button';
  restartButton.className = 'vibecade-mobile-restart';
  restartButton.setAttribute('aria-label', 'Restart game');
  restartButton.title = 'Restart game';
  restartButton.textContent = '↻';
  restartButton.addEventListener('click', () => window.location.reload());
  document.body.appendChild(restartButton);

  syncTouchLayout();
  window.addEventListener('resize', syncTouchLayout, { passive: true });
  if (coarsePointer.addEventListener) {
    coarsePointer.addEventListener('change', syncTouchLayout);
    narrowViewport.addEventListener('change', syncTouchLayout);
  } else {
    coarsePointer.addListener(syncTouchLayout);
    narrowViewport.addListener(syncTouchLayout);
  }

  const fullscreenElement = () => document.fullscreenElement
    || document.webkitFullscreenElement
    || document.msFullscreenElement;
  const request = root.requestFullscreen
    || root.webkitRequestFullscreen
    || root.msRequestFullscreen;

  if (!request) {
    root.dataset.mobileFullscreen = 'unsupported';
    return;
  }

  root.dataset.mobileFullscreen = fullscreenElement() ? 'entered' : 'ready';
  let requestInFlight = false;

  const removeGestureListeners = () => {
    document.removeEventListener('pointerup', attemptFullscreen, true);
    document.removeEventListener('touchend', attemptFullscreen, true);
    document.removeEventListener('click', attemptFullscreen, true);
  };

  const onFullscreenChange = () => {
    if (fullscreenElement()) {
      root.dataset.mobileFullscreen = 'entered';
      removeGestureListeners();
    } else if (touchLayoutEnabled) {
      root.dataset.mobileFullscreen = 'ready';
      addGestureListeners();
    }
  };

  function attemptFullscreen(event) {
    if (!touchLayoutEnabled || fullscreenElement() || requestInFlight) return;

    requestInFlight = true;
    root.dataset.mobileFullscreenAttempted = 'true';
    root.dataset.mobileFullscreen = 'requesting';

    try {
      const result = request.call(root);
      if (result && typeof result.then === 'function') {
        result
          .then(() => onFullscreenChange())
          .catch(() => {
            requestInFlight = false;
            root.dataset.mobileFullscreen = 'ready';
          });
      } else {
        requestInFlight = false;
        onFullscreenChange();
      }
    } catch (_) {
      requestInFlight = false;
      root.dataset.mobileFullscreen = 'ready';
    }
  }

  function addGestureListeners() {
    document.addEventListener('pointerup', attemptFullscreen, { capture: true, passive: true });
    document.addEventListener('touchend', attemptFullscreen, { capture: true, passive: true });
    document.addEventListener('click', attemptFullscreen, { capture: true, passive: true });
  }

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  addGestureListeners();
})();
