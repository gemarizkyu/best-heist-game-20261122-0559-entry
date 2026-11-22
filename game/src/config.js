// Gilded Vault — shared tuning and palette.
// One job: every number and colour the rest of the game agrees on.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 11,
  walkSpeed: 168,
  sneakSpeed: 86,
  grabSeconds: 0.7,
  grabReach: 46,
  coinRange: 430,
  coinsPerLevel: 3,
  empPerLevel: 2,
};

export const GUARD = {
  radius: 12,
  patrolSpeed: 56,
  chaseSpeed: 118,
  investigateSpeed: 88,
  coneRange: 185,
  coneHalfAngle: 0.6,
  waitSeconds: 1.4,
  suspicionGain: 0.9,
  suspicionDecay: 0.45,
  hearRadius: 95,
  catchRadius: 26,
  loseSightSeconds: 3,
};

export const CAMERA = {
  coneRange: 225,
  coneHalfAngle: 0.46,
  alarmPerSecond: 22,
  sweepSpeed: 0.55,
};

export const ALARM = {
  guardSeenPerSecond: 34,
  decayPerSecond: 6,
  empCost: 8,
  laserHit: 25,
  max: 100,
};

export const EMP = { disableSeconds: 6 };

export const LASER = { period: 2.4, onSeconds: 1.5 };

export const PALETTE = {
  floorA: '#2b2118',
  floorB: '#241b13',
  floorLine: '#1c140d',
  carpet: '#571e26',
  carpetTrim: '#c9a227',
  wall: '#171209',
  wallTrim: '#c9a227',
  caseGlass: '#9fc4d4',
  caseFrame: '#8a6d2b',
  statue: '#7d7468',
  planter: '#2f5233',
  rope: '#a11d33',
  thief: '#7c3aed',
  thiefTrim: '#ffd75e',
  guard: '#2b4a7a',
  guardTrim: '#d8e2f2',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneCalmEdge: 'rgba(255, 214, 90, 0.45)',
  coneSuspicious: 'rgba(255, 150, 40, 0.30)',
  coneAlert: 'rgba(255, 60, 50, 0.34)',
  coneDisabled: 'rgba(140, 150, 160, 0.10)',
  loot: '#ffd75e',
  lootGlow: 'rgba(255, 215, 94, 0.35)',
  exit: '#34d399',
  exitLocked: '#5b6b62',
  hudBack: 'rgba(8, 6, 4, 0.88)',
  hudGold: '#ffd75e',
  hudText: '#f2e8d5',
  hudDanger: '#ff5a4e',
  laser: 'rgba(255, 45, 70, 0.85)',
  laserOff: 'rgba(255, 45, 70, 0.18)',
};
