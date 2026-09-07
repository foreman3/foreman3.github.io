(() => {
  'use strict';

  if (window.__vibecadeMobileInitialized) return;
  window.__vibecadeMobileInitialized = true;

  const root = document.documentElement;
  const narrowViewport = window.matchMedia('(max-width: 900px)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  let mobileSession = narrowViewport.matches || coarsePointer.matches;
  let touchLayoutEnabled = mobileSession;
  const controlPreferenceKey = 'vibecade-mobile-controls';
  const controlBindings = new Set();
  let controlPreference = 'joystick';
  try { if (localStorage.getItem(controlPreferenceKey) === 'buttons') controlPreference = 'buttons'; } catch (_) {}
  const setControlPreference = (value, persist = true) => {
    controlPreference = value === 'buttons' ? 'buttons' : 'joystick';
    if (persist) { try { localStorage.setItem(controlPreferenceKey, controlPreference); } catch (_) {} }
    controlBindings.forEach(apply => apply());
    syncOptions();
  };
  window.addEventListener('storage', event => {
    if (event.key === controlPreferenceKey || event.key === null) setControlPreference(event.newValue, false);
  });
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
    .vibecade-direction-pad { display: none !important; }
    .vibecade-mobile-options { display: none !important; }
    body.touch-device .vibecade-mobile-options:not([hidden]) {
      display: grid !important; position: fixed; z-index: 39;
      top: max(8px, env(safe-area-inset-top));
      right: auto; left: calc(100vw - max(8px, env(safe-area-inset-right)) - 92px);
      width: 42px; height: 42px; padding: 0; place-items: center;
      border: 1px solid rgba(255,255,255,.3); border-radius: 50%;
      background: rgba(8,18,32,.8); color: #fff; cursor: pointer;
    }
    .vibecade-mobile-options svg { width: 23px; height: 23px; pointer-events: none; }
    #vibecade-options {
      position: fixed; inset: auto; top: calc(max(8px, env(safe-area-inset-top)) + 50px);
      right: auto; left: max(12px, calc(100vw - max(8px, env(safe-area-inset-right)) - 310px)); margin: 0;
      width: min(310px, calc(100vw - 24px)); box-sizing: border-box;
      max-height: calc(100dvh - 76px); overflow-y: auto;
      padding: 18px; border: 1px solid #91bacb; border-radius: 16px;
      background: #13293d; color: #f4faff; box-shadow: 0 12px 32px #0007;
      font: 14px/1.4 system-ui, sans-serif; text-align: left;
    }
    #vibecade-options header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
    #vibecade-options h2 { margin: 0; color: inherit; font: 700 20px/1.2 system-ui, sans-serif; letter-spacing: normal; }
    #vibecade-options button {
      min-height: 42px; margin: 0; padding: 8px 12px; border: 1px solid #91bacb;
      border-radius: 10px; background: #254b63; color: #fff; cursor: pointer;
      font: 700 14px/1.2 system-ui, sans-serif; letter-spacing: normal; text-transform: none;
    }
    #vibecade-options .vibecade-options-close { width: 42px; padding: 0; font-size: 24px; }
    #vibecade-options .vibecade-option-row { display: flex; flex-direction: column; gap: 10px; }
    #vibecade-options p { margin: 10px 0 0; font: 12px/1.4 system-ui, sans-serif; color: #c0d6e2; }
    body.touch-device:has(#instruction-modal.is-visible) .vibecade-mobile-options,
    body.touch-device:has(#tutorialOverlay:not(.hidden)) .vibecade-mobile-options { visibility: hidden !important; }
    body.touch-device .virtual-joystick[data-control-style="buttons"] {
      background: none !important; border-color: transparent !important;
      box-shadow: none !important; backdrop-filter: none !important;
    }
    body.touch-device .virtual-joystick[data-control-style="buttons"] > :is(.joystick-knob, .joystick-mark, .joystick-label) { display: none !important; }
    body.touch-device .virtual-joystick[data-control-style="buttons"] > .vibecade-direction-pad {
      display: block !important; position: absolute !important; inset: 0 !important;
      width: 126px !important; height: 126px !important; touch-action: none !important;
    }
    body.touch-device .vibecade-direction-pad > button {
      position: absolute !important; display: grid !important; place-items: center !important;
      width: 44px !important; height: 44px !important; min-width: 0 !important; min-height: 0 !important;
      margin: 0 !important; padding: 0 !important; box-sizing: border-box !important;
      border: 1px solid #9dc4d3 !important; border-radius: 10px !important;
      background: #19394e !important; color: #f4faff !important;
      font: 900 20px/1 system-ui, sans-serif !important;
      box-shadow: 0 3px 0 #081723 !important;
      pointer-events: auto !important; touch-action: none !important;
    }
    body.touch-device .vibecade-direction-pad > [data-direction="up"] { top: 0 !important; left: 41px !important; }
    body.touch-device .vibecade-direction-pad > [data-direction="down"] { bottom: 0 !important; left: 41px !important; }
    body.touch-device .vibecade-direction-pad > [data-direction="left"] { top: 41px !important; left: 0 !important; }
    body.touch-device .vibecade-direction-pad > [data-direction="right"] { top: 41px !important; right: 0 !important; }
    body.touch-device .vibecade-direction-pad[data-axis="horizontal"] > button { width: 58px !important; height: 58px !important; top: 34px !important; }
    body.touch-device .vibecade-direction-pad > button.is-held { background: #396d87 !important; box-shadow: inset 0 2px 4px #081723 !important; }
    body.touch-device :is(.vibecade-control-toggle, .vibecade-direction-pad > button):focus-visible { outline: 3px solid #ffd470 !important; outline-offset: 2px !important; }
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
      inset: auto !important;
      margin: 0 !important;
      transform: none !important;
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
      right: auto; left: calc(100vw - max(8px, env(safe-area-inset-right)) - 42px);
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

    // Decorative overflow can inflate innerWidth on mobile; fit to the visible viewport.
    const viewportWidth = Math.min(window.innerWidth, root.clientWidth || window.innerWidth);
    const viewportHeight = Math.min(window.innerHeight, root.clientHeight || window.innerHeight);
    const useRails = touchLayoutEnabled && viewportWidth >= 600 && viewportWidth > viewportHeight;
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

    const railSize = Math.round(Math.max(136, Math.min(150, viewportWidth * 0.2)));
    const availableWidth = Math.max(240, viewportWidth - railSize * 2);
    const availableHeight = Math.max(180, viewportHeight - 8);
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

  const optionsButton = document.createElement('button');
  optionsButton.type = 'button'; optionsButton.className = 'vibecade-mobile-options';
  optionsButton.setAttribute('aria-label', 'Options');
  optionsButton.setAttribute('aria-haspopup', 'dialog');
  optionsButton.setAttribute('aria-controls', 'vibecade-options');
  optionsButton.setAttribute('aria-expanded', 'false');
  optionsButton.hidden = true;
  optionsButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 3 1-2h4l1 2 2 1 2-.2 2 3-1 2v4l1 2-2 3-2-.2-2 1-1 2h-4l-1-2-2-1-2 .2-2-3 1-2V9L3 7l2-3 2 .2Z" transform="translate(1 1) scale(.9)"/><circle cx="12" cy="11" r="3.3"/></svg>';
  const optionsPanel = document.createElement('div');
  optionsPanel.id = 'vibecade-options'; optionsPanel.popover = 'auto';
  optionsPanel.setAttribute('role', 'dialog'); optionsPanel.setAttribute('aria-labelledby', 'vibecade-options-title');
  optionsPanel.innerHTML = '<header><h2 id="vibecade-options-title">Options</h2><button class="vibecade-options-close" type="button" aria-label="Close options">×</button></header><div class="vibecade-options-list"><div class="vibecade-option-row"><strong>Movement controls</strong><button class="vibecade-control-toggle" type="button"></button><p>Saved for all games on this browser.</p></div></div>';
  const controlToggle = optionsPanel.querySelector('.vibecade-control-toggle');
  function syncOptions() {
    optionsButton.hidden = controlBindings.size === 0;
    controlToggle.textContent = controlPreference === 'buttons' ? 'Buttons · switch to joystick' : 'Joystick · switch to buttons';
    controlToggle.setAttribute('aria-label', controlPreference === 'buttons' ? 'Use joystick in all games' : 'Use buttons in all games');
  }
  const closeOptions = () => { optionsPanel.hidePopover(); };
  optionsButton.popoverTargetElement = optionsPanel;
  optionsPanel.querySelector('.vibecade-options-close').addEventListener('click', closeOptions);
  controlToggle.addEventListener('click', () => setControlPreference(controlPreference === 'buttons' ? 'joystick' : 'buttons'));
  optionsPanel.addEventListener('beforetoggle', event => {
    if (event.newState === 'open') window.dispatchEvent(new Event('vibecade:reset-input'));
    optionsButton.setAttribute('aria-expanded', String(event.newState === 'open'));
  });
  optionsPanel.addEventListener('keydown', event => { event.stopPropagation(); });
  optionsPanel.addEventListener('keyup', event => { event.stopPropagation(); });
  window.addEventListener('resize', closeOptions);
  restartButton.addEventListener('click', closeOptions);
  document.body.append(optionsButton, optionsPanel);

  window.VibeCadeJoystick = function bindVibeCadeJoystick(element, options = {}) {
    if (!element) return () => {};

    const knob = element.querySelector('.joystick-knob');
    const mode = options.mode === 'cardinal' || options.mode === 'horizontal'
      ? options.mode
      : 'analog';
    element.dataset.axis = mode;
    const precision = options.profile === 'precision' && mode !== 'cardinal';
    const requestedDeadZone = Number.isFinite(options.deadZone) ? options.deadZone : 7 / 63;
    const requestedMinimumDeadZone = Number.isFinite(options.minimumDeadZone)
      ? options.minimumDeadZone
      : 7 / 63;
    const minimumDeadZone = Math.max(0.08, Math.min(0.24, requestedMinimumDeadZone));
    const deadZone = Math.max(minimumDeadZone, Math.min(0.42, requestedDeadZone));
    const onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    let pointerId = null;
    let lastVector = '';
    element.dataset.joystickDeadZone = precision ? '0.00' : deadZone.toFixed(2);
    element.dataset.joystickProfile = precision ? 'precision' : 'standard';

    const directionName = (x, y) => {
      if (Math.hypot(x, y) < 0.01) return 'idle';
      const vertical = y < -0.3 ? 'up' : y > 0.3 ? 'down' : '';
      const horizontal = x < -0.3 ? 'left' : x > 0.3 ? 'right' : '';
      return [vertical, horizontal].filter(Boolean).join('-') || 'idle';
    };

    const emit = (x, y) => {
      const key = `${x},${y}`;
      if (key === lastVector) return;
      lastVector = key;
      element.dataset.joystickVector = `${x.toFixed(3)},${y.toFixed(3)}`;
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

      if (precision) {
        if (distance === 0) {
          emit(0, 0);
          return;
        }
        if (mode === 'horizontal') {
          const displacement = Math.max(-1, Math.min(1, dx / maxTravel));
          emit(Math.sign(displacement) * Math.pow(Math.abs(displacement), 1.6), 0);
          return;
        }
        const displacement = Math.min(1, distance / maxTravel);
        const strength = Math.pow(displacement, 1.6);
        emit(dx / distance * strength, dy / distance * strength);
        return;
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
      if (controlPreference === 'buttons' || event.target.closest('.vibecade-control-toggle, .vibecade-direction-pad')) return;
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
    const pad = document.createElement('div');
    pad.className = 'vibecade-direction-pad';
    pad.dataset.axis = mode;
    pad.setAttribute('role', 'group');
    pad.setAttribute('aria-label', mode === 'horizontal' ? 'Left and right controls' : 'Directional controls');
    const heldPointers = new Map();
    const heldKeys = new Set();
    const directions = mode === 'horizontal' ? ['left', 'right'] : ['up', 'left', 'right', 'down'];
    const vectors = {left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1]};
    const buttons = new Map();
    const emitButtons = () => {
      const held = [...heldPointers.values(), ...heldKeys].filter(Boolean);
      buttons.forEach((button, direction) => {
        button.classList.toggle('is-held', held.includes(direction));
        button.setAttribute('aria-pressed', String(held.includes(direction)));
      });
      if (mode === 'cardinal') { const v = vectors[held[held.length - 1]] || [0, 0]; emit(...v); return; }
      let x = Number(held.includes('right')) - Number(held.includes('left'));
      let y = Number(held.includes('down')) - Number(held.includes('up'));
      const length = Math.max(1, Math.hypot(x, y));
      emit(x / length, y / length);
    };
    const releaseButtons = () => {
      const captures = [...heldPointers.keys()];
      heldPointers.clear(); heldKeys.clear();
      captures.forEach(id => { try { if (pad.hasPointerCapture(id)) pad.releasePointerCapture(id); } catch (_) {} });
      emitButtons();
    };
    const releaseInput = () => { finish({}); releaseButtons(); };
    directions.forEach(direction => {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.direction = direction;
      button.textContent = {left: '◀', right: '▶', up: '▲', down: '▼'}[direction];
      button.setAttribute('aria-label', direction[0].toUpperCase() + direction.slice(1));
      button.draggable = false;
      button.addEventListener('keydown', event => {
        if (controlPreference !== 'buttons' || !['Space', 'Enter'].includes(event.code)) return;
        event.preventDefault(); event.stopPropagation(); heldKeys.add(direction); emitButtons();
      });
      button.addEventListener('keyup', event => {
        if (!['Space', 'Enter'].includes(event.code)) return;
        event.preventDefault(); event.stopPropagation(); heldKeys.delete(direction); emitButtons();
      });
      button.addEventListener('blur', () => { heldKeys.delete(direction); emitButtons(); });
      buttons.set(direction, button); pad.appendChild(button);
    });
    pad.addEventListener('pointerdown', event => {
      if (controlPreference !== 'buttons' || !touchLayoutEnabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
      const button = event.target.closest('[data-direction]');
      if (!button) return;
      event.preventDefault(); event.stopPropagation();
      heldPointers.set(event.pointerId, button.dataset.direction);
      try { pad.setPointerCapture(event.pointerId); } catch (_) {}
      emitButtons();
    });
    pad.addEventListener('pointermove', event => {
      if (!heldPointers.has(event.pointerId)) return;
      event.preventDefault(); event.stopPropagation();
      const button = [...buttons.values()].find(button => {
        const rect = button.getBoundingClientRect();
        return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      });
      // Keep capture through the neutral space so a thumb can slide to another direction.
      heldPointers.set(event.pointerId, button?.dataset.direction || ''); emitButtons();
    });
    const finishButton = event => {
      if (!heldPointers.has(event.pointerId)) return;
      event.preventDefault(); event.stopPropagation(); heldPointers.delete(event.pointerId);
      try { if (pad.hasPointerCapture(event.pointerId)) pad.releasePointerCapture(event.pointerId); } catch (_) {}
      emitButtons();
    };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(type, finishButton);
    const applyPreference = () => {
      releaseInput();
      element.dataset.controlStyle = controlPreference;
      pad.inert = controlPreference !== 'buttons';
      pad.setAttribute('aria-hidden', String(controlPreference !== 'buttons'));

    };
    element.append(pad);
    controlBindings.add(applyPreference);
    applyPreference();
    syncOptions();
    const onVisibility = () => { if (document.hidden) releaseInput(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', releaseInput);
    window.addEventListener('resize', releaseInput);
    window.addEventListener('vibecade:reset-input', releaseInput);
    centerKnob();

    return () => {
      element.removeEventListener('pointerdown', start);
      element.removeEventListener('pointermove', update);
      element.removeEventListener('pointerup', finish);
      element.removeEventListener('pointercancel', finish);
      element.removeEventListener('lostpointercapture', finish);
      element.removeEventListener('contextmenu', suppressTouchCallout);
      window.removeEventListener('blur', releaseInput);
      window.removeEventListener('resize', releaseInput);
      window.removeEventListener('vibecade:reset-input', releaseInput);
      controlBindings.delete(applyPreference);
      document.removeEventListener('visibilitychange', onVisibility);
      releaseInput(); pad.remove();
      syncOptions();
      if (!controlBindings.size) closeOptions();
      delete element.dataset.controlStyle;
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

  const restartInPlace = () => {
    window.dispatchEvent(new Event('vibecade:reset-input'));
    const restartEvent = new CustomEvent('vibecade:restart', { cancelable: true });
    window.dispatchEvent(restartEvent);
    if (!restartEvent.defaultPrevented) {
      const nativeRestart = [...document.querySelectorAll('#restartBtn, #restartButton, #restart-button, #resetGame, #reset-button, [data-action="restart"]')]
        .find(button => !button.disabled);
      const restartFunction = ['restartGame', 'resetGame', 'resetCampaign', 'resetRace']
        .map(name => window[name])
        .find(candidate => typeof candidate === 'function' && candidate.length === 0);
      if (nativeRestart) nativeRestart.click();
      else if (restartFunction) restartFunction();
      else {
        for (const type of ['keydown', 'keyup']) {
          document.dispatchEvent(new KeyboardEvent(type, {
            key: 'r', code: 'KeyR', bubbles: true, cancelable: true
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
