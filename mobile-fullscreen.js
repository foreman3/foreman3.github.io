(() => {
  'use strict';

  const root = document.documentElement;
  const narrowViewport = window.matchMedia('(max-width: 900px)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  let mobileSession = narrowViewport.matches || coarsePointer.matches;
  let touchLayoutEnabled = mobileSession;
  const suppressTouchCallout = (event) => {
    if (touchLayoutEnabled) event.preventDefault();
  };

  const syncTouchLayout = () => {
    if (narrowViewport.matches || coarsePointer.matches) mobileSession = true;
    touchLayoutEnabled = mobileSession;
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
    syncJoystickLayout();
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
      position: relative !important;
      box-sizing: border-box !important;
      width: 126px !important;
      height: 126px !important;
      flex: 0 0 126px !important;
      pointer-events: auto !important;
      border: 1px solid rgba(190, 240, 255, .38) !important;
      border-radius: 50% !important;
      background: radial-gradient(circle, rgba(175, 235, 255, .12) 0 31%, rgba(8, 13, 29, .62) 32% 100%) !important;
      box-shadow: inset 0 0 15px rgba(120, 220, 255, .1), 0 5px 18px rgba(0, 0, 0, .22) !important;
      backdrop-filter: blur(8px);
      touch-action: none !important;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    body.touch-device .joystick-mark {
      position: absolute !important;
      color: rgba(220, 248, 255, .62) !important;
      font: 900 11px/1 system-ui, sans-serif !important;
      pointer-events: none !important;
    }
    body.touch-device .joystick-mark.up { left: 50% !important; top: 7px !important; transform: translateX(-50%) !important; }
    body.touch-device .joystick-mark.right { right: 8px !important; top: 50% !important; transform: translateY(-50%) !important; }
    body.touch-device .joystick-mark.down { left: 50% !important; bottom: 7px !important; transform: translateX(-50%) !important; }
    body.touch-device .joystick-mark.left { left: 8px !important; top: 50% !important; transform: translateY(-50%) !important; }
    body.touch-device .virtual-joystick[data-axis="horizontal"] .joystick-mark.up,
    body.touch-device .virtual-joystick[data-axis="horizontal"] .joystick-mark.down { display: none !important; }
    body.touch-device .joystick-knob {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      width: 47px !important;
      height: 47px !important;
      border: 1px solid rgba(225, 250, 255, .78) !important;
      border-radius: 50% !important;
      background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, .48), rgba(64, 116, 151, .8)) !important;
      box-shadow: 0 4px 10px rgba(0, 0, 0, .4), 0 0 10px rgba(115, 225, 255, .24) !important;
      transform: translate(-50%, -50%);
      pointer-events: none !important;
    }
    body.touch-device .virtual-joystick.is-active .joystick-knob {
      box-shadow: 0 3px 8px rgba(0, 0, 0, .44), 0 0 15px rgba(115, 225, 255, .5) !important;
    }
    body.touch-device.vibecade-joystick-rails .vibecade-joystick-playfield {
      position: relative !important;
      box-sizing: border-box !important;
      width: var(--vibecade-playfield-width) !important;
      height: var(--vibecade-playfield-height) !important;
      min-width: 0 !important;
      min-height: 0 !important;
      max-width: var(--vibecade-playfield-width) !important;
      max-height: var(--vibecade-playfield-height) !important;
      flex: 0 0 auto !important;
      margin: auto !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    body.touch-device.vibecade-joystick-rails .vibecade-joystick-playfield canvas {
      box-sizing: border-box !important;
      width: 100% !important;
      height: 100% !important;
      min-width: 0 !important;
      min-height: 0 !important;
      max-width: none !important;
      max-height: none !important;
      margin: 0 !important;
    }
    body.touch-device.vibecade-joystick-rails #touch-controls,
    body.touch-device.vibecade-joystick-rails .touch-controls {
      position: fixed !important;
      inset: 0 !important;
      z-index: 38 !important;
      box-sizing: border-box !important;
      display: grid !important;
      width: 100vw !important;
      height: 100dvh !important;
      grid-template-columns: var(--vibecade-control-rail) minmax(0, 1fr) var(--vibecade-control-rail) !important;
      grid-template-rows: 1fr !important;
      align-items: center !important;
      justify-items: center !important;
      padding: 4px 0 !important;
      pointer-events: none !important;
    }
    body.touch-device.vibecade-joystick-rails :is(#touch-controls, .touch-controls) > .virtual-joystick {
      grid-column: 1 !important;
      grid-row: 1 !important;
      align-self: center !important;
      justify-self: center !important;
    }
    body.touch-device.vibecade-joystick-rails :is(#touch-controls, .touch-controls) > :not(.virtual-joystick) {
      grid-column: 3 !important;
      grid-row: 1 !important;
      align-self: center !important;
      justify-self: center !important;
    }
    body.touch-device.vibecade-joystick-rails :is(.control-cluster, .touch-cluster, .actions, .touch-group, #right-controls, .control-row) {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
    }
    body.touch-device.vibecade-joystick-rails :is(.control-button, .touch-button, .fire, .pulse, .pump) {
      flex: 0 0 auto !important;
      margin: 0 !important;
    }
    body.touch-device:has(#instruction-modal.is-visible) :is(#touch-controls, .touch-controls),
    body.touch-device:has(#tutorialOverlay:not(.hidden)) :is(#touch-controls, .touch-controls) {
      visibility: hidden !important;
      pointer-events: none !important;
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
    .vibecade-mobile-ready,
    .vibecade-mobile-settling {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      display: none;
      place-items: center;
      box-sizing: border-box;
      padding: max(18px, env(safe-area-inset-top)) max(18px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left));
      background: rgba(3, 7, 18, .78);
      color: #fff;
      text-align: center;
      backdrop-filter: blur(12px);
    }
    body.touch-device .vibecade-mobile-ready,
    body.touch-device .vibecade-mobile-settling {
      display: grid;
    }
    .vibecade-mobile-ready-card {
      width: min(360px, 92vw);
      box-sizing: border-box;
      padding: 24px;
      border: 1px solid rgba(150, 226, 255, .42);
      border-radius: 22px;
      background: linear-gradient(155deg, rgba(22, 35, 61, .97), rgba(5, 10, 24, .98));
      box-shadow: 0 24px 70px rgba(0, 0, 0, .5);
    }
    .vibecade-mobile-ready h2 {
      margin: 0 0 8px;
      font: 800 clamp(1.45rem, 6vw, 2rem)/1.05 system-ui, sans-serif;
      letter-spacing: -.02em;
    }
    .vibecade-mobile-ready p {
      margin: 0 auto 20px;
      max-width: 30ch;
      color: rgba(235, 246, 255, .78);
      font: 500 .96rem/1.45 system-ui, sans-serif;
    }
    .vibecade-mobile-ready button {
      display: block;
      width: 100%;
      min-height: 50px;
      border: 1px solid rgba(255, 255, 255, .28);
      border-radius: 999px;
      color: #fff;
      font: 800 .92rem/1 system-ui, sans-serif;
      letter-spacing: .04em;
    }
    .vibecade-mobile-play {
      background: linear-gradient(135deg, #1777c8, #12a6a6);
      box-shadow: 0 8px 24px rgba(19, 151, 184, .3);
    }
    .vibecade-mobile-instructions {
      margin-top: 10px;
      background: rgba(255, 255, 255, .08);
    }
    .vibecade-mobile-settling {
      font: 800 1rem/1.3 system-ui, sans-serif;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .vibecade-mobile-settling::before {
      content: '';
      position: absolute;
      width: 46px;
      height: 46px;
      margin-top: -76px;
      border: 4px solid rgba(255, 255, 255, .2);
      border-top-color: #7de7ff;
      border-radius: 50%;
      animation: vibecade-spin .7s linear infinite;
    }
    @keyframes vibecade-spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(mobileStyles);

  const joystickElement = document.querySelector('.virtual-joystick[data-joystick]');
  const playfieldCanvas = document.querySelector('canvas:not(.crosshair-layer)');
  const dedicatedPlayfield = playfieldCanvas?.closest('#game-shell, #playfield, #game-stage, #gameCanvas-wrapper, .canvas-wrapper');
  const playfieldElement = dedicatedPlayfield || playfieldCanvas;

  const syncJoystickLayout = () => {
    if (!document.body || !joystickElement || !playfieldCanvas || !playfieldElement) return;

    const useRails = touchLayoutEnabled && window.innerWidth >= 600 && window.innerWidth > window.innerHeight;
    document.body.classList.toggle('vibecade-joystick-rails', useRails);
    playfieldElement.classList.toggle('vibecade-joystick-playfield', useRails);

    if (!useRails) {
      document.body.style.removeProperty('--vibecade-control-rail');
      playfieldElement.style.removeProperty('--vibecade-playfield-width');
      playfieldElement.style.removeProperty('--vibecade-playfield-height');
      delete document.body.dataset.vibecadeControlRail;
      delete playfieldElement.dataset.vibecadePlayfieldFit;
      return;
    }

    const railSize = Math.round(Math.max(136, Math.min(150, window.innerWidth * 0.2)));
    const availableWidth = Math.max(240, window.innerWidth - railSize * 2);
    const availableHeight = Math.max(180, window.innerHeight - 8);
    const intrinsicWidth = Number(playfieldCanvas.getAttribute('width')) || playfieldCanvas.width || 16;
    const intrinsicHeight = Number(playfieldCanvas.getAttribute('height')) || playfieldCanvas.height || 9;
    const scale = Math.min(availableWidth / intrinsicWidth, availableHeight / intrinsicHeight);
    const fittedWidth = Math.max(1, Math.floor(intrinsicWidth * scale));
    const fittedHeight = Math.max(1, Math.floor(intrinsicHeight * scale));

    document.body.style.setProperty('--vibecade-control-rail', `${railSize}px`);
    playfieldElement.style.setProperty('--vibecade-playfield-width', `${fittedWidth}px`);
    playfieldElement.style.setProperty('--vibecade-playfield-height', `${fittedHeight}px`);
    document.body.dataset.vibecadeControlRail = String(railSize);
    playfieldElement.dataset.vibecadePlayfieldFit = `${fittedWidth}x${fittedHeight}`;
  };

  const restartButton = document.createElement('button');
  restartButton.type = 'button';
  restartButton.className = 'vibecade-mobile-restart';
  restartButton.setAttribute('aria-label', 'Restart game');
  restartButton.title = 'Restart game without reloading';
  restartButton.textContent = '↻';
  document.body.appendChild(restartButton);

  window.VibeCadeJoystick = function bindVibeCadeJoystick(element, options = {}) {
    if (!element) return () => {};

    const knob = element.querySelector('.joystick-knob');
    const mode = options.mode === 'cardinal' || options.mode === 'horizontal'
      ? options.mode
      : 'analog';
    const requestedDeadZone = Number.isFinite(options.deadZone) ? options.deadZone : 0.16;
    const deadZone = Math.max(0.24, Math.min(0.42, requestedDeadZone));
    const onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    let pointerId = null;
    let lastVector = '';
    element.dataset.joystickDeadZone = deadZone.toFixed(2);

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
      const rawDy = event.clientY - (rect.top + rect.height / 2);
      const dy = mode === 'horizontal' ? 0 : rawDy;
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

      if (mode === 'horizontal') {
        const strength = Math.min(1, (Math.abs(dx) - radius * deadZone) / (radius * (0.78 - deadZone)));
        emit(Math.sign(dx) * strength, 0);
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

  window.dispatchEvent(new Event('vibecade-controls-ready'));

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
  root.dataset.mobileFullscreen = request
    ? (fullscreenElement() ? 'entered' : 'ready')
    : 'unsupported';
  let requestInFlight = false;

  const onFullscreenChange = () => {
    if (fullscreenElement()) {
      root.dataset.mobileFullscreen = 'entered';
    } else if (touchLayoutEnabled) {
      root.dataset.mobileFullscreen = request ? 'ready' : 'unsupported';
    }
    requestInFlight = false;
  };

  function attemptFullscreen() {
    if (!request || !touchLayoutEnabled || fullscreenElement() || requestInFlight) {
      return Promise.resolve(Boolean(fullscreenElement()));
    }

    requestInFlight = true;
    root.dataset.mobileFullscreenAttempted = 'true';
    root.dataset.mobileFullscreen = 'requesting';

    try {
      const result = request.call(root);
      if (result && typeof result.then === 'function') {
        return result
          .then(() => onFullscreenChange())
          .catch(() => {
            requestInFlight = false;
            root.dataset.mobileFullscreen = 'ready';
            return false;
          });
      }
      requestInFlight = false;
      onFullscreenChange();
    } catch (_) {
      requestInFlight = false;
      root.dataset.mobileFullscreen = 'ready';
    }
    return Promise.resolve(Boolean(fullscreenElement()));
  }

  const waitForStableViewport = () => new Promise((resolve) => {
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    let stableSince = performance.now();
    const startedAt = stableSince;

    const check = () => {
      const now = performance.now();
      if (window.innerWidth !== lastWidth || window.innerHeight !== lastHeight) {
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        stableSince = now;
      }
      if (now - stableSince >= 360 || now - startedAt >= 1400) {
        resolve();
        return;
      }
      window.requestAnimationFrame(check);
    };
    window.requestAnimationFrame(check);
  });

  const launchButtons = '#instruction-close, #startGameBtn, #start-button';
  const bypassLaunchGate = new WeakSet();
  let launchInFlight = false;
  let readyScreen = null;
  let settlingScreen = null;

  const showSettlingScreen = () => {
    settlingScreen = document.createElement('div');
    settlingScreen.className = 'vibecade-mobile-settling';
    settlingScreen.setAttribute('role', 'status');
    settlingScreen.setAttribute('aria-live', 'polite');
    settlingScreen.textContent = 'Fitting the playfield';
    document.body.appendChild(settlingScreen);
  };

  const beginLaunch = async (launchButton) => {
    if (!touchLayoutEnabled || launchInFlight || !launchButton) return;
    launchInFlight = true;
    root.dataset.vibecadeLaunch = 'preparing';
    readyScreen?.remove();
    readyScreen = null;
    showSettlingScreen();

    await Promise.race([
      attemptFullscreen(),
      new Promise((resolve) => window.setTimeout(resolve, 900))
    ]);
    await waitForStableViewport();
    syncTouchLayout();

    settlingScreen?.remove();
    settlingScreen = null;
    root.dataset.vibecadeLaunch = 'playing';
    bypassLaunchGate.add(launchButton);
    launchButton.click();
    launchInFlight = false;
  };

  document.addEventListener('click', (event) => {
    const instructionSurface = event.target.closest?.('#instruction-modal, #tutorialOverlay');
    const launchButton = event.target.closest?.(launchButtons)
      || (event.target === instructionSurface ? instructionSurface.querySelector(launchButtons) : null);
    if (!touchLayoutEnabled || !launchButton) return;
    if (bypassLaunchGate.has(launchButton)) {
      bypassLaunchGate.delete(launchButton);
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    beginLaunch(launchButton);
  }, true);

  const isInstructionSurfaceVisible = (surface) => {
    if (!surface) return false;
    if (surface.classList.contains('hidden')) return false;
    if (surface.id === 'instruction-modal' && !surface.classList.contains('is-visible')) return false;
    const style = window.getComputedStyle(surface);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.pointerEvents !== 'none';
  };

  const createReturningLaunchGate = (launchButton, instructionSurface) => {
    readyScreen = document.createElement('div');
    readyScreen.className = 'vibecade-mobile-ready';
    readyScreen.setAttribute('role', 'dialog');
    readyScreen.setAttribute('aria-modal', 'true');
    readyScreen.innerHTML = `
      <div class="vibecade-mobile-ready-card">
        <h2>Ready when you are</h2>
        <p>The game is paused. Play will begin after fullscreen and the playfield finishes resizing.</p>
        <button class="vibecade-mobile-play" type="button">Play fullscreen</button>
        <button class="vibecade-mobile-instructions" type="button">Review controls</button>
      </div>`;
    readyScreen.querySelector('.vibecade-mobile-play').addEventListener('click', () => beginLaunch(launchButton));
    readyScreen.querySelector('.vibecade-mobile-instructions').addEventListener('click', () => {
      readyScreen?.remove();
      readyScreen = null;
      instructionSurface?.querySelector(launchButtons)?.focus({ preventScroll: true });
    });
    document.body.appendChild(readyScreen);
    readyScreen.querySelector('.vibecade-mobile-play').focus({ preventScroll: true });
    root.dataset.vibecadeLaunch = 'ready';
  };

  const setupMobileLaunch = () => {
    if (!touchLayoutEnabled || /\/scorched-earth\//.test(window.location.pathname)) return;
    const instructionSurface = document.querySelector('#instruction-modal, #tutorialOverlay');
    const launchButton = instructionSurface?.querySelector(launchButtons) || document.querySelector(launchButtons);
    if (!instructionSurface || !launchButton) return;

    if (isInstructionSurfaceVisible(instructionSurface)) {
      root.dataset.vibecadeLaunch = 'instructions';
      return;
    }

    const helpButton = document.getElementById('help-button');
    helpButton?.click();
    if (isInstructionSurfaceVisible(instructionSurface)) {
      createReturningLaunchGate(launchButton, instructionSurface);
    }
  };

  const isVisible = (element) => {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
  };

  const restartInPlace = () => {
    const nativeRestart = [...document.querySelectorAll('#restartBtn, #restartButton, #restart-button, #resetGame, #reset-button, [data-action="restart"]')]
      .find(isVisible);
    if (nativeRestart) {
      nativeRestart.click();
    } else {
      const restartEvent = new CustomEvent('vibecade:restart', { cancelable: true });
      window.dispatchEvent(restartEvent);
      if (!restartEvent.defaultPrevented) {
        const restartFunction = ['restartGame', 'resetGame', 'resetCampaign', 'resetRace', 'startLevel']
          .map((name) => window[name])
          .find((candidate) => typeof candidate === 'function' && candidate.length === 0);
        if (restartFunction) {
          restartFunction();
        } else {
          document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'r',
            code: 'KeyR',
            bubbles: true,
            cancelable: true
          }));
          document.dispatchEvent(new KeyboardEvent('keyup', {
            key: 'r',
            code: 'KeyR',
            bubbles: true,
            cancelable: true
          }));
        }
      }
    }
    root.dataset.vibecadeRestart = String(Date.now());
    restartButton.animate?.([
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ], { duration: 280, easing: 'ease-out' });
  };

  restartButton.addEventListener('click', restartInPlace);
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  if (document.readyState === 'complete') window.setTimeout(setupMobileLaunch, 0);
  else window.addEventListener('load', () => window.setTimeout(setupMobileLaunch, 0), { once: true });
})();
