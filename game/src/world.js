// Gilded Vault — the heist itself: state, movement, guards, cameras, alarm.
// One job: advance one fixed step of the game from the player's input.
import { ALARM, CAMERA, EMP, GUARD, LASER, PLAYER, STEP } from './config.js';
import { LEVELS } from './levels.js';
import { circleHitsRects, insideCone } from './vision.js';

export const STATUS_TITLE = 'title';
export const STATUS_PLAY = 'play';
export const STATUS_PAUSED = 'paused';
export const STATUS_CLEAR = 'clear';
export const STATUS_BUSTED = 'busted';
export const STATUS_CAUGHT = 'caught';
export const STATUS_WIN = 'win';

/** Fresh state for a level, carrying the running total score forward. */
export function createWorld(levelIndex, totalScore) {
  const level = LEVELS[levelIndex];
  const state = {
    levelIndex,
    level,
    totalScore,
    time: 0,
    status: STATUS_TITLE,
    alarm: 0,
    maxAlarm: 0,
    lootValue: 0,
    player: {
      x: level.start.x,
      y: level.start.y,
      angle: 0,
      moving: false,
      sneaking: false,
      grabProgress: 0,
      grabbing: null,
      coins: PLAYER.coinsPerLevel,
      emp: PLAYER.empPerLevel,
      laserCooldownUntil: 0,
    },
    guards: level.guards.map((g) => ({
      x: g.waypoints[0][0],
      y: g.waypoints[0][1],
      angle: 0,
      waypoints: g.waypoints,
      wpIndex: 1 % g.waypoints.length,
      wait: 0,
      state: 'patrol',
      suspicion: 0,
      lastSeen: null,
      loseTimer: 0,
      scanTimer: 0,
      target: null,
    })),
    cameras: level.cameras.map((c) => ({
      ...c,
      disabledUntil: 0,
      sees: false,
      wasSeeing: false,
    })),
    lasers: level.lasers.map((l) => ({ ...l, on: false })),
    loot: level.loot.map((item) => ({ ...item, taken: false })),
    coinMarkers: [],
    empUntil: 0,
    events: [],
    flash: 0,
    message: '',
    messageUntil: 0,
    levelScore: 0,
    ghost: false,
  };
  return state;
}

/** Every rect that blocks walking: walls plus every piece of cover. */
export function walkSolids(level) {
  return level.walls.concat(level.cover);
}

/** Every rect that blocks sight: walls plus cover that is not low. */
export function sightSolids(level) {
  return level.walls.concat(level.cover.filter((c) => !c.low));
}

/** Move a circle by (mx, my), pushing it out of any solid it overlaps. */
function slideCircle(state, entity, radius, mx, my) {
  entity.x += mx;
  entity.y += my;
  const solids = walkSolids(state.level);
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < solids.length; i += 1) {
      const r = solids[i];
      const nearX = Math.max(r.x, Math.min(entity.x, r.x + r.w));
      const nearY = Math.max(r.y, Math.min(entity.y, r.y + r.h));
      const dx = entity.x - nearX;
      const dy = entity.y - nearY;
      const d2 = dx * dx + dy * dy;
      if (d2 >= radius * radius) continue;
      if (d2 === 0) {
        entity.y = r.y - radius;
        continue;
      }
      const d = Math.sqrt(d2);
      const push = (radius - d) / d;
      entity.x += dx * push;
      entity.y += dy * push;
    }
  }
}

/** Move the thief one step, sliding around walls and cover instead of wedging into their corners. */
export function movePlayer(state, mx, my, dt) {
  const player = state.player;
  const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  slideCircle(state, player, PLAYER.radius, mx * speed * dt, my * speed * dt);
  if (mx !== 0 || my !== 0) player.angle = Math.atan2(my, mx);
  player.moving = mx !== 0 || my !== 0;
}

