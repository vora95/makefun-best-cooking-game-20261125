// All canvas drawing for Sizzle Rush: kitchen, tickets, chef, food, HUD,
// title and end screens. Everything is vector-drawn, no image files.
import {
  CANVAS_W, CANVAS_H, SHIFT_LENGTH, RUSH_AT, CHOP_TIME, COOK_TIME, BURN_TIME,
  STATIONS, ORDER_BOARD, PALETTE, INGREDIENTS, rankFor,
} from './config.js';
import { itemLabel, plateProgress } from './state.js';
import { stationCenter } from './kitchen.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'center', weight = 'bold', font = 'sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// ---- Food icons (vector, drawn fresh each frame) ----
export function drawFoodIcon(ctx, kind, stage, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  const burnt = stage === 'burnt';
  const base = burnt ? '#2b2b2b' : INGREDIENTS[kind].color;
  if (kind === 'rice') {
    ctx.fillStyle = '#e8e0c8';
    ctx.beginPath(); ctx.arc(0, 2, r, 0, Math.PI); ctx.fill(); // bowl
    ctx.fillStyle = burnt ? '#1a1a1a' : '#fffdf4';
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * r * 0.32, -r * 0.25 - Math.abs(i) * r * 0.08, r * 0.22, 0, Math.PI * 2); ctx.fill(); }
    if (stage === 'cooked') { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.9); ctx.quadraticCurveTo(0, -r * 1.3, r * 0.4, -r * 0.9); ctx.stroke(); }
  } else if (kind === 'noodle') {
    ctx.strokeStyle = base; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.4 + i * r * 0.4);
      ctx.quadraticCurveTo(0, -r * 0.7 + i * r * 0.4, r * 0.8, -r * 0.4 + i * r * 0.4);
      ctx.stroke();
    }
    ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.arc(0, r * 0.55, r * 0.9, 0, Math.PI); ctx.fill();
  } else if (kind === 'egg') {
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = burnt ? '#1a1a1a' : '#ffb703';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'chicken') {
    ctx.fillStyle = burnt ? '#1a1a1a' : '#c97b4a';
    ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.1, r * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f5edd6'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r * 0.35, r * 0.35); ctx.lineTo(r * 0.9, r * 0.9); ctx.stroke();
    ctx.fillStyle = '#f5edd6';
    ctx.beginPath(); ctx.arc(r * 0.95, r * 0.95, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.7, r * 1.05, r * 0.2, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'chili') {
    ctx.strokeStyle = burnt ? '#1a1a1a' : '#d00000';
    ctx.lineWidth = r * 0.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.5); ctx.quadraticCurveTo(0, r * 0.9, r * 0.8, -r * 0.2); ctx.stroke();
    ctx.strokeStyle = '#588157'; ctx.lineWidth = r * 0.22;
    ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.5); ctx.lineTo(-r * 0.95, -r * 0.85); ctx.stroke();
  } else if (kind === 'veg') {
    ctx.fillStyle = burnt ? '#1a1a1a' : '#588157';
    for (const [dx, dy, rot] of [[-0.4, 0.2, -0.6], [0.4, 0.2, 0.6], [0, -0.35, 0]]) {
      ctx.save(); ctx.translate(dx * r, dy * r); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.42, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
  if (stage === 'chopped') {
    // Diced look: small squares over the icon.
    ctx.fillStyle = 'rgba(43,33,24,0.55)';
    for (const [dx, dy] of [[-0.4, -0.3], [0.35, -0.35], [0, 0.3]]) {
      ctx.fillRect(dx * r - r * 0.12, dy * r - r * 0.12, r * 0.24, r * 0.24);
    }
  }
  ctx.restore();
}

function drawPlateIcon(ctx, items, x, y, r) {
  ctx.fillStyle = '#f8f9fa';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.32, 0, 0, Math.PI * 2); ctx.stroke();
  items.forEach((it, i) => {
    drawFoodIcon(ctx, it.kind, it.stage, x + (i - (items.length - 1) / 2) * r * 0.85, y - r * 0.35, r * 0.42);
  });
}

