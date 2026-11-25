// Kitchen interaction: chef movement, nearest station, E/click actions.
// Stations come from config.js; logic lives here, drawing in render.js.
import {
  STATIONS, CHEF_SPEED, INTERACT_RADIUS, CHOP_TIME, COOK_TIME, BURN_TIME, INGREDIENTS,
} from './config.js';
import { makeItem, isFinished, servePlate, plateMatchesTicket } from './state.js';

export function stationCenter(s) {
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

export function nearestStation(state) {
  const { x, y } = state.chef;
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const c = stationCenter(s);
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < bestD) { bestD = d; best = s; }
  }
  return bestD <= INTERACT_RADIUS + Math.max(best.w, best.h) / 2 ? best : null;
}

export function moveChef(state, dt, keys) {
  const chef = state.chef;
  let dx = 0;
  let dy = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    chef.x += (dx / len) * CHEF_SPEED * dt;
    chef.y += (dy / len) * CHEF_SPEED * dt;
    chef.dir = dx !== 0 ? Math.sign(dx) : chef.dir;
    chef.moving = true;
    chef.tx = chef.x;
    chef.ty = chef.y;
  } else if (Math.hypot(chef.tx - chef.x, chef.ty - chef.y) > 4) {
    // Click-to-move target.
    const dx2 = chef.tx - chef.x;
    const dy2 = chef.ty - chef.y;
    const len = Math.hypot(dx2, dy2);
    const step = Math.min(len, CHEF_SPEED * dt);
    chef.x += (dx2 / len) * step;
    chef.y += (dy2 / len) * step;
    chef.dir = dx2 !== 0 ? Math.sign(dx2) : chef.dir;
    chef.moving = true;
  } else {
    chef.moving = false;
  }
  // Stay on the kitchen floor.
  chef.x = Math.max(140, Math.min(1220, chef.x));
  chef.y = Math.max(215, Math.min(685, chef.y));
}

// What happens when the player presses E (or clicks a station while close).
// Returns a short label for the HUD hint, or null.
export function interact(state, sfx) {
  const chef = state.chef;
  const st = nearestStation(state);
  if (!st) {
    state.flash = { text: 'Dekati stasiun dulu!', t: 1.2 };
    return null;
  }
  const holding = chef.holding;

  if (st.kind === 'crate') {
    if (holding) { state.flash = { text: 'Tangan penuh!', t: 1.2 }; sfx.error(); return null; }
    chef.holding = makeItem(st.ingredient, 'raw');
    sfx.pickup();
    return `Ambil ${INGREDIENTS[st.ingredient].name}`;
  }

  if (st.kind === 'board') {
    if (state.board) {
      if (holding) { state.flash = { text: 'Talenan sedang dipakai!', t: 1.2 }; return null; }
      // Pick the chopped item back up (chopping is done via hold-E, see chopTick).
      if (state.board.item.stage === 'chopped') {
        chef.holding = state.board.item;
        state.board = null;
        sfx.pickup();
        return 'Ambil hasil cincangan';
      }
      return null;
    }
    if (!holding || holding.kind === 'plate') { state.flash = { text: 'Bawa bahan mentah ke talenan', t: 1.4 }; return null; }
    if (!INGREDIENTS[holding.kind].chop) { state.flash = { text: `${INGREDIENTS[holding.kind].name} tidak perlu dicincang`, t: 1.4 }; sfx.error(); return null; }
    if (holding.stage !== 'raw') { state.flash = { text: 'Sudah dicincang!', t: 1.2 }; return null; }
    state.board = { item: holding, chopT: 0 };
    chef.holding = null;
    sfx.place();
    return 'Taruh di talenan — tahan E untuk mencincang';
  }

  if (st.kind === 'stove') {
    const b = state.burners[st.burner];
    if (b) {
      if (holding) { state.flash = { text: 'Kompor sedang dipakai!', t: 1.2 }; return null; }
      chef.holding = b.item;
      state.burners[st.burner] = null;
      sfx.pickup();
      return b.item.stage === 'burnt' ? 'Angkat yang gosong — buang ke sampah!' : 'Angkat dari kompor';
    }
    if (!holding || holding.kind === 'plate') { state.flash = { text: 'Bawa bahan ke kompor', t: 1.4 }; return null; }
    if (!INGREDIENTS[holding.kind].cook) { state.flash = { text: `${INGREDIENTS[holding.kind].name} tidak perlu dimasak`, t: 1.4 }; sfx.error(); return null; }
    if (holding.stage === 'cooked') { state.flash = { text: 'Sudah matang!', t: 1.2 }; return null; }
    state.burners[st.burner] = { item: holding, cookT: 0 };
    chef.holding = null;
    sfx.sizzle();
    return 'Memasak di kompor…';
  }

  if (st.kind === 'plate') {
    if (holding && holding.kind === 'plate') {
      // Put the carried plate back down.
      state.plate = holding.items;
      chef.holding = null;
      sfx.place();
      return 'Taruh piring di meja';
    }
    if (holding) {
      if (!isFinished(holding)) { state.flash = { text: 'Selesaikan dulu: cincang / masak bahannya', t: 1.6 }; sfx.error(); return null; }
      if (state.plate.length >= 3) { state.flash = { text: 'Piring penuh!', t: 1.2 }; return null; }
      state.plate.push(holding);
      chef.holding = null;
      sfx.place();
      const ready = state.orders.some((o) => plateMatchesTicket(state.plate, o.recipe));
      return ready ? 'Piring lengkap — SIAP DISAJIKAN!' : 'Tata di piring';
    }
    // Empty hands: pick the plate up (if it has anything).
    if (state.plate.length === 0) { state.flash = { text: 'Piring masih kosong', t: 1.2 }; return null; }
    chef.holding = { kind: 'plate', items: state.plate };
    state.plate = [];
    sfx.pickup();
    return 'Angkat piring — antar ke jendela saji';
  }

  if (st.kind === 'window') {
    if (!holding || holding.kind !== 'plate') { state.flash = { text: 'Bawa piring lengkap ke sini', t: 1.4 }; return null; }
    return servePlate(state, sfx) ? 'Disajikan!' : null;
  }

  if (st.kind === 'bin') {
    if (!holding) { state.flash = { text: 'Tidak ada yang dibuang', t: 1.2 }; return null; }
    chef.holding = null;
    sfx.place();
    return 'Dibuang';
  }
  return null;
}

// Hold-E chopping: call every frame while E is held near the board.
export function chopTick(state, dt, sfx) {
  if (!state.board) return;
  const item = state.board.item;
  if (item.stage !== 'raw') return;
  state.board.chopT += dt;
  if (Math.floor(state.board.chopT * 10) !== Math.floor((state.board.chopT - dt) * 10)) sfx.chop();
  if (state.board.chopT >= CHOP_TIME) {
    item.stage = 'chopped';
    state.flash = { text: `${INGREDIENTS[item.kind].name} selesai dicincang!`, t: 1.2 };
    sfx.ding();
  }
}

export { COOK_TIME, BURN_TIME };
