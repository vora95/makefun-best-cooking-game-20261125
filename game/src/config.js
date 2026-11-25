// Sizzle Rush — config: recipes, stations, timings, palette.
// Original game: a midnight-diner cooking rush. No external assets.
export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const SHIFT_LENGTH = 150; // seconds per shift
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 55; // seconds before a ticket expires
export const SPAWN_EVERY = 12; // seconds between new tickets (8 in rush)
export const RUSH_AT = 120; // last 30s = rush hour
export const CHOP_TIME = 1.4; // seconds of holding E at the board
export const COOK_TIME = 4.0; // seconds on a burner before done
export const BURN_TIME = 9.0; // seconds on a burner before burnt
export const CHEF_SPEED = 280;
export const INTERACT_RADIUS = 86;

// Ingredient kinds and how each is prepared.
export const INGREDIENTS = {
  rice:    { name: 'Nasi',    color: '#f5edd6', chop: false, cook: true,  price: 6 },
  noodle:  { name: 'Mie',     color: '#f2c14e', chop: false, cook: true,  price: 6 },
  egg:     { name: 'Telur',   color: '#fff3b0', chop: false, cook: true,  price: 7 },
  chicken: { name: 'Ayam',    color: '#e8a87c', chop: true,  cook: true,  price: 9 },
  chili:   { name: 'Cabai',   color: '#e63946', chop: true,  cook: false, price: 5 },
  veg:     { name: 'Sayur',   color: '#80b918', chop: true,  cook: false, price: 5 },
};

// A recipe = the finished items a plate must hold (kind + final stage).
export const RECIPES = [
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng Kilat',
    needs: [
      { kind: 'rice', stage: 'cooked' },
      { kind: 'egg', stage: 'cooked' },
      { kind: 'chili', stage: 'chopped' },
    ],
  },
  {
    id: 'mie-tumis',
    name: 'Mie Tumis Pedas',
    needs: [
      { kind: 'noodle', stage: 'cooked' },
      { kind: 'chicken', stage: 'cooked' },
      { kind: 'veg', stage: 'chopped' },
    ],
  },
  {
    id: 'sate-platter',
    name: 'Sate Ayam Bakar',
    needs: [
      { kind: 'chicken', stage: 'cooked' },
      { kind: 'rice', stage: 'cooked' },
      { kind: 'chili', stage: 'chopped' },
    ],
  },
];

// Station layout (kitchen floor is y 205..700). Each station: id, label, x, y, w, h.
export const STATIONS = [
  { id: 'crate-rice',    kind: 'crate', ingredient: 'rice',    label: 'NASI',   x: 24,  y: 300, w: 96, h: 76 },
  { id: 'crate-noodle',  kind: 'crate', ingredient: 'noodle',  label: 'MIE',    x: 24,  y: 392, w: 96, h: 76 },
  { id: 'crate-egg',     kind: 'crate', ingredient: 'egg',     label: 'TELUR',  x: 24,  y: 484, w: 96, h: 76 },
  { id: 'crate-chicken', kind: 'crate', ingredient: 'chicken', label: 'AYAM',   x: 24,  y: 576, w: 96, h: 76 },
  { id: 'crate-chili',   kind: 'crate', ingredient: 'chili',   label: 'CABAI',  x: 132, y: 576, w: 96, h: 76 },
  { id: 'crate-veg',     kind: 'crate', ingredient: 'veg',     label: 'SAYUR',  x: 240, y: 576, w: 96, h: 76 },
  { id: 'board',         kind: 'board',  label: 'TALENAN',                    x: 420, y: 596, w: 150, h: 84 },
  { id: 'stove-0',       kind: 'stove',  burner: 0, label: 'KOMPOR 1',       x: 640, y: 596, w: 120, h: 84 },
  { id: 'stove-1',       kind: 'stove',  burner: 1, label: 'KOMPOR 2',       x: 776, y: 596, w: 120, h: 84 },
  { id: 'plate',         kind: 'plate',  label: 'PIRING SAJI',                x: 960, y: 596, w: 150, h: 84 },
  { id: 'window',        kind: 'window', label: 'JENDELA SAJI',               x: 1140, y: 300, w: 116, h: 220 },
  { id: 'bin',           kind: 'bin',    label: 'TEMPAT SAMPAH',              x: 1140, y: 576, w: 116, h: 76 },
];

export const ORDER_BOARD = { x: 24, y: 76, w: 700, h: 118 };

export const PALETTE = {
  floorA: '#c98f5f',
  floorB: '#bd8252',
  wall: '#7c4a2d',
  counterTop: '#8d5a2b',
  counterSide: '#6e4520',
  boardBg: '#2b2118',
  ticketBg: '#fff8e7',
  ticketEdge: '#d9a441',
  hudBg: '#241812',
  accent: '#ffb703',
  danger: '#e63946',
  good: '#80b918',
  textDark: '#2b2118',
  textLight: '#fff8e7',
};

export function rankFor(coins, served) {
  if (coins >= 320 && served >= 9) return 'MASTER CHEF';
  if (coins >= 220 && served >= 7) return 'KOKI BINTANG 5';
  if (coins >= 130 && served >= 5) return 'KOKI HANDAL';
  if (coins >= 60 && served >= 3) return 'KOKI PEMULA';
  return 'MAGANG DAPUR';
}
