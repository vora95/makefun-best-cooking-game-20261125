// Sizzle Rush — boot + game loop.
// Shot mode: ?shot=start|play|serve|end&seed=1 renders one frozen, seeded
// frame (used for the entry screenshots, reproducible to the byte).
import { CANVAS_W, CANVAS_H } from './config.js';
import { newState, startShift, update } from './state.js';
import { moveChef, interact, chopTick, nearestStation } from './kitchen.js';
import { render } from './render.js';
import { buildShotState } from './shots.js';
import { createInput } from './input.js';
import { Sfx } from './audio.js';

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1');

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');

const sfx = new Sfx();
let state = shotName ? buildShotState(shotName, seed) : newState(seed);
if (!state) state = newState(seed);

// Expose for play-testing / smoke tests.
window.__world = state;
window.__shot = shotName || null;

const input = createInput(canvas, () => state, {
  onKey(code) {
    if (state.screen === 'title' && (code === 'enter' || code === 'space')) {
      state = startShift(state);
      window.__world = state;
      sfx.ensure();
      sfx.ding();
      return;
    }
    if (state.screen === 'end' && (code === 'keyr' || code === 'enter')) {
      state = startShift(state);
      window.__world = state;
      return;
    }
    if (state.screen === 'play' && code === 'keyp') {
      state.paused = !state.paused;
      return;
    }
    if (state.screen === 'play' && code === 'keye') {
      const hint = interact(state, sfx);
      if (hint) state.flash = { text: hint, t: 1.4 };
    }
  },
  onInteract() {
    if (state.screen === 'play') {
      const hint = interact(state, sfx);
      if (hint) state.flash = { text: hint, t: 1.4 };
    }
  },
  onClick() {
    if (state.screen === 'end') {
      state = startShift(state);
      window.__world = state;
    } else if (state.screen === 'title') {
      state = startShift(state);
      window.__world = state;
      sfx.ensure();
    }
  },
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!shotName && state.screen === 'play' && !state.paused) {
    moveChef(state, dt, input.keys);
    if (input.eHeld && nearestStation(state)?.kind === 'board') chopTick(state, dt, sfx);
    update(state, dt, sfx);
  }
  render(ctx, state);
  requestAnimationFrame(frame);
}

// Shot mode renders exactly one frozen frame (deterministic screenshot).
if (shotName) {
  render(ctx, state);
} else {
  requestAnimationFrame(frame);
}
