// OYEN DASH — input: keyboard, mouse and touch, all funnelled into the
// same tiny set of intents (jump / start / restart / pause / mute).
// One clear job: listen to the player and translate it into game actions.
export function createInput(canvas, callbacks) {
  // callbacks: { onJump, onStart, onRestart, onPause, onMute }
  const state = { jumpQueued: false };

  function queueJump() {
    state.jumpQueued = true;
  }

  function consumeJump() {
    const queued = state.jumpQueued;
    state.jumpQueued = false;
    return queued;
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    const key = event.key;
    if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') {
      event.preventDefault();
      queueJump();
      callbacks.onJump?.();
    } else if (key === 'Enter') {
      callbacks.onStart?.();
    } else if (key === 'p' || key === 'P' || key === 'Escape') {
      callbacks.onPause?.();
    } else if (key === 'm' || key === 'M') {
      callbacks.onMute?.();
    } else if (key === 'r' || key === 'R') {
      callbacks.onRestart?.();
    }
  }

  function onPointerDown(event) {
    event.preventDefault();
    queueJump();
    callbacks.onJump?.();
  }

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('pointerdown', onPointerDown);
  // Touch scrolling must never steal a jump: the canvas is touch-action none.
  canvas.addEventListener('touchstart', (event) => event.preventDefault(), { passive: false });

  return {
    consumeJump,
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('pointerdown', onPointerDown);
    },
  };
}
