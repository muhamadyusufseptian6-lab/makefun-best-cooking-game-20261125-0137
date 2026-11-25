// main.js — boot and game loop for Dapur Petir — Warung Kilat.
// Owns the shift clock, the rush hour, the screen state and every action the
// player can take; the rules live in orders.js / plate.js, the pixels in
// render.js, the sounds in sounds.js, the keys in controls.js.

import { W, drawScene, binRect } from './render.js';
import { OrderBoard } from './orders.js';
import { Plate, Score } from './plate.js';
import { SoundFX } from './sounds.js';
import { bindControls } from './controls.js';
import { ingredientById } from './recipes.js';

const SHIFT_SECONDS = 120;
const RUSH_EVERY = 45;
const RUSH_LENGTH = 15;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sounds = new SoundFX();

const state = {
  screen: 'title', // title | playing | paused | over
  board: OrderBoard.demo(),
  plate: new Plate(),
  score: new Score(),
  shiftTimeLeft: SHIFT_SECONDS,
  shiftMax: SHIFT_SECONDS,
  elapsed: 0,
  rushActive: false,
  rushTimeLeft: 0,
  nextRushIn: RUSH_EVERY,
  floaters: [],
  shake: 0,
  hoverBin: null,
};

// The title screen shows a dish mid-assembly so the kitchen reads at a glance.
state.plate.add('nasi', state.board.selected.dish);
state.plate.add('telur', state.board.selected.dish);

function floater(x, y, text, color) {
  state.floaters.push({ x, y, text, color, life: 1.2, maxLife: 1.2 });
  if (state.floaters.length > 12) state.floaters.shift();
}

function addIngredient(id) {
  if (state.screen !== 'playing') return;
  const order = state.board.selected;
  if (!order) { sounds.error(); return; }
  const result = state.plate.add(id, order.dish);
  const ing = ingredientById(id);
  if (result === 'added') {
    sounds.chop();
    sounds.startSizzle();
    floater(640, 240, `+ ${ing.emoji}`, '#ffd97a');
  } else if (result === 'duplicate') {
    sounds.error();
    state.shake = 8;
    floater(640, 240, 'Sudah ada di piring!', '#ff9f9f');
  } else {
    sounds.error();
    state.shake = 12;
    state.score.spoilPlate();
    floater(640, 240, `❌ ${ing.name} bukan bahan ${order.dish.name}!`, '#ff5a5a');
  }
}

function serve() {
  if (state.screen !== 'playing') return;
  const order = state.board.selected;
  if (!order) return;
  if (!state.plate.isComplete(order.dish)) {
    sounds.error();
    floater(1150, 330, 'Belum siap!', '#ff9f9f');
    return;
  }
  let earned = state.score.serve(order);
  if (state.rushActive) earned *= 2;
  state.board.removeOrder(order.id);
  state.plate.reset();
  sounds.stopSizzle();
  sounds.ding();
  if (state.score.combo >= 3) sounds.fanfare();
  floater(1150, 330, `+${earned} 🪙 ${order.customer.name} senang!`, '#7bd88a');
}

function trash() {
  if (state.screen !== 'playing') return;
  if (state.plate.added.length === 0) return;
  state.plate.reset();
  state.score.spoilPlate();
  sounds.stopSizzle();
  sounds.pop();
  floater(640, 240, '🗑️ Piring dibuang', '#c9a0c9');
}

function selectOrder(index) {
  if (state.screen !== 'playing') return;
  if (index === state.board.selectedIndex) return;
  state.board.select(index);
  // One plate, one dish: switching tickets dumps the unfinished plate.
  if (state.plate.added.length > 0) {
    state.plate.reset();
    sounds.stopSizzle();
    sounds.pop();
  }
}

