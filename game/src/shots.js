// Gilded Vault — the staged scenes behind ?shot=start|play|heat|escape.
// One job: play the real rules forward from a fresh room with a scripted
// pilot, so each screenshot is a frame a real game produces, and the same
// seed always gives the same frame.
import { STEP } from './config.js';
import { createWorld, stepWorld, STATUS_PLAY, STATUS_TITLE } from './world.js';

const SAMPLE = STEP;
const ARRIVE = 16;

/** A scripted pilot: walk the legs in order, grabbing or waiting as told. */
export function makePilot(legs) {
  let legIndex = 0;
  let waitLeft = 0;
  let grabLeft = 0;
  let fleeing = false;
  return function pilot(state) {
    const input = { mx: 0, my: 0, sneak: false, grab: false, emp: false, coin: null };
    if (legIndex >= legs.length) return { input, done: true };
    // Hunted means a guard is chasing or about to: drop whatever the script
    // was doing and run for the next leg. A running thief outruns a guard.
    let huntedNow = false;
    for (let i = 0; i < state.guards.length; i += 1) {
      const guard = state.guards[i];
      if (guard.state === 'chase' || guard.suspicion > 0.4) huntedNow = true;
    }
    if (huntedNow && !fleeing) {
      fleeing = true;
      legIndex += 1;
      waitLeft = 0;
      grabLeft = 0;
      if (legIndex >= legs.length) return { input, done: true };
    }
    if (!huntedNow) fleeing = false;
    const leg = legs[legIndex];
    const player = state.player;
    const dx = leg.x - player.x;
    const dy = leg.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= ARRIVE) {
      if (leg.grab && grabLeft <= 0) grabLeft = 3;
      if (leg.grab && grabLeft > 0) {
        grabLeft -= SAMPLE;
        const target = state.loot.find((item) => !item.taken
          && Math.hypot(item.x - player.x, item.y - player.y) <= 46);
        if (!target || grabLeft <= 0) {
          legIndex += 1;
          grabLeft = 0;
          return { input, done: false };
        }
        input.grab = true;
        return { input, done: false };
      }
      if (leg.wait && waitLeft <= 0) waitLeft = leg.wait;
      if (leg.wait && waitLeft > 0) {
        waitLeft -= SAMPLE;
        if (waitLeft <= 0) legIndex += 1;
        return { input, done: false };
      }
      legIndex += 1;
      return { input, done: false };
    }
    input.mx = dx / distance;
    input.my = dy / distance;
    let nearGuard = false;
    let hunted = false;
    for (let i = 0; i < state.guards.length; i += 1) {
      const guard = state.guards[i];
      const d = Math.hypot(guard.x - player.x, guard.y - player.y);
      if (d < 210) nearGuard = true;
      if (guard.state === 'chase' || guard.suspicion > 0.4) hunted = true;
    }
    // Sneak past a calm patrol, but run once a guard is on to you: a chasing
    // guard is slower than a running thief, so legs are the way out.
    input.sneak = !!leg.sneak || (nearGuard && !hunted);
    return { input, done: false };
  };
}

/** Run the pilot for at most `maxSeconds`, or until it finishes or the level ends. */
function runPilot(state, legs, maxSeconds) {
  const pilot = makePilot(legs);
  const limit = Math.floor(maxSeconds / SAMPLE);
  for (let i = 0; i < limit; i += 1) {
    const { input, done } = pilot(state);
    stepWorld(state, input);
    if (done) break;
    if (state.status !== STATUS_PLAY) break;
  }
}

/** Run with no input at all (guards walk, cameras sweep) for `seconds`. */
function runIdle(state, seconds) {
  const limit = Math.floor(seconds / SAMPLE);
  for (let i = 0; i < limit; i += 1) {
    stepWorld(state, { mx: 0, my: 0, sneak: false, grab: false, emp: false, coin: null });
  }
}

/**
 * Build the world behind a named shot and return it ready to draw.
 * start: the title over a live gallery. play: mid-heist in room one.
 * heat: room two with the alarm high and a guard giving chase.
 * escape: room one cleared — the diamond stolen, the thief at the door.
 */
export function stageShot(name) {
  if (name === 'heat') {
    const state = createWorld(1, 0);
    state.status = STATUS_PLAY;
    runPilot(state, [
      { x: 600, y: 200, wait: 3 },
      { x: 700, y: 500 },
      { x: 1050, y: 520, wait: 2 },
    ], 30);
    state.message = '';
    return state;
  }
  if (name === 'escape') {
    const state = createWorld(0, 0);
    state.status = STATUS_PLAY;
    runPilot(state, [
      { x: 350, y: 240 },
      { x: 650, y: 200 },
      { x: 1000, y: 200 },
      { x: 1040, y: 360 },
      { x: 1130, y: 360, grab: true },
      { x: 1020, y: 360 },
      { x: 1000, y: 470 },
      { x: 700, y: 540 },
      { x: 450, y: 540 },
      { x: 250, y: 610 },
      { x: 12, y: 636 },
    ], 60);
    return state;
  }
  if (name === 'play') {
    const state = createWorld(0, 0);
    state.status = STATUS_PLAY;
    runPilot(state, [
      { x: 260, y: 90, grab: true },
      { x: 350, y: 240 },
      { x: 640, y: 150, wait: 3 },
      { x: 800, y: 240 },
      { x: 1000, y: 240 },
      { x: 1060, y: 360, wait: 1 },
    ], 45);
    return state;
  }
  const state = createWorld(0, 0);
  state.status = STATUS_TITLE;
  runIdle(state, 5);
  state.status = STATUS_TITLE;
  return state;
}
