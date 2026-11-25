// Game state: orders, burners, chopping board, plate, score, shift clock.
// Pure logic — no drawing here. All timings come from config.js.
import {
  SHIFT_LENGTH, MAX_ORDERS, ORDER_PATIENCE, SPAWN_EVERY, RUSH_AT,
  CHOP_TIME, COOK_TIME, BURN_TIME, RECIPES, INGREDIENTS,
} from './config.js';
import { mulberry32, pick } from './random.js';

let orderSeq = 0;

export function makeItem(kind, stage = 'raw') {
  return { kind, stage };
}

export function itemLabel(item) {
  if (!item) return '';
  if (item.kind === 'plate') return 'Piring';
  const base = INGREDIENTS[item.kind].name;
  if (item.stage === 'chopped') return base + ' cincang';
  if (item.stage === 'cooked') return base + ' matang';
  if (item.stage === 'burnt') return base + ' GOSONG';
  return base + ' mentah';
}

// Is this item finished (ready to go on a plate)?
export function isFinished(item) {
  if (!item || item.kind === 'plate') return false;
  const spec = INGREDIENTS[item.kind];
  if (item.stage === 'burnt') return false;
  if (spec.cook) return item.stage === 'cooked';
  if (spec.chop) return item.stage === 'chopped';
  return item.stage === 'raw';
}

export function newState(seed = 1) {
  return {
    screen: 'title', // title | play | end
    seed,
    rng: mulberry32(seed),
    time: 0,
    spawnTimer: 4,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    chef: { x: 640, y: 420, tx: 640, ty: 420, dir: 1, holding: null, moving: false },
    orders: [],
    burners: [null, null], // { item, cookT } per burner
    board: null, // { item, chopT }
    plate: [], // finished items sitting on the plating counter
    banner: null, // { text, t, color }
    flash: null, // { text, t } floating feedback near chef
    endStats: null,
    paused: false,
  };
}

export function startShift(state) {
  const fresh = newState(state.seed);
  fresh.screen = 'play';
  return fresh;
}

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return;
  const recipe = pick(state.rng, RECIPES);
  state.orders.push({
    id: ++orderSeq,
    recipe,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
  });
}

export function plateMatchesTicket(plateItems, recipe) {
  if (plateItems.length !== recipe.needs.length) return false;
  const have = plateItems.map((i) => `${i.kind}:${i.stage}`).sort().join('|');
  const want = recipe.needs.map((n) => `${n.kind}:${n.stage}`).sort().join('|');
  return have === want;
}

// How many of a ticket's needs are already on the plate?
export function plateProgress(plateItems, recipe) {
  const pool = plateItems.map((i) => `${i.kind}:${i.stage}`);
  let done = 0;
  for (const n of recipe.needs) {
    const key = `${n.kind}:${n.stage}`;
    const idx = pool.indexOf(key);
    if (idx >= 0) { done++; pool.splice(idx, 1); }
  }
  return done;
}

export function servePlate(state, sfx) {
  const plate = state.chef.holding;
  if (!plate || plate.kind !== 'plate') return false;
  const ticket = state.orders.find((o) => plateMatchesTicket(plate.items, o.recipe));
  if (!ticket) {
    state.flash = { text: 'Belum cocok dengan pesanan!', t: 1.6 };
    sfx.error();
    return false;
  }
  const frac = Math.max(0, ticket.patience / ticket.maxPatience);
  const tip = Math.round(frac * 15);
  const value = 25 + tip + state.combo * 2;
  state.coins += value;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders = state.orders.filter((o) => o !== ticket);
  state.chef.holding = null;
  state.banner = { text: `TERSAJI! +${value} koin`, t: 1.8, color: '#80b918' };
  sfx.serve();
  return true;
}

export function update(state, dt, sfx) {
  if (state.screen !== 'play' || state.paused) return;
  state.time += dt;
  if (state.banner) { state.banner.t -= dt; if (state.banner.t <= 0) state.banner = null; }
  if (state.flash) { state.flash.t -= dt; if (state.flash.t <= 0) state.flash = null; }

  // Spawn tickets.
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnOrder(state);
    state.spawnTimer = state.time >= RUSH_AT ? 8 : SPAWN_EVERY;
  }

  // Ticket patience.
  for (const o of [...state.orders]) {
    o.patience -= dt;
    if (o.patience <= 0) {
      state.orders = state.orders.filter((x) => x !== o);
      state.missed += 1;
      state.combo = 0;
      state.coins = Math.max(0, state.coins - 15);
      state.banner = { text: `PESANAN ${o.recipe.name.toUpperCase()} HANGUS! -15`, t: 2, color: '#e63946' };
      sfx.error();
    }
  }

  // Burners cook (and burn).
  state.burners.forEach((b, i) => {
    if (!b) return;
    b.cookT += dt;
    if (b.cookT >= COOK_TIME && b.item.stage !== 'cooked' && b.item.stage !== 'burnt') {
      b.item.stage = 'cooked';
      state.flash = { text: `${INGREDIENTS[b.item.kind].name} matang!`, t: 1.2 };
      sfx.ding();
    }
    if (b.cookT >= BURN_TIME && b.item.stage !== 'burnt') {
      b.item.stage = 'burnt';
      state.banner = { text: 'ADA YANG GOSONG!', t: 1.6, color: '#e63946' };
      sfx.error();
    }
    void i;
  });

  // Shift over?
  if (state.time >= SHIFT_LENGTH) {
    state.screen = 'end';
    state.endStats = {
      coins: state.coins,
      served: state.served,
      missed: state.missed,
      bestCombo: state.bestCombo,
    };
    sfx.ding();
  }
}

export { RECIPES };