// ---- Stations ----
function drawStation(ctx, state, s) {
  const c = stationCenter(s);
  const near = state.chef && Math.hypot(c.x - state.chef.x, c.y - state.chef.y) <= 150;
  ctx.save();
  // Counter body.
  ctx.fillStyle = PALETTE.counterSide;
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  rr(ctx, s.x, s.y, s.w, 14, 7); ctx.fill();
  if (near && state.screen === 'play') {
    ctx.strokeStyle = PALETTE.accent; ctx.lineWidth = 3;
    rr(ctx, s.x - 3, s.y - 3, s.w + 6, s.h + 6, 12); ctx.stroke();
  }
  if (s.kind === 'crate') {
    drawFoodIcon(ctx, s.ingredient, 'raw', c.x, c.y - 6, 20);
    text(ctx, s.label, c.x, s.y + s.h - 12, 13, '#fff8e7');
  } else if (s.kind === 'board') {
    ctx.fillStyle = '#e9c46a';
    rr(ctx, s.x + 14, s.y + 12, s.w - 28, s.h - 34, 6); ctx.fill();
    if (state.board) {
      drawFoodIcon(ctx, state.board.item.kind, state.board.item.stage, c.x, c.y - 2, 20);
      if (state.board.item.stage === 'raw') {
        const frac = state.board.chopT / CHOP_TIME;
        ctx.fillStyle = '#2b2118'; ctx.fillRect(s.x + 14, s.y + 4, s.w - 28, 8);
        ctx.fillStyle = PALETTE.accent; ctx.fillRect(s.x + 14, s.y + 4, (s.w - 28) * frac, 8);
        text(ctx, 'TAHAN E', c.x, s.y - 12, 12, '#ffb703');
      }
    }
    text(ctx, s.label, c.x, s.y + s.h - 12, 13, '#fff8e7');
  } else if (s.kind === 'stove') {
    const b = state.burners[s.burner];
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath(); ctx.arc(c.x, c.y - 4, 26, 0, Math.PI * 2); ctx.fill();
    if (b) {
      const t = state.time;
      const flick = 0.75 + 0.25 * Math.sin(t * 9 + s.burner * 2);
      ctx.fillStyle = b.item.stage === 'burnt' ? '#555' : `rgba(255,${Math.round(120 * flick)},0,0.9)`;
      ctx.beginPath(); ctx.arc(c.x, c.y - 4, 30 * flick, 0, Math.PI * 2); ctx.fill();
      drawFoodIcon(ctx, b.item.kind, b.item.stage, c.x, c.y - 6, 18);
      const frac = Math.min(1, b.cookT / COOK_TIME);
      ctx.fillStyle = '#2b2118'; ctx.fillRect(s.x + 10, s.y + 6, s.w - 20, 8);
      ctx.fillStyle = b.item.stage === 'burnt' ? '#e63946' : frac >= 1 ? '#80b918' : '#ffb703';
      ctx.fillRect(s.x + 10, s.y + 6, (s.w - 20) * frac, 8);
      if (b.item.stage === 'cooked') text(ctx, 'MATANG!', c.x, s.y - 12, 12, '#80b918');
      if (b.item.stage === 'burnt') text(ctx, 'GOSONG!', c.x, s.y - 12, 12, '#e63946');
    }
    text(ctx, s.label, c.x, s.y + s.h - 12, 13, '#fff8e7');
  } else if (s.kind === 'plate') {
    if (state.plate.length) drawPlateIcon(ctx, state.plate, c.x, c.y - 8, 34);
    else { ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(c.x, c.y - 4, 34, 11, 0, 0, Math.PI * 2); ctx.stroke(); }
    const ready = state.plate.length && state.orders.some((o) => {
      const have = state.plate.map((i) => `${i.kind}:${i.stage}`).sort().join('|');
      const want = o.recipe.needs.map((n) => `${n.kind}:${n.stage}`).sort().join('|');
      return have === want;
    });
    if (ready) text(ctx, 'SIAP SAJI!', c.x, s.y - 14, 13, '#80b918');
    text(ctx, s.label, c.x, s.y + s.h - 12, 13, '#fff8e7');
  } else if (s.kind === 'window') {
    ctx.fillStyle = '#ffe8a3';
    rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 40, 8); ctx.fill();
    text(ctx, 'SAJIKAN', c.x, s.y + 26, 14, '#7c4a2d');
    text(ctx, 'DI SINI', c.x, s.y + 44, 14, '#7c4a2d');
    ctx.fillStyle = '#7c4a2d';
    ctx.fillRect(s.x + 8, s.y + 62, s.w - 16, 4);
    text(ctx, '→', c.x, s.y + 100, 34, '#7c4a2d');
    text(ctx, s.label, c.x, s.y + s.h - 12, 12, '#fff8e7');
  } else if (s.kind === 'bin') {
    ctx.fillStyle = '#495057';
    rr(ctx, s.x + 26, s.y + 10, s.w - 52, s.h - 30, 6); ctx.fill();
    text(ctx, '🗑', c.x, c.y - 6, 26, '#fff');
    text(ctx, s.label, c.x, s.y + s.h - 12, 11, '#fff8e7');
  }
  ctx.restore();
}

