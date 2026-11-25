// controls.js — keyboard + mouse for Warung Kilat. Translates raw events into
// game actions and canvas-logical coordinates. No game rules live here.

import { W, H, hitTest } from './render.js';
import { INGREDIENTS } from './recipes.js';

export function bindControls(canvas, actions) {
  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const { x, y } = toLogical(event);
    actions.hover(x, y);
  });

  canvas.addEventListener('click', (event) => {
    actions.wakeAudio();
    const { x, y } = toLogical(event);
    const hit = hitTest(x, y, actions.screen());
    if (!hit) return;
    if (hit.type === 'start') actions.start();
    else if (hit.type === 'restart') actions.restart();
    else if (hit.type === 'bin') actions.addIngredient(hit.id);
    else if (hit.type === 'ticket') actions.selectOrder(hit.index);
    else if (hit.type === 'bell') actions.serve();
    else if (hit.type === 'trash') actions.trash();
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    actions.wakeAudio();
    const key = event.key;
    if (key === 'Enter' && actions.screen() === 'title') { actions.start(); return; }
    if ((key === 'r' || key === 'R') && actions.screen() === 'over') { actions.restart(); return; }
    if (key === 'p' || key === 'P') { actions.togglePause(); return; }
    if (key === 'm' || key === 'M') { actions.toggleMute(); return; }
    if (actions.screen() !== 'playing') return;
    if (key === ' ') { event.preventDefault(); actions.serve(); return; }
    if (key === 't' || key === 'T') { actions.trash(); return; }
    if (key === 'ArrowRight' || key === 'Tab') { event.preventDefault(); actions.cycleOrder(1); return; }
    if (key === 'ArrowLeft') { event.preventDefault(); actions.cycleOrder(-1); return; }
    const ing = INGREDIENTS.find((item) => item.key === key);
    if (ing) actions.addIngredient(ing.id);
  });
}