/** The nearest loot the thief could grab, or null. */
export function grabbableLoot(state) {
  const player = state.player;
  for (let i = 0; i < state.loot.length; i += 1) {
    const item = state.loot[i];
    if (item.taken) continue;
    const d = Math.hypot(item.x - player.x, item.y - player.y);
    if (d <= PLAYER.grabReach) return item;
  }
  return null;
}

export function mainLootTaken(state) {
  return state.loot.some((item) => item.main && item.taken);
}
/** One guard's patrol: walk its waypoints, pausing to look around at each one. */
function patrolGuard(state, guard, dt) {
  if (guard.wait > 0) {
    guard.wait -= dt;
    guard.angle += Math.sin(guard.wait * 2.2) * 0.02;
    return;
  }
  const target = guard.waypoints[guard.wpIndex];
  const dx = target[0] - guard.x;
  const dy = target[1] - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 6) {
    guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
    guard.wait = GUARD.waitSeconds;
    return;
  }
  const speed = GUARD.patrolSpeed * dt;
  slideCircle(state, guard, GUARD.radius, (dx / distance) * speed, (dy / distance) * speed);
  guard.angle = Math.atan2(dy, dx);
}

/**
 * Walk toward a point at `speed`, sliding along walls and cover like the
 * thief does; true once close enough to stop.
 */
function walkToward(state, guard, x, y, speed, dt) {
  const dx = x - guard.x;
  const dy = y - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 8) return true;
  const step = Math.min(distance, speed * dt);
  slideCircle(state, guard, GUARD.radius, (dx / distance) * step, (dy / distance) * step);
  guard.angle = Math.atan2(dy, dx);
  return Math.hypot(x - guard.x, y - guard.y) < 8;
}

function nearestWaypointIndex(guard) {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < guard.waypoints.length; i += 1) {
    const d = Math.hypot(guard.waypoints[i][0] - guard.x, guard.waypoints[i][1] - guard.y);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  }
  return best;
}

/** One guard's brain for one step. Returns true when the guard sees the thief. */
function updateGuard(state, guard, dt) {
  const player = state.player;
  const solids = sightSolids(state.level);
  const sees = insideCone(
    guard,
    player,
    GUARD.coneRange,
    GUARD.coneHalfAngle,
    solids,
  );
  if (sees) {
    const distance = Math.hypot(player.x - guard.x, player.y - guard.y);
    guard.suspicion += GUARD.suspicionGain * dt * (1.35 - (distance / GUARD.coneRange) * 0.55);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.loseTimer = 0;
    if (guard.suspicion >= 1 && guard.state !== 'chase') {
      guard.state = 'chase';
      state.events.push({ type: 'chase' });
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - GUARD.suspicionDecay * dt);
  }

  // Running feet nearby make a guard curious even without seeing you.
  if (player.moving && !player.sneaking) {
    const distance = Math.hypot(player.x - guard.x, player.y - guard.y);
    if (distance < GUARD.hearRadius) guard.suspicion = Math.min(1, guard.suspicion + 0.22 * dt);
  }

  if (guard.state === 'chase') {
    if (sees) {
      walkToward(state, guard, player.x, player.y, GUARD.chaseSpeed, dt);
    } else {
      guard.loseTimer += dt;
      if (guard.loseTimer > GUARD.loseSightSeconds && guard.lastSeen) {
        guard.state = 'investigate';
        guard.target = guard.lastSeen;
        guard.scanTimer = 0;
      } else if (guard.lastSeen) {
        walkToward(state, guard, guard.lastSeen.x, guard.lastSeen.y, GUARD.chaseSpeed, dt);
      }
    }
    const caught = Math.hypot(player.x - guard.x, player.y - guard.y) < GUARD.catchRadius;
    if (caught) {
      state.status = STATUS_CAUGHT;
      state.events.push({ type: 'caught' });
    }
    return sees;
  }

  if (guard.state === 'investigate' && guard.target) {
    const arrived = walkToward(state, guard, guard.target.x, guard.target.y, GUARD.investigateSpeed, dt);
    if (arrived) {
      guard.scanTimer += dt;
      guard.angle += Math.sin(guard.scanTimer * 3) * 0.03;
      if (guard.scanTimer > 2) {
        guard.state = 'patrol';
        guard.target = null;
        guard.wpIndex = nearestWaypointIndex(guard);
        guard.suspicion = 0.3;
      }
    }
    return sees;
  }

  patrolGuard(state, guard, dt);
  return sees;
}

