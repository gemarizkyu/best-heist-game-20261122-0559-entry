// Gilded Vault — seeing and being seen.
// One job: answer "can this watcher see that point?" for guards and cameras.
function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** True when the point sits inside any solid rect (walls, or cover that blocks sight). */
export function pointBlocked(x, y, solids) {
  for (let i = 0; i < solids.length; i += 1) {
    if (pointInRect(x, y, solids[i])) return true;
  }
  return false;
}

/**
 * True when the straight line from (x0, y0) to (x1, y1) crosses no solid rect.
 * Samples the line in small steps: cheap, and exact enough for a cone check.
 */
export function lineOfSight(x0, y0, x1, y1, solids) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(distance / 7));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (pointBlocked(x0 + dx * t, y0 + dy * t, solids)) return false;
  }
  return true;
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * True when `target` is inside the watcher's cone: close enough, inside the
 * half-angle, and with a clear line of sight.
 */
export function insideCone(watcher, target, range, halfAngle, solids) {
  const dx = target.x - watcher.x;
  const dy = target.y - watcher.y;
  const distance = Math.hypot(dx, dy);
  if (distance > range) return false;
  const bearing = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(bearing, watcher.angle)) > halfAngle) return false;
  return lineOfSight(watcher.x, watcher.y, target.x, target.y, solids);
}

/** True when a circle at (x, y) with `radius` overlaps any rect in `rects`. */
export function circleHitsRects(x, y, radius, rects) {
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    const nearX = Math.max(r.x, Math.min(x, r.x + r.w));
    const nearY = Math.max(r.y, Math.min(y, r.y + r.h));
    const dx = x - nearX;
    const dy = y - nearY;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}
