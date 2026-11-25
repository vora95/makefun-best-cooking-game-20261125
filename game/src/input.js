// Keyboard + mouse input. Keys are tracked in a Set of lowercase codes;
// clicks set a walk target (and interact when clicked on a near station).
import { interact, nearestStation, stationCenter } from './kitchen.js';

export function createInput(canvas, getState, callbacks) {
  const keys = new Set();
  let eHeld = false;

  function canvasPos(ev) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (ev.clientX - rect.left) * scaleX, y: (ev.clientY - rect.top) * scaleY };
  }

  window.addEventListener('keydown', (ev) => {
    const code = ev.code.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(code)) ev.preventDefault();
    if (ev.repeat) return;
    keys.add(code);
    if (code === 'keye') eHeld = true;
    callbacks.onKey(code);
  });
  window.addEventListener('keyup', (ev) => {
    const code = ev.code.toLowerCase();
    keys.delete(code);
    if (code === 'keye') eHeld = false;
  });
  window.addEventListener('blur', () => { keys.clear(); eHeld = false; });

  canvas.addEventListener('mousedown', (ev) => {
    const p = canvasPos(ev);
    const state = getState();
    if (state.screen !== 'play') { callbacks.onClick(p); return; }
    const st = nearestStation(state);
    if (st) {
      const c = stationCenter(st);
      if (Math.hypot(c.x - p.x, c.y - p.y) < Math.max(st.w, st.h)) {
        callbacks.onInteract();
        return;
      }
    }
    state.chef.tx = Math.max(140, Math.min(1220, p.x));
    state.chef.ty = Math.max(215, Math.min(685, p.y));
  });

  return {
    keys,
    get eHeld() { return eHeld; },
  };
}

export { interact };