/** One camera's sweep and its alarm contribution for one step. */
function updateCamera(state, camera, dt) {
  camera.angle = camera.angle ?? camera.baseAngle;
  const time = state.time;
  camera.angle = camera.baseAngle + Math.sin(time * CAMERA.sweepSpeed) * camera.sweep;
  camera.sees = false;
  if (time < camera.disabledUntil) return false;
  const solids = sightSolids(state.level);
  const sees = insideCone(camera, state.player, CAMERA.coneRange, CAMERA.coneHalfAngle, solids);
  camera.sees = sees;
  if (sees && !camera.wasSeeing) state.events.push({ type: 'spotted' });
  camera.wasSeeing = sees;
  if (sees) state.alarm = Math.min(ALARM.max, state.alarm + CAMERA.alarmPerSecond * dt);
  return sees;
}

/** Lasers blink on their cycle; a live beam trips the alarm when crossed. */
function updateLasers(state) {
  const empActive = state.time < state.empUntil;
  for (let i = 0; i < state.lasers.length; i += 1) {
    const laser = state.lasers[i];
    const cycle = (state.time + laser.phase) % LASER.period;
    laser.on = !empActive && cycle < LASER.onSeconds;
    if (!laser.on) continue;
    const p = state.player;
    const nearX = Math.max(laser.x, Math.min(p.x, laser.x + laser.w));
    const nearY = Math.max(laser.y, Math.min(p.y, laser.y + laser.h));
    const dx = p.x - nearX;
    const dy = p.y - nearY;
    if (dx * dx + dy * dy < PLAYER.radius * PLAYER.radius && state.time > p.laserCooldownUntil) {
      p.laserCooldownUntil = state.time + 1;
      state.alarm = Math.min(ALARM.max, state.alarm + ALARM.laserHit);
      state.events.push({ type: 'laser' });
      state.flash = 0.35;
    }
  }
}

/** Throw a coin: the nearest guard in earshot goes to look at it. */
function throwCoin(state, point) {
  const player = state.player;
  if (player.coins <= 0) return;
  const distance = Math.hypot(point.x - player.x, point.y - player.y);
  if (distance > PLAYER.coinRange) return;
  player.coins -= 1;
  state.coinMarkers.push({ x: point.x, y: point.y, ttl: 4 });
  state.events.push({ type: 'coin' });
  let best = null;
  let bestDistance = Infinity;
  for (let i = 0; i < state.guards.length; i += 1) {
    const guard = state.guards[i];
    const d = Math.hypot(point.x - guard.x, point.y - guard.y);
    if (d < 420 && d < bestDistance) {
      bestDistance = d;
      best = guard;
    }
  }
  if (best) {
    best.state = 'investigate';
    best.target = { x: point.x, y: point.y };
    best.scanTimer = 0;
    best.suspicion = Math.max(best.suspicion, 0.35);
  }
}

/** Fire the EMP: cameras and lasers sleep, but the alarm jumps. */
function fireEmp(state) {
  const player = state.player;
  if (player.emp <= 0) return;
  player.emp -= 1;
  state.empUntil = state.time + EMP.disableSeconds;
  for (let i = 0; i < state.cameras.length; i += 1) {
    state.cameras[i].disabledUntil = state.empUntil;
  }
  state.alarm = Math.min(ALARM.max, state.alarm + ALARM.empCost);
  state.events.push({ type: 'emp' });
}

