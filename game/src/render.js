// render.js — every pixel of Warung Kilat, drawn on one canvas with plain
// shapes and emoji. Also owns the layout geometry and click hit-testing, so
// controls.js can ask "what did the player click?" in one call.

import { INGREDIENTS, ingredientById } from './recipes.js';

export const W = 1280;
export const H = 720;

// ---- layout geometry (shared by drawing and hit-testing) ----
export const TOP_BAR = { x: 0, y: 0, w: W, h: 64 };
export const BOARD = { x: 24, y: 84, w: 280, h: 118, gap: 16 };
export const STOVE = { x: 48, y: 224, w: 340, h: 210 };
export const PLATE = { x: 640, y: 330, rx: 150, ry: 64 };
export const WINDOW = { x: 872, y: 212, w: 384, h: 170 };
export const BELL = { x: 1150, y: 416, r: 32 };
export const TRASH = { x: 920, y: 416, r: 28 };
export const COUNTER = { y: 484, h: 150, x: 24, w: 128, gap: 8 };
export const START_BUTTON = { x: 440, y: 560, w: 400, h: 64 };
export const RESTART_BUTTON = { x: 440, y: 560, w: 400, h: 64 };

export function binRect(i) {
  return {
    x: COUNTER.x + i * (COUNTER.w + COUNTER.gap),
    y: COUNTER.y,
    w: COUNTER.w,
    h: COUNTER.h,
  };
}

export function ticketRect(i) {
  return { x: BOARD.x + i * (BOARD.w + BOARD.gap), y: BOARD.y, w: BOARD.w, h: BOARD.h };
}

function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function insideCircle(x, y, c) {
  const dx = x - c.x;
  const dy = y - c.y;
  return dx * dx + dy * dy <= c.r * c.r;
}

// What did the player click? Returns an action object or null.
export function hitTest(x, y, screen) {
  if (screen === 'title') {
    if (inside(x, y, START_BUTTON)) return { type: 'start' };
    return { type: 'start' }; // any click opens the warung
  }
  if (screen === 'over') {
    if (inside(x, y, RESTART_BUTTON)) return { type: 'restart' };
    return { type: 'restart' };
  }
  if (screen !== 'playing') return null;
  for (let i = 0; i < INGREDIENTS.length; i++) {
    if (inside(x, y, binRect(i))) return { type: 'bin', id: INGREDIENTS[i].id };
  }
  for (let i = 0; i < 4; i++) {
    if (inside(x, y, ticketRect(i))) return { type: 'ticket', index: i };
  }
  if (insideCircle(x, y, BELL)) return { type: 'bell' };
  if (insideCircle(x, y, TRASH)) return { type: 'trash' };
  return null;
}

// ---- drawing helpers ----
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function moodFace(mood) {
  return mood === 'happy' ? '😊' : mood === 'impatient' ? '😐' : '😠';
}

// ---- scene ----
export function drawScene(ctx, s, nowMs) {
  ctx.save();
  if (s.shake > 0.5) {
    ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
  }
  drawWall(ctx, nowMs);
  drawTopBar(ctx, s);
  drawOrderBoard(ctx, s);
  drawKitchen(ctx, s, nowMs);
  drawCounter(ctx, s, nowMs);
  drawHints(ctx, s);
  drawFloaters(ctx, s);
  if (s.rushActive) drawRushBanner(ctx, nowMs);
  if (s.screen === 'title') drawTitle(ctx, s);
  if (s.screen === 'paused') drawPaused(ctx);
  if (s.screen === 'over') drawGameOver(ctx, s);
  ctx.restore();
}

