/* Pointer capture allows driving and firing with separate thumbs. */
(() => {
  const ultra = document.body.classList.contains('ultra');
  const hint = document.createElement('div');
  hint.className = 'aim-hint';
  document.getElementById('game-container').append(hint);
  let armed = null, fireHeld = false, fireTicks = 0, aimPointer = null;
  const buttons = [...document.querySelectorAll('.control-button')];
  const fire = () => { if (!gamePaused && running && player.alive) shoot(player); };
  function refresh() {
    if (!ultra) {
      const button = document.querySelector('[data-action="mine"]');
      button.disabled = !!mine;
      button.textContent = mine ? 'Mine active' : 'Mine';
      return;
    }
    const state = {
      missile: [guidedMissilesRemaining === 0, `${guidedMissilesRemaining} remaining`],
      mine: [!!mine, mine ? 'Deployed' : 'Ready'],
      raid: [airRaidAvailable === 0 || airRaidCountdown > 0, airRaidCountdown > 0 ? `Strike in ${Math.ceil(airRaidCountdown / 60)}s` : `${airRaidAvailable} remaining`]
    };
    for (const button of buttons) {
      const action = button.dataset.action;
      if (!state[action]) continue;
      button.disabled = state[action][0];
      const text = armed === action ? 'Tap field · tap again cancels' : state[action][1];
      const small = button.querySelector('small');
      if (small.textContent !== text) small.textContent = text;
      if (action !== 'mine') button.setAttribute('aria-pressed', String(armed === action));
    }
    hint.textContent = armed === 'missile' ? 'Tap battlefield to launch · drag to guide' : armed === 'raid' ? 'Tap battlefield to confirm air strike' : guidedMissiles.some(m => !m.explosion) ? 'Drag battlefield to guide missile' : '';
  }
  window.resetBattleInput = () => {
    Object.keys(keys).forEach(k => delete keys[k]);
    joystickTurn = joystickThrottle = 0;
    fireHeld = false; fireTicks = 0; armed = null; aimPointer = null;
    buttons.forEach(b => b.classList.remove('pressed'));
    hint.textContent = '';
  };
  window.updateBattleInput = () => {
    if (fireTicks > 0) fireTicks--;
    if ((fireHeld || keys[' ']) && fireTicks === 0) { fire(); fireTicks = 12; }
    refresh();
  };
  buttons.forEach(button => {
    let pointer = null;
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      if (gamePaused || !running || !player.alive || pointer !== null) return;
      pointer = event.pointerId;
      button.setPointerCapture(pointer);
      button.classList.add('pressed');
      const action = button.dataset.action;
      if (action === 'fire') { fireHeld = true; fire(); fireTicks = 12; }
      else if (action === 'mine') {
        armed = null;
        if (ultra) { specialWeaponIndex = 1; useSpecialWeapon(); updateSpecialWeaponDisplay(); }
        else placeMine();
      } else {
        armed = armed === action ? null : action;
        specialWeaponIndex = action === 'missile' ? 0 : 2;
        updateSpecialWeaponDisplay();
      }
      refresh();
    });
    const release = event => {
      if (event.pointerId !== pointer) return;
      pointer = null;
      button.classList.remove('pressed');
      if (button.dataset.action === 'fire') fireHeld = false;
    };
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, release);
    button.addEventListener('contextmenu', e => e.preventDefault());
  });
  if (ultra) {
    function aim(event) {
      const rect = canvas.getBoundingClientRect();
      pointerX = Math.max(0, Math.min(800, (event.clientX - rect.left) * 800 / rect.width));
      pointerY = Math.max(0, Math.min(600, (event.clientY - rect.top) * 600 / rect.height));
    }
    canvas.addEventListener('pointerdown', event => {
      if (gamePaused || !running || event.pointerType === 'mouse' || aimPointer !== null) return;
      event.preventDefault();
      aimPointer = event.pointerId;
      canvas.setPointerCapture(aimPointer);
      aim(event);
      if (armed) {
        specialWeaponIndex = armed === 'missile' ? 0 : 2;
        useSpecialWeapon(); armed = null;
      }
      refresh();
    });
    canvas.addEventListener('pointermove', event => {
      if (!gamePaused && event.pointerId === aimPointer) { event.preventDefault(); aim(event); }
    });
    const release = event => { if (event.pointerId === aimPointer) aimPointer = null; };
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(name, release);
  }
  window.addEventListener('blur', window.resetBattleInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) window.resetBattleInput(); });
  for (const id of ['instruction-close', 'startGameBtn', 'restartBtn']) {
    document.getElementById(id)?.addEventListener('click', () => { canvas.focus({preventScroll:true}); refresh(); });
  }
  canvas.addEventListener('contextmenu', e => e.preventDefault());
})();
