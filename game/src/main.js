// Gilded Vault — the front door: canvas, loop, menus, and the ?shot= scenes.
// One job: own the animation frame, feed input to the world, draw the result.
import { STEP, VIEW } from './config.js';
import { LEVELS } from './levels.js';
import { createWorld, stepWorld, mainLootTaken } from './world.js';
import { STATUS_TITLE, STATUS_PLAY, STATUS_PAUSED, STATUS_CLEAR, STATUS_BUSTED, STATUS_CAUGHT, STATUS_WIN } from './world.js';
import { drawGame } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();

let state = createWorld(0, 0);
let shownMainHint = false;

/** Fit the 1280x720 room into the window without stretching it. */
function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  const width = Math.floor(VIEW.width * scale);
  const height = Math.floor(VIEW.height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.left = `${Math.floor((window.innerWidth - width) / 2)}px`;
  canvas.style.top = `${Math.floor((window.innerHeight - height) / 2)}px`;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = VIEW.width * dpr;
  canvas.height = VIEW.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function startLevel(levelIndex, totalScore) {
  state = createWorld(levelIndex, totalScore);
  shownMainHint = false;
  state.status = STATUS_PLAY;
}

function restartLevel() {
  startLevel(state.levelIndex, state.totalScore);
}

function nextLevel() {
  if (state.levelIndex + 1 < LEVELS.length) startLevel(state.levelIndex + 1, state.totalScore);
}

function announce(text) {
  if (statusLine) statusLine.textContent = text;
}

function handleMenuKeys() {
  if (input.wasPressed('enter')) {
    audio.ensure();
    if (state.status === STATUS_TITLE) {
      state.status = STATUS_PLAY;
      announce(`${state.level.name}: steal the ${state.level.loot.find((i) => i.main).label}, then reach the exit.`);
    } else if (state.status === STATUS_CLEAR) {
      nextLevel();
    }
  }
  if (input.wasPressed('r')) {
    if (state.status === STATUS_BUSTED || state.status === STATUS_CAUGHT) restartLevel();
    else if (state.status === STATUS_WIN) startLevel(0, 0);
    else if (state.status === STATUS_PLAY || state.status === STATUS_PAUSED) restartLevel();
  }
  if (input.wasPressed('p')) {
    if (state.status === STATUS_PLAY) state.status = STATUS_PAUSED;
    else if (state.status === STATUS_PAUSED) state.status = STATUS_PLAY;
  }
  if (input.wasPressed('m')) {
    audio.muted = !audio.muted;
    state.message = audio.muted ? 'Sound off' : 'Sound on';
    state.messageUntil = state.time + 1.5;
  }
  if (input.wasPressed('q')) input.queueEmp();
}
function frame() {
  input.poll();
  handleMenuKeys();
  if (state.status === STATUS_PLAY) {
    stepWorld(state, {
      mx: input.mx,
      my: input.my,
      sneak: input.sneak,
      grab: input.grab,
      emp: input.emp,
      coin: input.coin,
    });
    for (const event of state.events) audio.play(event);
    if (mainLootTaken(state) && !shownMainHint) {
      shownMainHint = true;
      state.message = 'Main prize secured — get to the green EXIT!';
      state.messageUntil = state.time + 5;
      announce('Main prize secured. Reach the green exit.');
    }
    if (state.status === STATUS_BUSTED) announce('Alarm tripped. Press R to try the room again.');
    if (state.status === STATUS_CAUGHT) announce('Caught by a guard. Press R to try the room again.');
    if (state.status === STATUS_CLEAR) announce(`Room clear. Score ${state.levelScore}. Press Enter for the next room.`);
    if (state.status === STATUS_WIN) announce(`The vault is yours. Total haul $${state.totalScore}. Press R to play again.`);
  }
  drawGame(ctx, state);
  input.endFrame();
}

function playLive() {
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  // Fixed-step accumulator: the world always advances in 1/60 s slices.
  let last = performance.now();
  let debt = 0;
  function tick(now) {
    debt += Math.min(100, now - last);
    last = now;
    while (debt >= STEP * 1000) {
      debt -= STEP * 1000;
      frame();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/** A screenshot scene: stage it, draw one frame, and tell the camera. */
function playShot(query) {
  const name = query.get('shot') || 'start';
  state = stageShot(name);
  fitCanvas();
  drawGame(ctx, state);
  window.__shotReady = true;
}

const query = new URLSearchParams(window.location.search);
if (query.has('shot')) playShot(query);
else playLive();