// ---- Order board ----
function drawOrderBoard(ctx, state) {
  const b = ORDER_BOARD;
  ctx.fillStyle = PALETTE.boardBg;
  rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
  text(ctx, '📋 PAPAN PESANAN', b.x + 14, b.y + 20, 16, '#ffb703', 'left');
  if (!state.orders.length) {
    text(ctx, 'Belum ada pesanan — siapkan dapurmu!', b.x + b.w / 2, b.y + 68, 16, '#fff8e7');
    return;
  }
  const tw = 208;
  state.orders.forEach((o, i) => {
    const x = b.x + 14 + i * (tw + 10);
    const y = b.y + 34;
    const frac = Math.max(0, o.patience / o.maxPatience);
    ctx.fillStyle = PALETTE.ticketBg;
    rr(ctx, x, y, tw, 74, 8); ctx.fill();
    ctx.strokeStyle = frac < 0.3 ? '#e63946' : PALETTE.ticketEdge;
    ctx.lineWidth = frac < 0.3 ? 3 : 2;
    rr(ctx, x, y, tw, 74, 8); ctx.stroke();
    text(ctx, `#${o.id} ${o.recipe.name}`, x + 10, y + 14, 13, PALETTE.textDark, 'left');
    o.recipe.needs.forEach((n, j) => {
      const done = plateProgress(state.plate, o.recipe) > j;
      drawFoodIcon(ctx, n.kind, n.stage, x + 24 + j * 56, y + 40, 15);
      if (done) { ctx.strokeStyle = '#80b918'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 24 + j * 56, y + 40, 17, 0, Math.PI * 2); ctx.stroke(); }
    });
    ctx.fillStyle = '#e9ecef'; ctx.fillRect(x + 10, y + 62, tw - 20, 6);
    ctx.fillStyle = frac > 0.5 ? '#80b918' : frac > 0.25 ? '#ffb703' : '#e63946';
    ctx.fillRect(x + 10, y + 62, (tw - 20) * frac, 6);
  });
}

// ---- Chef ----
function drawChef(ctx, state) {
  const c = state.chef;
  const bob = c.moving ? Math.sin(state.time * 14) * 3 : 0;
  ctx.save();
  ctx.translate(c.x, c.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 20 - bob, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Body (white apron).
  ctx.fillStyle = '#f8f9fa';
  rr(ctx, -18, -6, 36, 26, 10); ctx.fill();
  ctx.fillStyle = '#e63946'; ctx.fillRect(-18, 8, 36, 5);
  // Head.
  ctx.fillStyle = '#f1c27d';
  ctx.beginPath(); ctx.arc(0, -18, 13, 0, Math.PI * 2); ctx.fill();
  // Toque (chef hat).
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-8, -28, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -32, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -28, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-11, -30, 22, 8);
  // Eyes look toward movement.
  ctx.fillStyle = '#2b2118';
  ctx.beginPath(); ctx.arc(c.dir * 3 - 4, -18, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(c.dir * 3 + 4, -18, 2, 0, Math.PI * 2); ctx.fill();
  // Held item above the hat.
  if (c.holding) {
    if (c.holding.kind === 'plate') drawPlateIcon(ctx, c.holding.items, 0, -58, 26);
    else drawFoodIcon(ctx, c.holding.kind, c.holding.stage, 0, -56, 16);
    text(ctx, itemLabel(c.holding), 0, -78, 12, '#fff8e7');
  }
  ctx.restore();
}

// ---- HUD ----
function drawHUD(ctx, state) {
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(0, 0, CANVAS_W, 64);
  text(ctx, '🍳 SIZZLE RUSH', 20, 32, 26, '#ffb703', 'left');
  text(ctx, 'Dapur Tengah Malam', 230, 34, 14, '#fff8e7', 'left');
  // Shift timer.
  const remain = Math.max(0, SHIFT_LENGTH - state.time);
  const mm = Math.floor(remain / 60);
  const ss = Math.floor(remain % 60).toString().padStart(2, '0');
  const rush = state.time >= RUSH_AT;
  text(ctx, `⏱ ${mm}:${ss}`, 560, 32, 26, rush ? '#e63946' : '#fff8e7');
  ctx.fillStyle = '#495057'; ctx.fillRect(640, 26, 180, 12);
  ctx.fillStyle = rush ? '#e63946' : '#80b918';
  ctx.fillRect(640, 26, 180 * (remain / SHIFT_LENGTH), 12);
  if (rush) text(ctx, 'RUSH HOUR!', 730, 52, 13, '#e63946');
  text(ctx, `🪙 ${state.coins}`, 880, 32, 24, '#ffb703');
  text(ctx, `🔥 x${state.combo}`, 1000, 32, 22, '#ff6d00');
  text(ctx, `✅ ${state.served}  ❌ ${state.missed}`, 1130, 32, 20, '#fff8e7');
  // Controls hint.
  text(ctx, 'WASD / klik = gerak  •  E = interaksi  •  tahan E di talenan = cincang  •  P = jeda', CANVAS_W / 2, 706, 13, '#fff8e7');
}

// ---- Title / end overlays ----
function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,6,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, '🍳', CANVAS_W / 2, 110, 72, '#fff');
  text(ctx, 'SIZZLE RUSH', CANVAS_W / 2, 190, 64, '#ffb703');
  text(ctx, 'DAPUR TENGAH MALAM', CANVAS_W / 2, 240, 24, '#fff8e7');
  text(ctx, 'Pesanan datang terus. Cincang, masak, tata di piring, sajikan sebelum pelanggan kabur!', CANVAS_W / 2, 282, 18, '#fff8e7');
  const panel = { x: 340, y: 320, w: 600, h: 190 };
  ctx.fillStyle = '#fff8e7';
  rr(ctx, panel.x, panel.y, panel.w, panel.h, 14); ctx.fill();
  const lines = [
    '1. Ambil bahan di crate kiri  (E)',
    '2. Cincang di TALENAN — tahan E',
    '3. Masak di KOMPOR — angkat sebelum gosong!',
    '4. Tata di PIRING SAJI sampai cocok dengan tiket',
    '5. Sajikan di JENDELA SAJI sebelum timer tiket habis',
  ];
  lines.forEach((l, i) => text(ctx, l, CANVAS_W / 2, panel.y + 28 + i * 30, 17, PALETTE.textDark));
  text(ctx, 'TEKAN ENTER UNTUK MULAI SHIFT  •  150 DETIK', CANVAS_W / 2, 560, 22, '#ffb703');
  text(ctx, 'WASD / panah / klik mouse untuk bergerak  •  E untuk berinteraksi', CANVAS_W / 2, 596, 15, '#fff8e7');
  void state;
}

