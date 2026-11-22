// Vaultfall — the two floors of the Meridian Bank, as data.
// Coordinates are pixels on the 1280x800 stage; the floor starts below the HUD band.
// walls and shadows are [x, y, w, h] rectangles. Guards walk their `path` as a loop
// (a two-point path paces back and forth), pausing `pause` seconds at each point.
// Cameras sit at a point and sweep their cone around `baseAngle` (radians, 0 = east,
// positive clockwise because the stage's y axis points down).

export const LEVELS = [
  {
    name: 'Floor One — The Gallery',
    brief: 'Cross the gallery, crack the vault, and get back to the stairs.',
    spawn: { x: 92, y: 424 },
    exit: { x: 40, y: 372, w: 56, h: 104 },
    vault: { x: 1148, y: 178, value: 5000, crackTime: 2.6 },
    walls: [
      [330, 150, 26, 260],
      [330, 500, 26, 240],
      [620, 88, 26, 240],
      [620, 420, 26, 300],
      [880, 300, 376, 26],
      [880, 560, 26, 216],
      [1050, 470, 206, 26],
      [980, 88, 26, 150],
      [980, 238, 200, 26],
    ],
    shadows: [
      [120, 560, 150, 110],
      [700, 600, 170, 100],
      [960, 336, 120, 90],
      [470, 170, 110, 80],
    ],
    guards: [
      { path: [[420, 140], [560, 140], [560, 380], [420, 380]], speed: 62, pause: 0.7 },
      { path: [[140, 650], [140, 170]], speed: 55, pause: 0.9 },
      { path: [[990, 650], [1190, 650], [1190, 540]], speed: 70, pause: 0.5 },
    ],
    cameras: [
      { x: 590, y: 100, baseAngle: Math.PI / 2, sweep: 0.62, period: 5.0, phase: 0 },
      { x: 1240, y: 545, baseAngle: Math.PI, sweep: 0.5, period: 6.5, phase: 1.7 },
    ],
    loot: [
      { x: 500, y: 706, value: 400 },
      { x: 762, y: 152, value: 600 },
      { x: 1150, y: 424, value: 800 },
      { x: 180, y: 300, value: 300 },
    ],
  },
  {
    name: 'Floor Two — The Vault Floor',
    brief: 'The vault room has one doorway. Time the patrols, then run.',
    spawn: { x: 92, y: 128 },
    exit: { x: 40, y: 84, w: 56, h: 96 },
    vault: { x: 1150, y: 240, value: 8000, crackTime: 3.2 },
    walls: [
      [260, 300, 500, 26],
      [260, 300, 26, 240],
      [500, 540, 420, 26],
      [920, 200, 26, 340],
      [980, 88, 26, 120],
      [980, 300, 26, 100],
      [980, 400, 276, 26],
      [640, 640, 26, 136],
      [150, 560, 240, 26],
    ],
    shadows: [
      [700, 120, 150, 90],
      [120, 640, 170, 100],
      [1020, 560, 140, 90],
      [420, 380, 110, 80],
    ],
    guards: [
      { path: [[400, 150], [850, 150], [850, 255], [400, 255]], speed: 74, pause: 0.5 },
      { path: [[140, 690], [600, 690]], speed: 66, pause: 0.8 },
      { path: [[900, 240], [900, 470], [820, 470]], speed: 60, pause: 0.6 },
    ],
    cameras: [
      { x: 480, y: 96, baseAngle: Math.PI / 2, sweep: 0.58, period: 4.6, phase: 0.8 },
      { x: 36, y: 424, baseAngle: 0, sweep: 0.52, period: 5.4, phase: 2.4 },
      { x: 1246, y: 436, baseAngle: Math.PI * 0.82, sweep: 0.45, period: 6.0, phase: 4.0 },
    ],
    loot: [
      { x: 820, y: 716, value: 700 },
      { x: 180, y: 424, value: 400 },
      { x: 700, y: 226, value: 500 },
      { x: 1100, y: 616, value: 900 },
    ],
  },
];
