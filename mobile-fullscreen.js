(() => {
  'use strict';

  const root = document.documentElement;
  const narrowViewport = window.matchMedia('(max-width: 900px)');
  let touchLayoutEnabled = narrowViewport.matches;
  const suppressTouchCallout = (event) => {
    if (touchLayoutEnabled) event.preventDefault();
  };

  const syncTouchLayout = () => {
    touchLayoutEnabled = narrowViewport.matches;
    root.dataset.vibecadeTouchUi = touchLayoutEnabled ? 'active' : 'inactive';
    document.body?.classList.toggle('touch-device', touchLayoutEnabled);
    document.querySelectorAll('#touch-controls, .touch-controls').forEach((controls) => {
      controls.setAttribute('aria-hidden', String(!touchLayoutEnabled));
      if (!controls.dataset.vibecadeTouchGuard) {
        controls.dataset.vibecadeTouchGuard = 'true';
        controls.addEventListener('contextmenu', suppressTouchCallout);
        controls.querySelectorAll('button').forEach((button) => {
          button.draggable = false;
        });
      }
    });
  };

  const mobileStyles = document.createElement('style');
  mobileStyles.textContent = `
    html[data-vibecade-touch-ui="inactive"] body #touch-controls,
    html[data-vibecade-touch-ui="inactive"] body .touch-controls,
    html[data-vibecade-touch-ui="inactive"] body .vibecade-mobile-restart {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
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
    body.touch-device canvas,
    body.touch-device #touch-controls,
    body.touch-device .touch-controls {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    body.touch-device .virtual-joystick {
      touch-action: none !important;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
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

  window.VibeCadeJoystick = function bindVibeCadeJoystick(element, options = {}) {
    if (!element) return () => {};

    const knob = element.querySelector('.joystick-knob');
    const mode = options.mode === 'cardinal' ? 'cardinal' : 'analog';
    const deadZone = Number.isFinite(options.deadZone) ? options.deadZone : 0.16;
    const onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    let pointerId = null;
    let lastVector = '';

    const directionName = (x, y) => {
      if (Math.hypot(x, y) < 0.01) return 'idle';
      const vertical = y < -0.3 ? 'up' : y > 0.3 ? 'down' : '';
      const horizontal = x < -0.3 ? 'left' : x > 0.3 ? 'right' : '';
      return [vertical, horizontal].filter(Boolean).join('-') || 'idle';
    };

    const emit = (x, y) => {
      const key = `${x.toFixed(3)},${y.toFixed(3)}`;
      if (key === lastVector) return;
      lastVector = key;
      element.dataset.joystickVector = key;
      element.dataset.joystickDirection = directionName(x, y);
      onChange(x, y);
    };

    const centerKnob = () => {
      element.classList.remove('is-active');
      if (knob) knob.style.transform = 'translate(-50%, -50%)';
      emit(0, 0);
    };

    const update = (event) => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const radius = Math.min(rect.width, rect.height) / 2;
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      const maxTravel = Math.max(1, radius * 0.48);
      const visualScale = distance > maxTravel ? maxTravel / distance : 1;

      if (knob) {
        knob.style.transform = `translate(calc(-50% + ${dx * visualScale}px), calc(-50% + ${dy * visualScale}px))`;
      }

      if (distance <= radius * deadZone) {
        emit(0, 0);
        return;
      }

      if (mode === 'cardinal') {
        if (Math.abs(dx) >= Math.abs(dy)) emit(Math.sign(dx), 0);
        else emit(0, Math.sign(dy));
        return;
      }

      const strength = Math.min(1, (distance - radius * deadZone) / (radius * (0.78 - deadZone)));
      emit(dx / distance * strength, dy / distance * strength);
    };

    const start = (event) => {
      if (pointerId !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      pointerId = event.pointerId;
      element.classList.add('is-active');
      try { element.setPointerCapture(pointerId); } catch (_) {}
      update(event);
    };

    const finish = (event) => {
      if (pointerId === null || (event.pointerId !== undefined && event.pointerId !== pointerId)) return;
      const capturedPointer = pointerId;
      pointerId = null;
      try {
        if (element.hasPointerCapture(capturedPointer)) element.releasePointerCapture(capturedPointer);
      } catch (_) {}
      centerKnob();
    };

    element.addEventListener('pointerdown', start);
    element.addEventListener('pointermove', update);
    element.addEventListener('pointerup', finish);
    element.addEventListener('pointercancel', finish);
    element.addEventListener('lostpointercapture', finish);
    element.addEventListener('contextmenu', suppressTouchCallout);
    window.addEventListener('blur', centerKnob);
    centerKnob();

    return () => {
      element.removeEventListener('pointerdown', start);
      element.removeEventListener('pointermove', update);
      element.removeEventListener('pointerup', finish);
      element.removeEventListener('pointercancel', finish);
      element.removeEventListener('lostpointercapture', finish);
      element.removeEventListener('contextmenu', suppressTouchCallout);
      window.removeEventListener('blur', centerKnob);
      centerKnob();
    };
  };

  syncTouchLayout();
  window.addEventListener('resize', syncTouchLayout, { passive: true });
  if (narrowViewport.addEventListener) {
    narrowViewport.addEventListener('change', syncTouchLayout);
  } else {
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