/** Score for a cleared level: loot, a time bonus, and a ghost bonus. */
function finishLevel(state) {
  const timeBonus = Math.max(0, Math.round((state.level.parSeconds - state.time) * 20));
  state.ghost = state.maxAlarm < 50;
  const ghostBonus = state.ghost ? 500 : 0;
  state.levelScore = state.lootValue + timeBonus + ghostBonus;
  state.totalScore += state.levelScore;
  state.status = state.levelIndex >= LEVELS.length - 1 ? STATUS_WIN : STATUS_CLEAR;
  state.events.push({ type: state.status === STATUS_WIN ? 'win' : 'clear' });
}

/**
 * Advance the game one fixed step.
 * `input` is { mx, my, sneak, grab, emp, coin } — mx/my in -1..1, emp and coin
 * are edge-triggered (a fresh press, or a fresh click point, this step).
 */
export function stepWorld(state, input) {
  const dt = STEP;
  state.events.length = 0;
  if (state.status !== STATUS_PLAY) {
    // On the title screen the guards still walk their rounds behind the menu.
    if (state.status === STATUS_TITLE) {
      state.time += dt;
      for (let i = 0; i < state.guards.length; i += 1) patrolGuard(state, state.guards[i], dt);
      for (let i = 0; i < state.cameras.length; i += 1) {
        state.cameras[i].angle = state.cameras[i].baseAngle
          + Math.sin(state.time * CAMERA.sweepSpeed) * state.cameras[i].sweep;
      }
    }
    return;
  }

  state.time += dt;
  const player = state.player;
  player.sneaking = !!input.sneak;
  movePlayer(state, input.mx, input.my, dt);
  if (input.emp) fireEmp(state);
  if (input.coin) throwCoin(state, input.coin);

  // Grabbing: hold still beside loot and the channel fills.
  const target = grabbableLoot(state);
  if (input.grab && target && !player.moving) {
    player.grabbing = target;
    player.grabProgress += dt / PLAYER.grabSeconds;
    if (player.grabProgress >= 1) {
      target.taken = true;
      state.lootValue += target.value;
      player.grabProgress = 0;
      player.grabbing = null;
      state.events.push({ type: 'grabbed', label: target.label, value: target.value });
    }
  } else {
    player.grabbing = null;
    player.grabProgress = Math.max(0, player.grabProgress - dt * 2);
  }

  let anyoneSees = false;
  for (let i = 0; i < state.guards.length; i += 1) {
    const sees = updateGuard(state, state.guards[i], dt);
    anyoneSees = anyoneSees || sees;
    if (sees) {
      state.alarm = Math.min(ALARM.max, state.alarm + ALARM.guardSeenPerSecond * dt);
      state.flash = Math.max(state.flash, 0.12);
    }
    if (state.status !== STATUS_PLAY) return;
  }
  for (let i = 0; i < state.cameras.length; i += 1) {
    anyoneSees = updateCamera(state, state.cameras[i], dt) || anyoneSees;
  }
  updateLasers(state);

  if (!anyoneSees) state.alarm = Math.max(0, state.alarm - ALARM.decayPerSecond * dt);
  state.maxAlarm = Math.max(state.maxAlarm, state.alarm);
  state.flash = Math.max(0, state.flash - dt);

  for (let i = state.coinMarkers.length - 1; i >= 0; i -= 1) {
    state.coinMarkers[i].ttl -= dt;
    if (state.coinMarkers[i].ttl <= 0) state.coinMarkers.splice(i, 1);
  }

  if (state.alarm >= ALARM.max) {
    state.status = STATUS_BUSTED;
    state.events.push({ type: 'busted' });
    return;
  }

  // The way out only opens once the main prize is in the bag.
  if (mainLootTaken(state)) {
    const exit = state.level.exit;
    const nearX = Math.max(exit.x, Math.min(player.x, exit.x + exit.w));
    const nearY = Math.max(exit.y, Math.min(player.y, exit.y + exit.h));
    const dx = player.x - nearX;
    const dy = player.y - nearY;
    if (dx * dx + dy * dy < (PLAYER.radius + 4) * (PLAYER.radius + 4)) finishLevel(state);
  }
}