function startGame() {
  state.board = new OrderBoard();
  state.plate = new Plate();
  state.score = new Score();
  state.shiftTimeLeft = SHIFT_SECONDS;
  state.elapsed = 0;
  state.rushActive = false;
  state.rushTimeLeft = 0;
  state.nextRushIn = RUSH_EVERY;
  state.floaters = [];
  state.shake = 0;
  state.screen = 'playing';
  // Two tickets up front so the board is never empty at the start.
  state.board.update(0.01, 0, false);
  state.board.update(0.01, 0, false);
  sounds.rush();
}

function endShift() {
  state.screen = 'over';
  sounds.stopSizzle();
  if (state.score.served >= 9) sounds.fanfare();
  else sounds.error();
}

function update(dt) {
  state.shake *= 0.88;
  if (state.shake < 0.5) state.shake = 0;
  for (const f of state.floaters) f.life -= dt;
  state.floaters = state.floaters.filter((f) => f.life > 0);

  if (state.screen === 'title') {
    // Keep the demo tickets' timers alive so the board feels busy.
    for (const order of state.board.orders) {
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) order.timeLeft = order.timeMax;
    }
    return;
  }
  if (state.screen !== 'playing') return;

  state.elapsed += dt;
  state.shiftTimeLeft -= dt;

  // Rush hour: every 45 seconds the stall gets slammed for 15 seconds.
  if (!state.rushActive) {
    state.nextRushIn -= dt;
    if (state.nextRushIn <= 0) {
      state.rushActive = true;
      state.rushTimeLeft = RUSH_LENGTH;
      sounds.rush();
      floater(W / 2, 120, '⚡ RUSH HOUR! ⚡', '#ff9f1c');
    }
  } else {
    state.rushTimeLeft -= dt;
    if (state.rushTimeLeft <= 0) {
      state.rushActive = false;
      state.nextRushIn = RUSH_EVERY;
    }
  }

  const expired = state.board.update(dt, state.elapsed, state.rushActive);
  for (const order of expired) {
    state.score.missOrder();
    state.shake = 12;
    sounds.error();
    floater(640, 200, `💨 ${order.customer.name} kabur — ${order.dish.name} hangus!`, '#ff5a5a');
    if (state.score.hearts <= 0) { endShift(); return; }
  }

  // Last-ten-seconds tick so the timer can be felt.
  if (state.shiftTimeLeft <= 10 && state.shiftTimeLeft > 0) {
    const whole = Math.ceil(state.shiftTimeLeft);
    if (whole !== update.lastTick) {
      update.lastTick = whole;
      sounds.tick();
    }
  }

  if (state.shiftTimeLeft <= 0) {
    state.shiftTimeLeft = 0;
    endShift();
  }
}
update.lastTick = -1;

let last = performance.now();
function loop(nowMs) {
  const dt = Math.min(0.05, (nowMs - last) / 1000);
  last = nowMs;
  update(dt);
  drawScene(ctx, state, nowMs);
  requestAnimationFrame(loop);
}

bindControls(canvas, {
  screen: () => state.screen,
  wakeAudio: () => sounds.ensure(),
  start: () => { sounds.ensure(); startGame(); },
  restart: () => { sounds.ensure(); startGame(); },
  addIngredient,
  selectOrder,
  cycleOrder: (dir) => selectOrder(state.board.selectedIndex + dir),
  serve,
  trash,
  togglePause: () => {
    if (state.screen === 'playing') { state.screen = 'paused'; sounds.stopSizzle(); }
    else if (state.screen === 'paused') state.screen = 'playing';
  },
  toggleMute: () => { sounds.muted = !sounds.muted; if (sounds.muted) sounds.stopSizzle(); },
  hover: (x, y) => {
    state.hoverBin = null;
    for (let i = 0; i < 9; i++) {
      const r = binRect(i);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        state.hoverBin = ['nasi', 'mie', 'telur', 'ayam', 'sate', 'cabai', 'kecap', 'teh', 'gula'][i];
      }
    }
  },
});

requestAnimationFrame(loop);
