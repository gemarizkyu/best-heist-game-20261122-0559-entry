// Gilded Vault — keyboard and mouse, read fresh every frame.
// One job: turn key and click state into one small input object per step.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    mx: 0,
    my: 0,
    sneak: false,
    grab: false,
    emp: false,
    coin: null,
    pressed: new Set(),
  };

  function keyName(event) {
    return event.key.toLowerCase();
  }

  window.addEventListener('keydown', (event) => {
    const key = keyName(event);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    if (!event.repeat) input.pressed.add(key);
    keys.add(key);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(keyName(event));
  });
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    input.coin = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  });

  /** Refresh the held-down axes; call once per animation frame. */
  input.poll = () => {
    const left = keys.has('a') || keys.has('arrowleft');
    const right = keys.has('d') || keys.has('arrowright');
    const up = keys.has('w') || keys.has('arrowup');
    const down = keys.has('s') || keys.has('arrowdown');
    let mx = (right ? 1 : 0) - (left ? 1 : 0);
    let my = (down ? 1 : 0) - (up ? 1 : 0);
    if (mx !== 0 && my !== 0) {
      mx *= Math.SQRT1_2;
      my *= Math.SQRT1_2;
    }
    input.mx = mx;
    input.my = my;
    input.sneak = keys.has('shift');
    input.grab = keys.has('e');
  };

  /** True once for a key pressed since the last frame; call once per frame. */
  input.wasPressed = (key) => input.pressed.has(key);

  /** Clear edge-triggered state after the frame has read it. */
  input.endFrame = () => {
    input.pressed.clear();
    input.emp = false;
    input.coin = null;
  };

  /** Queue an EMP for the next step (Q is read here so repeats do not stack). */
  input.queueEmp = () => {
    input.emp = true;
  };

  return input;
}
