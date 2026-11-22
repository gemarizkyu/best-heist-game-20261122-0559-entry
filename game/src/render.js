// Gilded Vault — everything the eye sees.
// One job: draw the room, its people, its cones and its HUD on the canvas.
import { ALARM, CAMERA, GUARD, PALETTE, PLAYER, VIEW } from './config.js';
import { mainLootTaken } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, level) {
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Parquet planks, two shades alternating by row and column.
  for (let row = 0; row < 12; row += 1) {
    for (let col = 0; col < 20; col += 1) {
      if ((row + col) % 2 === 0) continue;
      ctx.fillStyle = PALETTE.floorB;
      ctx.fillRect(col * 64 + (row % 2) * 32 - 32, row * 60, 64, 60);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let row = 0; row <= 12; row += 1) {
    ctx.beginPath();
    ctx.moveTo(0, row * 60);
    ctx.lineTo(VIEW.width, row * 60);
    ctx.stroke();
  }
  // A round crimson rug under the main prize, so the eye finds it at once.
  const main = level.loot.find((item) => item.main);
  if (main) {
    ctx.fillStyle = PALETTE.carpet;
    ctx.beginPath();
    ctx.arc(main.x, main.y, 118, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.carpetTrim;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(main.x, main.y, 108, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawWalls(ctx, level) {
  for (const wall of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = PALETTE.wallTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(wall.x + 1, wall.y + 1, wall.w - 2, wall.h - 2);
  }
}

function drawCoverPiece(ctx, piece) {
  if (piece.kind === 'case') {
    ctx.fillStyle = PALETTE.caseFrame;
    ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
    ctx.fillStyle = PALETTE.caseGlass;
    ctx.fillRect(piece.x + 6, piece.y + 6, piece.w - 12, piece.h - 12);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(piece.x + 10, piece.y + 8, piece.w - 20, 6);
    ctx.fillStyle = PALETTE.loot;
    ctx.beginPath();
    ctx.arc(piece.x + piece.w / 2, piece.y + piece.h / 2, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (piece.kind === 'statue') {
    ctx.fillStyle = '#4a4238';
    ctx.fillRect(piece.x + 4, piece.y + piece.h - 10, piece.w - 8, 10);
    ctx.fillStyle = PALETTE.statue;
    ctx.beginPath();
    ctx.arc(piece.x + piece.w / 2, piece.y + piece.h / 2 - 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8d8478';
    ctx.beginPath();
    ctx.arc(piece.x + piece.w / 2 - 4, piece.y + piece.h / 2 - 6, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (piece.kind === 'planter') {
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
    ctx.fillStyle = PALETTE.planter;
    ctx.beginPath();
    ctx.arc(piece.x + piece.w / 2, piece.y + piece.h / 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f7a44';
    ctx.beginPath();
    ctx.arc(piece.x + piece.w / 2 - 6, piece.y + piece.h / 2 - 5, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (piece.kind === 'rope') {
    ctx.fillStyle = '#c8b06a';
    ctx.fillRect(piece.x, piece.y - 2, 6, piece.h + 4);
    ctx.fillRect(piece.x + piece.w - 6, piece.y - 2, 6, piece.h + 4);
    ctx.strokeStyle = PALETTE.rope;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(piece.x + 3, piece.y + piece.h / 2);
    ctx.quadraticCurveTo(piece.x + piece.w / 2, piece.y + piece.h / 2 + 8, piece.x + piece.w - 3, piece.y + piece.h / 2);
    ctx.stroke();
  } else {
    // Rooftop air-conditioning unit: a humming grey box with a fan grille.
    ctx.fillStyle = '#3d454e';
    ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
    ctx.strokeStyle = '#22282e';
    ctx.lineWidth = 2;
    ctx.strokeRect(piece.x + 2, piece.y + 2, piece.w - 4, piece.h - 4);
    ctx.fillStyle = '#5b6b7a';
    ctx.beginPath();
    ctx.arc(piece.x + piece.w / 2, piece.y + piece.h / 2, 13, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLootPiece(ctx, item, state) {
  if (item.taken) return;
  const pulse = 0.5 + 0.5 * Math.sin(state.time * 3 + item.x);
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.3 * pulse;
  ctx.fillStyle = PALETTE.lootGlow;
  ctx.beginPath();
  ctx.arc(item.x, item.y, 30 + 6 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = PALETTE.loot;
  ctx.strokeStyle = '#7a5b12';
  ctx.lineWidth = 2;
  if (item.kind === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(item.x, item.y - 16);
    ctx.lineTo(item.x + 14, item.y - 4);
    ctx.lineTo(item.x + 10, item.y + 12);
    ctx.lineTo(item.x - 10, item.y + 12);
    ctx.lineTo(item.x - 14, item.y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff6c9';
    ctx.beginPath();
    ctx.moveTo(item.x, item.y - 16);
    ctx.lineTo(item.x + 7, item.y - 4);
    ctx.lineTo(item.x - 7, item.y - 4);
    ctx.closePath();
    ctx.fill();
  } else if (item.kind === 'crown') {
    ctx.beginPath();
    ctx.moveTo(item.x - 15, item.y + 10);
    ctx.lineTo(item.x - 15, item.y - 6);
    ctx.lineTo(item.x - 7, item.y + 2);
    ctx.lineTo(item.x, item.y - 12);
    ctx.lineTo(item.x + 7, item.y + 2);
    ctx.lineTo(item.x + 15, item.y - 6);
    ctx.lineTo(item.x + 15, item.y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (item.kind === 'gold') {
    for (let i = -1; i <= 1; i += 1) {
      ctx.fillRect(item.x - 16 + i * 11, item.y - 6 + Math.abs(i) * 4, 10, 8);
    }
    ctx.strokeRect(item.x - 16, item.y - 6, 32, 8);
  } else {
    // Painting or relic on a small gilt frame.
    ctx.fillRect(item.x - 16, item.y - 12, 32, 24);
    ctx.strokeRect(item.x - 16, item.y - 12, 32, 24);
    ctx.fillStyle = item.kind === 'relic' ? '#3fae8a' : '#b8577a';
    ctx.fillRect(item.x - 12, item.y - 8, 24, 16);
  }
  const near = Math.hypot(item.x - state.player.x, item.y - state.player.y) < 130;
  if (near) {
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.label} — $${item.value.toLocaleString('en-US')}`, item.x, item.y - 34);
    if (item.main) ctx.fillText('MAIN PRIZE — hold E to grab', item.x, item.y - 52);
  }
}

function drawExit(ctx, state) {
  const exit = state.level.exit;
  const open = mainLootTaken(state);
  if (exit.pad) {
    ctx.strokeStyle = open ? PALETTE.exit : PALETTE.exitLocked;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(exit.x + exit.w / 2, exit.y + exit.h / 2, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = open ? PALETTE.exit : PALETTE.exitLocked;
    ctx.font = '800 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', exit.x + exit.w / 2, exit.y + exit.h / 2 + 2);
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText(open ? 'GETAWAY — GO!' : 'HELIPAD — LOCKED', exit.x + exit.w / 2, exit.y + exit.h / 2 + 66);
    ctx.textBaseline = 'alphabetic';
    return;
  }
  ctx.fillStyle = open ? PALETTE.exit : PALETTE.exitLocked;
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = '#08130d';
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(exit.x + exit.w / 2, exit.y + exit.h / 2);
  ctx.rotate(exit.w < exit.h ? -Math.PI / 2 : 0);
  ctx.fillText(open ? 'EXIT' : 'LOCKED', 0, 5);
  ctx.restore();
}

function drawLasers(ctx, state) {
  for (const laser of state.lasers) {
    ctx.fillStyle = laser.on ? PALETTE.laser : PALETTE.laserOff;
    ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
    ctx.fillStyle = '#2b0a10';
    ctx.fillRect(laser.x - 4, laser.y - 6, laser.w + 8, 6);
    ctx.fillRect(laser.x - 4, laser.y + laser.h, laser.w + 8, 6);
    if (laser.on) {
      ctx.fillStyle = '#ff8fa0';
      ctx.fillRect(laser.x, laser.y + laser.h / 2 - 1, laser.w, 2);
    }
  }
}
function drawCone(ctx, x, y, angle, range, halfAngle, calm, edge, alert) {
  const gradient = ctx.createRadialGradient(x, y, 8, x, y, range);
  gradient.addColorStop(0, alert);
  gradient.addColorStop(0.55, calm);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle - halfAngle) * range, y + Math.sin(angle - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle + halfAngle) * range, y + Math.sin(angle + halfAngle) * range);
  ctx.stroke();
}

function drawGuard(ctx, guard) {
  const alert = guard.state === 'chase';
  const warm = guard.suspicion > 0.45 && !alert;
  drawCone(
    ctx,
    guard.x,
    guard.y,
    guard.angle,
    GUARD.coneRange,
    GUARD.coneHalfAngle,
    alert ? PALETTE.coneAlert : warm ? PALETTE.coneSuspicious : PALETTE.coneCalm,
    PALETTE.coneCalmEdge,
    alert ? PALETTE.coneAlert : warm ? PALETTE.coneSuspicious : 'rgba(255,214,90,0.12)',
  );
  // Navy uniform, cap brim facing the way he looks.
  ctx.fillStyle = PALETTE.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.guardTrim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
  ctx.stroke();
  const fx = Math.cos(guard.angle);
  const fy = Math.sin(guard.angle);
  ctx.fillStyle = PALETTE.guardTrim;
  ctx.beginPath();
  ctx.arc(guard.x + fx * 7, guard.y + fy * 7, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath();
  ctx.arc(guard.x + fx * (GUARD.radius + 7), guard.y + fy * (GUARD.radius + 7), 3, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion reads at a glance: ? while curious, ! once he gives chase.
  if (alert || guard.suspicion > 0.45) {
    ctx.fillStyle = alert ? '#ff5a4e' : '#ffb02e';
    ctx.font = '800 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(alert ? '!' : '?', guard.x, guard.y - GUARD.radius - 8);
  }
}

function drawCamera(ctx, camera, now) {
  const off = now < camera.disabledUntil;
  const colour = off ? PALETTE.coneDisabled : camera.sees ? PALETTE.coneAlert : PALETTE.coneCalm;
  drawCone(
    ctx,
    camera.x,
    camera.y,
    camera.angle,
    CAMERA.coneRange,
    CAMERA.coneHalfAngle,
    colour,
    camera.sees ? 'rgba(255,90,78,0.6)' : 'rgba(255,214,90,0.35)',
    camera.sees ? PALETTE.coneAlert : 'rgba(255,214,90,0.10)',
  );
  ctx.fillStyle = '#4a5058';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = camera.sees ? '#ff3b30' : off ? '#5a636e' : '#37e08b';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx, state) {
  const player = state.player;
  // A soft shadow grounds the thief on the floor.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 8, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded cloak, gold-trimmed, pointing where the thief moves.
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(-12, -12);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-12, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.thiefTrim;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(-12, -12);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-12, 12);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#241533';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2e8d5';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.angle) * 2, player.y + Math.sin(player.angle) * 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // The grab channel rings around the thief while a prize is being lifted.
  if (player.grabbing && player.grabProgress > 0) {
    ctx.strokeStyle = PALETTE.loot;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 20, -Math.PI / 2, -Math.PI / 2 + player.grabProgress * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GRABBING…', player.x, player.y - 28);
  }
  if (player.sneaking) {
    ctx.fillStyle = 'rgba(242,232,213,0.85)';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', player.x, player.y + 28);
  }
}

function drawCoinMarkers(ctx, state) {
  for (const marker of state.coinMarkers) {
    const pulse = 0.5 + 0.5 * Math.sin(state.time * 8);
    ctx.strokeStyle = `rgba(255, 215, 94, ${0.4 + 0.4 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, 10 + 4 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.loot;
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.hudBack;
  ctx.fillRect(0, 0, VIEW.width, 48);
  ctx.fillStyle = PALETTE.hudGold;
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ROOM ${state.levelIndex + 1}/3 — ${state.level.name.toUpperCase()}`, 16, 20);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '400 12px system-ui, sans-serif';
  ctx.fillText(state.level.sub, 16, 37);
  // Alarm meter: the number that decides whether the night ends early.
  const alarmX = 470;
  const alarmW = 300;
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', alarmX, 20);
  ctx.fillStyle = '#241a12';
  ctx.fillRect(alarmX + 62, 8, alarmW, 14);
  const ratio = state.alarm / ALARM.max;
  ctx.fillStyle = ratio < 0.5 ? '#37b06a' : ratio < 0.8 ? '#ffb02e' : PALETTE.hudDanger;
  ctx.fillRect(alarmX + 62, 8, alarmW * ratio, 14);
  ctx.strokeStyle = '#6b5a3e';
  ctx.lineWidth = 1;
  ctx.strokeRect(alarmX + 62, 8, alarmW, 14);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText(`${Math.round(state.alarm)}%`, alarmX + 62 + alarmW + 8, 20);
  ctx.fillStyle = PALETTE.hudGold;
  ctx.font = '800 16px system-ui, sans-serif';
  ctx.textAlign = 'right';
  // Once a room is cleared its loot is already inside the total: do not count it twice.
  const shownLoot = state.status === 'clear' || state.status === 'win'
    ? state.totalScore
    : state.totalScore + state.lootValue;
  ctx.fillText(`$${shownLoot.toLocaleString('en-US')}`, 1080, 20);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '400 12px system-ui, sans-serif';
  ctx.fillText(`EMP ×${state.player.emp}   COIN ×${state.player.coins}`, 1080, 37);
  const seconds = Math.floor(state.time);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.fillText(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, 1210, 20);
  // Controls, small, along the bottom edge.
  ctx.fillStyle = 'rgba(242,232,213,0.75)';
  ctx.font = '400 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / arrows — move    SHIFT — sneak    E — grab loot    Q — EMP    CLICK — toss coin    P — pause    M — mute', VIEW.width / 2, VIEW.height - 10);
  if (state.message && state.time < state.messageUntil) {
    ctx.fillStyle = PALETTE.hudGold;
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText(state.message, VIEW.width / 2, 76);
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(4, 3, 2, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = accent;
  ctx.font = '800 54px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.width / 2, 300);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '400 18px system-ui, sans-serif';
  let y = 340;
  for (const line of lines) {
    ctx.fillText(line, VIEW.width / 2, y);
    y += 30;
  }
}

/** Draw one frame of the game, whatever screen the player is on. */
export function drawGame(ctx, state) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx, state.level);
  drawLasers(ctx, state);
  drawWalls(ctx, state.level);
  for (const piece of state.level.cover) drawCoverPiece(ctx, piece);
  drawExit(ctx, state);
  for (const item of state.loot) drawLootPiece(ctx, item, state);
  drawCoinMarkers(ctx, state);
  for (const camera of state.cameras) drawCamera(ctx, camera, state.time);
  for (const guard of state.guards) drawGuard(ctx, guard);
  drawPlayer(ctx, state);
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 40, 30, ${Math.min(0.28, state.flash)})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
  drawHud(ctx, state);

  if (state.status === 'title') {
    overlay(ctx, 'GILDED VAULT', [
      'A midnight heist in three rooms. Slip past the guards, mind the cameras,',
      'lift the main prize — then reach the green way out.',
      '',
      'ENTER — begin the heist',
    ], PALETTE.hudGold);
  } else if (state.status === 'paused') {
    overlay(ctx, 'PAUSED', ['P — resume     R — restart this room'], PALETTE.hudText);
  } else if (state.status === 'clear') {
    overlay(ctx, 'CLEAN GETAWAY', [
      `Loot this room  $${state.lootValue.toLocaleString('en-US')}`,
      `Time bonus  $${Math.max(0, Math.round((state.level.parSeconds - state.time) * 20)).toLocaleString('en-US')}`,
      state.ghost ? 'Ghost bonus  $500 — never raised above half alarm' : 'Ghost bonus  $0 — the alarm climbed past half',
      `Room score  $${state.levelScore.toLocaleString('en-US')}      Total  $${state.totalScore.toLocaleString('en-US')}`,
      '',
      'ENTER — next room',
    ], PALETTE.exit);
  } else if (state.status === 'win') {
    overlay(ctx, 'THE VAULT IS YOURS', [
      `Three rooms, one clean night. Total haul  $${state.totalScore.toLocaleString('en-US')}`,
      '',
      'R — play it again',
    ], PALETTE.hudGold);
  } else if (state.status === 'busted') {
    overlay(ctx, 'ALARM TRIPPED — BUSTED', [
      'The museum locks down and the night is over.',
      '',
      'R — try the room again',
    ], PALETTE.hudDanger);
  } else if (state.status === 'caught') {
    overlay(ctx, 'CAUGHT RED-HANDED', [
      'A guard got his hands on you before you reached the door.',
      '',
      'R — try the room again',
    ], PALETTE.hudDanger);
  }
}
