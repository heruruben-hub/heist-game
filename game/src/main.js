// Vaultfall — bootstrap and game loop: owns the screen state machine
// (title → floor briefing → playing ⇄ paused → won / lost), feeds input to the
// world, turns world events into sound, and draws each frame.
// With ?shot=N in the address it instead freezes one composed scene (see shots.js).

import { LEVELS } from './levels.js';
import { createWorld, stepWorld } from './world.js';
import {
  renderScene, drawTitleOverlay, drawBriefOverlay,
  drawPauseOverlay, drawWinOverlay, drawLoseOverlay,
} from './render.js';
import { initInput, held, wasPressed, drainPressed, moveVector } from './input.js';
import {
  initAudio, sfxStep, sfxPickup, sfxCrackTick,
  sfxSpotted, sfxCaught, sfxSuccess, sfxClick,
} from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

initInput(window);
window.addEventListener('keydown', initAudio, { once: false });
window.addEventListener('pointerdown', initAudio);

const game = {
  screen: 'title',
  levelIndex: 0,
  world: createWorld(LEVELS[0]),
  bankedLoot: 0,
  bankedTime: 0,
  briefLeft: 0,
};

function startLevel(index) {
  game.levelIndex = index;
  game.world = createWorld(LEVELS[index]);
  game.screen = 'brief';
  game.briefLeft = 1.6;
}

function resetRun() {
  game.bankedLoot = 0;
  game.bankedTime = 0;
  startLevel(0);
}

function playEvents(events) {
  for (const event of events) {
    if (event === 'step') sfxStep();
    else if (event === 'pickup') sfxPickup();
    else if (event === 'crackTick') sfxCrackTick();
    else if (event === 'spotted') sfxSpotted();
    else if (event === 'cracked') sfxSuccess();
    else if (event === 'caught') sfxCaught();
  }
}

function update(dt) {
  const world = game.world;
  if (game.screen === 'title') {
    if (wasPressed('Enter', 'Space')) {
      sfxClick();
      resetRun();
    }
    return;
  }
  if (game.screen === 'brief') {
    game.briefLeft -= dt;
    if (game.briefLeft <= 0) game.screen = 'playing';
    return;
  }
  if (game.screen === 'paused') {
    if (wasPressed('KeyP', 'Escape')) game.screen = 'playing';
    return;
  }
  if (game.screen === 'won') {
    if (wasPressed('KeyR')) resetRun();
    return;
  }
  if (game.screen === 'lost') {
    if (wasPressed('KeyR')) startLevel(game.levelIndex);
    return;
  }
  // playing
  if (wasPressed('KeyP', 'Escape')) {
    game.screen = 'paused';
    return;
  }
  if (wasPressed('KeyR')) {
    startLevel(game.levelIndex);
    return;
  }
  const events = stepWorld(world, moveVector(), held('KeyE'), dt);
  playEvents(events);
  if (world.caught) {
    game.screen = 'lost';
  } else if (world.escaped) {
    game.bankedLoot += world.lootValue;
    game.bankedTime += world.time;
    if (game.levelIndex + 1 < LEVELS.length) {
      sfxSuccess();
      startLevel(game.levelIndex + 1);
    } else {
      game.screen = 'won';
    }
  }
}

function draw() {
  const world = game.world;
  renderScene(ctx, world, game.bankedLoot, game.bankedTime);
  if (game.screen === 'title') drawTitleOverlay(ctx, world);
  else if (game.screen === 'brief') drawBriefOverlay(ctx, world);
  else if (game.screen === 'paused') drawPauseOverlay(ctx);
  else if (game.screen === 'won') drawWinOverlay(ctx, game.bankedLoot, game.bankedTime);
  else if (game.screen === 'lost') drawLoseOverlay(ctx, world, game.bankedLoot);
}

// --- screenshot mode ----------------------------------------------------------

const shotParam = new URLSearchParams(window.location.search).get('shot');
if (shotParam !== null) {
  const n = Math.min(4, Math.max(1, Number.parseInt(shotParam, 10) || 1));
  const overlay = applyShot(game.world, n);
  game.screen = overlay === 'title' ? 'title' : 'playing';
  draw();
  // Keep re-drawing the same frozen frame so a capture at any moment sees it whole.
  setInterval(draw, 250);
} else {
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    drainPressed();
    draw();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