function drawEnd(ctx, state) {
  const s = state.endStats || { coins: 0, served: 0, missed: 0, bestCombo: 0 };
  ctx.fillStyle = 'rgba(20,12,6,0.85)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, '🏁 SHIFT SELESAI!', CANVAS_W / 2, 130, 48, '#ffb703');
  text(ctx, rankFor(s.coins, s.served), CANVAS_W / 2, 185, 30, '#80b918');
  const panel = { x: 390, y: 220, w: 500, h: 240 };
  ctx.fillStyle = '#fff8e7';
  rr(ctx, panel.x, panel.y, panel.w, panel.h, 14); ctx.fill();
  text(ctx, `🪙 Koin: ${s.coins}`, CANVAS_W / 2, 270, 26, PALETTE.textDark);
  text(ctx, `✅ Pesanan tersaji: ${s.served}`, CANVAS_W / 2, 315, 22, PALETTE.textDark);
  text(ctx, `❌ Pesanan hangus: ${s.missed}`, CANVAS_W / 2, 355, 22, PALETTE.textDark);
  text(ctx, `🔥 Combo terbaik: x${s.bestCombo}`, CANVAS_W / 2, 400, 22, PALETTE.textDark);
  text(ctx, 'TEKAN R ATAU KLIK UNTUK MAIN LAGI', CANVAS_W / 2, 520, 24, '#ffb703');
  text(ctx, 'Terima kasih sudah masak di Dapur Tengah Malam!', CANVAS_W / 2, 560, 16, '#fff8e7');
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  // Floor.
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = (x + y) % 2 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x * 80, 64 + y * 56, 80, 56);
    }
  }
  // Wall strip under HUD.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 64, CANVAS_W, 12);
  drawOrderBoard(ctx, state);
  for (const s of STATIONS) drawStation(ctx, state, s);
  if (state.screen !== 'title') drawChef(ctx, state);
  drawHUD(ctx, state);
  // Banner (below the order board so it never covers a ticket).
  if (state.banner) {
    ctx.font = 'bold 22px sans-serif';
    const bw = ctx.measureText(state.banner.text).width + 60;
    ctx.fillStyle = 'rgba(20,12,6,0.78)';
    rr(ctx, CANVAS_W / 2 - bw / 2, 208, bw, 40, 10); ctx.fill();
    text(ctx, state.banner.text, CANVAS_W / 2, 229, 22, state.banner.color || '#fff8e7');
  }
  if (state.flash) {
    text(ctx, state.flash.text, state.chef.x, state.chef.y - 96, 15, '#fff8e7');
  }
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'end') drawEnd(ctx, state);
}
