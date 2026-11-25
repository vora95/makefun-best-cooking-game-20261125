// Deterministic scripted states for screenshots (?shot=start|play|serve|end).
// Each shot is a fixed, seeded state so two runs render byte-identical frames.
import { newState, spawnOrder, makeItem } from './state.js';
import { RECIPES } from './config.js';

function basePlay(seed) {
  const s = newState(seed);
  s.screen = 'play';
  return s;
}

function setOrder(s, recipeId, patienceFrac) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  spawnOrder(s);
  const o = s.orders[s.orders.length - 1];
  o.recipe = recipe;
  o.patience = o.maxPatience * patienceFrac;
  return o;
}

export function buildShotState(shot, seed = 1) {
  if (shot === 'start') {
    const s = newState(seed);
    s.screen = 'title';
    return s;
  }
  if (shot === 'play') {
    const s = basePlay(seed);
    s.time = 47;
    s.coins = 85;
    s.combo = 3;
    s.bestCombo = 3;
    s.served = 3;
    setOrder(s, 'nasi-goreng', 0.7);
    setOrder(s, 'mie-tumis', 0.5);
    setOrder(s, 'sate-platter', 0.85);
    // Chef mid-assembly: holding chopped chili, heading to the stove.
    s.chef.x = 700; s.chef.y = 520; s.chef.tx = 700; s.chef.ty = 520;
    s.chef.holding = makeItem('chili', 'chopped');
    // Burner 1: rice cooking, halfway. Board: chicken being chopped.
    s.burners[0] = { item: makeItem('rice', 'raw'), cookT: 2.2 };
    s.board = { item: makeItem('chicken', 'raw'), chopT: 0.9 };
    // Plate mid-assembly: rice + egg already plated.
    s.plate = [makeItem('rice', 'cooked'), makeItem('egg', 'cooked')];
    s.banner = { text: 'PESANAN BARU: MIE TUMIS PEDAS!', t: 99, color: '#ffb703' };
    return s;
  }
  if (shot === 'serve') {
    const s = basePlay(seed);
    s.time = 96;
    s.coins = 210;
    s.combo = 5;
    s.bestCombo = 5;
    s.served = 7;
    setOrder(s, 'nasi-goreng', 0.55);
    setOrder(s, 'mie-tumis', 0.35);
    // Complete plate for ticket #1, carried to the serving window.
    s.chef.x = 1090; s.chef.y = 430; s.chef.tx = 1090; s.chef.ty = 430;
    s.chef.holding = {
      kind: 'plate',
      items: [makeItem('rice', 'cooked'), makeItem('egg', 'cooked'), makeItem('chili', 'chopped')],
    };
    s.burners[1] = { item: makeItem('noodle', 'raw'), cookT: 3.1 };
    s.board = { item: makeItem('veg', 'raw'), chopT: 0.4 };
    s.banner = { text: 'PIRING LENGKAP — SIAP DISAJIKAN!', t: 99, color: '#80b918' };
    return s;
  }
  if (shot === 'end') {
    const s = basePlay(seed);
    s.time = 150;
    s.screen = 'end';
    s.coins = 320;
    s.served = 9;
    s.missed = 1;
    s.bestCombo = 6;
    s.endStats = { coins: 320, served: 9, missed: 1, bestCombo: 6 };
    s.chef.x = 640; s.chef.y = 420;
    return s;
  }
  return null;
}