function drawWall(ctx, nowMs) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#40263f');
  g.addColorStop(0.6, '#33203a');
  g.addColorStop(1, '#241626');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // wall tiles
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let y = 70; y < 470; y += 46) {
    for (let x = (y / 46) % 2 === 0 ? 0 : 46; x < W; x += 92) {
      ctx.fillRect(x + 2, y + 2, 88, 42);
    }
  }
  // striped awning over the serving window
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ff9f1c' : '#fff3d6';
    ctx.fillRect(872 + i * 48, 196, 48, 16);
  }
  // hanging lamp glow
  const flicker = 0.85 + Math.sin(nowMs / 300) * 0.05;
  const glow = ctx.createRadialGradient(640, 210, 10, 640, 210, 260);
  glow.addColorStop(0, `rgba(255, 214, 120, ${0.16 * flicker})`);
  glow.addColorStop(1, 'rgba(255, 214, 120, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(380, 0, 520, 470);
  ctx.fillStyle = '#ffd678';
  ctx.beginPath();
  ctx.arc(640, 196, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(638, 150, 4, 46);
}

function drawTopBar(ctx, s) {
  ctx.fillStyle = '#1d1220';
  ctx.fillRect(0, 0, W, 64);
  ctx.fillStyle = '#ff9f1c';
  ctx.fillRect(0, 64, W, 4);
  text(ctx, '⚡ DAPUR PETIR', 130, 32, 26, '#ffd97a', 'center');
  text(ctx, 'Warung Kilat', 130, 54, 12, '#c9a0c9', 'center');

  // shift timer — the big one the player feels
  const ratio = Math.max(0, s.shiftTimeLeft / s.shiftMax);
  const barX = 400;
  const barW = 480;
  ctx.fillStyle = '#3a2438';
  rr(ctx, barX, 18, barW, 28, 14);
  ctx.fill();
  ctx.fillStyle = ratio > 0.5 ? '#7bd88a' : ratio > 0.25 ? '#ffd166' : '#e63946';
  if (ratio > 0) {
    rr(ctx, barX + 2, 20, (barW - 4) * ratio, 24, 12);
    ctx.fill();
  }
  text(ctx, `⏱ ${formatTime(s.shiftTimeLeft)}`, barX + barW / 2, 32, 20, '#ffffff');

  // coins, hearts, combo
  text(ctx, `🪙 ${s.score.coins}`, 960, 30, 24, '#ffd166');
  let hearts = '';
  for (let i = 0; i < 3; i++) hearts += i < s.score.hearts ? '❤️' : '🖤';
  text(ctx, hearts, 1120, 30, 22, '#ffffff');
  if (s.score.combo >= 2) {
    text(ctx, `🔥 x${s.score.combo} COMBO`, 960, 54, 13, '#ff9f1c');
  }
}

function drawOrderBoard(ctx, s) {
  text(ctx, '📋 PAPAN PESANAN — klik tiket untuk memilih', 24, 74, 13, '#e8c8e8', 'left');
  const orders = s.board.orders;
  for (let i = 0; i < s.board.maxOrders; i++) {
    const r = ticketRect(i);
    const order = orders[i];
    if (!order) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      rr(ctx, r.x, r.y, r.w, r.h, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      ctx.setLineDash([]);
      text(ctx, '— kosong —', r.x + r.w / 2, r.y + r.h / 2, 15, '#9a7a9a');
      continue;
    }
    const selected = i === s.board.selectedIndex;
    ctx.fillStyle = selected ? '#fff8e1' : '#f3e3c2';
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    if (selected) {
      ctx.strokeStyle = '#ff9f1c';
      ctx.lineWidth = 4;
      rr(ctx, r.x, r.y, r.w, r.h, 12);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    // pin
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.arc(r.x + r.w / 2, r.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, order.dish.emoji, r.x + 34, r.y + 46, 40, '#000');
    text(ctx, order.dish.name, r.x + 64, r.y + 32, 16, '#3a2438', 'left');
    text(ctx, `${order.customer.face} ${order.customer.name} ${moodFace(order.mood)}`,
      r.x + 64, r.y + 56, 13, '#6b4a5a', 'left');
    // needed ingredients, checked off as they land on the plate
    const dish = order.dish;
    dish.ingredients.forEach((ingId, j) => {
      const ing = ingredientById(ingId);
      const done = selected && s.plate.added.includes(ingId);
      ctx.font = '20px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = done ? '#2a9d3f' : '#3a2438';
      ctx.fillText(done ? '✅' : ing.emoji, r.x + 16 + j * 34, r.y + 84);
    });
    // order countdown
    const ratio = Math.max(0, order.timeLeft / order.timeMax);
    ctx.fillStyle = '#d9c8a8';
    rr(ctx, r.x + 14, r.y + 100, r.w - 28, 10, 5);
    ctx.fill();
    ctx.fillStyle = ratio > 0.5 ? '#7bd88a' : ratio > 0.25 ? '#ffb703' : '#e63946';
    if (ratio > 0) {
      rr(ctx, r.x + 14, r.y + 100, (r.w - 28) * ratio, 10, 5);
      ctx.fill();
    }
    text(ctx, `${Math.ceil(order.timeLeft)} dtk`, r.x + r.w - 14, r.y + 84, 12, '#6b4a5a', 'right');
  }
}

function drawKitchen(ctx, s, nowMs) {
  // floor strip
  ctx.fillStyle = '#5b3a4a';
  ctx.fillRect(0, 434, W, 50);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let x = 0; x < W; x += 64) ctx.fillRect(x, 434, 2, 50);

  drawStove(ctx, s, nowMs);
  drawPlateArea(ctx, s, nowMs);
  drawServingWindow(ctx, s);
}

function drawStove(ctx, s, nowMs) {
  const { x, y, w, h } = STOVE;
  ctx.fillStyle = '#4a4a55';
  rr(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.fillStyle = '#33333d';
  rr(ctx, x + 12, y + 12, w - 24, 54, 10);
  ctx.fill();
  // wok with flame — it only sizzles while a dish is being built
  const cooking = s.screen === 'playing' && s.plate.added.length > 0;
  const flame = cooking ? 1 : 0.35;
  const flick = Math.sin(nowMs / 90) * 4;
  ctx.fillStyle = `rgba(255, ${140 + Math.floor(flick * 4)}, 0, ${0.85 * flame})`;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 96, 86 + flick, 26 + flick * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2b33';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 92, 96, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c98a4b';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 88, 78, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  // what is in the wok
  const dish = s.board.selected?.dish;
  if (dish && s.plate.added.length > 0) {
    ctx.font = '30px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dish.emoji, x + w / 2, y + 86);
  }
  // knobs
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = cooking ? '#ff9f1c' : '#777';
    ctx.beginPath();
    ctx.arc(x + 60 + i * 50, y + h - 26, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, '🔥 KOMPOR PETIR', x + w / 2, y + h - 52, 14, '#ffd97a');
}

function drawPlateArea(ctx, s, nowMs) {
  const { x, y, rx, ry } = PLATE;
  const dish = s.board.selected?.dish;
  const complete = dish && s.plate.isComplete(dish);
  // glow when the plate is ready to serve
  if (complete) {
    const pulse = 0.5 + Math.sin(nowMs / 150) * 0.25;
    const glow = ctx.createRadialGradient(x, y, 10, x, y, rx + 60);
    glow.addColorStop(0, `rgba(255, 214, 100, ${0.35 * pulse})`);
    glow.addColorStop(1, 'rgba(255, 214, 100, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - rx - 70, y - ry - 70, (rx + 70) * 2, (ry + 70) * 2);
  }
  // table
  ctx.fillStyle = '#a9743f';
  rr(ctx, x - rx - 40, y - ry - 26, (rx + 40) * 2, ry * 2 + 76, 18);
  ctx.fill();
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(x - rx - 40, y + ry + 34, (rx + 40) * 2, 16);
  // the plate
  ctx.fillStyle = '#f8f4ec';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9c8a8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, rx - 14, ry - 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  // ingredients mid-assembly, piled on the plate
  const added = s.plate.added;
  added.forEach((ingId, i) => {
    const ing = ingredientById(ingId);
    const angle = (i / Math.max(1, added.length)) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(angle) * (rx * 0.45);
    const py = y + Math.sin(angle) * (ry * 0.45);
    ctx.font = '38px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ing.emoji, px, py);
  });
  if (added.length === 0) {
    text(ctx, 'Piring kosong — klik bahan di bawah!', x, y, 15, '#9a8a7a');
  }
  if (s.plate.wrong) {
    text(ctx, '❌ SALAH BAHAN! Buang dulu (T)', x, y - ry - 44, 18, '#ff5a5a');
  } else if (complete) {
    text(ctx, '✨ SIAP DISAJIKAN! Tekan SPASI / bel ✨', x, y - ry - 44, 18, '#2a9d3f');
  } else if (dish) {
    const left = dish.ingredients.length - s.plate.added.filter(
      (id) => dish.ingredients.includes(id)).length;
    text(ctx, `Rakit: ${dish.name} — kurang ${left} bahan`, x, y - ry - 44, 15, '#ffd97a');
  }
  // progress dots
  if (dish) {
    dish.ingredients.forEach((ingId, i) => {
      const ing = ingredientById(ingId);
      const done = s.plate.added.includes(ingId);
      ctx.font = '24px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = done ? 1 : 0.35;
      ctx.fillText(ing.emoji, x - 60 + i * 34, y + ry + 56);
      ctx.globalAlpha = 1;
    });
  }
}

function drawServingWindow(ctx, s) {
  const { x, y, w, h } = WINDOW;
  ctx.fillStyle = '#1d1220';
  rr(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.fillStyle = '#2e1f33';
  rr(ctx, x + 10, y + 10, w - 20, h - 20, 10);
  ctx.fill();
  const order = s.board.selected;
  if (order) {
    ctx.font = '72px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(order.customer.face, x + 70, y + 70);
    text(ctx, order.customer.name, x + 130, y + 44, 18, '#ffd97a', 'left');
    text(ctx, moodFace(order.mood), x + 130, y + 74, 28, '#fff', 'left');
    text(ctx, `“${order.dish.name}, ya!”`, x + 130, y + 104, 15, '#e8c8e8', 'left');
    text(ctx, `Bayar 🪙 ${order.dish.price}`, x + 130, y + 128, 14, '#ffd166', 'left');
  } else {
    text(ctx, '😴', x + w / 2, y + 70, 56, '#fff');
    text(ctx, 'Belum ada pelanggan…', x + w / 2, y + 130, 15, '#9a7a9a');
  }
  // trash button
  ctx.fillStyle = '#5b3a4a';
  ctx.beginPath();
  ctx.arc(TRASH.x, TRASH.y, TRASH.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ff9f9f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(TRASH.x, TRASH.y, TRASH.r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  text(ctx, '🗑️', TRASH.x, TRASH.y - 4, 26, '#fff');
  text(ctx, 'BUANG (T)', TRASH.x, TRASH.y + TRASH.r + 12, 11, '#ff9f9f');
  // serve bell
  const dish = s.board.selected?.dish;
  const ready = dish && s.plate.isComplete(dish);
  ctx.fillStyle = ready ? '#ffd166' : '#8a7a5a';
  ctx.beginPath();
  ctx.arc(BELL.x, BELL.y, BELL.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2438';
  ctx.beginPath();
  ctx.arc(BELL.x, BELL.y - 6, 26, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(BELL.x - 26, BELL.y - 6, 52, 8);
  ctx.beginPath();
  ctx.arc(BELL.x, BELL.y + 12, 5, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, ready ? 'SAJIKAN! (Spasi)' : 'BEL', BELL.x, BELL.y + BELL.r + 12, 12, ready ? '#ffd166' : '#9a8a7a');
}

function drawCounter(ctx, s, nowMs) {
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(0, COUNTER.y - 14, W, COUNTER.h + 28);
  ctx.fillStyle = '#a9743f';
  ctx.fillRect(0, COUNTER.y - 14, W, 12);
  text(ctx, '🧺 BAHAN DI ATAS MEJA — klik atau tekan 1–9', 24, COUNTER.y - 26, 13, '#e8c8e8', 'left');
  INGREDIENTS.forEach((ing, i) => {
    const r = binRect(i);
    const hover = s.hoverBin === ing.id;
    ctx.fillStyle = hover ? '#ffe9b0' : '#f7ead0';
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.strokeStyle = '#8a5a33';
    ctx.lineWidth = 2;
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.font = '46px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ing.emoji, r.x + r.w / 2, r.y + 52);
    text(ctx, ing.name, r.x + r.w / 2, r.y + 102, 15, '#3a2438');
    // key cap
    ctx.fillStyle = '#3a2438';
    rr(ctx, r.x + 8, r.y + 8, 24, 24, 6);
    ctx.fill();
    text(ctx, ing.key, r.x + 20, r.y + 20, 13, '#ffd97a');
    // dim bins already on the plate
    if (s.plate.added.includes(ing.id)) {
      ctx.fillStyle = 'rgba(42, 157, 63, 0.25)';
      rr(ctx, r.x, r.y, r.w, r.h, 12);
      ctx.fill();
      text(ctx, '✓', r.x + r.w - 18, r.y + 22, 18, '#2a9d3f');
    }
    void nowMs;
  });
}

function drawHints(ctx, s) {
  text(ctx, 'Klik tiket = pilih pesanan  •  1–9 / klik = tambah bahan  •  SPASI = sajikan  •  T = buang  •  ← → = ganti tiket  •  P = jeda  •  M = suara',
    W / 2, 668, 14, '#c9a0c9');
  if (s.screen === 'playing' && s.board.orders.length === 0) {
    text(ctx, 'Tunggu pesanan masuk…', W / 2, 700, 14, '#ffd97a');
  }
}

function drawFloaters(ctx, s) {
  for (const f of s.floaters) {
    const alpha = Math.max(0, f.life / f.maxLife);
    ctx.globalAlpha = alpha;
    text(ctx, f.text, f.x, f.y - (1 - alpha) * 40, 22, f.color);
    ctx.globalAlpha = 1;
  }
}

function drawRushBanner(ctx, nowMs) {
  const blink = Math.sin(nowMs / 120) > 0;
  ctx.fillStyle = blink ? '#e63946' : '#ff9f1c';
  rr(ctx, W / 2 - 260, 70, 520, 40, 20);
  ctx.fill();
  text(ctx, '⚡ RUSH HOUR! Pesanan dobel, koin x2! ⚡', W / 2, 90, 20, '#ffffff');
}

function drawTitle(ctx, s) {
  ctx.fillStyle = 'rgba(20, 10, 24, 0.72)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '⚡ DAPUR PETIR ⚡', W / 2, 150, 64, '#ffd166');
  text(ctx, 'WARUNG KILAT — masak cepat, pelanggan lapar, cabai jangan pelit.', W / 2, 205, 20, '#ffe9b0');
  text(ctx, 'Pesanan masuk di papan atas. Klik bahan di meja, rakit di piring,', W / 2, 260, 18, '#ffffff');
  text(ctx, 'lalu bunyikan bel sebelum timer pelanggan habis. 3 pesanan hangus = shift selesai.', W / 2, 288, 18, '#ffffff');
  text(ctx, '🍚 Nasi Goreng Petir  •  🍜 Mie Goreng Kilat  •  🍢 Sate Kilat  •  🍗 Ayam Geprek  •  🧋 Es Teh Manis  •  🍜 Mie Nyemek',
    W / 2, 330, 16, '#ffd97a');
  text(ctx, 'Keyboard: 1–9 bahan  •  SPASI sajikan  •  T buang  •  ← → ganti tiket  •  P jeda', W / 2, 372, 16, '#c9a0c9');
  // start button
  const b = START_BUTTON;
  const pulse = 1 + Math.sin(Date.now() / 300) * 0.03;
  ctx.save();
  ctx.translate(W / 2, b.y + b.h / 2);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#ff9f1c';
  rr(ctx, -b.w / 2, -b.h / 2, b.w, b.h, 16);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  rr(ctx, -b.w / 2, -b.h / 2, b.w, b.h, 16);
  ctx.stroke();
  ctx.lineWidth = 1;
  text(ctx, '🍳 BUKA WARUNG — klik / ENTER', 0, 0, 24, '#3a2438');
  ctx.restore();
  text(ctx, 'Shift 2 menit • Rush hour tiap 45 detik • Kak Kunti juga pesan di sini 👻', W / 2, 660, 14, '#9a7a9a');
  void s;
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20, 10, 24, 0.7)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '⏸ JEDA', W / 2, 330, 56, '#ffd166');
  text(ctx, 'Tekan P untuk lanjut masak', W / 2, 390, 18, '#ffffff');
}

function drawGameOver(ctx, s) {
  ctx.fillStyle = 'rgba(20, 10, 24, 0.78)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, '🌙 WARUNG TUTUP 🌙', W / 2, 150, 52, '#ffd166');
  text(ctx, s.score.rankTitle, W / 2, 215, 30, '#ff9f1c');
  text(ctx, `🪙 ${s.score.coins} koin  •  🍽️ ${s.score.served} hidangan disajikan  •  🔥 combo terbaik x${s.score.bestCombo}  •  💰 tip ${s.score.tips} koin`,
    W / 2, 280, 20, '#ffffff');
  const verdict = s.score.served >= 14
    ? 'Pelanggan antre sampai ke ujung gang. Warungmu LEGENDA.'
    : s.score.served >= 9
      ? 'Wajanmu berasap terus. Besok buka lagi, ya?'
      : s.score.served >= 5
        ? 'Lumayan! Tapi Kak Kunti masih lapar…'
        : 'Warungmu sepi… mungkin cabainya kurang? Coba lagi!';
  text(ctx, verdict, W / 2, 330, 18, '#ffe9b0');
  const b = RESTART_BUTTON;
  ctx.fillStyle = '#ff9f1c';
  rr(ctx, b.x, b.y, b.w, b.h, 16);
  ctx.fill();
  text(ctx, '🔄 MASAK LAGI — klik / tekan R', W / 2, b.y + b.h / 2, 22, '#3a2438');
  text(ctx, 'Skor ini yang akan dinilai juri: hidangan, kecepatan, dan combo.', W / 2, 660, 14, '#9a7a9a');
}
