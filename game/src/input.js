// Vaultfall — keyboard state: which keys are held, and which were pressed this frame.
// The game loop reads `held` for movement and drains `pressed` once per frame for
// one-shot actions (start, pause, restart).

const heldKeys = new Set();
const pressedKeys = new Set();

const GAME_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyE', 'KeyP', 'KeyR', 'Space', 'Enter', 'Escape',
]);

export function initInput(windowObj) {
  windowObj.addEventListener('keydown', (event) => {
    if (GAME_KEYS.has(event.code)) event.preventDefault();
    if (!event.repeat) pressedKeys.add(event.code);
    heldKeys.add(event.code);
  });
  windowObj.addEventListener('keyup', (event) => {
    heldKeys.delete(event.code);
  });
  windowObj.addEventListener('blur', () => {
    heldKeys.clear();
  });
}

// Is any of the given key codes currently held down?
export function held(...codes) {
  return codes.some((code) => heldKeys.has(code));
}

// Was any of the given key codes pressed since the last drain?
export function wasPressed(...codes) {
  return codes.some((code) => pressedKeys.has(code));
}

// Forget the pressed-this-frame set; the loop calls this after reading it.
export function drainPressed() {
  pressedKeys.clear();
}

// The thief's wish direction from the movement keys, as a unit vector (or zero).
export function moveVector() {
  let x = 0;
  let y = 0;
  if (held('KeyA', 'ArrowLeft')) x -= 1;
  if (held('KeyD', 'ArrowRight')) x += 1;
  if (held('KeyW', 'ArrowUp')) y -= 1;
  if (held('KeyS', 'ArrowDown')) y += 1;
  if (x === 0 && y === 0) return { x: 0, y: 0 };
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}
