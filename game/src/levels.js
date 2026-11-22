// Gilded Vault — the three rooms, as data.
// One job: where the walls, cover, loot, guards, cameras, lasers and exit sit.
// Walls block movement and sight; cover blocks movement, and sight unless `low`.
// Angles are radians: 0 faces right, Math.PI / 2 faces down.
const OUTER = [
  { x: 0, y: 0, w: 1280, h: 24 },
  { x: 0, y: 696, w: 1280, h: 24 },
  { x: 0, y: 0, w: 24, h: 720 },
  { x: 1256, y: 0, w: 24, h: 720 },
];

export const LEVELS = [
  {
    name: 'The Grand Gallery',
    sub: 'Steal the Sun of Halcyon',
    seed: 11,
    parSeconds: 150,
    start: { x: 90, y: 110 },
    exit: { x: 0, y: 600, w: 24, h: 72 },
    walls: [
      ...OUTER,
      { x: 430, y: 24, w: 26, h: 150 },
      { x: 430, y: 300, w: 26, h: 150 },
      { x: 430, y: 600, w: 26, h: 96 },
      { x: 850, y: 24, w: 26, h: 120 },
      { x: 850, y: 270, w: 26, h: 150 },
      { x: 850, y: 570, w: 26, h: 126 },
    ],
    cover: [
      { x: 150, y: 150, w: 92, h: 46, kind: 'case' },
      { x: 150, y: 520, w: 92, h: 46, kind: 'case' },
      { x: 560, y: 120, w: 92, h: 46, kind: 'case' },
      { x: 560, y: 560, w: 92, h: 46, kind: 'case' },
      { x: 1050, y: 200, w: 92, h: 46, kind: 'case' },
      { x: 980, y: 500, w: 92, h: 46, kind: 'case' },
      { x: 620, y: 330, w: 40, h: 40, kind: 'statue' },
      { x: 960, y: 330, w: 40, h: 40, kind: 'statue' },
      { x: 300, y: 340, w: 36, h: 36, kind: 'planter' },
      { x: 740, y: 600, w: 36, h: 36, kind: 'planter' },
      { x: 1120, y: 280, w: 36, h: 36, kind: 'planter' },
      { x: 1050, y: 298, w: 150, h: 10, kind: 'rope', low: true },
      { x: 1050, y: 416, w: 150, h: 10, kind: 'rope', low: true },
    ],
    loot: [
      { x: 1130, y: 360, kind: 'diamond', value: 5000, main: true, label: 'Sun of Halcyon' },
      { x: 260, y: 88, kind: 'painting', value: 800, label: 'Portrait in Gold' },
      { x: 700, y: 88, kind: 'painting', value: 800, label: 'The Duchess at Dusk' },
    ],
    guards: [
      { waypoints: [[500, 200], [800, 200], [800, 520], [500, 520]] },
      { waypoints: [[920, 150], [1180, 150], [1180, 580], [920, 580]] },
    ],
    cameras: [
      { x: 640, y: 58, angle: Math.PI / 2, sweep: 0.55 },
      { x: 1254, y: 360, angle: Math.PI, sweep: 0.5 },
    ],
    lasers: [],
  },
  {
    name: 'The Vault Hall',
    sub: 'Crack the gold vault',
    seed: 23,
    parSeconds: 180,
    start: { x: 90, y: 620 },
    exit: { x: 0, y: 80, w: 24, h: 72 },
    walls: [
      ...OUTER,
      { x: 430, y: 24, w: 26, h: 200 },
      { x: 430, y: 370, w: 26, h: 326 },
      { x: 850, y: 24, w: 26, h: 150 },
      { x: 850, y: 300, w: 26, h: 150 },
      { x: 850, y: 600, w: 26, h: 96 },
    ],
    cover: [
      { x: 150, y: 140, w: 92, h: 46, kind: 'case' },
      { x: 150, y: 540, w: 92, h: 46, kind: 'case' },
      { x: 560, y: 100, w: 92, h: 46, kind: 'case' },
      { x: 480, y: 580, w: 92, h: 46, kind: 'case' },
      { x: 1000, y: 150, w: 92, h: 46, kind: 'case' },
      { x: 1000, y: 500, w: 92, h: 46, kind: 'case' },
      { x: 700, y: 340, w: 40, h: 40, kind: 'statue' },
      { x: 940, y: 340, w: 40, h: 40, kind: 'statue' },
      { x: 300, y: 360, w: 36, h: 36, kind: 'planter' },
      { x: 740, y: 360, w: 36, h: 36, kind: 'planter' },
    ],
    loot: [
      { x: 1130, y: 360, kind: 'gold', value: 8000, main: true, label: 'Vault Gold' },
      { x: 260, y: 88, kind: 'relic', value: 1200, label: 'Jade Falcon' },
      { x: 700, y: 88, kind: 'relic', value: 1200, label: 'Ivory Compass' },
    ],
    guards: [
      { waypoints: [[480, 180], [820, 180], [820, 540], [480, 540]] },
      { waypoints: [[900, 120], [1200, 120], [1200, 580], [900, 580]] },
      { waypoints: [[640, 280], [640, 620]] },
    ],
    cameras: [
      { x: 640, y: 58, angle: Math.PI / 2, sweep: 0.55 },
      { x: 1254, y: 200, angle: Math.PI, sweep: 0.5 },
      { x: 1254, y: 520, angle: Math.PI, sweep: 0.5 },
    ],
    lasers: [
      { x: 430, y: 224, w: 26, h: 146, phase: 0 },
      { x: 850, y: 420, w: 26, h: 150, phase: 1.2 },
    ],
  },
  {
    name: 'The Rooftop',
    sub: 'Lift the crown, catch the chopper',
    seed: 37,
    parSeconds: 150,
    start: { x: 90, y: 110 },
    exit: { x: 24, y: 600, w: 110, h: 72, pad: true },
    walls: [
      ...OUTER,
      { x: 640, y: 24, w: 26, h: 180 },
      { x: 640, y: 420, w: 26, h: 276 },
      { x: 580, y: 120, w: 180, h: 120 },
    ],
    cover: [
      { x: 150, y: 200, w: 36, h: 36, kind: 'planter' },
      { x: 150, y: 500, w: 36, h: 36, kind: 'planter' },
      { x: 1080, y: 300, w: 36, h: 36, kind: 'planter' },
      { x: 1000, y: 500, w: 36, h: 36, kind: 'planter' },
      { x: 700, y: 480, w: 90, h: 50, kind: 'unit' },
      { x: 1000, y: 200, w: 90, h: 50, kind: 'unit' },
      { x: 1050, y: 480, w: 90, h: 50, kind: 'unit' },
      { x: 300, y: 340, w: 90, h: 50, kind: 'unit' },
    ],
    loot: [
      { x: 1150, y: 360, kind: 'crown', value: 10000, main: true, label: 'The Halcyon Crown' },
      { x: 700, y: 88, kind: 'painting', value: 1500, label: 'Moon over the Bay' },
    ],
    guards: [
      { waypoints: [[480, 280], [820, 280], [820, 580], [480, 580]] },
      { waypoints: [[900, 120], [1200, 120], [1200, 600], [900, 600]] },
      { waypoints: [[240, 280], [240, 620]] },
    ],
    cameras: [
      { x: 640, y: 58, angle: Math.PI / 2, sweep: 0.6 },
      { x: 1254, y: 360, angle: Math.PI, sweep: 0.55 },
    ],
    lasers: [],
  },
];